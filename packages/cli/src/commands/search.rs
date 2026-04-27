//! `flareo search` — query the module catalog and render results as a table.

use crate::api::{client, fetch, v1_url, with_auth};
use crate::config::load;
use crate::errors::CliError;
use comfy_table::{presets::UTF8_HORIZONTAL_ONLY, ContentArrangement, Table};
use owo_colors::OwoColorize;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct ListResponse {
    modules: Vec<ModuleSummary>,
}

#[derive(Debug, Deserialize)]
struct ModuleSummary {
    slug: String,
    name: String,
    version: String,
    #[allow(dead_code)]
    author: String,
    category: String,
    trust: i32,
    cves: CveCounts,
    deploys: i32,
    #[serde(default, rename = "previewable")]
    #[allow(dead_code)]
    previewable: bool,
}

#[derive(Debug, Deserialize)]
struct CveCounts {
    critical: i32,
    high: i32,
    medium: i32,
    #[allow(dead_code)]
    low: i32,
}

pub async fn run(api_url: &str, query: &str, limit: u32) -> Result<(), CliError> {
    // Auth is optional on this endpoint — it works anonymously too —
    // but we still attach it when present so the higher rate-limit
    // bucket applies.
    let cfg = load().unwrap_or_default();
    let token = cfg.auth.as_ref().map(|a| a.token.as_str());

    // Clamp limit to the server's max.
    let limit = limit.clamp(1, 100);

    let url = format!(
        "{}?q={}&limit={}",
        v1_url(api_url, "/modules"),
        urlencoding_minimal(query),
        limit
    );

    let body: ListResponse = fetch(with_auth(client()?.get(&url), token)).await?;

    if body.modules.is_empty() {
        println!();
        println!("  No modules found for {}", query.cyan());
        println!();
        return Ok(());
    }

    let mut table = Table::new();
    table
        .load_preset(UTF8_HORIZONTAL_ONLY)
        .set_content_arrangement(ContentArrangement::Dynamic)
        .set_header(vec![
            "SLUG", "VERSION", "CATEGORY", "TRUST", "CVE", "DEPLOYS",
        ]);

    for m in body.modules {
        let cve_cell = format_cves(&m.cves);
        let trust_cell = format_trust(m.trust);
        table.add_row(vec![
            m.slug.to_string(),
            m.version.to_string(),
            m.category.to_string(),
            trust_cell,
            cve_cell,
            format_deploys(m.deploys),
        ]);
        // prevent unused-variable warning for `name` field
        let _ = &m.name;
    }

    println!();
    println!("{}", table);
    println!();
    Ok(())
}

fn format_cves(c: &CveCounts) -> String {
    if c.critical > 0 {
        format!("{} crit", c.critical).red().to_string()
    } else if c.high > 0 {
        format!("{} high", c.high).yellow().to_string()
    } else if c.medium > 0 {
        format!("{} med", c.medium).bright_black().to_string()
    } else {
        "clean".green().to_string()
    }
}

fn format_trust(trust: i32) -> String {
    let s = format!("{}", trust);
    if trust >= 90 {
        s.green().to_string()
    } else if trust >= 60 {
        s.yellow().to_string()
    } else {
        s.red().to_string()
    }
}

fn format_deploys(n: i32) -> String {
    if n >= 1000 {
        format!("{:.1}k", n as f64 / 1000.0)
    } else {
        format!("{}", n)
    }
}

/// Minimal URL-encoder for the query string. Avoids pulling another crate
/// just for this.
fn urlencoding_minimal(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.' || ch == '~' {
            out.push(ch);
        } else {
            let mut buf = [0u8; 4];
            for b in ch.encode_utf8(&mut buf).as_bytes() {
                out.push_str(&format!("%{:02X}", b));
            }
        }
    }
    out
}
