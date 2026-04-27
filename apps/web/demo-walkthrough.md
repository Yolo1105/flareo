# Flareo — demo walkthrough

**Trust-first container registry.** Every module in the catalog has been built in a hermetic sandbox, scanned for CVEs, signed with cosign, attested with SLSA L2 or L3 provenance, and has its full SBOM published. Daily canary rebuilds re-verify every module and surface upstream compromises within 24 hours.

This document is the orientation. If you're landing here cold, read the whole thing in order — by the end you'll know what the product claims, what's wired end-to-end, what's scaffolded, and what you can click through to see it working.

---

## 1. What problem this product solves

Most operators who self-host software pull Docker images from public registries (Docker Hub, GHCR, Quay). Those images typically:

- Are built by the upstream maintainer on their laptop or CI with unknown provenance
- Haven't been rescanned for newly-disclosed CVEs since they were pushed
- Have no SBOM, so you don't know what's inside
- Have no build-environment attestation, so a supply-chain compromise at the upstream author's machine is invisible
- Are rebuilt at the author's whim, not on a schedule

Flareo re-publishes popular self-hosted images with every missing receipt attached, rebuilds them daily, and publishes a trust score derived from those signals. The `/verify` tool lets anyone paste an image ref and check the signature against Flareo's key material.

The product is a verification registry. It deliberately is NOT a payment marketplace, an app store, or a Docker Hub replacement — it sits on top of an OCI registry (ECR, GHCR, self-hosted) and adds the trust layer.

---

## 2. What's implemented end-to-end

Everything in this section actually works in the running app. Seed data exists for all of it. There are no "TODO" comments on the paths below.

### 2.1. Public browsing and verification

- `/` — marketing homepage with pitch, trust-chain diagram, and CTA
- `/catalog` — every public module, with three discovery surfaces:
  - **Featured strip** — editorially curated by admin
  - **Trending strip** — algorithmically ranked by recent reviews + rebuild freshness + trust (see `lib/db/curation.ts` for the scoring formula)
  - **Filterable main grid** — category, sort, search
- `/modules/<slug>` — per-module detail page with:
  - Trust score (0-100), status badge, SLSA level, rebuild-SLA badge
  - Cryptographic receipts (digest, signature, Rekor entry, SBOM link)
  - Deploy snippet (ready-to-copy `docker pull` + `docker run`)
  - Expandable SBOM viewer
  - Rebuild history table (last 10 canary rebuilds with status + duration)
  - Community reviews with 5-star aggregate + histogram
  - "Report a problem" panel
- `/verify` — paste any image digest or ref, get verified / unsigned / invalid with the full receipt
- `/@<username>` — public profile pages showing a user's published modules and reviews
- `/docs/*` — operator documentation (glossary, first-verify, submitting-dockerfiles, review timelines, previews, good-module)

### 2.2. Authenticated publishing workflow

- `/login` — GitHub OAuth via NextAuth. Email fallback exists but is deprioritized.
- `/app` — dashboard with personalized quick-links
- `/app/publish` — 4-step wizard:
  1. **Source** — paste upstream repo URL
  2. **Manifest** — name, version, category, visibility (Pro plan required for private modules)
  3. **Dockerfile** — paste or upload; R2 staging with ownership record and sha256 verification
  4. **Review** — confirm and submit
- `/app/submissions` — user's own submission history, grouped into "In Flight" and "History"
- `/app/submissions/[id]` — detail for a single submission:
  - State-matched status banner with next-step guidance
  - Manifest + timeline cards
  - **Live build log streaming** (polls `/api/v1/submissions/[id]/build-log`, ANSI-free plain text)
  - Archived-log download link for terminal states

### 2.3. Admin workflow

- `/app/admin` — review queue (pending submissions), decision panel (approve / reject / request changes)
- `/app/admin/worker` — worker health: active jobs, in-flight submissions, DLQ
- `/app/admin/rebuilds` — daily canary rebuild log
- `/app/admin/reviews` — flagged/hidden review moderation
- `/app/admin/featured` — editorial curator UI for the Featured strip
- `/app/admin/reports` — user-filed module reports, triage queue (open / investigating / resolved / dismissed)
- `/app/admin/analytics` — Plausible event aggregates

