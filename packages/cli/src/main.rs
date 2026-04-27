//! flareo CLI entry point.
//!
//! Parses subcommands with clap and dispatches to handlers in
//! `commands::*`. The top-level `Cli` struct also holds global flags
//! (`--api-url`, `--verbose`) that apply to every subcommand.

use clap::{Parser, Subcommand};

mod api;
mod config;
mod errors;
mod commands;

use errors::CliError;

/// Verify and browse signed container modules from your terminal.
///
/// Flareo is a container supply chain platform. This CLI lets you verify
/// any Sigstore-signed image, browse the Flareo catalog, and pull signed
/// images pinned by digest.
#[derive(Parser)]
#[command(
    name = "flareo",
    version,
    about,
    long_about = None,
    propagate_version = true,
    arg_required_else_help = true,
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Override the Flareo API base URL. Defaults to https://flareo.dev.
    /// Useful for pointing at a local dev server (http://localhost:3000).
    #[arg(long, env = "FLAREO_API_URL", global = true)]
    api_url: Option<String>,

    /// Verbose output (sets RUST_LOG=flareo=debug if unset).
    #[arg(short, long, global = true)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Sign in to Flareo via GitHub device code.
    Login,

    /// Show who you are currently signed in as.
    Whoami,

    /// Sign out (delete the stored token).
    Logout,

    /// Search the Flareo catalog.
    Search {
        /// Query string. Searches slug, name, description, and tags.
        query: String,

        /// Max results (1-100).
        #[arg(short = 'n', long, default_value_t = 20)]
        limit: u32,
    },

    /// Verify any signed container image against Sigstore.
    Verify {
        /// Image reference to verify (e.g. public.ecr.aws/flareo/vaultwarden:latest).
        #[arg(value_name = "IMAGE")]
        image_ref: String,
    },

    /// Pull a Flareo-signed module by slug.
    ///
    /// Resolves the current pinned digest, verifies its Sigstore
    /// signature, and then invokes `docker pull` (or `podman pull` if
    /// docker is not on the PATH). Refuses to pull if verification
    /// fails, unless `--no-verify` is set.
    Pull {
        /// Module slug (e.g. vaultwarden).
        #[arg(value_name = "SLUG")]
        slug: String,

        /// Skip signature verification. Not recommended — only useful
        /// when you've already verified the digest another way.
        #[arg(long)]
        no_verify: bool,
    },

    /// Run a Flareo module ephemerally on this machine.
    ///
    /// Resolves the pinned digest, verifies the signature, generates a
    /// fresh isolated config (random ports, fresh data volume, fresh
    /// admin credentials per the module's bootstrap-config schema),
    /// then `docker run`s it with a TTL after which the container is
    /// stopped and the volume removed. Designed for "test on my own
    /// data without committing infrastructure" evaluation.
    ///
    /// The container runs in the foreground; Ctrl-C cleanly stops it
    /// and tears down the volume. The TTL is a backstop for unattended
    /// sessions (laptop closed, terminal forgotten); it's not the
    /// primary teardown path.
    ///
    /// This is the simpler alternative to per-user hosted previews —
    /// the user's machine is the substrate, not Flareo's.
    Run {
        /// Module slug (e.g. vaultwarden).
        #[arg(value_name = "SLUG")]
        slug: String,

        /// Auto-stop after this many minutes. 0 means no timeout.
        /// Default 60. Cap is 480 (8 hours) — beyond that, just run
        /// the module non-ephemerally.
        #[arg(long, default_value_t = 60)]
        ttl_minutes: u32,

        /// Host port to bind. If unset, picks a random free port in
        /// the 49152-65535 ephemeral range.
        #[arg(long)]
        port: Option<u16>,

        /// Skip signature verification. Strongly discouraged — same
        /// semantics as `flareo pull --no-verify`.
        #[arg(long)]
        no_verify: bool,

        /// Don't print the post-launch help block (the URL, the
        /// teardown command, etc.). Useful when scripting.
        #[arg(long)]
        quiet: bool,
    },

    /// Show what's changed since you last pulled a module.
    ///
    /// Compares your local image's pinned digest against the catalog's
    /// current pinned digest. If they differ, prints the version,
    /// CVE counts, and rebuild date for the catalog version, plus
    /// the upgrade command. Doesn't auto-pull — informed upgrade is
    /// the whole point.
    Update {
        /// Module slug (e.g. vaultwarden).
        #[arg(value_name = "SLUG")]
        slug: String,

        /// Override the auto-detected current digest. Useful when
        /// scripting against a known pinned digest from a compose
        /// file rather than docker's local image cache. Format:
        /// sha256:abc...
        #[arg(long)]
        current: Option<String>,
    },

    /// Generate a docker-compose.yaml for a Flareo module.
    ///
    /// Emits a compose file pinned to the module's current verified
    /// digest, with sensible port bindings, volumes, and environment
    /// variables per module. By default prints to stdout; use
    /// `--output` to write to a file.
    Compose {
        /// Module slug.
        #[arg(value_name = "SLUG")]
        slug: String,

        /// Host port to bind (overrides the module default).
        #[arg(long)]
        port: Option<u16>,

        /// Public domain the module will be served at (used to fill in
        /// environment variables like NEXTAUTH_URL or GITEA ROOT_URL).
        #[arg(long)]
        domain: Option<String>,

        /// Write the compose file to this path instead of stdout.
        #[arg(short = 'o', long)]
        output: Option<String>,

        /// Also include a Caddy reverse-proxy service that fronts the module.
        #[arg(long)]
        with_caddy: bool,
    },

    /// Submit the current directory as a module for Flareo review.
    ///
    /// Reads `./flareo.json` in the current directory and POSTs to
    /// the Flareo submission endpoint. Requires prior `flareo login`.
    /// Optionally includes `./Dockerfile` with the submission.
    Publish,

    /// Initialize a new flareo.json manifest in the current directory.
    ///
    /// Interactive prompts collect the minimum fields needed for
    /// submission. Does NOT overwrite an existing flareo.json unless
    /// `--force` is given.
    Init {
        /// Overwrite an existing flareo.json.
        #[arg(long)]
        force: bool,
    },
}

