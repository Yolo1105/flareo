//! `flareo login` — GitHub device code flow.
//!
//! Flow:
//!   1. POST to github.com/login/device/code with our public client_id.
//!   2. Display the user_code and verification_uri. Open the browser.
//!   3. Poll github.com/login/oauth/access_token with device_code.
//!   4. On success, POST github token → Flareo's /api/auth/cli-exchange.
//!   5. Flareo returns a scoped API key (fla_<hex>).
//!   6. Save the Flareo key in ~/.flareo/config.toml.
//!
//! The GitHub OAuth client_id here is the PUBLIC Flareo CLI client. It
//! is intentionally baked into the binary; it is not a secret. Each
//! Flareo deployment chooses its own client_id and exposes it as
//! FLAREO_CLI_GITHUB_CLIENT_ID at build time.

use crate::api::{client, parse_response, user_agent};
use crate::config::{save, AuthBlock, Config};
use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Built-in default GitHub OAuth client_id for the Flareo CLI.
///
/// This is replaced at release time via `cargo build --features embed-client-id`
/// and a build-time env var; for dev builds we use the placeholder below. The
/// CLI works fine with any GitHub OAuth App as long as it has the "device
/// flow" capability enabled.
const DEFAULT_GITHUB_CLIENT_ID: &str = env!(
    "FLAREO_GITHUB_CLIENT_ID",
    "FLAREO_GITHUB_CLIENT_ID env var must be set at build time"
);

#[derive(Debug, Deserialize)]
struct DeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum PollResponse {
    Success {
        access_token: String,
    },
    Pending {
        error: String,
        #[allow(dead_code)]
        error_description: Option<String>,
    },
}

#[derive(Debug, Serialize)]
struct ExchangeRequest<'a> {
    github_access_token: &'a str,
    /// Human-readable label for this key, shown in /app/settings/api-keys.
    label: String,
}

#[derive(Debug, Deserialize)]
struct ExchangeResponse {
    flareo_token: String,
    user_handle: Option<String>,
}

pub async fn run(api_url: &str) -> Result<(), CliError> {
    eprintln!();
    eprintln!("{}", "Sign in to Flareo".bold());
    eprintln!();

    let client = client()?;

    // ── Step 1: request a device code from GitHub ───────────────
    let device: DeviceCodeResponse = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", DEFAULT_GITHUB_CLIENT_ID),
            // The only scope we need is `read:user` (to get your handle)
            // plus `user:email` for the exchange.
            ("scope", "read:user user:email"),
        ])
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    // ── Step 2: show the user_code and open the browser ─────────
    eprintln!(
        "  First, copy this one-time code: {}",
        device.user_code.yellow().bold()
    );
    eprintln!(
        "  Then open:                      {}",
        device.verification_uri.cyan()
    );
    eprintln!();
    eprintln!("  Waiting for authorization ...");

    // Best-effort: try to open the browser for the user. Non-fatal if it fails.
    let _ = open_browser(&device.verification_uri);

    // ── Step 3: poll for the access token ───────────────────────
    let start = std::time::Instant::now();
    let max_elapsed = Duration::from_secs(device.expires_in);
    let mut interval = Duration::from_secs(device.interval);

    let github_token = loop {
        if start.elapsed() > max_elapsed {
            return Err(CliError::Auth(
                "device code expired before you authorized; please run `flareo login` again".into(),
            ));
        }

        tokio::time::sleep(interval).await;

        let resp = client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .form(&[
                ("client_id", DEFAULT_GITHUB_CLIENT_ID),
                ("device_code", &device.device_code),
                ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
            ])
            .send()
            .await?;

        if !resp.status().is_success() {
            return Err(CliError::Auth(format!(
                "GitHub polling failed with status {}",
                resp.status()
            )));
        }

        let parsed: PollResponse = resp.json().await?;
        match parsed {
            PollResponse::Success { access_token } => {
                break access_token;
            }
            PollResponse::Pending { error, .. } => match error.as_str() {
                "authorization_pending" => {
                    // Keep waiting.
                    continue;
                }
                "slow_down" => {
                    // GitHub asked us to slow down. Add 5 seconds to the interval.
                    interval += Duration::from_secs(5);
                    continue;
                }
                "expired_token" => {
                    return Err(CliError::Auth(
                        "device code expired; run `flareo login` again".into(),
                    ));
                }
                "access_denied" => {
                    return Err(CliError::Auth("authorization was denied".into()));
                }
                other => {
                    return Err(CliError::Auth(format!(
                        "unexpected error from GitHub: {other}"
                    )));
                }
            },
        }
    };

    // ── Step 4: exchange the GitHub token for a Flareo API key ──
    eprintln!("  {} GitHub authorization received.", "✓".green());
    eprintln!("  Exchanging for a Flareo session ...");

    let label = format!("cli / {}", hostname_short());
    let exchange_url = format!("{}/api/auth/cli-exchange", api_url.trim_end_matches('/'));
    let exchange_resp = client
        .post(&exchange_url)
        .header("User-Agent", user_agent())
        .json(&ExchangeRequest {
            github_access_token: &github_token,
            label,
        })
        .send()
        .await?;

    let exchange: ExchangeResponse = parse_response(exchange_resp).await?;

    // ── Step 5: save to config ──────────────────────────────────
    let cfg = Config {
        auth: Some(AuthBlock {
            token: exchange.flareo_token,
            api_url: api_url.to_string(),
            user_handle: exchange.user_handle.clone(),
            signed_in_at: Some(chrono_now_rfc3339()),
        }),
    };
    save(&cfg)?;

    // ── Done ────────────────────────────────────────────────────
    eprintln!();
    eprintln!(
        "  {} Signed in{}",
        "✓".green().bold(),
        match exchange.user_handle {
            Some(h) => format!(" as {}.", h.cyan()),
            None => ".".to_string(),
        }
    );
    eprintln!("  Try: {}", "flareo whoami".cyan());
    eprintln!();
    Ok(())
}

/// Attempt to open a URL in the user's default browser. Platform-specific.
fn open_browser(url: &str) -> std::io::Result<()> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(url).status()?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open").arg(url).status()?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", url])
            .status()?;
    }
    Ok(())
}

/// Short hostname for use in the API key label. Falls back to "unknown"
/// if the OS doesn't let us read it.
fn hostname_short() -> String {
    match std::env::var("HOSTNAME").ok().or_else(|| {
        std::process::Command::new("hostname")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
    }) {
        Some(s) if !s.is_empty() => s,
        _ => "unknown".to_string(),
    }
}

/// Minimal RFC3339 current timestamp. This is only a diagnostic field
/// stored in the config file; we don't need perfect accuracy.
fn chrono_now_rfc3339() -> String {
    // Use the OS `date` command if available (works on macOS/Linux,
    // fails gracefully on Windows where we fall back to an epoch
    // timestamp). The failure case is cosmetic.
    if let Ok(output) = std::process::Command::new("date")
        .args(["-u", "+%Y-%m-%dT%H:%M:%SZ"])
        .output()
    {
        if output.status.success() {
            if let Ok(s) = String::from_utf8(output.stdout) {
                let trimmed = s.trim().to_string();
                if !trimmed.is_empty() {
                    return trimmed;
                }
            }
        }
    }
    // Fallback: epoch seconds as a string.
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("epoch:{}", secs)
}
