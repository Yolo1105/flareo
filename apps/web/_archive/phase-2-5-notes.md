# Phase 2.5 — Close and Harden

This zip ships three pieces of Q1 Phase 2.5 from `q1-plan.md`:

1. **Week 11a — Dockerfile upload UI** on `/app/publish`. Submitters can attach a Dockerfile that lands in Cloudflare R2 at the canonical key the build worker expects.
2. **Week 14 — Worker health dashboard** at `/app/admin/worker`. Five numbers at 8 AM, plus the in-flight build and last-10 terminal submissions.
3. **Week 14 — Reliability and telemetry: retries with exponential backoff, dead-letter queue, and Sentry wiring on the worker.** The build pipeline can now survive transient failures without human babysitting, and genuinely bad failures land both in the admin DLQ and on your phone.

Still remaining in Phase 2.5: Week 13 red-team day (execute `docs/red-team-playbook.md` on the dedicated build host), a real non-maintainer smoke test, and one unattended weekend.

## Week 11a — Dockerfile upload UI

New files:

- `lib/storage/r2.ts` — minimal R2 client wrapper. One operation: `uploadDockerfile({ submissionId, content, declaredSha256 })`; returns the `r2://` reference URL to attach to the submission commit.
- `app/api/v1/submissions/dockerfile-upload/route.ts` — `POST` endpoint. Client sends `{ dockerfile, sha256, submissionId? }`; server verifies the hash, writes to R2 at `submissions/<id>/Dockerfile`, returns `{ submissionId, referenceUrl }`. Auth = session or API key. Rate-limited via the `auth-signin` bucket.
- `components/sections/app-publish/DockerfileStep.tsx` — wizard step 3. Drag-drop, file picker, and paste textarea all converge on the same state. On "Upload & continue", computes SHA-256 via `crypto.subtle.digest` in the browser, POSTs to the upload endpoint, hands the referenceUrl back to the parent. "Skip for now" is allowed; reviewer can request changes later.

Modified files:

- `.env.example` — added `R2_BUCKET_SUBMISSIONS="flareo-submissions"`. Left `R2_BUCKET_NAME="flareo-artifacts"` untouched (used by the canary rebuild workflow).
- `package.json` — added `@aws-sdk/client-s3`.
- `app/api/v1/submissions/route.ts` — accepts optional `dockerfileUrl` + `dockerfileSha256`. When `dockerfileUrl` is present the endpoint extracts the submission id from the URL pattern (prevents a spoofing path) and stores the reference. When absent, a fresh id is minted and inline `dockerfile` continues to work.
- `components/sections/app-publish/PublishWizard.tsx` — four-step flow: `SOURCE → MANIFEST → DOCKERFILE → REVIEW`.

## Week 14 — Worker health dashboard

New files:

- `lib/db/worker-stats.ts` — three query functions: `getWorkerDashboardStats()`, `getInFlightBuild()`, `getRecentTerminalSubmissions(limit)`. Parallel reads, all covered by existing indexes.
- `app/app/admin/worker/page.tsx` — admin-gated. Reload-to-refresh. Sections: health signal banner → DLQ banner (when non-empty) → five-number grid → median build + approved-queue link → in-flight build card → last-10 terminal submissions table. All status badges tone-coded; dead-lettered rows render as `DLQ · EXHAUSTED` in bad-red.

Modified files:

- `components/layout/app/Sidebar.tsx` — added "Worker health" entry under OPERATIONS (admin-only).

## Week 14 — Retries, DLQ, and Sentry

### Schema

- `prisma/schema.prisma` — added to Submission:
  - `attemptCount Int @default(0)` — number of prior `kind="system"` failures
  - `availableAfter DateTime?` — earliest time the row becomes re-claimable after a retry
- `prisma/migrations/20260424070000_add_retry_columns/migration.sql` — additive migration. Both columns are nullable or defaulted; pre-migration rows behave as "never retried, available now". Also adds a compound index `(status, availableAfter)` matching the worker's updated claim query.

### Worker

- `apps/worker/src/sentry.ts` (new) — Sentry wrapper around `@sentry/node`. Four entry points:
  - `initSentry(dsn, workerId)` — safe no-op when DSN is unset
  - `captureSystemFailure({ ..., willRetry })` — level: warning for retries, error for dead-letters
  - `captureDeadLetter({ ... })` — level: fatal
  - `captureUnhandled(err, context)` — level: fatal
  - `flushSentry(timeoutMs)` — called on graceful shutdown and before `process.exit(1)` in the fatal branch
- `apps/worker/src/db.ts`:
  - `ApprovedRow` now includes `attemptCount`
  - `claimNextApprovedSubmission` SQL now filters by `availableAfter IS NULL OR availableAfter <= NOW()` and selects `attemptCount`
  - New exports: `MAX_SYSTEM_RETRY_ATTEMPTS = 3`, `RetryOrFailInput`, `RetryDecision`, `markFailedOrRetry()` (which classifies by kind and, for system errors, either requeues with backoff or dead-letters)
  - Backoff schedule: attempt 1 → 1 minute, attempt 2 → 5 minutes, attempt 3+ → 15 minutes. After 3 attempts, status flips to `worker_failures` (the DLQ) instead of requeuing