fn init_logging(verbose: bool) {
    use tracing_subscriber::{fmt, EnvFilter};
    let default = if verbose { "flareo=debug" } else { "flareo=warn" };
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(default));
    fmt()
        .with_env_filter(filter)
        .with_target(false)
        .without_time()
        .with_writer(std::io::stderr)
        .init();
}

#[tokio::main(flavor = "multi_thread", worker_threads = 2)]
async fn main() {
    let cli = Cli::parse();
    init_logging(cli.verbose);

    let api_url = cli
        .api_url
        .clone()
        .unwrap_or_else(|| "https://flareo.dev".to_string());

    let result: Result<(), CliError> = match cli.command {
        Commands::Login => commands::login::run(&api_url).await,
        Commands::Whoami => commands::whoami::run(&api_url).await,
        Commands::Logout => commands::logout::run().await,
        Commands::Search { query, limit } => {
            commands::search::run(&api_url, &query, limit).await
        }
        Commands::Verify { image_ref } => {
            commands::verify::run(&api_url, &image_ref).await
        }
        Commands::Pull { slug, no_verify } => {
            commands::pull::run(&api_url, &slug, no_verify).await
        }
        Commands::Run {
            slug,
            ttl_minutes,
            port,
            no_verify,
            quiet,
        } => {
            commands::run::run(
                &api_url,
                &slug,
                ttl_minutes,
                port,
                no_verify,
                quiet,
            )
            .await
        }
        Commands::Update { slug, current } => {
            commands::update::run(&api_url, &slug, current).await
        }
        Commands::Compose {
            slug,
            port,
            domain,
            output,
            with_caddy,
        } => {
            commands::compose::run(
                &api_url,
                &slug,
                port,
                domain.as_deref(),
                output.as_deref(),
                with_caddy,
            )
            .await
        }

        Commands::Publish => commands::publish::run(&api_url).await,
        Commands::Init { force } => commands::init::run(force).await,
    };

    if let Err(err) = result {
        err.print_friendly();
        std::process::exit(err.exit_code());
    }
}
