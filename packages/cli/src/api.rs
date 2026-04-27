//! HTTP client wrapper.
//!
//! Wraps reqwest with Flareo-specific defaults:
//!   - a sensible user agent
//!   - 30-second timeout
//!   - optional Bearer auth header from config
//!   - opt-in retry-on-429 with `Retry-After` header support
//!
//! All API endpoints are under `/api/v1` on the Flareo site. The base URL
//! is passed in from `Cli.api_url` so tests and local dev can redirect.
//!
//! ## Retry semantics (the polite-CLI fix)
//!
//! The retro from the 8-week MVP flagged that the CLI didn't respect
//! `Retry-After` headers — a user hitting the rate limit got a flat
//! 429 with a "wait a minute" message and had to manually re-run.
//! That's both impolite to the server (re-runs hit the limit again
//! and clog the bucket) and frustrating to the user.
//!
//! `send_with_retry()` and `fetch<T>()` add the missing behavior:
//!
//!   - On 429, read the `Retry-After` header. Integer-seconds form
//!     is honored exactly. HTTP-date form is recognized but ignored
//!     (we'd need a date-parsing crate for that; not worth a new
//!     dep just for the rare server that uses it).
//!   - If `Retry-After` is absent or unparseable, fall back to
//!     exponential backoff: 1s, 2s, 4s.
//!   - Any individual sleep is capped at 60s to defend against a
//!     misconfigured server returning a huge value.
//!   - Total cumulative wait is capped at 5 minutes — beyond that
//!     we surface the 429 to the user instead of retrying forever.
//!   - Maximum 3 retries per request. After exhausting them the
//!     caller sees the final 429 response.
//!   - If the request body isn't cloneable (rare for our use cases —
//!     all current bodies are JSON), we don't retry and surface the
//!     429 immediately.
//!
//! Other status codes don't retry. 5xx in particular is left to the
//! caller — it's tempting to retry on 503 too, but a flapping server
//! benefits from us backing off, not retrying. If we ever want 5xx
//! retry we'll add it explicitly per-call-site rather than baking it
//! into the generic helper.

use crate::errors::CliError;
use serde::de::DeserializeOwned;
use std::time::{Duration, Instant};

pub fn user_agent() -> String {
    format!(
        "flareo-cli/{} ({}; {})",
        env!("CARGO_PKG_VERSION"),
        std::env::consts::OS,
        std::env::consts::ARCH
    )
}

/// Build a reqwest client with our defaults. Cheap to call per-command;
/// we don't pool across processes.
pub fn client() -> Result<reqwest::Client, CliError> {
    reqwest::Client::builder()
        .user_agent(user_agent())
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .build()
        .map_err(CliError::Network)
}

/// Parse a response that might be an error, into either the typed T or
/// a structured CliError. The Flareo API returns `{ error: { code, message } }`
/// on 4xx/5xx.
///
/// This is the low-level parser used by `fetch()` and called directly
/// by call sites that don't want retry behavior (e.g. login's
/// device-flow polling, which has its own backoff loop).
pub async fn parse_response<T: DeserializeOwned>(resp: reqwest::Response) -> Result<T, CliError> {
    let status = resp.status();
    if status.is_success() {
        let text = resp.text().await?;
        let parsed: T = serde_json::from_str(&text).map_err(|e| {
            CliError::Other(anyhow::anyhow!(
                "failed to parse API response: {}. body: {}",
                e,
                text.chars().take(200).collect::<String>()
            ))
        })?;
        Ok(parsed)
    } else {
        let message = extract_error_message(resp).await;
        Err(CliError::ApiError {
            status: status.as_u16(),
            message,
        })
    }
}

async fn extract_error_message(resp: reqwest::Response) -> String {
    // Try to parse the Flareo-shaped error envelope. If that fails, fall
    // back to plain text. If THAT fails, just say "unknown."
    let text = match resp.text().await {
        Ok(t) => t,
        Err(_) => return "unknown error".to_string(),
    };
    #[derive(serde::Deserialize)]
    struct ErrEnvelope {
        error: Option<ErrBody>,
    }
    #[derive(serde::Deserialize)]
    struct ErrBody {
        message: Option<String>,
    }
    if let Ok(parsed) = serde_json::from_str::<ErrEnvelope>(&text) {
        if let Some(err) = parsed.error {
            if let Some(msg) = err.message {
                return msg;
            }
        }
    }
    let trimmed: String = text.chars().take(200).collect();
    if trimmed.is_empty() {
        "empty response body".to_string()
    } else {
        trimmed
    }
}

/// Build a URL for a v1 API endpoint. Prevents off-by-one slash bugs.
pub fn v1_url(base: &str, path: &str) -> String {
    let base = base.trim_end_matches('/');
    let path = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{}", path)
    };
    format!("{}/api/v1{}", base, path)
}

/// Apply the user's stored auth token to a request builder, if one exists.
pub fn with_auth(
    req: reqwest::RequestBuilder,
    token: Option<&str>,
) -> reqwest::RequestBuilder {
    match token {
        Some(t) if !t.is_empty() => req.bearer_auth(t),
        _ => req,
    }
}

// ─── retry helpers ────────────────────────────────────────────────

/// Maximum retries on 429 (initial attempt is "attempt 0", so 3 retries
/// = up to 4 sends total).
const MAX_RETRIES: u32 = 3;

/// Cap on a single sleep between retries. Defends against a server
/// returning a pathological `Retry-After: 86400` etc.
const MAX_SLEEP: Duration = Duration::from_secs(60);

