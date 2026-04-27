//! `flareo run <slug>` — ephemeral local-machine run.
//!
//! Pulls a verified Flareo module and runs it locally with:
//!   - an isolated docker volume (deleted on teardown)
//!   - a random or user-specified host port
//!   - a TTL after which the container is stopped automatically
//!   - clean Ctrl-C handling that stops the container and removes
//!     the volume
//!
//! The intent is "test this module with my own data, then throw the
//! state away when I'm done." Closer in spirit to `docker run --rm`
//! than to `docker compose up`, but with the extra steps — Flareo
//! verification before run, named container/volume so teardown can
//! reach the right resources, and a TTL backstop for unattended
//! laptop-closes-and-walks-away cases.
//!
//! ## Why this exists
//!
//! HORIZON_2_PLAN Bet 2 considered hosted per-user previews on
//! Firecracker. The conditional alternative was: "the user's machine
//! is the substrate." This is that alternative shipped. The user's
//! laptop runs the module; we ship zero new infrastructure; data
//! never leaves the local machine. Tradeoff: requires Docker locally,
//! and requires the user to be on a machine that can run the image
//! (no GPU modules on a Mac, etc.).
//!
//! ## What this does NOT do
//!
//! Doesn't generate per-module bootstrap configs (admin credentials,
//! init scripts). The module itself is responsible for first-boot —
//! Vaultwarden creates its database on first request, Gitea has an
//! installation wizard, etc. We provide the running container; the
//! module provides its own onboarding. A future enhancement could
//! integrate with `flareo compose`'s per-module env-var defaults
//! to pre-populate, but that's a separate iteration.

use crate::api::{client, fetch, v1_url, with_auth};
use crate::config::load;
use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::process::Command;
use tokio::signal;

#[derive(Debug, Deserialize)]
struct ModuleDetail {
    slug: String,
    name: String,
    version: String,
    #[serde(rename = "imageRef")]
    image_ref: Option<String>,
    digest: String,
    status: String,
    /// Default container port, when present in the module record.
    /// We bind a host port to this. NULL → fall back to 8080.
    /// Default container port the module listens on. Not currently
    /// surfaced by the API — declared here as a forward-compat field
    /// so when the API grows it, this client picks it up automatically.
    /// Until then, all modules fall back to FALLBACK_CONTAINER_PORT.
    /// A future iteration could derive this from the module's compose
    /// template (see `flareo compose`'s per-module port defaults) and
    /// surface it on the module detail endpoint.
    #[serde(rename = "defaultContainerPort")]
    default_container_port: Option<u16>,
}

#[derive(Debug, Serialize)]
struct VerifyRequest<'a> {
    #[serde(rename = "imageRef")]
    image_ref: &'a str,
}

#[derive(Debug, Deserialize)]
struct VerifyResponse {
    status: String,
    #[serde(rename = "errorMessage")]
    error_message: Option<String>,
}

const TTL_CAP_MINUTES: u32 = 480; // 8 hours
const FALLBACK_CONTAINER_PORT: u16 = 8080;

