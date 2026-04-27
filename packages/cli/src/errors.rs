//! Error types for the CLI.
//!
//! Every command returns `Result<(), CliError>`. The main dispatcher
//! prints the error with the appropriate human-facing formatting and
//! exits with a code that matches the error class. This gives scripts
//! predictable, documentable exit codes.

use owo_colors::OwoColorize;
use std::io;

/// Top-level CLI error. All command handlers return this.
#[derive(Debug, thiserror::Error)]
pub enum CliError {
    #[error("not signed in")]
    NotSignedIn,

    #[error("network error: {0}")]
    Network(#[from] reqwest::Error),

    #[error("io error: {0}")]
    Io(#[from] io::Error),

    #[error("configuration error: {0}")]
    Config(String),

    #[error("authentication failed: {0}")]
    Auth(String),

    #[error("the Flareo API returned an error ({status}): {message}")]
    ApiError { status: u16, message: String },

    #[error("{0}")]
    Other(#[from] anyhow::Error),
}

impl CliError {
    /// Exit code used when this error bubbles up to `main`. Following
    /// the rough git convention of reserving 1 for generic failure, 2
    /// for usage errors, and 100+ for more specific classes.
    pub fn exit_code(&self) -> i32 {
        match self {
            CliError::NotSignedIn => 4,
            CliError::Auth(_) => 4,
            CliError::Network(_) => 3,
            CliError::ApiError { .. } => 5,
            CliError::Io(_) => 2,
            CliError::Config(_) => 6,
            CliError::Other(_) => 1,
        }
    }

    /// Print a human-friendly error to stderr with colored labels where
    /// the terminal supports them. Verbose mode (tracing) gets the
    /// fuller `Debug` rendering via the tracing macros elsewhere.
    pub fn print_friendly(&self) {
        let label = "error:".red().bold().to_string();
        eprintln!("{} {}", label, self);

        // Include a helpful next step when we can.
        match self {
            CliError::NotSignedIn => {
                eprintln!();
                eprintln!("  Run {} to sign in.", "flareo login".cyan());
            }
            CliError::Auth(_) => {
                eprintln!();
                eprintln!(
                    "  Your session may have expired. Try {} to refresh.",
                    "flareo login".cyan()
                );
            }
            CliError::Network(e) => {
                if e.is_timeout() {
                    eprintln!();
                    eprintln!(
                        "  Request timed out. Check your network or use {}.",
                        "--api-url".cyan()
                    );
                }
            }
            CliError::ApiError { status, .. } if *status == 429 => {
                eprintln!();
                eprintln!("  Rate limit exceeded. Wait a minute and retry.");
            }
            CliError::ApiError { status, .. } if *status == 404 => {
                eprintln!();
                eprintln!("  No result for that query.");
            }
            _ => {}
        }
    }
}
