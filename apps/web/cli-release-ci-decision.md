# CLI release CI cost — decision

The W1-8 retro flagged that the CLI release matrix "tripled CI minutes." Reviewed in this session against the current release.yml:

## What's there

Four targets (not 5 as I'd assumed earlier):

| Target | OS runner | Notes |
|---|---|---|
| `x86_64-unknown-linux-musl` | `ubuntu-22.04` | Native compile + musl-tools |
| `aarch64-unknown-linux-musl` | `ubuntu-22.04` | Cross-compile via `cross` |
| `x86_64-apple-darwin` | `macos-13` | Native compile (Intel mac) |
| `aarch64-apple-darwin` | `macos-14` | Native compile (M-series mac) |

No Windows target. (My long-term review incorrectly listed Windows; correcting here.)

## Where the cost actually lives

GitHub Actions billing weights matter:

- `ubuntu-22.04` minutes: 1× billing weight
- `macos-13` / `macos-14` minutes: **10× billing weight**

The two macOS targets dominate the bill. Each macOS runner does the full Rust install + dep download + cargo build + test + sign + archive — easily 10-15 min per target. Two macOS runs at 10× weighting = ~250-300 weighted minutes per release tag.

The Linux targets together cost ~30-40 weighted minutes. Roughly 10% of the macOS cost.

## Decision

**Keep the matrix as-is. The "tripled CI minutes" framing in the retro overstated the addressable cost.** Three reasons:

1. **macOS targets cannot be cross-compiled cheaply.** Apple's licensing requires macOS runners to build for macOS. Cross-rs's macOS-on-Linux story works for some targets but breaks linker behavior for others (rustls + ring + native-tls combinations are fragile cross-compiled). Even if it built, signing the binary would need notarization steps that can only run on real macOS.
2. **The cache is already correctly keyed.** The `actions/cache` step keys on `runner.os + target + Cargo.lock`. Subsequent releases reuse the registry/git cache; the dominant cost on cache-hit is the actual compile, which can't be cached without sccache infrastructure.
3. **Release frequency is the variable to optimize, not per-release cost.** Releases happen on tag push, manually triggered. If you tag every commit you pay the cost; if you tag once per feature batch you don't. The lever is your release cadence, not CI architecture.

## What WOULD save real money if you cared

If GitHub Actions costs become an issue (unlikely until ~50 releases/year):

- **Move to self-hosted runners** for Linux (free with cheap VPS), keep macOS on GHA. Saves the Linux portion entirely, ~30-40 weighted minutes per release.
- **Use a release-please bot** to batch tag automatically only on milestones. Reduces release count without reducing release quality.
- **Drop `aarch64-unknown-linux-musl`** if telemetry shows nobody downloads it. Saves ~10 weighted minutes per release. The arm64 Linux audience is real (Raspberry Pi homelab) but small.

None of these are urgent.

## What about cross-rs Docker cross-compile?

Considered briefly. Replacing the four-runner matrix with a single Linux runner using cross-rs would:

- Save the macOS runner cost ✓
- Lose the ability to sign macOS binaries with macOS-side notarization tools ✗
- Lose Apple Silicon tier-1 toolchain support; rustls/ring on aarch64-apple-darwin via cross is documented as flaky ✗
- Save maybe 200 weighted minutes per release at the cost of release reliability ✗

Net: not worth it.

## When to revisit

| Trigger | Action |
|---|---|
| GitHub Actions monthly bill exceeds €50 | Look at self-hosted Linux runners |
| `aarch64-unknown-linux-musl` shows <5% of installer downloads after 90 days of telemetry | Drop the target |
| Release cadence reaches >1 per week consistently | Add release-please batching |

Until any of those fire, the current matrix is correct.
