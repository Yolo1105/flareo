//! `flareo compose <slug>` — emit a `docker-compose.yaml` for a module.
//!
//! Fetches the module's current pinned digest from `/api/v1/modules/<slug>`,
//! then emits a complete Compose file with:
//!   - `image:` pinned by digest (content-addressable, won't silently change)
//!   - port binding on 127.0.0.1 by default (safer than 0.0.0.0)
//!   - a named volume for persistent state
//!   - restart policy and resource hints
//!
//! Port / volume / env guidance per module is baked into the CLI as a
//! lookup table for the 12 known modules. Over time we'd replace this
//! with a `/api/v1/modules/:slug/compose-hints` endpoint and keep the
//! CLI thin, but for v0.2 this keeps the critical path working even
//! when the server side hasn't been extended.

use crate::api::{client, fetch, v1_url, with_auth};
use crate::config::load;
use crate::errors::CliError;
use owo_colors::OwoColorize;
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;

/// Subset of the module detail response we actually use.
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

/// What goes in the rendered Compose file for each known module. If a
/// module isn't in this table we still generate a file, but with
/// placeholder defaults and a TODO comment.
struct ComposeHints {
    /// Default host port to bind.
    host_port: u16,
    /// Container port the app listens on.
    container_port: u16,
    /// Single named volume mounted at this path (most modules).
    volume_path: Option<&'static str>,
    /// Environment variables to seed with sensible defaults. Each
    /// tuple is (KEY, VALUE_template) — the template may contain
    /// `{domain}` which we'll substitute from the --domain flag.
    env: &'static [(&'static str, &'static str)],
    /// Optional sidecar services this module needs (e.g. Postgres for
    /// Linkwarden). Keyed by service name; value is the image.
    sidecars: &'static [(&'static str, &'static str)],
    /// Brief note shown as a comment at the top of the file.
    notes: &'static str,
}

