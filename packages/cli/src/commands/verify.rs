//! `flareo verify <image>` — verify any signed container image.
//!
//! Posts to `/api/v1/verify` on the Flareo server, which in turn does the
//! Sigstore signature-manifest check against the upstream registry. The
//! server is the source of truth; this command is a friendly terminal
//! wrapper around it.
//!
//! Exit codes:
//!   0  `verified` or `signed` — signature present and valid
//!   1  `unsigned` — no Sigstore signature found for this image
//!   2  `invalid` — signature present but rejected (CVE threshold, etc.)
//!   5  `error` — registry unreachable, parse failure, etc.
//!
//! Scriptable. Drop it into a Makefile and exit-code-check.

use crate::api::{client, fetch, v1_url, with_auth};
use crate::config::load;
use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct VerifyRequest<'a> {
    #[serde(rename = "imageRef")]
    image_ref: &'a str,
}

#[derive(Debug, Deserialize)]
struct VerifyResponse {
    status: String,
    #[serde(rename = "imageRef")]
    #[allow(dead_code)]
    image_ref: String,
    #[serde(rename = "resolvedDigest")]
    resolved_digest: Option<String>,
    #[serde(rename = "signerIdentity")]
    signer_identity: Option<String>,
    #[serde(rename = "signerIssuer")]
    signer_issuer: Option<String>,
    #[serde(rename = "rekorLogIndex")]
    rekor_log_index: Option<String>,
    #[serde(rename = "rekorUrl")]
    rekor_url: Option<String>,
    #[serde(rename = "flareoModule")]
    flareo_module: Option<FlareoModuleSummary>,
    #[serde(rename = "errorMessage")]
    error_message: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FlareoModuleSummary {
    slug: String,
    name: String,
    version: String,
    trust: i32,
    cves: CveCounts,
    #[serde(rename = "sbomUrl")]
    sbom_url: Option<String>,
    #[serde(rename = "scanUrl")]
    scan_url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CveCounts {
    critical: i32,
    high: i32,
    medium: i32,
    low: i32,
}

pub async fn run(api_url: &str, image_ref: &str) -> Result<(), CliError> {
    // Auth is optional for /verify but we attach it when present so the
    // user gets the higher rate-limit bucket.
    let cfg = load().unwrap_or_default();
    let token = cfg.auth.as_ref().map(|a| a.token.as_str());

    let url = v1_url(api_url, "/verify");

    eprintln!();
    eprintln!("{} {}", "verifying".bold(), image_ref.cyan());
    eprintln!();

    let body: VerifyResponse =
        fetch(with_auth(client()?.post(&url), token).json(&VerifyRequest { image_ref })).await?;

    render(&body);

    // Exit code depends on the verdict. The main dispatcher wraps this
    // Result<(), CliError> and converts to a process exit. We use
    // CliError::ApiError for non-zero cases so the exit code reflects
    // the verdict.
    match body.status.as_str() {
        "verified" | "signed" => Ok(()),
        "unsigned" => Err(CliError::Other(anyhow::anyhow!("unsigned"))),
        "invalid" => Err(CliError::Other(anyhow::anyhow!(
            "invalid: {}",
            body.error_message
                .as_deref()
                .unwrap_or("signature rejected")
        ))),
        "error" => Err(CliError::ApiError {
            status: 502,
            message: body
                .error_message
                .unwrap_or_else(|| "verification error".to_string()),
        }),
        other => Err(CliError::ApiError {
            status: 500,
            message: format!("unexpected status: {}", other),
        }),
    }
}

fn render(r: &VerifyResponse) {
    let (label, color_fn): (&str, fn(&str) -> String) = match r.status.as_str() {
        "verified" => ("VERIFIED", |s| s.green().bold().to_string()),
        "signed" => ("SIGNED", |s| s.green().to_string()),
        "unsigned" => ("UNSIGNED", |s| s.yellow().bold().to_string()),
        "invalid" => ("INVALID", |s| s.red().bold().to_string()),
        "error" => ("ERROR", |s| s.red().bold().to_string()),
        _ => ("UNKNOWN", |s| s.red().to_string()),
    };

    println!("  {}", color_fn(label));
    println!();

    if let Some(digest) = &r.resolved_digest {
        println!("  {}    {}", "digest".bright_black(), digest);
    }

    if let Some(identity) = &r.signer_identity {
        println!("  {}    {}", "signer".bright_black(), identity);
    }
    if let Some(issuer) = &r.signer_issuer {
        println!("  {}    {}", "issuer".bright_black(), issuer);
    }
    if let Some(idx) = &r.rekor_log_index {
        println!("  {}     {}", "rekor".bright_black(), idx);
    }
    if let Some(url) = &r.rekor_url {
        println!("  {}   {}", "rekor url".bright_black(), url.cyan());
    }

    // Catalog enrichment
    if let Some(m) = &r.flareo_module {
        println!();
        println!("  {}", "Flareo catalog module:".bold());
        println!(
            "    {} {}",
            m.slug.cyan(),
            format!("({} v{})", m.name, m.version).bright_black()
        );
        let trust_rendered = format_trust(m.trust);
        println!("    {} {}", "trust    ".bright_black(), trust_rendered);
        println!(
            "    {} {}",
            "cves     ".bright_black(),
            format_cves(&m.cves)
        );
        if let Some(sbom) = &m.sbom_url {
            println!(
                "    {} {}",
                "sbom     ".bright_black(),
                truncate(sbom, 72).cyan()
            );
        }
        if let Some(scan) = &m.scan_url {
            println!(
                "    {} {}",
                "scan     ".bright_black(),
                truncate(scan, 72).cyan()
            );
        }
    }

    // Error message for "error" / "invalid"
    if let Some(msg) = &r.error_message {
        println!();
        println!("  {} {}", "message:".bright_black(), msg);
    }

    // Trailing advice
    println!();
    match r.status.as_str() {
        "verified" => {
            println!(
                "  {}",
                "Image is signed by Flareo and passes trust checks.".bright_black()
            );
        }
        "signed" => {
            println!(
                "  {}",
                "Image is Sigstore-signed but not in the Flareo catalog.".bright_black()
            );
            println!(
                "  {}",
                "  We cannot attest to it beyond 'signature present'.".bright_black()
            );
        }
        "unsigned" => {
            println!(
                "  {}",
                "No Sigstore signature found. Provenance is unverifiable.".bright_black()
            );
        }
        "invalid" => {
            println!(
                "  {}",
                "Signature present but rejected. See message above.".bright_black()
            );
        }
        "error" => {
            println!(
                "  {}",
                "Could not complete the check. Retry in a moment.".bright_black()
            );
        }
        _ => {}
    }
    println!();
}

fn format_trust(trust: i32) -> String {
    let s = format!("{}/100", trust);
    if trust >= 90 {
        s.green().to_string()
    } else if trust >= 70 {
        s.yellow().to_string()
    } else {
        s.red().to_string()
    }
}

fn format_cves(c: &CveCounts) -> String {
    if c.critical > 0 {
        format!(
            "{} critical, {} high, {} medium, {} low",
            c.critical, c.high, c.medium, c.low
        )
        .red()
        .to_string()
    } else if c.high > 0 {
        format!(
            "0 critical, {} high, {} medium, {} low",
            c.high, c.medium, c.low
        )
        .yellow()
        .to_string()
    } else {
        format!("0 critical, 0 high, {} medium, {} low", c.medium, c.low)
            .green()
            .to_string()
    }
}

fn truncate(s: &str, n: usize) -> String {
    if s.chars().count() <= n {
        s.to_string()
    } else {
        let mut out: String = s.chars().take(n).collect();
        out.push('…');
        out
    }
}
