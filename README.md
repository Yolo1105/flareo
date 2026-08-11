# Flareo

Container supply-chain verification platform. Submitters push a Dockerfile; the platform builds it deterministically, scans it for vulnerabilities, signs the result with Sigstore, and publishes a verifiable runbook attached to the resulting image.

The product target is teams running self-hosted infrastructure who want to know that the containers they pull match the source they think they're pulling — without having to set up the build, sign, and verify pipelines themselves.

---

## Repository layout

This is a monorepo. One git repo, multiple deployable artifacts.

```
flareo/
├── apps/
│   ├── web/                Next.js main app (marketplace, dashboard, API)
│   └── worker/             Build worker (Node, runs Trivy + cosign)
├── packages/
│   └── cli/                Rust CLI (`flareo verify`, `flareo pull`)
├── deploy/
│   ├── kubernetes/         Admission controller manifests
│   └── preview/            Hetzner preview-box ops scripts
├── selfhost/               Self-host distribution (placeholder)
├── docs/                   Cross-cutting documentation
├── package.json            Workspaces config
└── README.md               This file
```

### Component responsibilities

**`apps/web`** is the user-facing Next.js application. It serves the marketing site, the marketplace catalog, the authenticated dashboard, and the JSON API. Authentication is via NextAuth v5 (GitHub OAuth). Data layer is Postgres via Prisma. Rate limiting via Upstash Redis. Email via Resend. Errors via Sentry.

**`apps/worker`** is a long-running Node process that picks up approved submissions from the database queue, builds them in a sandboxed environment, runs Trivy for vulnerability scanning, signs the resulting image with Sigstore (`cosign`), pushes to ECR Public, and writes the result back to the main app via an authenticated callback.

**`packages/cli`** is a Rust binary built from this repository (`cargo build --release` in `packages/cli`). It is a thin client over the Flareo verify API: it requests signature verification for an image reference and surfaces the result. Independent Cargo project.

**`deploy/kubernetes`** holds the OPA Gatekeeper manifests (`flareo-admission.yaml`, `flareo-admission-strict.yaml`, `flareo-admission-sigstore.yaml`) that operators install in their cluster to enforce "only verified images can run."

**`docs/archive/deploy-preview`** holds the archived operations scripts for the retired Hetzner shared-preview box (historical only).

**`selfhost`** is a placeholder for the future self-host distribution. Currently README-only.

---

## Local setup

Requirements:

