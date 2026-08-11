//! `flareo whoami` — print identity of the currently signed-in user.

use crate::api::{client, fetch, v1_url, with_auth};
use crate::config::load;
use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct WhoamiResponse {
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    email: Option<String>,
    #[serde(default)]
    role: Option<String>,
    #[serde(default, rename = "authSource")]
    auth_source: Option<String>,
    #[serde(default, rename = "apiKeyLabel")]
    api_key_label: Option<String>,
}

pub async fn run(api_url: &str) -> Result<(), CliError> {
    let cfg = load()?;
    let auth = cfg.require_token()?;

    // Use the API URL recorded in config if present, else the flag value.
    // If they differ, prefer the flag (the user is explicitly redirecting).
    let base = if api_url != "https://flareo.app" {
        api_url
    } else {
        &auth.api_url
    };

    let url = v1_url(base, "/whoami");
    let who: WhoamiResponse = fetch(with_auth(client()?.get(&url), Some(&auth.token))).await?;

    println!();
    print_kv(
        "user",
        who.name
            .as_deref()
            .or(who.id.as_deref())
            .unwrap_or("<unknown>"),
    );
    if let Some(email) = &who.email {
        print_kv("email", email);
    }
    if let Some(role) = &who.role {
        print_kv("role", role);
    }
    if let Some(src) = &who.auth_source {
        print_kv("auth", src);
    }
    if let Some(label) = &who.api_key_label {
        print_kv("key", label);
    }
    print_kv("api", base);
    println!();
    Ok(())
}

fn print_kv(k: &str, v: &str) {
    println!("  {:<6} {}", k.bright_black(), v);
}
