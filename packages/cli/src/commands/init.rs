//! `flareo init` — scaffold a `flareo.json` manifest in the current dir.
//!
//! Prompts the user for the minimum fields needed for a submission:
//!   - slug (inferred from directory name by default)
//!   - name
//!   - version
//!   - author
//!   - description
//!   - category
//!   - license
//!   - upstream URL
//!   - contact email
//!
//! Writes the result to `./flareo.json`. Refuses to overwrite an
//! existing file unless --force is passed.

use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::Serialize;
use std::fs;
use std::io::{self, BufRead, Write};
use std::path::Path;

/// Exact shape written to flareo.json. Matches the SubmitSchema on
/// the server side; keep these in sync when fields are added.
#[derive(Debug, Serialize)]
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

const CATEGORIES: &[&str] = &[
    "security",
    "media",
    "automation",
    "productivity",
    "network",
    "devtools",
    "monitoring",
    "communication",
];

pub async fn run(force: bool) -> Result<(), CliError> {
    let path = Path::new("flareo.json");
    if path.exists() && !force {
        return Err(CliError::Other(anyhow::anyhow!(
            "flareo.json already exists in this directory. Pass --force to overwrite, or edit it by hand."
        )));
    }

    eprintln!();
    eprintln!("{}", "Scaffold a flareo.json manifest.".bold());
    eprintln!(
        "  {}",
        "Press Enter to accept the default shown in [brackets].".bright_black()
    );
    eprintln!();

    // Derive a default slug from the current directory name.
    let default_slug = std::env::current_dir()
        .ok()
        .and_then(|p| {
            p.file_name()
                .map(|s| s.to_string_lossy().to_ascii_lowercase().to_string())
        })
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "my-module".to_string());

    let slug = prompt("slug (lowercase, kebab-case)", &default_slug)?;
    let name = prompt("display name", &title_case(&slug))?;
    let version = prompt("version", "0.1.0")?;
    let author = prompt("author", "")?;
    let description =
        prompt_long("description (at least 10 chars; 1-2 sentences of what this does)")?;

    eprintln!();
    eprintln!("  categories:");
    for (i, c) in CATEGORIES.iter().enumerate() {
        eprintln!("    {}  {}", i + 1, c);
    }
    let category = prompt_choice(CATEGORIES, "productivity")?;

    let license = prompt("license (SPDX identifier)", "MIT")?;
    let upstream_url = prompt("upstream URL (https://github.com/...)", "")?;
    let contact_email = prompt("contact email", "")?;

    let manifest = Manifest {
        slug,
        name,
        version,
        author,
        description,
        category,
        license,
        upstream_url,
        contact_email,
    };

    // Validate by round-tripping through serde_json and doing our own
    // length / regex checks. If something's wrong, we'd rather catch it
    // now than have the server reject the submission later.
    validate(&manifest)?;

    let json = serde_json::to_string_pretty(&manifest)
        .map_err(|e| CliError::Other(anyhow::anyhow!("serialize failed: {}", e)))?;
    fs::write(path, format!("{}\n", json))?;

    eprintln!();
    eprintln!(
        "{} Wrote {} ({} bytes)",
        "✓".green().bold(),
        "./flareo.json".cyan(),
        json.len() + 1
    );
    eprintln!();
    eprintln!("{}", "Next steps:".bold());
    eprintln!("  1. Add a Dockerfile (optional but strongly recommended)");
    eprintln!("  2. Review ./flareo.json and edit if needed");
    eprintln!("  3. Run: {} to submit", "flareo publish".cyan());
    eprintln!();

    Ok(())
}

fn prompt(label: &str, default: &str) -> Result<String, CliError> {
    if default.is_empty() {
        eprint!("  {}: ", label.bright_black());
    } else {
        eprint!("  {} [{}]: ", label.bright_black(), default.cyan());
    }
    io::stderr().flush()?;

    let stdin = io::stdin();
    let mut line = String::new();
    stdin.lock().read_line(&mut line)?;
    let v = line.trim();
    if v.is_empty() && default.is_empty() {
        return Err(CliError::Other(anyhow::anyhow!("'{}' is required", label)));
    }
    Ok(if v.is_empty() {
        default.to_string()
    } else {
        v.to_string()
    })
}

fn prompt_long(label: &str) -> Result<String, CliError> {
    eprint!("  {}: ", label.bright_black());
    io::stderr().flush()?;
    let stdin = io::stdin();
    let mut line = String::new();
    stdin.lock().read_line(&mut line)?;
    let v = line.trim();
    if v.len() < 10 {
        return Err(CliError::Other(anyhow::anyhow!(
            "description must be at least 10 characters"
        )));
    }
    Ok(v.to_string())
}

fn prompt_choice(choices: &[&str], default: &str) -> Result<String, CliError> {
    loop {
        eprint!("  category [{}]: ", default.cyan());
        io::stderr().flush()?;
        let stdin = io::stdin();
        let mut line = String::new();
        stdin.lock().read_line(&mut line)?;
        let v = line.trim().to_lowercase();
        let v = if v.is_empty() { default } else { v.as_str() };
        if choices.contains(&v) {
            return Ok(v.to_string());
        }
        // Try parsing as a number index.
        if let Ok(n) = v.parse::<usize>() {
            if n >= 1 && n <= choices.len() {
                return Ok(choices[n - 1].to_string());
            }
        }
        eprintln!("  {} not a valid category. Try again.", "✗".red());
    }
}

fn title_case(s: &str) -> String {
    s.split('-')
        .filter(|w| !w.is_empty())
        .map(|w| {
            let mut chars = w.chars();
            match chars.next() {
                Some(c) => c.to_uppercase().collect::<String>() + chars.as_str(),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn validate(m: &Manifest) -> Result<(), CliError> {
    let slug_ok = m
        .slug
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
    if !slug_ok || m.slug.len() < 2 || m.slug.len() > 64 {
        return Err(CliError::Other(anyhow::anyhow!(
            "slug must be lowercase kebab-case, 2-64 chars (got '{}')",
            m.slug
        )));
    }
    if m.upstream_url.is_empty()
        || !m.upstream_url.starts_with("https://")
        || !(m.upstream_url.contains("github.com/")
            || m.upstream_url.contains("gitlab.com/")
            || m.upstream_url.contains("codeberg.org/")
            || m.upstream_url.contains("bitbucket.org/"))
    {
        return Err(CliError::Other(anyhow::anyhow!(
            "upstream URL must be a full https:// URL on GitHub, GitLab, Codeberg, or Bitbucket"
        )));
    }
    if !m.contact_email.contains('@') || m.contact_email.len() < 5 {
        return Err(CliError::Other(anyhow::anyhow!(
            "contact email looks invalid"
        )));
    }
    Ok(())
}