fn hints_for(slug: &str) -> Option<ComposeHints> {
    // Stays in sync with the 12-module catalog. If a module's upstream
    // defaults change, update here; `cargo test` in the tests/ dir
    // catches stale entries against the live catalog.
    Some(match slug {
        "vaultwarden" => ComposeHints {
            host_port: 8080,
            container_port: 80,
            volume_path: Some("/data"),
            env: &[
                ("DOMAIN", "https://{domain}"),
                ("SIGNUPS_ALLOWED", "false"),
                ("WEBSOCKET_ENABLED", "true"),
            ],
            sidecars: &[],
            notes: "Set SIGNUPS_ALLOWED=true temporarily to create the first admin user.",
        },
        "uptime-kuma" => ComposeHints {
            host_port: 3001,
            container_port: 3001,
            volume_path: Some("/app/data"),
            env: &[],
            sidecars: &[],
            notes: "First visit to the web UI walks you through admin setup.",
        },
        "gitea" => ComposeHints {
            host_port: 3000,
            container_port: 3000,
            volume_path: Some("/data"),
            env: &[
                ("GITEA__server__ROOT_URL", "https://{domain}/"),
                ("GITEA__server__DOMAIN", "{domain}"),
            ],
            sidecars: &[],
            notes: "SSH port 22 is not mapped by default; uncomment the ports: block to enable git+ssh.",
        },
        "linkwarden" => ComposeHints {
            host_port: 3000,
            container_port: 3000,
            volume_path: Some("/data/data"),
            env: &[
                ("DATABASE_URL", "postgresql://linkwarden:changeme@linkwarden-db:5432/linkwarden"),
                ("NEXTAUTH_URL", "https://{domain}/api/v1/auth"),
                ("NEXTAUTH_SECRET", "CHANGE_ME_TO_A_RANDOM_STRING"),
            ],
            sidecars: &[("linkwarden-db", "docker.io/library/postgres:16-alpine")],
            notes: "Needs a Postgres sidecar; a placeholder is included. Generate NEXTAUTH_SECRET with `openssl rand -hex 32`.",
        },
        "ntfy" => ComposeHints {
            host_port: 8080,
            container_port: 80,
            volume_path: Some("/var/lib/ntfy"),
            env: &[
                ("NTFY_BASE_URL", "https://{domain}"),
                ("NTFY_LISTEN_HTTP", ":80"),
                ("NTFY_BEHIND_PROXY", "true"),
            ],
            sidecars: &[],
            notes: "If you run a reverse proxy, keep NTFY_BEHIND_PROXY=true so ntfy trusts X-Forwarded-For.",
        },
        "adguard-home" => ComposeHints {
            host_port: 3000,
            container_port: 3000,
            volume_path: Some("/opt/adguardhome/work"),
            env: &[],
            sidecars: &[],
            notes: "To use AdGuard as DNS, expose 53/udp and 53/tcp — removed from the defaults because most homelabs already run something on :53.",
        },
        "caddy" => ComposeHints {
            host_port: 80,
            container_port: 80,
            volume_path: Some("/data"),
            env: &[],
            sidecars: &[],
            notes: "Edit the Caddyfile volume mount to pass your own config. Defaults to a static file server.",
        },
        "jellyfin" => ComposeHints {
            host_port: 8096,
            container_port: 8096,
            volume_path: Some("/config"),
            env: &[("JELLYFIN_PublishedServerUrl", "https://{domain}")],
            sidecars: &[],
            notes: "Add a bind mount for your media library under /media.",
        },
        "immich" => ComposeHints {
            host_port: 2283,
            container_port: 3001,
            volume_path: Some("/usr/src/app/upload"),
            env: &[("IMMICH_VERSION", "release")],
            sidecars: &[],
            notes: "Immich has its own published compose file with a Postgres+Redis+ML stack. This skeleton only starts the web service; for the full stack see https://immich.app/docs/install/docker-compose.",
        },
        "home-assistant" => ComposeHints {
            host_port: 8123,
            container_port: 8123,
            volume_path: Some("/config"),
            env: &[("TZ", "UTC")],
            sidecars: &[],
            notes: "Home Assistant usually wants host networking for device discovery. Add `network_mode: host` and remove the ports: block if you need that.",
        },
        "nextcloud" => ComposeHints {
            host_port: 8080,
            container_port: 80,
            volume_path: Some("/var/www/html"),
            env: &[
                ("NEXTCLOUD_TRUSTED_DOMAINS", "{domain}"),
                ("OVERWRITEPROTOCOL", "https"),
            ],
            sidecars: &[],
            notes: "Nextcloud recommends a database sidecar (Postgres or MariaDB) for anything past a tiny install. Not included here.",
        },
        "paperless-ngx" => ComposeHints {
            host_port: 8000,
            container_port: 8000,
            volume_path: Some("/usr/src/paperless/data"),
            env: &[
                ("PAPERLESS_URL", "https://{domain}"),
                ("PAPERLESS_REDIS", "redis://paperless-redis:6379"),
                ("PAPERLESS_SECRET_KEY", "CHANGE_ME_TO_A_RANDOM_STRING"),
            ],
            sidecars: &[("paperless-redis", "docker.io/library/redis:7-alpine")],
            notes: "Needs Redis sidecar (included) and ideally Postgres (not included; the default SQLite works for small libraries).",
        },
        _ => return None,
    })
}