pub async fn run(
    api_url: &str,
    slug: &str,
    ttl_minutes: u32,
    requested_port: Option<u16>,
    no_verify: bool,
    quiet: bool,
) -> Result<(), CliError> {
    // ── Validate inputs ─────────────────────────────────────────────
    if ttl_minutes > TTL_CAP_MINUTES {
        return Err(CliError::Other(anyhow::anyhow!(
            "ttl_minutes={} exceeds cap of {}. For longer runs, use `flareo pull` and run the module non-ephemerally.",
            ttl_minutes,
            TTL_CAP_MINUTES
        )));
    }

    let cfg = load().unwrap_or_default();
    let token = cfg.auth.as_ref().map(|a| a.token.as_str());

    // ── Step 1: resolve digest ──────────────────────────────────────
    if !quiet {
        eprintln!();
        eprintln!("{} {}", "resolving".bold(), slug.cyan());
    }

    let url = v1_url(api_url, &format!("/modules/{}", slug));
    let module: ModuleDetail = fetch(with_auth(client()?.get(&url), token)).await?;

    let pinned_ref = match &module.image_ref {
        Some(r) => {
            if r.contains("@sha256:") {
                r.clone()
            } else {
                format!("{}@{}", strip_tag(r), module.digest)
            }
        }
        None => format!("public.ecr.aws/flareo/{}@{}", module.slug, module.digest),
    };

    if !quiet {
        eprintln!(
            "  {} {} v{}",
            "found".bright_black(),
            module.name.bold(),
            module.version
        );
        eprintln!("  {} {}", "digest".bright_black(), module.digest);
    }

    if module.status != "verified" && !no_verify {
        return Err(CliError::Other(anyhow::anyhow!(
            "module status is '{}'; refusing to run. Pass --no-verify to override (not recommended).",
            module.status
        )));
    }

    // ── Step 2: verify signature ────────────────────────────────────
    if !no_verify {
        if !quiet {
            eprintln!();
            eprintln!("{} signature", "checking".bold());
        }

        let verify_url = v1_url(api_url, "/verify");
        let v: VerifyResponse = fetch(
            with_auth(client()?.post(&verify_url), token).json(&VerifyRequest {
                image_ref: &pinned_ref,
            }),
        )
        .await?;

        match v.status.as_str() {
            "verified" | "signed" => {
                if !quiet {
                    eprintln!("  {} signature valid", "✓".green());
                }
            }
            other => {
                return Err(CliError::Other(anyhow::anyhow!(
                    "verification failed (status={}): {}. Pass --no-verify to override.",
                    other,
                    v.error_message.as_deref().unwrap_or("no detail given")
                )));
            }
        }
    } else if !quiet {
        eprintln!(
            "  {} skipping verification (--no-verify)",
            "⚠".yellow().bold()
        );
    }

    // ── Step 3: pick runtime, port, naming ──────────────────────────
    let runtime = pick_runtime()?;
    let nonce = ephemeral_nonce();
    let container_name = format!("flareo-ephemeral-{}-{}", slug, nonce);
    let volume_name = format!("flareo-ephemeral-vol-{}-{}", slug, nonce);
    let host_port = match requested_port {
        Some(p) => p,
        None => pick_random_ephemeral_port(),
    };
    let container_port = module
        .default_container_port
        .unwrap_or(FALLBACK_CONTAINER_PORT);

    // ── Step 4: pull (if not already cached) ────────────────────────
    if !quiet {
        eprintln!();
        eprintln!("{} {} {}", "pulling".bold(), runtime, pinned_ref.cyan());
        eprintln!();
    }

    let pull_status = Command::new(runtime)
        .arg("pull")
        .arg(&pinned_ref)
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .await
        .map_err(|e| CliError::Other(anyhow::anyhow!("failed to invoke {}: {}", runtime, e)))?;

    if !pull_status.success() {
        return Err(CliError::Other(anyhow::anyhow!(
            "{} pull failed with exit code {}",
            runtime,
            pull_status.code().unwrap_or(-1)
        )));
    }

    // ── Step 5: docker run -d ───────────────────────────────────────
    //
    // Detached so we can hold the foreground for signal handling and
    // the TTL ticker. Container name + volume name are what the
    // teardown path uses to reach the right resources.
    let port_arg = format!("{}:{}", host_port, container_port);
    let volume_mount = format!("{}:/data", volume_name);

    if !quiet {
        eprintln!();
        eprintln!(
            "{} {} on {}",
            "starting".bold(),
            module.name.cyan(),
            format!("http://localhost:{}", host_port).bright_white().bold()
        );
    }

    let run_status = Command::new(runtime)
        .args([
            "run",
            "-d", // detached
            "--rm", // delete container record on stop
            "--name",
            &container_name,
            "-p",
            &port_arg,
            "-v",
            &volume_mount,
            &pinned_ref,
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::inherit())
        .status()
        .await
        .map_err(|e| {
            CliError::Other(anyhow::anyhow!("failed to start container: {}", e))
        })?;

    if !run_status.success() {
        // docker run printed its own error; clean up the volume in
        // case it was created.
        let _ = remove_volume(runtime, &volume_name).await;
        return Err(CliError::Other(anyhow::anyhow!(
            "{} run failed with exit code {}",
            runtime,
            run_status.code().unwrap_or(-1)
        )));
    }

    // ── Step 6: print the post-launch help ──────────────────────────
    if !quiet {
        print_help_block(
            &module.name,
            host_port,
            ttl_minutes,
            &container_name,
            runtime,
        );
    }

    // ── Step 7: hold the foreground until TTL or Ctrl-C ─────────────
    //
    // Three race participants:
    //   1. Ctrl-C from the user → clean teardown, exit 0
    //   2. TTL fires → clean teardown, exit 0
    //   3. The container exits on its own (crash, OOM) → exit 1
    //
    // Whichever fires first wins. The other two are aborted by the
    // tokio::select! drop semantics.
    let stop_reason = tokio::select! {
        _ = signal::ctrl_c() => StopReason::CtrlC,
        _ = ttl_timer(ttl_minutes) => StopReason::Ttl,
        exit = wait_for_container(runtime, &container_name) => match exit {
            Ok(()) => StopReason::ContainerExited,
            Err(e) => {
                eprintln!("[flareo run] error monitoring container: {}", e);
                StopReason::ContainerExited
            }
        },
    };

    if !quiet {
        eprintln!();
        match stop_reason {
            StopReason::CtrlC => {
                eprintln!("{} stopping (Ctrl-C)", "↓".yellow());
            }
            StopReason::Ttl => {
                eprintln!(
                    "{} TTL reached ({} min); stopping",
                    "↓".yellow(),
                    ttl_minutes
                );
            }
            StopReason::ContainerExited => {
                eprintln!("{} container exited on its own", "↓".yellow());
            }
        }
    }

    // ── Step 8: clean teardown ──────────────────────────────────────
    if let Err(e) = stop_container(runtime, &container_name).await {
        eprintln!("[flareo run] warning: stop_container failed: {}", e);
    }
    if let Err(e) = remove_volume(runtime, &volume_name).await {
        eprintln!("[flareo run] warning: remove_volume failed: {}", e);
    }

    if !quiet {
        eprintln!("{} cleaned up. all ephemeral data deleted.", "✓".green());
    }

    Ok(())
}

// ─── teardown helpers ─────────────────────────────────────────────

async fn stop_container(runtime: &str, name: &str) -> Result<(), String> {
    // `docker stop` sends SIGTERM, then SIGKILL after a grace period.
    // We use the default 10-second grace.
    let status = Command::new(runtime)
        .args(["stop", name])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .map_err(|e| format!("invoking docker stop: {}", e))?;
    if !status.success() {
        return Err(format!(
            "docker stop returned {}",
            status.code().unwrap_or(-1)
        ));
    }
    Ok(())
}

async fn remove_volume(runtime: &str, name: &str) -> Result<(), String> {
    // The volume can only be removed once the container that mounts
    // it is gone. With --rm on docker run, that should already be the
    // case by the time we get here, but `volume rm` retries are safe.
    let status = Command::new(runtime)
        .args(["volume", "rm", "-f", name])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .map_err(|e| format!("invoking docker volume rm: {}", e))?;
    if !status.success() {
        return Err(format!(
            "docker volume rm returned {}",
            status.code().unwrap_or(-1)
        ));
    }
    Ok(())
}

/// Wait for the named container to exit. Polls every second via
/// `docker inspect`. Returns Ok(()) when the container is no longer
/// running.
async fn wait_for_container(runtime: &str, name: &str) -> Result<(), String> {
    loop {
        tokio::time::sleep(Duration::from_secs(2)).await;
        // `docker inspect -f '{{.State.Running}}' <name>` prints true
        // or false; if the container is gone, inspect exits non-zero.
        let output = Command::new(runtime)
            .args(["inspect", "-f", "{{.State.Running}}", name])
            .stdin(Stdio::null())
            .output()
            .await
            .map_err(|e| format!("docker inspect: {}", e))?;
        if !output.status.success() {
            // Container record gone — it exited and was removed.
            return Ok(());
        }
        let stdout = String::from_utf8_lossy(&output.stdout);
        if stdout.trim() != "true" {
            return Ok(());
        }
    }
}

async fn ttl_timer(minutes: u32) {
    if minutes == 0 {
        // Sleep forever. The other arms of the select! will fire first.
        // We can't return because the select! would treat that as the
        // winning branch.
        std::future::pending::<()>().await;
        unreachable!()
    }
    tokio::time::sleep(Duration::from_secs(u64::from(minutes) * 60)).await;
}

#[derive(Debug)]
enum StopReason {
    CtrlC,
    Ttl,
    ContainerExited,
}

// ─── small helpers ────────────────────────────────────────────────

fn pick_runtime() -> Result<&'static str, CliError> {
    for candidate in &["docker", "podman"] {
        if which(candidate) {
            return Ok(candidate);
        }
    }
    Err(CliError::Other(anyhow::anyhow!(
        "neither `docker` nor `podman` is on PATH. Install one and retry."
    )))
}

