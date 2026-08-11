//! `flareo pull <slug>` — verify, then pull.
//!
//! Flow:
//!   1. Fetch module metadata from /api/v1/modules/<slug>
//!   2. Verify the signature via /api/v1/verify against the pinned digest
//!   3. If verification passes, shell out to `docker pull` (or podman if
//!      docker is not present)
//!   4. Print the pinned-digest ref the user can use in their compose
//!      file or docker run
//!
//! Refuses to pull when verification fails. The `--no-verify` flag
//! overrides this, but prints a loud warning.

use crate::api::{client, fetch, v1_url, with_auth};
use crate::config::load;
use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};

#[derive(Debug, Deserialize)]
struct ModuleDetail {
    slug: String,
    name: String,
    version: String,
    #[serde(rename = "imageRef")]
    image_ref: Option<String>,
    digest: String,
    status: String,
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

pub async fn run(api_url: &str, slug: &str, no_verify: bool) -> Result<(), CliError> {
    let cfg = load().unwrap_or_default();
    let token = cfg.auth.as_ref().map(|a| a.token.as_str());

    // ── Step 1: fetch module metadata ─────────────────────────────
    eprintln!();
    eprintln!("{} {}", "resolving".bold(), slug.cyan());

    let url = v1_url(api_url, &format!("/modules/{}", slug));
    let module: ModuleDetail = fetch(with_auth(client()?.get(&url), token)).await?;

    // Construct the pinned-digest ref that we'll pull.
    let pinned_ref = match &module.image_ref {
        Some(r) => {
            // If the API already gave us a digest-pinned ref, use it;
            // otherwise strip the tag and append the digest.
            if r.contains("@sha256:") {
                r.clone()
            } else {
                format!("{}@{}", strip_tag(r), module.digest)
            }
        }
        None => format!("public.ecr.aws/flareo/{}@{}", module.slug, module.digest),
    };

    eprintln!(
        "  {} {} v{}",
        "found".bright_black(),
        module.name.bold(),
        module.version
    );
    eprintln!("  {} {}", "digest".bright_black(), module.digest);

    // ── Step 2: refuse if status isn't verified (unless overridden) ──
    if module.status != "verified" && !no_verify {
        return Err(CliError::Other(anyhow::anyhow!(
            "module status is '{}'; refusing to pull. Pass --no-verify to override (not recommended).",
            module.status
        )));
    }

    // ── Step 3: verify signature ────────────────────────────────
    if !no_verify {
        eprintln!();
        eprintln!("{} signature", "checking".bold());

        let verify_url = v1_url(api_url, "/verify");
        let v: VerifyResponse = fetch(with_auth(client()?.post(&verify_url), token).json(
            &VerifyRequest {
                image_ref: &pinned_ref,
            },
        ))
        .await?;

        match v.status.as_str() {
            "verified" => {
                eprintln!("  {} Flareo signature valid", "✓".green());
            }
            "signed" => {
                // Signed but not in our catalog — shouldn't happen for a
                // known slug but fall through as a soft-success.
                eprintln!("  {} Sigstore signature present", "✓".green());
            }
            other => {
                return Err(CliError::Other(anyhow::anyhow!(
                    "verification returned '{}': {}",
                    other,
                    v.error_message.as_deref().unwrap_or("no detail")
                )));
            }
        }
    } else {
        eprintln!();
        eprintln!(
            "{} signature verification DISABLED (--no-verify)",
            "⚠".yellow().bold()
        );
    }

    // ── Step 4: pick runtime ────────────────────────────────────
    let runtime = pick_runtime()?;

    // ── Step 5: docker pull ─────────────────────────────────────
    eprintln!();
    eprintln!("{} {} {}", "pulling".bold(), runtime, pinned_ref.cyan());
    eprintln!();

    let status = Command::new(runtime)
        .arg("pull")
        .arg(&pinned_ref)
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .map_err(|e| CliError::Other(anyhow::anyhow!("failed to invoke {}: {}", runtime, e)))?;

    if !status.success() {
        return Err(CliError::Other(anyhow::anyhow!(
            "{} pull failed with exit code {}",
            runtime,
            status.code().unwrap_or(-1)
        )));
    }

    // ── Done ────────────────────────────────────────────────────
    eprintln!();
    eprintln!("{} {}", "✓".green().bold(), "pull complete".bold());
    eprintln!();
    eprintln!("  Use this reference in your compose or run command:");
    eprintln!();
    eprintln!("    {}", pinned_ref.cyan());
    eprintln!();
    eprintln!(
        "  Or run directly: {}",
        format!("{} run --rm {}", runtime, pinned_ref).bright_black()
    );
    eprintln!();

    Ok(())
}

/// Pick a container runtime. Prefer docker; fall back to podman. Error
/// if neither is available.
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
    std::env::split_paths(&path).any(|p| {
        let full = p.join(bin);
        // On Unix we'd check executable bit, but just "is this path
        // readable" is enough for a heuristic — docker run will give a
        // clearer error if it's really not executable.
        std::fs::metadata(&full).is_ok()
    })
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
