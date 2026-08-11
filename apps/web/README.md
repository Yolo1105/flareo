# Flareo

A catalog of pre-built, verified self-hosted modules — and the verification surface to prove what's in any container image.

This is the main app (Next.js 15 App Router, TypeScript, Postgres via Prisma). Sister repos:

- `apps/worker/` — TypeScript build worker (Sentry, retry/DLQ, policy-gated publish)
- `packages/cli/` — Rust CLI binary (`flareo verify`, `pull`, `run`, `compose`, `publish`, `init`, etc.)
- `deploy/kubernetes/` — Kubernetes admission policies (Kyverno YAMLs)
- `deploy/preview/` — Hetzner shared-preview ops (Caddy + Docker + systemd reset timer)

For a tour of all the docs in this repo, read [`docs/index.md`](./index.md). For gated decisions and trigger criteria, read [`docs/decisions.md`](./decisions.md). For how I work with Claude across multi-session buildouts, read [`docs/session-protocol.md`](./session-protocol.md).

---

## What's running here

- **Marketplace catalog** at `/marketplace` with module pages at `/modules/[slug]`. Each module has a Trust Score (0-100), CVE breakdown, SBOM viewer, signature receipts (Rekor + Fulcio + cosign), VEX-annotated CVE list, and a copy-pasteable pull command.
- **Verify-any-image tool** at `/verify`. Paste any image ref; we hit Sigstore and Trivy and return signed/unsigned + CVE breakdown. Audit surface for non-Flareo images too.
- **Submission flow** at `/app/publish` with a Dockerfile or CNB-detected language source. Goes to a reviewer queue; the build worker runs the pipeline once approved.
- **Reviewer admin** under `/app/admin`. Submission triage, VEX annotation editor, OPA-shaped admission policy editor with revision history, module reports/featured/curation, worker DLQ.
- **Pricing + billing** at `/pricing` and `/app/settings/billing`. Stripe-backed €12/mo individual tier with quota enforcement.
- **Docs** at `/docs/*` — 22 pages covering install, first-verify, threat model, signing, VEX, admission policies, CLI reference, etc.
- **F0 conversion analytics** — Plausible-tracked preview→catalog flow with a 30-day decision clock (see G-1 in decisions.md).

51 API routes total, ~12 modules in the seed catalog.

---

## Quick start

Postgres 16+, Node 20+, npm.

```sh
git clone <repo>
cd apps/web
npm install
cp .env.example .env  # fill in values; see "Environment" below
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Then http://localhost:3000.

For a populated demo, `SEED=1 npx prisma db seed` (or `SEED=1 npm run db:seed`). Idempotent; safe to re-run. Guarded behind the `SEED` env var so you can't accidentally seed production.

For end-to-end tests:
```sh
npx playwright install chromium
npm run test:e2e
```

---

## Environment

Required to boot:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `NEXTAUTH_SECRET` | NextAuth session encryption |
| `NEXTAUTH_URL` | Canonical origin for callback URLs |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | NextAuth OAuth provider |

Required for full pipeline (worker, signing, billing, etc.):

| Variable | Purpose |
|---|---|
| `FLAREO_WORKER_SECRET` | HMAC secret for worker→main app callbacks |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Billing |
| `RESEND_API_KEY` | Transactional email (submission status, billing receipts) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | SBOM + build log artifact storage |
| `PLAUSIBLE_DOMAIN` | F0 analytics target site |
| `SENTRY_DSN` | Error capture |

`.env.example` is canonical; treat it as the source of truth. If you add an env var to the codebase, add it there too.

---

## Repository layout

```
apps/web/
├── app/                       # Next.js App Router
│   ├── (marketing)/           # Public marketing pages (/pricing, /legal/*, etc.)
│   ├── api/                   # API routes (51 total)
│   │   ├── v1/                # Public + worker-callback API
│   │   └── auth/              # NextAuth handlers
│   ├── app/                   # Authenticated dashboard
│   │   ├── admin/             # Reviewer admin (vex, policy, reports, etc.)
│   │   ├── publish/           # Module submission flow
│   │   ├── settings/          # Account, billing, API keys
│   │   └── submissions/       # Submitter's view of their submissions
│   ├── docs/                  # /docs/* MDX pages (22)
│   ├── modules/[slug]/        # Module detail pages
│   ├── verify/                # The verify-any-image tool
│   └── ...
├── components/
│   ├── sections/              # Page-section components, organized by route
│   ├── docs/                  # Sidebar, DocPage layout
│   └── ui/                    # Atoms: Button, Card, etc.
├── lib/
│   ├── auth/                  # NextAuth callbacks + session helpers
│   ├── billing/               # Stripe + quota
│   ├── db/                    # Typed query helpers per model (modules, vex, policy, etc.)
│   ├── data/                  # Static catalog + nav data
│   ├── email/                 # Email templates wiring (uses /emails/*.tsx)
│   ├── policy/                # OPA-shaped admission policy evaluator
│   ├── sigstore/              # Cosign / Rekor / Fulcio verification
│   ├── validation/            # Zod schemas for API inputs
│   └── ...
├── emails/                    # React email templates (Resend)
├── prisma/
│   ├── schema.prisma
│   └── migrations/            # Hand-authored SQL migrations (use migrate deploy)
├── e2e/                       # Playwright tests (conversion-flow.spec.ts)
├── public/
└── scripts/
    ├── canary/                # Legacy canary scripts (prefer scripts/republish/)
    └── cleanup/                # One-shot maintenance scripts (e.g. as-never cleanup)