### 2.4. Build worker (separate repo: `apps/worker/`)

Separate Node service that polls the `Submission` table, pulls `approved` rows, runs the full verification pipeline against the submitted Dockerfile:

- Hermetic build in a Docker-in-Docker sandbox
- Cosign signing against a KMS-backed identity
- SBOM generation with syft
- CVE scan with grype
- Rekor transparency log entry
- Push to OCI registry
- Canary rebuilds on a daily cron with upstream-unchanged short-circuit

Retries are exponential with a dead-letter queue. Unhandled crashes page Sentry with submission context (submission_id, module_name, attempt).

### 2.5. Billing (Stripe)

- Plans: Free, Pro
- Gating: private module visibility, rate limits (Pro gets 5x), weekly rebuild SLA vs. daily
- Webhook handler at `/api/v1/billing/webhook` (signed, idempotent)
- Self-serve portal at `/app/settings/billing`

### 2.6. Rate limiting + abuse controls

- Upstash Redis token-bucket rate limiter with per-endpoint buckets
- Plan-aware multipliers (Pro gets 5x on verify-auth + modules-list)
- Review flag spam prevented via auth-signin bucket
- Report 7-day cooldown per (user, module)
- Username change 24h cooldown
- Self-review rejection (publishers can't review own modules)
- Submission ID ownership verification on Dockerfile commit

---

## 3. What's deliberately scaffolded

Three things look "present" but are deliberately thinner than production. Calling this out so there's no confusion:

**Email delivery.** Resend is wired for the major submission-lifecycle emails (approval, rejection, build success, build failed, changes requested). Report-triage emails and publisher-notification emails are NOT wired. The UI occasionally says "You'll get an email when..." and honestly hedges that with "(emails aren't wired for this surface yet)."

**Registry integration.** The OCI registry write path assumes ECR and uses fixture-backed digests in local dev. Swapping to a real registry requires credentials in env + two lines in `apps/worker/src/registry.ts`.

**Admin is a single-person role.** The product has one admin role gate (`User.role === "admin"`). No sub-roles, no admin audit log beyond what SubmissionAudit captures. Fine for the current scope; a team deployment would need proper RBAC.

---

## 4. Full-loop demo (5 minutes)

The fastest way to see everything work, assuming a fresh checkout with seed data loaded:

1. **Land on `/`**. Read the pitch. Note the trust-chain diagram.
2. **Click into `/catalog`**. Note the three sections: Featured (editorially picked), Trending (computed), main grid.
3. **Click any module** (e.g. `vaultwarden`). On the detail page, observe in order:
   - Status + SLSA + **rebuild-SLA badge** ("REBUILT TODAY")
   - Trust score (large number)
   - Receipts table — every line is a real cryptographic artifact
   - Deploy snippet (copy-paste works)
   - SBOM (expand to see package list)
   - Rebuild history (last 10 canary runs)
   - Reviews with average rating + histogram
   - "Report a problem" link at the very bottom
4. **Click the publisher name** ("by NAME" line in the hero). Lands on `/@<username>` showing their other modules + reviews.
5. **Go to `/verify`**. Paste the digest from the module page. Instant verified response.
6. **Sign in** as a test user (GitHub OAuth, or seeded credentials).
7. **Go to `/app/publish`**. Walk through the wizard without submitting.
8. **Submit a test module** (there's a seeded Dockerfile in `dev-seeds/`).
9. **Land on `/app/submissions/[id]`**. Status banner reads "Awaiting reviewer."
10. **In another tab, sign in as the admin user**. Navigate to `/app/admin`. Approve the submission.
11. **Return to the submitter tab**. Refresh. Banner reads "Approved — queued" then "Building now" as the worker picks it up. **Live build log streams in real time.**
12. On success, banner becomes "Built and live" with a link to the public module page.

Total clicks: ~20. Total time: 5 minutes.

---

## 5. Repo layout

```
apps/web/
├── app/
│   ├── (marketing)/           # Public pages (no auth required)
│   │   ├── catalog/
│   │   ├── modules/[slug]/
│   │   ├── u/[username]/      # Rewritten from /@<handle> by middleware
│   │   ├── verify/
│   │   └── docs/
│   ├── app/                   # Authenticated surface (middleware-gated)
│   │   ├── publish/
│   │   ├── submissions/
│   │   ├── modules/           # "my modules" list
│   │   ├── settings/
│   │   └── admin/
│   │       ├── reviews/       # moderation
│   │       ├── featured/      # curation
│   │       └── reports/       # report inbox
│   └── api/v1/                # JSON API
│       ├── submissions/
│       ├── modules/[slug]/    # + /reviews, /report
│       ├── reviews/[id]/flag/
│       ├── reports/[id]/triage/
│       ├── admin/             # admin-only endpoints
│       └── billing/
├── components/
│   ├── ui/                    # primitives (StatusBadge, Button, etc.)
│   ├── layout/app/            # app shell (Sidebar, TopBar)
│   └── sections/
│       ├── catalog/           # CatalogExplorer + Featured/Trending strips
│       ├── module-detail/     # Hero, Receipts, Deploy, SBOM, Reviews, Reports
│       ├── app-publish/       # PublishWizard
│       ├── app-admin/         # Admin-only components
│       └── app-settings/      # ProfileEditor, PublicProfileEditor, etc.
├── lib/
│   ├── db/                    # query helpers per domain
│   │   ├── queries.ts         # modules
│   │   ├── admin-submissions.ts
│   │   ├── my-submissions.ts
│   │   ├── reviews.ts
│   │   ├── profiles.ts
│   │   ├── curation.ts        # featured + trending
│   │   ├── reports.ts
│   │   └── module-rebuilds.ts
│   ├── validation/            # Zod schemas shared by APIs
│   ├── auth/                  # NextAuth config + admin gate
│   ├── billing/               # Stripe + plan gating
│   ├── email/                 # Resend templates + send helpers
│   ├── storage/r2.ts          # Dockerfile upload + signed URLs
│   └── ratelimit.ts           # Upstash buckets
├── prisma/
│   ├── schema.prisma
│   └── migrations/            # chronologically ordered
└── middleware.ts              # auth gating + /@handle rewrite

flareo-worker/
├── src/
│   ├── index.ts               # main loop
│   ├── pipeline.ts            # build + sign + scan
│   ├── registry.ts            # OCI push
│   ├── db.ts                  # worker-side queries
│   └── sentry.ts              # crash reporting
```

---

## 6. Key schema highlights

- **Submission** — the publishing request. States: `pending`, `approved`, `building`, `built`, `failed`, `scan_rejected`, `rejected`, `changes_requested`, `worker_failures`.
- **Module** — the built, published artifact. Linked to the submission that created it. Tracks `trust`, `lastRebuiltAt`, `publisherId`, `visibility`.
- **ModuleRebuild** — each canary rebuild attempt with status, duration, and diff indicator.
- **BuildLogLine** — serialized log chunks from the worker. Read by the submitter's detail page via polling.
- **DockerfileUpload** — ownership record linking a staged R2 upload to the user who staged it.
- **ModuleReview** — 1-5 star community reviews with moderation states (`visible`, `flagged`, `hidden`).
- **User** — extended with `username`, `bio`, `websiteUrl` for public profiles.
- **ModuleFeatured** — editorial curation rows (up to 6 active).
- **ModuleReport** — user-filed problem reports for admin triage.

Migrations are chronological and idempotent. The `20260424120000_heal_upstream_ref` migration back-fills a historical data-corruption bug where user IDs had been written to the `upstreamRef` column.

---

## 7. What it would take to productionize

Assume you forked this and wanted to run it for real users. The gaps:

1. **Registry creds.** Wire ECR / GHCR / Quay credentials. Two lines in `apps/worker/src/registry.ts`.
2. **KMS signing key.** Cosign needs a real signing identity backed by KMS. The worker loads from env today but the dev env uses an ephemeral key.
3. **Email provider.** Resend is wired but needs a verified domain + DMARC.
4. **Observability.** Sentry is wired. You'd also want structured logs and a dashboard per the `apps/worker/` service.
5. **Operational verification.** Red-team day. 5+ non-maintainer submissions exercising the real workflow. Unattended weekend of the canary cron. Stripe production webhook verification. Plausible production event integrity.
6. **Scaling.** Catalog currently does full table scans for featured/trending computation. Fine for hundreds of modules; swap to cached snapshots for thousands.
7. **Copy reconciliation.** Marketing copy on `/`, `/pricing`, `/verify` leads on "cryptographic receipts are the trust signal." Community reviews + trending + profiles landed later. The copy doesn't mention them. Either lean harder into the receipts pitch and treat community as secondary, or rewrite to acknowledge both. Decide, don't leave it.

None of these is a redesign. Each is 1-2 sessions of focused work with known unknowns.

---

## 8. Session trail

This project was built across many sessions. The complete change log lives in the `*_NOTES.md` files at the repo root:

- `q1-plan.md`, `q1-retro.md`, `docs/q2-plan.md`, `docs/q2-week-1-schedule.md` — planning docs
- `phase2-runbook.md`, `full-runbook.md`, `account-system-runbook.md` — ops runbooks
- `WEEKn_NOTES.md` — per-week build logs
- `retrospective-w1-8.md` — the mid-project retro
- `code-review.md` — full code review with severity-tagged findings
- `private-module-notes.md`, `dlq-dismissal-notes.md`, `canary-observability-notes.md`, `build-log-streaming-notes.md`, `rate-limits-and-analytics-notes.md` — Track A feature notes
- `bug-fix-pass-notes.md` — security + data-corruption fixes
- `submitter-flow-notes.md` — submitter-facing workflow
- `marketplace-reviews-notes.md`, `marketplace-profiles-notes.md`, `marketplace-curation-notes.md`, `marketplace-reports-notes.md` — marketplace features
- `demo-walkthrough.md` — this document

Read in date order if you want the full history; read just this document if you want the current snapshot.

---

## 9. Known limitations (honest list)

- **No daily pull-delta tracking.** `Module.pulls30d` is a single number, not a time series. "Trending" therefore uses review velocity + rebuild freshness as the primary signal, not pull growth. See `lib/db/curation.ts` comments for the planned upgrade path.
- **BuildLogLine table grows unboundedly.** No cleanup cron. First real deployment needs one.
- **Catalog fixture fallback is always present.** If the DB is unreachable, the catalog renders the `MODULES` static fixture so the page doesn't blank. Good for dev + demo, questionable if you'd rather show an error page in production.
- **Review moderation is reactive, not proactive.** No automated spam filter. An admin reads everything flagged by users.
- **No publisher dashboard for inbound reports.** Reports go to admin who can manually forward. A publisher-facing "reports on your modules" view is its own sub-project.
- **Single admin role.** RBAC needed for multi-person admin teams.

---

## 10. Where to start reading if you're contributing

- Core user flow: `app/app/publish/page.tsx` → `components/sections/app-publish/PublishWizard.tsx` → `app/api/v1/submissions/route.ts`
- Build worker integration: `lib/db/admin-submissions.ts` → `apps/worker/src/index.ts` → `apps/worker/src/pipeline.ts`
- Public catalog: `app/(marketing)/catalog/page.tsx` → `components/sections/catalog/CatalogExplorer.tsx` → `lib/db/curation.ts`
- Module detail: `app/(marketing)/modules/[slug]/page.tsx` → everything in `components/sections/module-detail/`

The codebase favors co-located concerns (one folder per feature surface) over horizontal layering. Query helpers are in `lib/db/` by domain, API routes mirror their URL path under `app/api/`, and UI components live under `components/sections/` organized by the page that uses them.
