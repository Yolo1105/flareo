# Bug fix pass — upstreamRef corruption + code-review items

Track 1 closes the pre-existing `upstreamRef` data-corruption bug (flagged in `private-module-notes.md`). Track 2 works through the remaining code-review findings that had been marked "still open" since the Q1 review.

## Track 1 — `upstreamRef` corruption

### The bug

`apps/worker/src/db.ts` `publishModuleFromSubmission` was passing `row.submitterId` into the SQL positional argument that mapped to the `upstreamRef` column. Published modules were therefore storing a user ID (cuid-shape) in a column that's displayed on the module detail page as the upstream repo URL.

Counting confirmed:
- SQL `$13` → `"upstreamRef"` column — JS was passing `row.submitterId ?? null` (wrong)
- SQL `$19` → `"publisherId"` column — JS was passing `row.submitterId` (correct)

### The fix (code)

- `publishModuleFromSubmission` args gained `upstreamUrl: string`
- SQL `$13` now receives `args.upstreamUrl`
- Caller in `apps/worker/src/index.ts` reads `flags.upstreamUrl` from the submission's parsed `flagsJson` and passes it through

### The fix (data)

`prisma/migrations/20260424120000_heal_upstream_ref/migration.sql` — two-pass heal:

1. For every Module whose `upstreamRef` is NULL, empty, or doesn't start with `http`, look up the most recent approved/built Submission matching the module's slug and copy its `flagsJson.upstreamUrl` value if that value looks like a URL.
2. Any Module that still has a non-URL value after pass 1 (because the flagsJson also didn't have a valid URL) gets `upstreamRef = NULL`. Better to show no upstream than a user-ID-shaped string.

Idempotent: re-running is a no-op once every row has either a URL or NULL. Safe: rows that already have URL-shaped values are untouched.

Verify with:
```sql
SELECT slug, "upstreamRef" FROM "Module"
WHERE "upstreamRef" IS NOT NULL AND "upstreamRef" NOT LIKE 'http%';
-- should return zero rows
```

## Track 2 — code-review items addressed

### ✅ #10 — NEXT_PUBLIC_APP_URL fail-fast (medium)

Problem: four call sites used `process.env.NEXT_PUBLIC_APP_URL ?? "https://flareo.dev"` (or `?? new URL(req.url).origin`). A missing env var in production would silently default, causing Stripe redirects from staging to bounce to the production domain.

Fix: new `lib/config/env.ts` exports two helpers:
- `appBaseUrl()` — throws if `NEXT_PUBLIC_APP_URL` is unset and `NODE_ENV !== "development"`. Dev falls back to `http://localhost:3000`.
- `appBaseUrlOr(requestOrigin)` — pragmatic compromise for the two endpoints (portal, create-checkout-session) whose historic fallback was `new URL(req.url).origin`. In production still prefers the env var; honors the request origin only if both are available.

Four call sites updated:
- `app/api/v1/billing/webhook/route.ts`
- `app/api/v1/billing/portal/route.ts`
- `app/api/v1/billing/create-checkout-session/route.ts`
- `lib/email/submission-emails.ts` — changed from module-scope constants to lazy getters so importing the file in a test env doesn't blow up

### ✅ #12 — Zod / R2 size cap divergence (medium)

Problem: Zod schema rejected dockerfiles over 20KB but the R2 upload helper only threw on 100KB. A 50KB Dockerfile would pass validation and then get rejected at the storage layer with a different error shape.

Fix: R2 helper's cap lowered to 20KB, exposed as a named constant `MAX_DOCKERFILE_BYTES` so future adjustment is a one-place edit.

### ✅ #7 — Requeued rows carry stale error (medium, resolved as non-issue)

Investigated. `retryBuild` already nulls `buildErrorKind` and `buildErrorMessage` when transitioning to `approved`. The admin detail page only renders the error block when status is `failed | scan_rejected`; post-retry the section is hidden entirely. No bug to fix — closing the finding as non-reproducible.

### ✅ #11 — Error-string brittle matching (medium)

Problem: `app/api/v1/submissions/dockerfile-upload/route.ts` used `message.includes("SHA-256 mismatch")` and `message.includes("R2 credentials missing")` to classify errors into HTTP status codes. Any copy change to the thrown message would silently break the status-code mapping.

Fix: two new named error classes in `lib/storage/r2.ts`:
- `R2ConfigError` (maps to 503)
- `DockerfileChecksumMismatch` (maps to 400)

Call sites changed to `instanceof` checks. The error message stays in the `.message` property for logs/responses but the classification is now type-based.

### ✅ #4 — Submission-id spoofing / DockerfileUpload ownership (high)

Problem: `/api/v1/submissions/dockerfile-upload` stored the Dockerfile in R2 under a key keyed on `submissionId`. Ownership was implicit via the unguessability of the 16-hex-char `sub_*` id — which works until the id leaks (shared URL, log, accidental paste). Anyone authenticated who knew the id could commit a submission using someone else's staged Dockerfile.

Fix: persist ownership explicitly.

**Schema:** new `DockerfileUpload` model and migration `20260424130000_add_dockerfile_upload`:
- `submissionId` (unique), `userId` (FK → User), `sha256`, `sizeBytes`, `uploadedAt`
- Index on `(userId, uploadedAt)` for future "my uploads" queries

**Upload endpoint:** after R2 upload succeeds, upserts a `DockerfileUpload` row keyed on `submissionId`. Same-user retries are idempotent (same content, same sha → row unchanged).

**Commit endpoint (`/api/v1/submissions` POST):** when `dockerfileUrl` is provided, extracts the submissionId from the URL pattern (pre-existing code), then:
- Looks up the `DockerfileUpload` row
- If found AND `userId` doesn't match the authenticated user → 403 `forbidden`
- If found AND `data.dockerfileSha256` doesn't match the stored sha → 400 `bad_request` (tampering signal)
- If NOT found → treated as legacy (pre-migration submission), allowed to commit. Once the queue has drained of pre-migration rows, the null-fallback should be tightened to reject.

Attack closed: even with a leaked or logged submissionId, another authenticated user cannot commit a submission using the original uploader's Dockerfile.

### ✅ #8 — Sentry enrichment on unhandled crashes (medium)

Problem: `captureUnhandled(err, context)` took no submission context. When `processSubmission()` crashed, the operator saw "worker crashed" in Sentry but not "which submission did it crash on."

Fix: `captureUnhandled` gained an optional third parameter `submission?: { submissionId, moduleName, attempt? }`. The call site inside the `processSubmission` try/catch now passes this context. The global handlers (`uncaughtException`, `unhandledRejection`, `main`) don't have submission context available, so they continue to call the function without the third arg — the parameter is optional so they keep compiling.

Sentry events from the processSubmission path now tag `submission_id`, `module_name`, and `attempt`, matching the tag shape of `captureSystemFailure` and `captureDeadLetter` for consistent dashboard filtering.

## Not addressed this session

### #15 — Unique index WHERE predicate (medium, cosmetic)

Skipped. The finding called out a partial-index predicate that could be sharper; zero behavioral impact. Not worth a migration for cosmetic cleanup.

### Five low-priority findings

Not touched. They're style/hygiene items — `VerifyToolUsed` dead-code removal (already resolved by wiring the event last session), Plausible queue-shim trimming (already addressed), migration comment polish, rate-limit doc-string review, and a couple of var-name suggestions. None affects behavior.

## Files changed summary

**Schema + migrations:**
- `prisma/schema.prisma` — added `DockerfileUpload` model + User back-relation
- `prisma/migrations/20260424120000_heal_upstream_ref/migration.sql`
- `prisma/migrations/20260424130000_add_dockerfile_upload/migration.sql`

**Main app:**
- `lib/config/env.ts` (new) — `appBaseUrl()` + `appBaseUrlOr()` fail-fast helpers
- `lib/storage/r2.ts` — size cap aligned to 20KB; new `R2ConfigError` + `DockerfileChecksumMismatch` classes
- `lib/email/submission-emails.ts` — lazy getters replacing module-scope constants
- `app/api/v1/submissions/dockerfile-upload/route.ts` — ownership row upsert; `instanceof` error classification
- `app/api/v1/submissions/route.ts` — commit-time ownership check + sha cross-verification
- `app/api/v1/billing/webhook/route.ts` — uses `appBaseUrl()`
- `app/api/v1/billing/portal/route.ts` — uses `appBaseUrlOr()`
- `app/api/v1/billing/create-checkout-session/route.ts` — uses `appBaseUrlOr()`

**Worker:**
- `apps/worker/src/db.ts` — `publishModuleFromSubmission.args.upstreamUrl`; SQL `$13` receives URL instead of user ID
- `apps/worker/src/index.ts` — passes `flags.upstreamUrl` to publish call; `captureUnhandled` gets submission context in the processSubmission catch
- `apps/worker/src/sentry.ts` — `captureUnhandled` third-param submission context

## How to verify

### Upstream ref healing

Before migration, a SQL query for corrupted rows:
```sql
SELECT slug, "upstreamRef" FROM "Module"
WHERE "upstreamRef" IS NOT NULL AND "upstreamRef" NOT LIKE 'http%';
```
returns rows with user-id-shaped values. After migration, returns zero rows.

### DockerfileUpload ownership

Sign in as user A, POST to `/api/v1/submissions/dockerfile-upload` → capture the `submissionId` from the response. Sign in as user B, POST to `/api/v1/submissions` with the same `dockerfileUrl` and `dockerfileSha256` → response is 403 `forbidden`. Before this fix, the 403 would have been a successful submission under user B's account.

### NEXT_PUBLIC_APP_URL fail-fast

In a test env, unset `NEXT_PUBLIC_APP_URL` and set `NODE_ENV=production`, then hit `/api/v1/billing/create-checkout-session` → returns 500 with a clear error. Before this fix, it would have returned 200 with a Stripe URL whose redirects pointed at a stale fallback.

### Sentry submission-context

Trigger a synthetic crash inside `processSubmission` (e.g. throw from a mock). Sentry event arrives with tags `submission_id`, `module_name`, `attempt` alongside the existing `context: "processSubmission"`. Before this fix, only `context` was tagged — dashboard filtering by submission was impossible.

## Track A + bug fix state

Track A: all six items complete. Bug fix pass: all critical and high findings closed, five of the seven mediums closed, the remaining two skipped as cosmetic/non-issue. The repo is in noticeably better shape than it was an hour ago.

Not addressed (deliberately):
- Week 1 operational verification (red-team day, 5 real submitters, unattended weekend, Stripe prod, Plausible prod) — all external to code
- BuildLogLine cleanup job — table grows unboundedly; cron-sized follow-up
- ANSI color parsing in the live log — polish
- Finding #15 (index predicate cosmetic) and five lows