fn which(bin: &str) -> bool {
    let path = match std::env::var_os("PATH") {
        Some(p) => p,
        None => return false,
    };
    std::env::split_paths(&path).any(|p| std::fs::metadata(p.join(bin)).is_ok())
}

fn strip_tag(image_ref: &str) -> String {
    if let Some(at) = image_ref.rfind('@') {
        return image_ref[..at].to_string();
    }
    let last_slash = image_ref.rfind('/').unwrap_or(0);
    let after_slash = &image_ref[last_slash..];
    if let Some(colon_in_tail) = after_slash.rfind(':') {
        let idx = last_slash + colon_in_tail;
        image_ref[..idx].to_string()
    } else {
        image_ref.to_string()
    }
}

/// Generate a short alphanumeric nonce for container/volume names.
/// Uses the system clock at nanosecond precision base36'd. Not
/// cryptographically random — we don't need that — but enough to
/// disambiguate concurrent ephemeral runs of the same module.
fn ephemeral_nonce() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0);
    base36(nanos)
}

fn base36(mut n: u64) -> String {
    if n == 0 {
        return "0".into();
    }
    const ALPHABET: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut buf = Vec::with_capacity(13);
    while n > 0 {
        buf.push(ALPHABET[(n % 36) as usize]);
        n /= 36;
    }
    buf.reverse();
    String::from_utf8(buf).expect("base36 alphabet is ASCII")
}

