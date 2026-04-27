//! Configuration file read/write.
//!
//! The CLI stores its session token in `~/.flareo/config.toml` (or the
//! platform equivalent via the `directories` crate). File mode is set to
//! `0600` on Unix after writing so other users on the system cannot read
//! the token.
//!
//! Config shape:
//!
//! ```toml
//! # Flareo CLI config. Do not edit by hand.
//! [auth]
//! token = "fla_abcdef..."
//! api_url = "https://flareo.dev"
//! user_handle = "octocat"
//! signed_in_at = "2026-04-23T14:32:00Z"
//! ```
//!
//! We include `api_url` and `user_handle` for diagnostic tooling; only
//! `token` is strictly required.

use crate::errors::CliError;
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct Config {
    pub auth: Option<AuthBlock>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AuthBlock {
    pub token: String,
    pub api_url: String,
    pub user_handle: Option<String>,
    pub signed_in_at: Option<String>,
}

/// Resolve the directory where we store config. Uses the `directories`
/// crate so we get the right path on macOS (~/Library/Application Support),
/// Linux (~/.config), and Windows (%APPDATA%).
fn config_dir() -> Result<PathBuf, CliError> {
    let proj = ProjectDirs::from("dev", "flareo", "flareo")
        .ok_or_else(|| CliError::Config("cannot locate home directory".into()))?;
    Ok(proj.config_dir().to_path_buf())
}

pub fn config_path() -> Result<PathBuf, CliError> {
    Ok(config_dir()?.join("config.toml"))
}

/// Load config. Missing file is NOT an error — we return an empty config.
pub fn load() -> Result<Config, CliError> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(Config::default());
    }
    let text = fs::read_to_string(&path)?;
    let cfg: Config = toml::from_str(&text)
        .map_err(|e| CliError::Config(format!("cannot parse {}: {e}", path.display())))?;
    Ok(cfg)
}

/// Save config. Creates parent directory, writes with 0600 permissions
/// on Unix.
pub fn save(cfg: &Config) -> Result<(), CliError> {
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let text = toml::to_string_pretty(cfg)
        .map_err(|e| CliError::Config(format!("serialize failed: {e}")))?;

    // Write in two steps: write to a temp file, set mode, rename. Avoids
    // a brief window where the file exists but has world-readable perms.
    let tmp = path.with_extension("toml.new");
    fs::write(&tmp, text)?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&tmp)?.permissions();
        perms.set_mode(0o600);
        fs::set_permissions(&tmp, perms)?;
    }

    fs::rename(&tmp, &path)?;
    Ok(())
}

/// Clear the config file entirely. Used by `flareo logout`.
pub fn clear() -> Result<bool, CliError> {
    let path = config_path()?;
    if path.exists() {
        fs::remove_file(&path)?;
        Ok(true)
    } else {
        Ok(false)
    }
}

impl Config {
    /// Return the token if we have one, else NotSignedIn error.
    pub fn require_token(&self) -> Result<&AuthBlock, CliError> {
        self.auth.as_ref().ok_or(CliError::NotSignedIn)
    }
}
