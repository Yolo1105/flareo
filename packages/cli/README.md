# flareo CLI

Command-line client for the [Flareo](https://flareo.app) container supply chain platform.

Browse the Flareo catalog, verify signed images, and sign in to your account from your terminal.

## Install

Build from source (requires Rust 1.80+):

```sh
git clone https://github.com/Yolo1105/flareo.git
cd flareo/packages/cli
FLAREO_GITHUB_CLIENT_ID=<your-oauth-app-id> cargo build --release
# Binary at target/release/flareo
```

Signed release binaries will be published once the release workflow runs. Until then, building from source is the supported path.

## Quickstart

```sh
flareo login          # GitHub device-code auth
flareo whoami         # confirm you're signed in
flareo search vault   # find modules
flareo logout         # remove the stored token
```

## Commands

| Command | Description | Status |
|---|---|---|
| `flareo login` | Sign in via GitHub device code | v0.1.0 |
| `flareo whoami` | Show current identity | v0.1.0 |
| `flareo logout` | Clear stored token | v0.1.0 |
| `flareo search <query>` | Search the catalog | v0.1.0 |
| `flareo verify <image>` | Verify any Sigstore-signed image | v0.2.0 |
| `flareo pull <slug>` | Pull a Flareo module | v0.2.0 |
| `flareo run <slug>` | Run a module ephemerally with TTL teardown | v0.3.0 |
| `flareo update <slug>` | Show what's changed since you last pulled | v0.3.1 |
| `flareo compose <slug>` | Generate a docker-compose.yaml | v0.2.0 |
| `flareo publish` | Submit a new module | v0.3.0 |
| `flareo init` | Scaffold a flareo.json | v0.3.0 |

## Configuration

Credentials are stored at `~/.flareo/config.toml` (or the platform equivalent) with mode `0600`. The file is not intended to be edited by hand; use `flareo login` / `flareo logout` to manage it.

The default API base URL is `https://flareo.app`. To point the CLI at a local dev server, use either:

```sh
flareo --api-url http://localhost:3000 login
FLAREO_API_URL=http://localhost:3000 flareo login
```

## Rate limiting

The Flareo API enforces per-user rate limits and returns HTTP 429 with a `Retry-After` header when you hit them. The CLI is polite about this:

- On a 429 response, the CLI reads `Retry-After` (integer seconds form) and sleeps that long before retrying. If the header is absent or unparseable, it falls back to exponential backoff (1s, 2s, 4s).
- Maximum 3 retries per request. Individual sleeps are capped at 60 seconds; total cumulative wait is capped at 5 minutes.
- A short stderr message tells you what's happening so a slow command isn't mysterious:

  ```
  rate-limited; waiting 30s before retry (1 of 3)
  ```

If you exhaust the retries, the original 429 surfaces as a `CliError::ApiError` with exit code 5. Scripts can rely on that.

The retry helper lives in `src/api.rs` (`send_with_retry`, `fetch`). `flareo login` doesn't use it — its OAuth device-flow polling has its own bespoke retry loop and shouldn't double-retry on 429.

## License

Apache-2.0.
