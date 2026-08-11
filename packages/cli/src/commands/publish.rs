//! `flareo publish` — submit the current directory as a module.
//!
//! Reads `./flareo.json`, validates the shape, and POSTs to
//! `/api/v1/submissions`. Requires authentication (`flareo login`
//! first) — the server rejects anonymous submissions.
//!
//! Optionally includes the contents of `./Dockerfile` in the submission
//! body, which helps reviewers understand the build.

use crate::api::{client, fetch, v1_url, with_auth};
use crate::config::load;
use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Deserialize, Serialize)]
struct Manifest {
    slug: String,
    name: String,
    version: String,
    author: String,
    description: String,
    category: String,
    license: String,
    #[serde(rename = "upstreamUrl")]
    upstream_url: String,
    #[serde(rename = "contactEmail")]
    contact_email: String,
}

#[derive(Debug, Serialize)]
struct SubmitRequest<'a> {
    slug: &'a str,
    name: &'a str,
    version: &'a str,
    author: &'a str,
    description: &'a str,
    category: &'a str,
    license: &'a str,
    #[serde(rename = "upstreamUrl")]
    upstream_url: &'a str,
    #[serde(rename = "contactEmail")]
    contact_email: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    dockerfile: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SubmitResponse {
    status: String,
    #[serde(rename = "submissionId")]
    submission_id: String,
    #[serde(default, rename = "reviewUrl")]
    review_url: Option<String>,
    #[serde(default)]
    message: Option<String>,
}

pub async fn run(api_url: &str) -> Result<(), CliError> {
    // Load auth; submission requires a token.
    let cfg = load().unwrap_or_default();
    let auth = cfg.require_token()?;

    // Read the manifest.
    let manifest_path = Path::new("flareo.json");
    if !manifest_path.exists() {
        return Err(CliError::Other(anyhow::anyhow!(
            "no flareo.json in current directory. Run `flareo init` first."
        )));
    }
    let manifest_text = fs::read_to_string(manifest_path)?;
    let manifest: Manifest = serde_json::from_str(&manifest_text).map_err(|e| {
        CliError::Other(anyhow::anyhow!(
            "failed to parse flareo.json: {}. Is the JSON valid?",
            e
        ))
    })?;

    // Optionally include Dockerfile.
    let dockerfile = fs::read_to_string("Dockerfile")
        .ok()
        .filter(|s| !s.is_empty());

    eprintln!();
    eprintln!(
        "{} {} (v{})",
        "submitting".bold(),
        manifest.slug.cyan(),
        manifest.version
    );
    eprintln!("  {}", manifest.description.bright_black());
    eprintln!();
    if dockerfile.is_some() {
        eprintln!(
            "  {} including Dockerfile ({} bytes)",
            "✓".green(),
            dockerfile.as_ref().map(String::len).unwrap_or(0)
        );
    } else {
        eprintln!(
            "  {} no Dockerfile found — submission will proceed without one",
            "!".yellow()
        );
    }
    eprintln!();

    // POST the submission.
    let url = v1_url(api_url, "/submissions");
    let body = SubmitRequest {
        slug: &manifest.slug,
        name: &manifest.name,
        version: &manifest.version,
        author: &manifest.author,
        description: &manifest.description,
        category: &manifest.category,
        license: &manifest.license,
        upstream_url: &manifest.upstream_url,
        contact_email: &manifest.contact_email,
        dockerfile,
    };

    let result: SubmitResponse =
        fetch(with_auth(client()?.post(&url), Some(&auth.token)).json(&body)).await?;

    // Render the result.
    match result.status.as_str() {
        "received" => {
            eprintln!(
                "{} Submission received: {}",
                "✓".green().bold(),
                result.submission_id.cyan()
            );
        }
        "already_pending" => {
            eprintln!(
                "{} Already in the queue: {}",
                "→".yellow(),
                result.submission_id.cyan()
            );
        }
        other => {
            eprintln!(
                "{} Unexpected status '{}' — submission id {}",
                "?".yellow(),
                other,
                result.submission_id
            );
        }
    }
    if let Some(url) = &result.review_url {
        eprintln!("  {} {}", "review".bright_black(), url);
    }
    if let Some(msg) = &result.message {
        eprintln!();
        eprintln!("  {}", msg.bright_black());
    }
    eprintln!();

    Ok(())
}