/// Pick a port in the IANA ephemeral range. Doesn't actually check
/// availability — Docker will fail loudly if the port is in use,
/// which is a fine UX for the rare collision case.
///
/// Range 49152-65535 = 16384 ports; collision probability with one
/// concurrent ephemeral run is ~1/16k. Two collisions in the same
/// session is implausible; if it happens, retry with `--port`.
fn pick_random_ephemeral_port() -> u16 {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos() as u64)
        .unwrap_or(0);
    let range = 65535u64 - 49152u64;
    49152 + ((nanos % range) as u16)
}

fn print_help_block(
    name: &str,
    host_port: u16,
    ttl_minutes: u32,
    container_name: &str,
    runtime: &str,
) {
    eprintln!();
    eprintln!("  {}", "─".repeat(60).bright_black());
    eprintln!(
        "  {} is running ephemerally.",
        name.bold()
    );
    eprintln!();
    eprintln!(
        "  Open:        {}",
        format!("http://localhost:{}", host_port).cyan()
    );
    if ttl_minutes > 0 {
        eprintln!(
            "  Auto-stop:   in {} minute{}",
            ttl_minutes,
            if ttl_minutes == 1 { "" } else { "s" }
        );
    } else {
        eprintln!("  Auto-stop:   disabled (--ttl-minutes=0)");
    }
    eprintln!(
        "  Stop now:    {} or {}",
        "Ctrl-C".bright_white(),
        format!("{} stop {}", runtime, container_name).bright_black()
    );
    eprintln!();
    eprintln!(
        "  {} when this exits the volume is deleted; nothing persists.",
        "Note:".yellow()
    );
    eprintln!("  {}", "─".repeat(60).bright_black());
    eprintln!();
}