```

---

## Migrations

Hand-authored SQL files in `prisma/migrations/`. Apply with `prisma migrate deploy`, never `migrate dev` (the latter would generate new files instead of using the existing ones). After deploy, run `prisma generate` to refresh the client types.

The data layer in `lib/db/*` uses some `as never` casts to bridge Prisma client gaps when migrations were ahead of the generated client; these come out cleanly post-`prisma generate`.

---

## Getting admin access

After signup:
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'you@example.com';
```

Then `/app/admin` is reachable. There's no UI for promoting users today — by design (admin promotion is rare and audited via DB).

---

## Scripts

```sh
npm run dev              # Next.js dev server
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run test:e2e         # Playwright e2e suite
npm run test:e2e:ui      # Playwright interactive runner
npm run db:generate      # Regenerate Prisma client
npm run db:migrate       # Run pending migrations (dev mode)
npm run db:push          # Push schema directly (NOT for production)
npm run db:seed          # Seed demo data (requires SEED=1 env var)
npm run db:studio        # Open Prisma Studio
```

Bash scripts in `scripts/republish/` (and legacy `scripts/canary/`) republish seed modules. The site surfaces `lastRebuiltAt` instead of asserting a rebuild cadence.

---

## Tests

- **Unit/integration:** none today. The retro flagged this as a deferred gap.
- **End-to-end:** Playwright suite in `e2e/conversion-flow.spec.ts`. Covers the load-bearing user-facing flows: marketplace, module detail, verify, install docs, signup. See `e2e/README.md`.
- **Manual:** the source of truth for "does this still work end-to-end" is reviewer walkthrough. See `demo-walkthrough.md`.

---

## Deploy

The main app deploys to a single Postgres + Vercel target. The worker is a separate Node process — see `apps/worker/README.md` for its requirements (Docker daemon access, KMS keys for cosign signing, R2 credentials).

Production checklist before tagging a release:

1. `npm run typecheck && npm run lint && npm run test:e2e` all green
2. `docs/red-team-playbook.md` walkthrough complete for any security-touching changes
3. `prisma migrate deploy` against staging first; smoke test
4. Mark the release date in decisions.md if it touches a gated decision

---

## Contributing

Solo project as of this commit. If that changes, the contributor guide goes in `CONTRIBUTING.md` (not yet written; placeholder).

For now: open issues describe what you'd want changed; PRs are reviewed by the project owner before merge.

---

## License

MIT.
