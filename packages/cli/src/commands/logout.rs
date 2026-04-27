//! `flareo logout` — remove the stored token.

use crate::config::{clear, config_path};
use crate::errors::CliError;
use owo_colors::OwoColorize;

pub async fn run() -> Result<(), CliError> {
    let path = config_path()?;
    let removed = clear()?;
    if removed {
        eprintln!("{} Signed out.", "✓".green());
        eprintln!(
            "  Removed {}.",
            path.display().to_string().bright_black()
        );
    } else {
        eprintln!("{} Not signed in — nothing to remove.", "✓".yellow());
    }
    Ok(())
}