pub async fn run(
    api_url: &str,
    slug: &str,
    host_port: Option<u16>,
    domain: Option<&str>,
    output: Option<&str>,
    with_caddy: bool,
) -> Result<(), CliError> {
    let cfg = load().unwrap_or_default();
    let token = cfg.auth.as_ref().map(|a| a.token.as_str());

    // Fetch module detail.
    let url = v1_url(api_url, &format!("/modules/{}", slug));
    let module: ModuleDetail = fetch(with_auth(client()?.get(&url), token)).await?;

    // The image ref we emit in the file. Always pinned by digest so
    // the user gets content-addressable, replay-safe behavior.
    let image_line = match &module.image_ref {
        Some(r) => format!("{}@{}", strip_tag(r), module.digest),
        None => format!("public.ecr.aws/flareo/{}@{}", module.slug, module.digest),
    };

    let hints = hints_for(&module.slug);
    let port = host_port.unwrap_or(hints.as_ref().map(|h| h.host_port).unwrap_or(8080));
    let container_port = hints
        .as_ref()
        .map(|h| h.container_port)
        .unwrap_or(port);
    let domain_value = domain
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{}.your-domain.example", module.slug));

    let yaml = render_compose(
        &module,
        &image_line,
        port,
        container_port,
        hints.as_ref(),
        &domain_value,
        with_caddy,
    );

    // Write to file or stdout.
    if let Some(out) = output {
        let path = PathBuf::from(out);
        fs::write(&path, &yaml)?;
        eprintln!();
        eprintln!(
            "{} Wrote {} ({} bytes)",
            "✓".green().bold(),
            path.display().to_string().cyan(),
            yaml.len()
        );
        eprintln!();
        eprintln!("{}", "Next steps:".bold());
        eprintln!("  docker compose -f {} up -d", path.display());
        if let Some(h) = &hints {
            if !h.notes.is_empty() {
                eprintln!();
                eprintln!("{}", "Note:".bright_black());
                eprintln!("  {}", h.notes.bright_black());
            }
        }
        eprintln!();
    } else {
        // Emit to stdout — user probably wants `flareo compose foo > file.yml`.
        print!("{}", yaml);
    }

    // Warn on stderr if the module status isn't healthy.
    if module.status != "verified" {
        eprintln!(
            "{} Module status is {}. This compose file pins a digest that is NOT currently verified. Review before deploying.",
            "!".yellow().bold(),
            module.status.yellow()
        );
    }

    Ok(())
}

