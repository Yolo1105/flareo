# Week 7 runbook: finish the CLI

Goal by Sunday night: `flareo` is fully useful for the normal homelab workflow. `flareo verify`, `flareo pull`, and `flareo compose` all work against production. v0.2.1 is tagged and released. Docs reflect the shipped state.

## Before you start

- Week 6 ran; launch day went OK; any serious blowback has been addressed.
- The main app is serving stably.
- You have the Rust toolchain installed locally (`rustup default stable`).

## Monday: apply the patch zip

Unzip `flareo-cli-week7.zip`. It's a full replacement of your `packages/cli/` directory, so:

```sh
cd ~/projects
mv flareo-cli flareo-cli.old-week6
unzip flareo-cli-week7.zip
cd packages/cli
```

Or if you'd rather diff by hand:

```sh
unzip -d /tmp/fc7 flareo-cli-week7.zip
diff -r flareo-cli /tmp/fc7/flareo-cli
```

**What changed:**

- `src/commands/pull.rs` — new
- `src/commands/compose.rs` — new
- `src/commands/mod.rs` — exports pull + compose
- `src/main.rs` — clap definitions expanded, dispatch wired
- `tests/smoke.rs` — smoke test extended to check `compose` in help output
- `Cargo.toml` — version bumped to 0.2.1

No other files touched.

## Tuesday: first build and smoke test

```sh
cd packages/cli
export FLAREO_GITHUB_CLIENT_ID=<your-oauth-app-id>
cargo build --release
```

First clean build takes 4-8 minutes depending on your machine (many crates to compile from scratch). Subsequent builds are seconds.

If the build fails with a specific compile error, message back what it says — I couldn't run `cargo check` in the sandbox where this was written, so the two new files (`pull.rs`, `compose.rs`) have not been proven to compile. Any errors should be small and localized.

Run the smoke tests:

```sh
cargo test
```

Should show three tests passing: `version_smoke`, `help_lists_subcommands`, `whoami_without_token_exits_4`.

## Wednesday: manual end-to-end test

Point the CLI at your production API (or your local dev server if you want to iterate faster) and walk through the real commands:

```sh
# Confirm help advertises all six real commands + two stubs
./target/release/flareo --help

# Verify should work against any signed image
./target/release/flareo verify public.ecr.aws/<your-alias>/flareo/vaultwarden:latest

# Pull — needs docker or podman on your machine
./target/release/flareo pull vaultwarden
# Expected: resolves slug → fetches metadata → verifies → docker pulls

# Compose to stdout
./target/release/flareo compose vaultwarden

# Compose with flags
./target/release/flareo compose gitea --domain git.example.com --port 3001 -o /tmp/gitea-compose.yaml
cat /tmp/gitea-compose.yaml

# With a reverse proxy
./target/release/flareo compose uptime-kuma --with-caddy
```

For each command, skim the output. Things to spot-check:

- `verify` reports the correct signer identity and Rekor log index
- `pull` refuses cleanly on a module whose status isn't `verified` (try a non-existent slug to trigger the error path)
- `compose` emits valid YAML (check with `docker compose -f <file> config`)
- `compose --with-caddy` emits a second service block and the Caddyfile snippet in comments

## Thursday: tag v0.2.1 and release

```sh
git add -A
git commit -m "v0.2.1: flareo pull and flareo compose are real"
git tag -a v0.2.1 -m "Pull and compose commands"
git push origin main
git push origin v0.2.1
```

Watch the `Release` workflow run. Four cross-builds × ~8 minutes = ~30-40 minutes total. At the end, a new release appears at `github.com/flareo/flareo-cli/releases/tag/v0.2.1` with:

- 4 signed archives (x86_64 + aarch64 × linux-musl + apple-darwin)
- `install.sh`
- SHA256 and cosign bundles for each archive

Re-run the installer on a clean VM to confirm the release path still works:

```sh
curl -fsSL https://flareo.dev/install | sh
flareo --version
# should print: flareo 0.2.1
flareo pull vaultwarden
```

## Friday: update the docs site

The `flareo-docs-week7-patch.zip` contains four updated files:

