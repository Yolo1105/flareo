# Flareo

Flareo re-publishes **pinned upstream container images** with receipts (SBOM, Trivy scan, Sigstore keyless signature, Rekor index), and provides a public tool to **verify the Sigstore signature of any image**. It does **not** build images from arbitrary Dockerfiles — see [Threat model first](#threat-model-first-why-there-is-no-build-path).

---

## First command (local)

With Postgres running and the web app up (see [Local setup](#local-setup)):

```sh
# Build the CLI
cd packages/cli && cargo build --release && cd ../..

# Verify any Sigstore-signed image against the local API
./packages/cli/target/release/flareo --api-url http://localhost:3000 verify \
  ghcr.io/sigstore/cosign/cosign:v2.4.1
```

Or open http://localhost:3000/verify and paste an image reference. The server is the source of truth; the CLI is a thin client over `POST /api/v1/verify`.

> Catalog images on ECR Public are published by the republish workflow (`.github/workflows/republish.yml`). Until that workflow has been dispatched successfully against live secrets, treat the **local verify path** above as the stranger-facing entry point — do not assume a specific `public.ecr.aws/...` digest is live.

---

## Two things this project does

**Track A — Curated catalog.** A republish pipeline (`apps/web/scripts/republish/`) takes a pinned upstream image (for example `docker.io/vaultwarden/server:1.32.7`), pulls it, records the **upstream digest**, re-tags and pushes to ECR Public under Flareo's namespace (**no rebuild — the bits are identical**), generates a CycloneDX SBOM with Syft, runs Trivy, uploads artifacts to R2, signs with cosign keyless, and upserts a `Module` row with a trust score derived from those outputs.

**Track B — Public verification utility.** `POST /api/v1/verify` and `flareo verify <image>` check the **Sigstore signature of any image**, in the catalog or not. For catalog images the response is enriched with scan/SBOM/trust metadata. For images outside the catalog, the response is **signature status only** (resolved digest, signer identity, issuer, Rekor index).

**This boundary is deliberate.** Flareo does **not** scan arbitrary user-supplied images on demand. It is a neutral verification client, not a scanning service. On-demand pull-and-scan of arbitrary images reintroduces compute abuse; VEX has no author for external images; and a trust score for an unsigned third-party image would be meaningless. See [ADR-014](docs/adr/ADR-014-verification-scope.md).

---

## Byte-identical to upstream

The pipeline records both the upstream reference and the upstream digest. The published image is a **re-tag**, not a rebuild. When a catalog module is live, a reader can compare the Flareo digest to the recorded upstream digest and confirm they match. Until ECR artifacts from a successful CI republish are available, inspect a module row's `upstreamRef` / `upstreamDigest` fields after a local republish run, or read `apps/web/scripts/republish/README.md`.

---

## Threat model first: why there is no build path

Three reasons the submit-a-Dockerfile path was retired:

1. **Signing-identity compromise is catastrophic.** A sandbox escape that reaches the signing identity lets an attacker obtain a "Flareo-verified" signature on a malicious image.
2. **An open build service is an abuse magnet** — cryptomining, free compute, DDoS staging — a permanent operational cost for a portfolio artifact.
3. **"Arbitrary Dockerfile" and "reproducible build" are contradictory.** A user Dockerfile can `curl … | sh`.

The sandbox implementation is preserved under `apps/worker/src/legacy/build.ts` as a record of how isolation was designed. No code path in this project now executes third-party images for signing. Shared demo instances were retired (see [ADR-013](docs/adr/ADR-013-preview-disposition.md)).

---

## Why VEX, and why now

The EU Cyber Resilience Act's vulnerability reporting obligations took effect on 11 September 2026 and are triggered by vulnerabilities that are **actively being exploited**. A CVE list alone cannot answer that; VEX annotation can. Flareo emits OpenVEX 0.2 documents per module so scanners can distinguish exploitable findings from `not_affected`.

**This is an engineering project making no compliance guarantees.**

---

## What it does

- Re-publishes pinned upstream images with Syft CycloneDX SBOMs and Trivy scans
- Cosign **keyless** signing (Fulcio/OIDC), with Rekor log index surfaced in verify output
- Sigstore bundle parsing (v0.1–v0.3) across Docker Hub, GHCR, and ECR Public (`apps/web/lib/sigstore/verify.ts`)
- VEX annotation distinguishing exploitable from `not_affected`
- Trust score from four real signals: vulns, SBOM, signature, provenance (Rekor + upstream digest)
- Kyverno and sigstore/policy-controller admission templates in Audit mode (`deploy/kubernetes/`)
- Rust CLI with scriptable exit codes (0 / 1 / 2 / 5)
- Postgres job claim via `SELECT … FOR UPDATE SKIP LOCKED` (`apps/worker/src/db.ts`)
- Retry with backoff, dead-letter handling, worker heartbeat

**Not claimed:** OpenTelemetry, BullMQ/Redis queues, in-toto attestation generation, SLSA levels, per-user previews, weekly rebuild cadence, Homebrew installs.

---

## Repository layout

```
flareo/
├── apps/
│   ├── web/                 Next.js app (marketplace, verify, API, republish scripts)
│   └── worker/              Node worker (historical submission path; build in legacy/)
├── packages/
│   └── cli/                 Rust CLI (thin client over /api/v1/verify)
├── deploy/
│   └── kubernetes/          Kyverno ×2 + sigstore/policy-controller admission manifests
├── docs/                    Decisions, ADRs, threat/red-team notes, deploy runbook
├── docs/archive/            Historical working notes and retired preview ops
├── selfhost/                Placeholder for a future self-host bundle
└── .github/workflows/       web-ci, web-e2e, cli-ci, cli-release, republish
```

---

## Local setup

Requirements: Node ≥ 22, npm ≥ 10, Postgres 14+ (Homebrew or Docker), optional Rust 1.80+ for the CLI.

```sh
git clone https://github.com/Yolo1105/flareo.git
cd flareo
npm install

# Postgres (example: docker compose under apps/web)
cd apps/web
docker compose up -d postgres
cp .env.example .env.local
# Set AUTH_SECRET; for sign-in also AUTH_GITHUB_ID / AUTH_GITHUB_SECRET
ln -sfn .env.local .env   # Prisma CLI reads .env
npm run db:push
SEED=1 npm run db:seed
# Optional demo personas (dev only):
# SEED=1 npm run db:seed:dev

cd ../..
npm run dev:web
```

App: http://localhost:3000.

Worker (optional; needs R2/ECR for real publishes):

```sh
cd apps/worker
cp .env.example .env
# DATABASE_URL, MAIN_APP_URL, FLAREO_WORKER_SECRET matching the web app
npm run dev
```

---

## Project history

Built solo since early 2025 alongside coursework and internships — the history is bursty. It started as a marketplace product with a build pipeline and a planned paid tier. In mid-2026 the build path was identified as the largest attack surface in a project premised on trust, and the marketplace framing as the wrong one, so the build path was retired and the project refocused on verification and re-publication. Decision records live under [`docs/adr/`](docs/adr/).

---

## Status

Intentionally frozen at a high-quality snapshot. Not seeking contributors, feature requests, or a roadmap. See [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md).

License: [Apache-2.0](LICENSE).