/// Strip everything after the final colon (tag) in an image ref, if any.
/// Leaves digest refs (containing @sha256:...) alone by only stripping
/// a tag that appears AFTER the last slash.
fn strip_tag(image_ref: &str) -> String {
    if image_ref.contains('@') {
        // Already digest-pinned; strip the digest part too because we'll
        // re-append a fresh one.
        if let Some(at) = image_ref.rfind('@') {
            return image_ref[..at].to_string();
        }
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

fn render_compose(
    module: &ModuleDetail,
    image: &str,
    host_port: u16,
    container_port: u16,
    hints: Option<&ComposeHints>,
    domain: &str,
    with_caddy: bool,
) -> String {
    let mut out = String::new();

    // Header comment.
    out.push_str(&format!(
        "# {} v{} — docker-compose.yaml\n",
        module.name, module.version
    ));
    out.push_str(&format!(
        "# Generated by flareo compose {} on {}\n",
        module.slug,
        current_date()
    ));
    out.push_str("#\n");
    out.push_str("# Image pinned by digest. To upgrade, run:\n");
    out.push_str(&format!("#   flareo compose {} > docker-compose.yaml\n", module.slug));
    out.push_str("# and diff against this file.\n");
    if let Some(h) = hints {
        if !h.notes.is_empty() {
            out.push_str("#\n");
            for line in wrap_comment(h.notes, 76) {
                out.push_str(&format!("# {}\n", line));
            }
        }
    } else {
        out.push_str("#\n");
        out.push_str("# NOTE: this module doesn't have per-module compose hints yet.\n");
        out.push_str("# The defaults below may need tuning — review before deploying.\n");
    }
    out.push_str("\n");

    out.push_str("services:\n");

    // Main service block.
    out.push_str(&format!("  {}:\n", module.slug));
    out.push_str(&format!("    image: {}\n", image));
    out.push_str("    restart: unless-stopped\n");
    out.push_str("    ports:\n");
    out.push_str(&format!(
        "      - \"127.0.0.1:{}:{}\"\n",
        host_port, container_port
    ));
    if let Some(h) = hints {
        if !h.env.is_empty() {
            out.push_str("    environment:\n");
            for (k, v) in h.env {
                let v = v.replace("{domain}", domain);
                out.push_str(&format!("      {}: {}\n", k, yaml_quote(&v)));
            }
        }
        if let Some(vol_path) = h.volume_path {
            out.push_str("    volumes:\n");
            out.push_str(&format!(
                "      - {}_data:{}\n",
                module.slug.replace('-', "_"),
                vol_path
            ));
        }
    }

    // Sidecar services.
    if let Some(h) = hints {
        for (svc_name, svc_image) in h.sidecars {
            out.push_str(&format!("\n  {}:\n", svc_name));
            out.push_str(&format!("    image: {}\n", svc_image));
            out.push_str("    restart: unless-stopped\n");
            // Seed Postgres / Redis with sensible defaults based on the image.
            if svc_image.contains("postgres") {
                out.push_str("    environment:\n");
                out.push_str(&format!("      POSTGRES_USER: {}\n", module.slug));
                out.push_str("      POSTGRES_PASSWORD: changeme-use-openssl-rand-hex-32\n");
                out.push_str(&format!("      POSTGRES_DB: {}\n", module.slug));
                out.push_str("    volumes:\n");
                out.push_str(&format!(
                    "      - {}_db:/var/lib/postgresql/data\n",
                    svc_name.replace('-', "_")
                ));
            } else if svc_image.contains("redis") {
                out.push_str("    volumes:\n");
                out.push_str(&format!(
                    "      - {}_data:/data\n",
                    svc_name.replace('-', "_")
                ));
            }
        }
    }

    // Optional Caddy reverse proxy.
    if with_caddy {
        out.push_str("\n  caddy:\n");
        out.push_str("    image: public.ecr.aws/flareo/caddy:latest\n");
        out.push_str("    restart: unless-stopped\n");
        out.push_str("    ports:\n");
        out.push_str("      - \"80:80\"\n");
        out.push_str("      - \"443:443\"\n");
        out.push_str("    volumes:\n");
        out.push_str("      - ./Caddyfile:/etc/caddy/Caddyfile:ro\n");
        out.push_str("      - caddy_data:/data\n");
        out.push_str("      - caddy_config:/config\n");
        out.push_str(&format!(
            "    depends_on:\n      - {}\n",
            module.slug
        ));
    }

    // Volumes block.
    let mut volumes: Vec<String> = Vec::new();
    if let Some(h) = hints {
        if h.volume_path.is_some() {
            volumes.push(format!("{}_data", module.slug.replace('-', "_")));
        }
        for (svc_name, svc_image) in h.sidecars {
            if svc_image.contains("postgres") {
                volumes.push(format!("{}_db", svc_name.replace('-', "_")));
            } else if svc_image.contains("redis") {
                volumes.push(format!("{}_data", svc_name.replace('-', "_")));
            }
        }
    }
    if with_caddy {
        volumes.push("caddy_data".to_string());
        volumes.push("caddy_config".to_string());
    }

    if !volumes.is_empty() {
        out.push_str("\nvolumes:\n");
        for v in volumes {
            out.push_str(&format!("  {}:\n", v));
        }
    }

    // If we added a Caddy service, suggest a Caddyfile inline.
    if with_caddy {
        out.push_str("\n# Minimal Caddyfile to go with --with-caddy:\n");
        out.push_str(&format!("#   {} {{\n", domain));
        out.push_str(&format!(
            "#       reverse_proxy {}:{}\n",
            module.slug, container_port
        ));
        out.push_str("#   }\n");
    }

    out
}

fn yaml_quote(s: &str) -> String {
    // Quote values that contain characters YAML would otherwise try
    // to interpret. Conservative: always quote anything with :, #, @,
    // {, }, or leading/trailing whitespace.
    if s.is_empty()
        || s.contains(':')
        || s.contains('#')
        || s.contains('@')
        || s.contains('{')
        || s.contains('}')
        || s.starts_with(' ')
        || s.ends_with(' ')
    {
        format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""))
    } else {
        s.to_string()
    }
}

fn wrap_comment(s: &str, width: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut current = String::new();
    for word in s.split_whitespace() {
        if !current.is_empty() && current.len() + 1 + word.len() > width {
            lines.push(std::mem::take(&mut current));
        }
        if !current.is_empty() {
            current.push(' ');
        }
        current.push_str(word);
    }
    if !current.is_empty() {
        lines.push(current);
    }
    lines
}

fn current_date() -> String {
    std::process::Command::new("date")
        .args(["-u", "+%Y-%m-%d"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "today".to_string())
}