- `app/docs/cli-reference/content.mdx` — `flareo verify`, `pull`, `compose` now marked shipped, full flag tables
- `app/docs/compose/content.mdx` — "Today, by hand" section replaced with real example output
- `app/docs/pull-run/content.mdx` — removed the "coming in v0.2.0" sentence
- `app/docs/verify-cli/content.mdx` — `flareo verify` section moved from "Future" to "Shortcut"

Unzip over `~/projects/flareo-docs/`, `npm run build` locally, push — Cloudflare Pages deploys.

## Saturday: announce

If you want. A short post is enough:

> **v0.2.1 of the flareo CLI is out.** `flareo pull` and `flareo compose` are shipped. You can now go from `flareo search vault` → `flareo compose vaultwarden --domain vw.example.com -o docker-compose.yaml` → `docker compose up` in three commands. Full changelog: github.com/flareo/flareo-cli/releases/tag/v0.2.1.

Good channels:

- A status update on Instatus (component: API v1 → "CLI v0.2.1 released")
- A note on Bluesky / Mastodon / Twitter — not a full thread, just a paragraph
- Reply to relevant issues on GitHub that asked "when will pull/compose ship"

Don't redo the big launch announcement. This is an incremental release.

## Sunday: what's next

Week 8 is the last week of the planned 8-week MVP. You can use it for:

- **Cleanup.** Anything that shipped with a known rough edge during weeks 1-7. Review the issue list, close what's closable.
- **Horizon 2 prep.** `flareo publish` + `flareo init` for module submission. Or the first-party Kubernetes admission controller.
- **Honest retrospective.** Write down what broke on launch day, what you'd do differently, what's working better than expected. Keep it as a journal entry for your own future reference.

Decide based on what's been loud in user feedback during the two weeks since launch.

## What DIDN'T happen this week (on purpose)

- **`flareo publish` / `flareo init`.** Module submission is still a Horizon 2 deliverable. `publish` needs a matching server-side review API, storage for submitted source, and a human review queue — too much for Week 7.
- **Shell completions.** `clap_complete` is a dep that was reserved in `Cargo.toml` but not wired. A simple `flareo completions <bash|zsh|fish>` command is ~30 minutes and could be a v0.2.2 patch.
- **Offline-capable `flareo verify`.** Today the CLI `verify` calls the Flareo API which does the signature-manifest check. True offline verification (parsing the Sigstore bundle in pure Rust against the TUF trust root) is a Horizon 2 feature. The current behavior is fine for all the use cases the CLI has today.

## What to do if something breaks

**Build fails with "could not find crate X".** `cargo update` to refresh the lockfile, or `cargo clean` + rebuild.

**Build fails with "requires rustc 1.80 or newer".** `rustup update stable` to get the current toolchain.

**`flareo pull vaultwarden` refuses with "module status is 'pending'".** The canary pipeline hasn't produced a verified build yet. Check your canary workflow. Use `--no-verify` as an escape hatch only if you know what you're doing.

**`flareo compose` emits a file that `docker compose config` rejects.** The YAML we emit for the 12 modules is hand-verified against the per-module templates in `src/commands/compose.rs`. If upstream released a breaking change, edit `hints_for()` for the affected slug. File an issue so we know.

**Smoke tests fail with "cannot find binary."** Run `cargo build` first; `cargo test` doesn't auto-build the binary under test in some configurations.

## Coverage snapshot after v0.2.1

| Command            | Status        | Notes                                   |
|--------------------|---------------|-----------------------------------------|
| `flareo login`     | ✓ v0.1.0      | GitHub device flow                      |
| `flareo whoami`    | ✓ v0.1.0      | Session or API key                      |
| `flareo logout`    | ✓ v0.1.0      | Clears stored token                     |
| `flareo search`    | ✓ v0.1.0      | Catalog search                          |
| `flareo verify`    | ✓ v0.2.0      | Sigstore verification                   |
| `flareo pull`      | ✓ v0.2.1      | Verify + docker pull                    |
| `flareo compose`   | ✓ v0.2.1      | Pinned-digest docker-compose generator  |
| `flareo publish`   | stub, v0.3.0  | Submission via web UI for now           |
| `flareo init`      | stub, v0.3.0  | `flareo.json` scaffolding               |

7 of 9 commands real. That's a complete product for the primary user journey.
