//! `flareo update <slug>` — show what's changed since you last pulled.
//!
//! Common ask: "I pulled vaultwarden last month, what's different now?"
//!
//! Without this command, the answer requires comparing digests by
//! hand against the catalog page or git-blame the docker-compose file.
//! This subcommand does the comparison for you and prints a focused
//! changelog.
//!
//! Flow:
//!   1. Read the user's currently-pinned digest. Two sources, in order:
//!      - The `--current <digest>` flag (explicit, scriptable)
//!      - `docker images` parsing for the most recently-tagged ref
//!        of the module's image. This is the "I forget what I pinned"
//!        convenience path.
//!   2. Fetch the catalog's current pinned digest for the module.
//!   3. If they're the same → exit 0 with "you're up to date."
//!   4. If they differ → fetch a few signal points for both digests
//!      (version, CVE count, signature time) and render a diff.
//!   5. Print the new pinned-digest ref and the `flareo pull` command
//!      to upgrade.
//!
//! What this does NOT do:
//!   - Doesn't auto-pull. The whole point is informed upgrade — show
//!     the user what's changing so they can decide.
//!   - Doesn't try to compute a semantic changelog. Modules don't all
//!     emit one. We surface the digest + version + scan-result delta;
//!     the rest is on the publisher.
//!   - Doesn't do bulk update across all modules. One slug at a time.

use crate::api::{client, fetch, v1_url, with_auth};
use crate::config::load;
use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::Deserialize;
use std::process::Command;

#[derive(Debug, Deserialize)]
struct ModuleDetail {
    slug: String,
    name: String,
    version: String,
    #[serde(rename = "imageRef")]
    image_ref: Option<String>,
    digest: String,
    status: String,
    /// CVE counts at current digest. Optional because the API may
    /// not surface them on every module endpoint variant.
    #[serde(rename = "cveCritical")]
    cve_critical: Option<u32>,
    #[serde(rename = "cveHigh")]
    cve_high: Option<u32>,
    /// Last build timestamp — when the canonical canary rebuild
    /// produced the current pinned digest. Used to estimate how
    /// stale the user's pinned digest is.
    #[serde(rename = "lastRebuiltAt")]
    last_rebuilt_at: Option<String>,
}

