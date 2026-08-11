# Week 3 runbook: Rust CLI

Goal by Sunday night: `curl -fsSL https://flareo.dev/install | sh` installs a working `flareo` binary that can `login`, `whoami`, `search`, and `logout` against your production API.

## Before you start

- Week 2 is done. The `/api/v1/*` endpoints respond correctly.
- You pushed `flareo` (main app) to Vercel and it's serving traffic at your domain.
- You have `rustup` installed locally: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

## Monday: GitHub OAuth App for the CLI

Create a **separate** OAuth App for the CLI. The web app's OAuth App can't be used because the CLI uses the "device flow" grant type, which is a separate toggle.

1. Go to https://github.com/organizations/flareo/settings/applications → New OAuth App.
2. Application name: `Flareo CLI`.
3. Homepage URL: `https://flareo.dev`.
4. Authorization callback URL: anything valid, e.g. `https://flareo.dev/cli-auth-done` (unused but required by GitHub's form).
5. Click **Enable Device Flow** on the app settings page. This is the critical step; without it, `flareo login` will fail with "device flow is not enabled for this application."
6. Copy the **Client ID**. You do NOT need the client secret for device flow.

Save the Client ID to your Week 0 secrets file as `FLAREO_GITHUB_CLIENT_ID`.

## Tuesday: push the flareo-cli repo and set secrets

Push this whole `packages/cli/` directory to `github.com/flareo/flareo-cli` (the empty repo you created in Week 0).

```sh
cd path/to/flareo-cli
git init
git add -A
git commit -m "Initial CLI implementation"
git branch -M main
git remote add origin https://github.com/flareo/flareo-cli.git
git push -u origin main
```

Then on GitHub, go to Settings → Secrets and variables → Actions → New repository secret:

- `FLAREO_GITHUB_CLIENT_ID` = the Client ID from Monday.

## Wednesday: local build smoke test

Back on your laptop:

```sh
cd path/to/flareo-cli
export FLAREO_GITHUB_CLIENT_ID=<paste-client-id>
cargo build --release
ls -lh target/release/flareo    # should be ~10-15 MB
```

Now test locally against your local dev server of the main app:

```sh
# Terminal 1 — main app
cd path/to/flareo
npm run dev

# Terminal 2 — CLI
cd path/to/flareo-cli
./target/release/flareo --api-url http://localhost:3000 login
```

You should see:

```
Sign in to Flareo

  First, copy this one-time code: XXXX-XXXX
  Then open:                      https://github.com/login/device

  Waiting for authorization ...
```

Your default browser should open to that URL. Paste the code, click **Authorize flareo**. Back in the terminal:

```
  ✓ GitHub authorization received.
  Exchanging for a Flareo session ...

  ✓ Signed in as yourname.
  Try: flareo whoami
```

Now try the other commands:

```sh
./target/release/flareo --api-url http://localhost:3000 whoami
./target/release/flareo --api-url http://localhost:3000 search vault
./target/release/flareo --api-url http://localhost:3000 logout
```

If all four work, the CLI is done. Everything else is just distribution.

## Thursday: tag your first release and watch CI build the archives

Tag `v0.1.0` and push:

```sh
cd path/to/flareo-cli
git tag -a v0.1.0 -m "First public CLI release"
git push origin v0.1.0
```

Watch the `Release` workflow in the Actions tab. It should build four archives in parallel (takes about 10 minutes for the cross-compiled arm64 Linux build to finish). At the end it publishes a GitHub Release with:

- `flareo-v0.1.0-x86_64-apple-darwin.tar.gz`
- `flareo-v0.1.0-aarch64-apple-darwin.tar.gz`
- `flareo-v0.1.0-x86_64-unknown-linux-musl.tar.gz`
- `flareo-v0.1.0-aarch64-unknown-linux-musl.tar.gz`
- Each with a `.sha256` and `.cosign.bundle` alongside.
- An `install.sh` bootstrap script.

## Friday: wire `flareo.dev/install` to serve the installer

Add a Next.js rewrite or edge function in `apps/web/next.config.ts`:

```ts
async rewrites() {
  return [
    {
      source: "/install",
      destination: "https://github.com/flareo/flareo-cli/releases/latest/download/install.sh",
    },
  ];
},
```

Deploy. Then from any clean machine:

```sh
curl -fsSL https://flareo.dev/install | sh
```

Should download, verify, and install the binary to `~/.local/bin/flareo`.

Test on at least: Ubuntu 22.04, macOS (Apple Silicon), ideally Alpine (busybox sh).

## Saturday: clean up, add a LICENSE, sanity-check cosign verification

Fetch the release archive from GitHub manually and verify with cosign:

```sh
cd /tmp
wget https://github.com/flareo/flareo-cli/releases/download/v0.1.0/flareo-v0.1.0-x86_64-unknown-linux-musl.tar.gz
wget https://github.com/flareo/flareo-cli/releases/download/v0.1.0/flareo-v0.1.0-x86_64-unknown-linux-musl.tar.gz.cosign.bundle

cosign verify-blob \
  --bundle flareo-v0.1.0-x86_64-unknown-linux-musl.tar.gz.cosign.bundle \
  --certificate-identity-regexp 'https://github.com/flareo/.+' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  flareo-v0.1.0-x86_64-unknown-linux-musl.tar.gz
```

Should print `Verified OK`.

Also replace the placeholder in `LICENSE` with the full AGPL-3.0 text from https://www.gnu.org/licenses/agpl-3.0.txt.

## Sunday: point the production CLI at the production server

Edit `install.sh` and confirm the install target defaults to the right binary name. Test the install path on a completely fresh cloud VM:

```sh
# On a new Ubuntu 24.04 VM with nothing installed:
curl -fsSL https://flareo.dev/install | sh
export PATH="$HOME/.local/bin:$PATH"

flareo login
# Complete device flow in browser
flareo whoami
flareo search jellyfin
flareo logout
```

If that full round trip works on a box that has never seen Flareo before, Week 3 is done.

## What DIDN'T happen this week (on purpose)

- `flareo verify` — the big one. Needs real offline Sigstore bundle verification using the `sigstore` Rust crate. That's 2+ days of work and lands in Week 4 or the v0.2.0 release.
- `flareo pull` and `flareo compose` — straightforward but not blocking the launch. v0.2.0.
- Homebrew tap. Set up as a nice-to-have after launch.
- Completions for bash/zsh/fish. `clap_complete` is already a dep; we'll wire `flareo completions <shell>` in v0.2.0.

## What to do if something breaks

**`flareo login` says "device flow is not enabled."** Go back to Monday. The GitHub OAuth App needs the Device Flow toggle on.

**CI build fails on musl linker errors.** The release workflow installs `musl-tools`; if your local build works but CI doesn't, check that the runner's apt cache was happy. Re-run the job.

**`cross` build for aarch64 Linux fails with "container failed to start."** Cross needs Docker on the runner. GitHub-hosted runners have it by default, but if you ever move to a self-hosted runner you'll need to enable it.

**The installer script fails on macOS with "operation not permitted."** macOS Gatekeeper. Run `xattr -c ~/.local/bin/flareo` to clear the quarantine bit, or sign the binary with your Apple Developer ID in the release workflow (Horizon 4 work).

## Notes on what's in this repo

- `src/main.rs` — clap dispatch
- `src/api.rs` — HTTP helpers, URL building, error extraction
- `src/config.rs` — `~/.flareo/config.toml` read/write with 0600 perms
- `src/errors.rs` — friendly error display with exit codes
- `src/commands/login.rs` — GitHub device flow + exchange to Flareo token
- `src/commands/whoami.rs` — calls `/api/v1/whoami`
- `src/commands/logout.rs` — clears config file
- `src/commands/search.rs` — calls `/api/v1/modules`, renders a table
- `tests/smoke.rs` — runs the binary with `--version` and `--help` to confirm it actually starts

On the main app side, Week 3 adds one new endpoint:

- `app/api/auth/cli-exchange/route.ts` — verifies a GitHub access token, upserts the corresponding Flareo user, mints a fresh API key, returns the raw token once.