/// Cap on total cumulative wait across all retries. Beyond this the
/// caller sees the 429 — better to fail fast than to hang forever.
const MAX_TOTAL_WAIT: Duration = Duration::from_secs(300);

/// Send a request, retrying on 429 with `Retry-After` honored.
///
/// The `RequestBuilder` is cloned via `try_clone()` before each send.
/// This works for our normal request shapes (JSON bodies, no body,
/// query params) — non-cloneable bodies (streaming uploads) would
/// cause us to give up and return the 429 directly. We don't have
/// streaming uploads in the CLI today.
///
/// The caller pairs this with `parse_response()` when a typed body
/// is needed; or calls `fetch::<T>(...)` for the combined helper.
pub async fn send_with_retry(
    req: reqwest::RequestBuilder,
) -> Result<reqwest::Response, CliError> {
    let start = Instant::now();
    let mut current = req;

    for attempt in 0..=MAX_RETRIES {
        // Clone before sending — once we send, `current` is consumed.
        let next = current.try_clone();

        let resp = current.send().await?;

        if resp.status() != reqwest::StatusCode::TOO_MANY_REQUESTS {
            return Ok(resp);
        }

        // 429. If this was our last allowed attempt, give the caller
        // the response so they can render the user-facing error.
        if attempt >= MAX_RETRIES {
            return Ok(resp);
        }

        // Compute how long to wait. Prefer Retry-After header; fall
        // back to exponential backoff.
        let server_hint = parse_retry_after(resp.headers());
        let wait = server_hint
            .unwrap_or_else(|| backoff_for_attempt(attempt))
            .min(MAX_SLEEP);

        // If sleeping would exceed the total wait budget, bail.
        if start.elapsed() + wait > MAX_TOTAL_WAIT {
            return Ok(resp);
        }

        // Need a cloned builder to retry. If body-stream made cloning
        // impossible, give up and surface the 429.
        let Some(retry_req) = next else {
            return Ok(resp);
        };

        // Friendly stderr notice. Quiet enough that scripts don't trip
        // on it but visible enough that an interactive user sees what's
        // happening rather than wondering why the command is slow.
        eprintln!(
            "  rate-limited; waiting {}s before retry ({} of {})",
            wait.as_secs(),
            attempt + 1,
            MAX_RETRIES
        );

        tokio::time::sleep(wait).await;
        current = retry_req;
    }

    // Loop exits via early returns; this is unreachable in practice.
    // A return here would mean attempt > MAX_RETRIES which is excluded
    // by the loop bound.
    unreachable!("send_with_retry loop terminated without returning")
}

/// One-call helper: send (with retry on 429) + parse the typed body.
///
/// This is the ergonomic call site for read endpoints — search, whoami,
/// module detail, verify lookup. POST endpoints that mutate state
/// (publish) can also use this safely because the server hasn't
/// processed the request body when it returns 429.
pub async fn fetch<T: DeserializeOwned>(
    req: reqwest::RequestBuilder,
) -> Result<T, CliError> {
    let resp = send_with_retry(req).await?;
    parse_response(resp).await
}

/// Read `Retry-After` from headers. Honors integer-seconds form (the
/// common case — Cloudflare, GitHub, our own API all use it). HTTP-date
/// form is documented in the spec but rare in practice; we'd need a
/// date-parsing crate to support it. Returns None for both missing and
/// unparseable, and the caller falls back to exponential backoff.
fn parse_retry_after(headers: &reqwest::header::HeaderMap) -> Option<Duration> {
    let value = headers.get(reqwest::header::RETRY_AFTER)?.to_str().ok()?;
    let secs: u64 = value.trim().parse().ok()?;
    Some(Duration::from_secs(secs))
}

/// Exponential backoff fallback when no `Retry-After` is present.
/// Attempt 0 → 1s, attempt 1 → 2s, attempt 2 → 4s, attempt 3 → 8s.
fn backoff_for_attempt(attempt: u32) -> Duration {
    let secs: u64 = 1u64.saturating_shl(attempt);
    Duration::from_secs(secs)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backoff_doubles() {
        assert_eq!(backoff_for_attempt(0), Duration::from_secs(1));
        assert_eq!(backoff_for_attempt(1), Duration::from_secs(2));
        assert_eq!(backoff_for_attempt(2), Duration::from_secs(4));
        assert_eq!(backoff_for_attempt(3), Duration::from_secs(8));
    }

    #[test]
    fn parse_retry_after_integer_seconds() {
        let mut h = reqwest::header::HeaderMap::new();
        h.insert(reqwest::header::RETRY_AFTER, "30".parse().unwrap());
        assert_eq!(parse_retry_after(&h), Some(Duration::from_secs(30)));
    }

    #[test]
    fn parse_retry_after_with_whitespace() {
        let mut h = reqwest::header::HeaderMap::new();
        h.insert(reqwest::header::RETRY_AFTER, "  45  ".parse().unwrap());
        assert_eq!(parse_retry_after(&h), Some(Duration::from_secs(45)));
    }

    #[test]
    fn parse_retry_after_missing() {
        let h = reqwest::header::HeaderMap::new();
        assert_eq!(parse_retry_after(&h), None);
    }

    #[test]
    fn parse_retry_after_http_date_returns_none() {
        // We deliberately don't support HTTP-date form. Verifies the
        // graceful-degradation path: unparseable → None → caller falls
        // back to exponential backoff rather than crashing.
        let mut h = reqwest::header::HeaderMap::new();
        h.insert(
            reqwest::header::RETRY_AFTER,
            "Wed, 21 Oct 2026 07:28:00 GMT".parse().unwrap(),
        );
        assert_eq!(parse_retry_after(&h), None);
    }
}