- Node 22 or higher
- npm 10 or higher
- Postgres 14+ (Docker Compose included)
- Optional: Rust toolchain (only if you're building the CLI)

```sh
# Clone the repo (after pushing to GitHub)
git clone <your-repo-url> flareo
cd flareo

# Install all JS workspaces in one go
npm install

# Start Postgres via Docker
cd apps/web
docker compose up -d postgres

# Set up your local environment
cp .env.example .env.local
# Edit .env.local — at minimum set AUTH_SECRET (generate: openssl rand -base64 32)
# For sign-in to work locally also set AUTH_GITHUB_ID and AUTH_GITHUB_SECRET

# Run migrations + seed
npm run db:push
npm run db:seed

# Run the dev server
cd ../..
npm run dev:web
```

The web app will be at `http://localhost:3000`.

To run the build worker locally:

```sh
# In a separate terminal
cd apps/worker
cp .env.example .env.local
# Set DATABASE_URL (same as web), MAIN_APP_URL (http://localhost:3000),
# FLAREO_WORKER_SECRET (must match web app)
npm run dev
```

---

## Workspace scripts

Run from the monorepo root:

| Command | What it does |
|---------|--------------|
| `npm run dev:web` | Start the Next.js dev server |
| `npm run dev:worker` | Start the build worker |
| `npm run build:web` | Production build (runs `prisma generate` + `next build`) |
| `npm run test:worker` | Worker test suite (Vitest, 17 tests) |
| `npm run typecheck:web` | TypeScript check on the web app |
| `npm run lint:web` | ESLint on the web app |

App-specific scripts (Prisma, Playwright, etc.) live inside `apps/web/package.json` and `apps/worker/package.json`. Run them with `cd apps/<name> && npm run <script>` or `npm run <script> --workspace=apps/<name>` from root.

---

## Deployment

The repo is configured for Vercel deploy of `apps/web`.

**One-time Vercel setup:** in your Vercel project settings, set **Root Directory** to `apps/web`. Vercel auto-detects Next.js from there. The build script (`prisma generate && next build`) and a `postinstall` hook (`prisma generate`) ensure the Prisma client is always fresh.

**Required environment variables in Vercel:**

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | Postgres connection (use Neon, Supabase, or Railway for managed) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed app — `lib/config/env.ts` throws without it |
| `AUTH_SECRET` | NextAuth session signing — generate with `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` | GitHub OAuth app credentials, for sign-in |
| `FLAREO_WORKER_SECRET` | Shared secret for worker callbacks — same value on both sides |

**Optional (graceful no-op when unset):** `STRIPE_*`, `RESEND_API_KEY`, `SENTRY_DSN`, `UPSTASH_REDIS_*`, `R2_*`, `AWS_*`. See `docs/deploy-runbook.md` for the full list.

**The worker deploys separately** to a Hetzner VPS as a systemd unit. See `apps/worker/deployment-runbook.md`.

**The CLI ships separately** as platform binaries through GitHub Releases. The release matrix is in `apps/web/.github/workflows/cli-release.yml`. See `apps/web/cli-release-ci-decision.md` for why it's structured the way it is.

**Full deploy walkthrough** is in `docs/deploy-runbook.md`. That's the single source of truth for going zip → production.

---

## Documentation

Three doc locations, ordered by audience:

**`docs/`** — read these first. Cross-cutting, project-wide.

- `docs/deploy-runbook.md` — top-to-bottom production deploy
- `docs/decisions.md` — pre-committed decision gates with trigger criteria (read before relitigating any gated work)
- `docs/session-protocol.md` — collaboration protocol for working with Claude on this codebase
- `docs/red-team-playbook.md` — adversarial testing checklist
- `docs/horizon-2-plan.md` — three-bet plan for the next horizon (review UI, Firecracker previews, paid tier)
- `docs/q2-plan.md` — active Q2 roadmap
- `docs/index.md` — full catalog of every doc in the repo

**`apps/web/`** — operational docs specific to the Next.js app. Examples: `apps/web/full-runbook.md`, `apps/web/account-system-runbook.md`, `apps/web/build-worker-spec.md`, the `apps/web/marketplace-*-notes.md` series, the `apps/web/phase-*-notes.md` series.

**`apps/web/_archive/`** — historical context, do not follow as instructions. Contains MVP-era week runbooks, superseded phase plans, past code-review journals.

The full doc catalog is `docs/index.md`.

---

## Architecture at a glance

```
┌─────────────────────────────────────────────────────────────┐
│                      apps/web (Vercel)                      │
│  Next.js • marketplace • dashboard • REST API • auth        │
└──────────────┬──────────────────────────────────┬───────────┘
               │ Postgres (Prisma)                │
               │                                  │ HTTP +
               ▼                                  │ FLAREO_WORKER_SECRET
┌──────────────────────────────────┐              │
│        Postgres (managed)        │              │
└──────────────────────────────────┘              │
                                                  ▼
                                ┌──────────────────────────────┐
                                │   apps/worker (Hetzner VPS)  │
                                │   Pulls jobs from Postgres   │
                                │   Builds in sandbox          │
                                │   Trivy scan + cosign sign   │
                                │   Pushes to ECR Public       │
                                │   POSTs results back to web  │
                                └──────────────────────────────┘
                                                  │
                                                  ▼
                                ┌──────────────────────────────┐
                                │     ECR Public (signed)      │
                                └──────────────────────────────┘
                                                  │
                                                  ▼
                       Operators run packages/cli or apply
                       deploy/kubernetes admission controller
                       to enforce verification at pull/run time.
```

---

## Status

Pre-launch. Core flow works end-to-end in dev. Deferred items live behind feature flags in `apps/web/lib/speculative/flags.ts` (search `FLAREO_FEATURE_`) — they ship dark and turn on after their trigger criteria fire (see `docs/decisions.md`).

The next gating decision is **F0** — does landing-page → signup conversion clear 5%? F0 instrumentation is wired but not yet deployed; deploying it starts the 30-day measurement clock per `docs/decisions.md`.

---

## License

See `packages/cli/LICENSE` for the CLI license. The web app and worker are not currently open-source — license file is intentionally absent at the repo root.

---

## Why monorepo

This is a solo-developer project. Multi-repo overhead (separate CI per repo, separate version bumps, cross-repo PRs for coordinated changes) would be wasted complexity at this scale. One repo means one `git clone`, atomic commits across web + worker when their contract changes, shared tooling, and a single issue tracker. The conventional layout (`apps/`, `packages/`, `deploy/`, `docs/`) matches what Vercel, Supabase, Linear, and Turborepo all use.