pub async fn run(
    api_url: &str,
    slug: &str,
    explicit_current: Option<String>,
) -> Result<(), CliError> {
    let cfg = load().unwrap_or_default();
    let token = cfg.auth.as_ref().map(|a| a.token.as_str());

    // ── Step 1: figure out what the user has locally ───────────────
    let current_digest = match explicit_current {
        Some(d) => {
            // Validate shape. The catalog API uses sha256:... format.
            if !d.starts_with("sha256:") || d.len() < 71 {
                return Err(CliError::Other(anyhow::anyhow!(
                    "--current must be a sha256 digest (sha256:abc...). Got: {}",
                    d
                )));
            }
            d
        }
        None => {
            // Inspect local docker images for the most recent matching ref.
            match find_local_digest(slug) {
                Some(d) => {
                    eprintln!(
                        "  {} found local digest {}",
                        "→".bright_black(),
                        short_digest(&d).cyan()
                    );
                    d
                }
                None => {
                    return Err(CliError::Other(anyhow::anyhow!(
                        "no local image found for slug '{}'. Either you haven't pulled it yet, or pass --current <digest> explicitly.",
                        slug
                    )));
                }
            }
        }
    };

    // ── Step 2: fetch the catalog's current pinned digest ──────────
    eprintln!(
        "{} {} {}",
        "checking".bold(),
        slug.cyan(),
        "for updates...".bright_black()
    );

    let url = v1_url(api_url, &format!("/modules/{}", slug));
    let module: ModuleDetail = fetch(with_auth(client()?.get(&url), token)).await?;

    // ── Step 3: compare ────────────────────────────────────────────
    if module.digest == current_digest {
        eprintln!();
        eprintln!(
            "  {} you're up to date with {} v{}.",
            "✓".green(),
            module.name.bold(),
            module.version
        );
        eprintln!(
            "  {} digest {}",
            "  ".bright_black(),
            short_digest(&module.digest).bright_black()
        );
        return Ok(());
    }

    // ── Step 4: render the diff ────────────────────────────────────
    eprintln!();
    eprintln!(
        "  {} {} has updates",
        "↑".yellow().bold(),
        module.name.bold()
    );
    eprintln!();
    eprintln!("  {}", "Your pinned version".bright_black());
    eprintln!(
        "    digest:  {}",
        short_digest(&current_digest).bright_white()
    );
    eprintln!();
    eprintln!("  {}", "Latest in catalog".bright_black());
    eprintln!("    version: {}", module.version.bright_white().bold());
    eprintln!(
        "    digest:  {}",
        short_digest(&module.digest).bright_white().bold()
    );
    if let Some(rebuilt) = &module.last_rebuilt_at {
        eprintln!(
            "    built:   {}",
            rebuilt.bright_black()
        );
    }

    if let (Some(crit), Some(high)) = (module.cve_critical, module.cve_high) {
        eprintln!();
        eprintln!("  {}", "CVE counts (post-VEX)".bright_black());
        let crit_color = if crit == 0 {
            format!("{}", crit).green().to_string()
        } else {
            format!("{}", crit).red().bold().to_string()
        };
        let high_color = if high == 0 {
            format!("{}", high).green().to_string()
        } else if high <= 3 {
            format!("{}", high).yellow().to_string()
        } else {
            format!("{}", high).red().to_string()
        };
        eprintln!("    critical: {}", crit_color);
        eprintln!("    high:     {}", high_color);
    }

    if module.status != "verified" {
        eprintln!();
        eprintln!(
            "  {} status is '{}' — review module page before pulling",
            "⚠".yellow(),
            module.status
        );
    }

    // ── Step 5: print the upgrade command ──────────────────────────
    let pinned_ref = match &module.image_ref {
        Some(r) if r.contains("@sha256:") => r.clone(),
        Some(r) => format!("{}@{}", strip_tag(r), module.digest),
        None => format!("public.ecr.aws/flareo/{}@{}", module.slug, module.digest),
    };

    eprintln!();
    eprintln!("  {}", "To upgrade".bright_black());
    eprintln!("    {} {}", "$".bright_black(), format!("flareo pull {}", slug).bright_white());
    eprintln!();
    eprintln!("  {}", "Or pull the digest-pinned ref directly".bright_black());
    eprintln!("    {} {}", "$".bright_black(), format!("docker pull {}", pinned_ref).bright_white());
    eprintln!();
    eprintln!(
        "  {}",
        format!(
            "Read the full module page: https://flareo.dev/modules/{}",
            slug
        )
        .bright_black()
    );

    Ok(())
}

// ─── helpers ──────────────────────────────────────────────────────

/// Inspect local docker (or podman) images for the most-recent
/// ref of the given module slug. Returns the sha256 digest if found.
fn find_local_digest(slug: &str) -> Option<String> {
    // Try docker first, then podman. Same CLI surface for inspect.
    for runtime in &["docker", "podman"] {
        if let Some(d) = inspect_with(runtime, slug) {
            return Some(d);
        }
    }
    None
}

fn inspect_with(runtime: &str, slug: &str) -> Option<String> {
    // List image refs matching the slug pattern. We accept any
    // registry path that ends with /<slug>:<tag> or /<slug>@<digest>.
    let images = Command::new(runtime)
        .args(["images", "--format", "{{.Repository}}:{{.Tag}}@{{.Digest}}"])
        .output()
        .ok()?;
    if !images.status.success() {
        return None;
    }
    let out = String::from_utf8_lossy(&images.stdout);
    // Find the first line whose repository ends with `/<slug>`.
    let needle = format!("/{}", slug);
    for line in out.lines() {
        // Format is `repo:tag@digest`. Split carefully — repo may
        // contain `:` from a port.
        let at = line.rfind('@')?;
        let (repo_tag, digest) = line.split_at(at);
        let digest = &digest[1..]; // strip the `@`
        if !digest.starts_with("sha256:") {
            continue;
        }
        // The colon separates repo from tag. We don't care about the
        // tag, just whether the repo ends with the slug.
        let repo_end = repo_tag.rfind(':').unwrap_or(repo_tag.len());
        let repo = &repo_tag[..repo_end];
        if repo.ends_with(&needle) || repo == slug {
            return Some(digest.to_string());
        }
    }
    None
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

fn short_digest(digest: &str) -> String {
    if digest.len() <= 19 {
        return digest.to_string();
    }
    format!("{}…", &digest[..19])
}
