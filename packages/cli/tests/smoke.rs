//! Integration tests. Run with `cargo test`.

use std::process::Command;

/// Smoke test: `flareo --version` succeeds and prints something sensible.
#[test]
fn version_smoke() {
    // Find the binary that `cargo test` built.
    let exe = env!("CARGO_BIN_EXE_flareo");
    let output = Command::new(exe).arg("--version").output().unwrap();
    assert!(output.status.success(), "`flareo --version` failed");
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(
        stdout.starts_with("flareo "),
        "unexpected version output: {stdout}"
    );
}

/// `flareo --help` shows all subcommands.
#[test]
fn help_lists_subcommands() {
    let exe = env!("CARGO_BIN_EXE_flareo");
    let output = Command::new(exe).arg("--help").output().unwrap();
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    for sub in [
        "login", "logout", "whoami", "search", "verify", "pull", "run", "update", "compose",
        "publish", "init",
    ] {
        assert!(
            stdout.contains(sub),
            "--help output is missing subcommand {sub}:\n{stdout}"
        );
    }
}

/// `flareo whoami` without a token prints the NotSignedIn error and
/// exits with code 4.
#[test]
fn whoami_without_token_exits_4() {
    // Point config directory at a tempdir so we don't clobber the real
    // user config on whoever's machine runs this test.
    let tmp = tempfile::tempdir().unwrap();
    let exe = env!("CARGO_BIN_EXE_flareo");
    let output = Command::new(exe)
        .arg("whoami")
        // XDG_CONFIG_HOME redirects `directories::ProjectDirs` on Linux.
        // HOME catches macOS.
        .env("XDG_CONFIG_HOME", tmp.path())
        .env("HOME", tmp.path())
        .output()
        .unwrap();
    assert_eq!(
        output.status.code(),
        Some(4),
        "expected exit 4, got {:?}. stderr: {}",
        output.status.code(),
        String::from_utf8_lossy(&output.stderr)
    );
}