- `apps/worker/src/index.ts`:
  - `processSubmission` has a local `systemFailure()` helper that centralizes the retry/dead-letter/Sentry-capture trio. All 5 previous `kind:"system"` `markFailed` call sites now route through this helper
  - The 2 `kind:"user"` and 1 `kind:"scan"` sites continue using `markFailed` directly — those are always terminal and don't participate in retries
  - The top-level unhandled-error catch also uses `markFailedOrRetry` + `captureUnhandled` + `captureDeadLetter` if that was the final attempt
  - `main()` calls `initSentry` before anything else so init-time errors are captured
  - `flushSentry` is called on graceful shutdown and in the fatal branch
- `apps/worker/package.json` — added `@sentry/node`

### Main app — DLQ surfaces

- `app/app/admin/page.tsx` — admin queue:
  - `STATUS_TONE` includes `worker_failures` → "DLQ" badge
  - "DLQ" filter chip added alongside Pending/Building/Built/Failed/Rejected/All
  - `worker_failures` included in the "All" filter's status list
- `lib/db/worker-stats.ts`:
  - `WorkerDashboardStats` now includes `deadLetterCount`
  - Query adds a `count` for `status: "worker_failures"`
  - Signal rules escalated: `≥5 DLQ` → red, `≥1 DLQ` → amber (unless another red rule fires first)
  - `TerminalStatus` and `getRecentTerminalSubmissions` now include `worker_failures`
- `app/app/admin/worker/page.tsx`:
  - New DLQ banner between the signal banner and the 5-number grid. Only renders when `deadLetterCount > 0`. Includes a direct "Open DLQ →" link to `/app/admin?status=worker_failures`
  - `TERMINAL_TONE` adds `worker_failures → "DLQ · EXHAUSTED"` for the recent-submissions table

## Deliberately NOT touched

- `lib/db/account.ts` — untouched. The Prisma `$transaction` typing issue from an earlier session was a sandbox artifact, not a real bug.
- `prisma/migrations/20260424000000_add_canary_artifacts` — prior migration preserved unchanged; new retry migration sits alongside with a later timestamp.
- `scripts/canary/*` and `.github/workflows/canary-rebuild.yml` — untouched. They still use `R2_BUCKET_NAME` for the artifacts bucket.
- The admin detail page at `/app/admin/[id]` — no new "dismiss from DLQ" button yet. The existing `retry-build` admin endpoint already handles moving a row back to `approved`, which works for DLQ rows too. A dedicated DLQ UI affordance can come in a follow-up.
- `docs/red-team-playbook.md` and scheduling a red-team day — that's a real-world execution task, not a code task.

## How to deploy this locally

```sh
cd apps/web
npm install
npx prisma migrate deploy     # applies both the canary migration and the new retry migration
npm run dev

# In another terminal:
cd ../flareo-worker
npm install                   # picks up @sentry/node
# Set env vars in flareo-worker/.env (DATABASE_URL must match the main app's)
# Optionally set SENTRY_DSN to get alerts on system failures and DLQ events.
npm run dev
```

Without `SENTRY_DSN`, the worker runs fine and simply logs to stdout instead of sending to Sentry. The DB-side retry/DLQ logic is independent of Sentry and works either way.

## How to smoke-test retry + DLQ end-to-end

Without an actual build host (Trivy, cosign, ECR), the cleanest way to exercise retry/DLQ is via the main-app side:

1. Create a test submission through `/app/publish`.
2. Approve it via `/app/admin/<id>`.
3. With the worker stopped, run this SQL three times against the same row:
   ```sql
   UPDATE "Submission"
     SET status = 'approved',
         "attemptCount" = "attemptCount" + 1,
         "availableAfter" = NULL,
         "buildErrorKind" = 'system',
         "buildErrorMessage" = 'simulated transient failure'
     WHERE id = '<submissionId>';
   ```
   Each run simulates a failed retry attempt.
4. After three attempts' worth of simulated failures, use the real retry path by setting `availableAfter = NULL` and flipping status to `approved` one more time, then start the worker and let it pick up a genuine failure (e.g. by pointing ECR_REPOSITORY_PREFIX at an unreachable host). Observe the row transition to `worker_failures` after three real attempts.
5. Open `/app/admin/worker` — the DLQ banner should appear; the row should be in the last-N terminal table with `DLQ · EXHAUSTED`.
6. Click "Open DLQ →" — lands on `/app/admin?status=worker_failures` with the row visible.

If `SENTRY_DSN` is set, each system failure generates a Sentry event (warning → warning → error escalation for the three attempts, then a separate fatal dead-letter event). Validate in the Sentry UI.

## How to smoke-test the upload UI end-to-end

Same as the previous zip. Short recipe:

1. Provision R2 bucket `flareo-submissions`, set the four `R2_*` env vars.
2. Sign in to `/app/publish`, upload a small valid Dockerfile.
3. Approve in `/app/admin/<id>`.
4. Start the worker — it claims the row, fetches the Dockerfile from R2, builds, scans, signs, pushes.
5. Refresh `/app/admin/worker` — the submission appears in the recent-builds table with a real duration.

## What's not in this build

Per the Phase 2.5 plan, this build closes four of the five remaining items (upload UI + dashboard + reliability/Sentry + DLQ). Still ahead:

- **Week 13 red-team day.** Execute `docs/red-team-playbook.md` against the build worker on its dedicated host. One-day exercise, not a coding task.
- **Real non-maintainer smoke test.** Find one or two people who are not you to submit real modules. The plan's ship criterion is 5 real submissions end-to-end.
- **Unattended weekend.** Friday evening through Monday morning with the pipeline live. If Monday's dashboard is green, Phase 2.5 is done.

After those three, Phase 2.5 is done and Q1 weeks 15-16 (paid tier) begin.
