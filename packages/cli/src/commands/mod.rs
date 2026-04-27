//! Subcommand handlers.
//!
//! Each command has its own module and exports a single `run` function.
//! Adding a new command means:
//!   1. Create a new module file here
//!   2. Add `pub mod <name>;` below
//!   3. Add the variant to `Commands` in `main.rs`
//!   4. Wire it into the `match` in `main`

pub mod compose;
pub mod init;
pub mod login;
pub mod logout;
pub mod publish;
pub mod pull;
pub mod run;
pub mod search;
pub mod update;
pub mod verify;
pub mod whoami;
