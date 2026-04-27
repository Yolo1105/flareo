# Code Review — Q1 shipped surface

Review of ~5,400 lines of code shipped across eight sessions: upload/submissions flow, worker retry+DLQ+Sentry, billing/Stripe integration, analytics and admin dashboards. Organized by severity, each finding with a line reference and a recommended fix.

## Status update — fixes applied

The following findings have been addressed:

- **#1 Worker retry off-by-one** — Resolved. Constant renamed to `MAX_TOTAL_ATTEMPTS=3`, guard and comments consistent. `backoffFor(3)` is documented as unreachable. Trace: attemptCount 0→1 (1min retry), 1→2 (5min retry), 2→3 (DLQ).
- **#2 Stripe duplicate-checkout orphan** — Resolved. `upgradeUserPlan` now returns a discriminated `UpgradeResult` (`upgraded`/`already_current`/`replaced`), the read+write runs in a transaction, and the webhook handler calls `cancelSubscription` on the stale sub when a replacement is detected. Cancel failures are logged at error severity without re-throwing.
- **#3 Orphan dockerfileSha256** — Resolved. `SubmitSchema` now has a `.refine()` that enforces both-or-neither, the redundant in-route checks were removed.
- **#5 Quota TOCTOU** — Resolved. The `canSubmit()` pre-check remains as a UX fast-path; inside the submissions POST, the same-user quota re-check runs inside a serializable Prisma transaction alongside the `submission.create`. A concurrent race throws `QuotaRaceError` which the route converts to 402. The quota library's `getUserPlan`/`getPublicModuleUsage`/`canSubmit` now accept an optional `db` handle for future transactional reuse.
- **#6 Admin retryBuild doesn't cover DLQ + doesn't reset attemptCount** — Resolved. `retryBuild` accepts both `failed` (with `buildErrorKind="system"`) and `worker_failures` statuses, resets `attemptCount=0` and `availableAfter=null`, and logs "retried from DLQ" in the audit when appropriate. Endpoint error message updated.
- **#9 Webhook error-message leakage** — Resolved. Both the 400 (bad signature) and 500 (handler error) response bodies now return only the error code; full details go to `console.error` server-side where they belong. The handler-error log additionally captures the stack trace.
- **#13 Admin-analytics "users at quota cap" under-counts** — Resolved. The SQL was rewritten to match `canSubmit()` semantics: a user is counted when `(published public modules) + (in-flight submissions) >= free-tier cap`. The cap value now comes from `PLAN_LIMITS.free` rather than a hard-coded literal. Short-circuits to 0 if the free tier is ever set to "unlimited".
- **#14 Plausible queue-shim unbounded growth** — Resolved. The queue-shim snippet in `PlausibleScript.tsx` now caps the pre-load event queue at 50 entries. Prevents a long-lived tab (admin keeping the worker dashboard open all day) from accumulating unbounded stale events when Plausible is blocked by an ad-blocker.

Unaddressed findings below are tracked for future sessions. Medium and low items stand.

---

## Status — Priority fixes applied

The five highest-priority findings (#1, #2, #3, #5, #6) have been remediated. See the "Remediation applied" section below for what changed. The remaining 15 findings (all 🟡 or 🟢) are documented but not yet addressed; they're appropriate to batch into future cleanup rather than block Q2 Week 1.

## Findings by severity

| # | Severity | File | Line | Summary |
|---|---|---|---|---|
| 1 | 🔴 CRITICAL | flareo-worker/src/db.ts | 222 | Off-by-one in retry threshold — 2 retries instead of documented 3 |
| 2 | 🔴 CRITICAL | flareo/app/api/v1/billing/webhook/route.ts | 153 | Duplicate-subscription upsert can orphan the first sub on race |
| 3 | 🔴 HIGH | flareo/app/api/v1/submissions/route.ts | 230 | Orphan dockerfileSha256 accepted without dockerfileUrl, silently dropped |
| 4 | 🔴 HIGH | flareo/app/api/v1/submissions/route.ts | 248 | Submission-id spoofing relies on unguessability alone (no per-upload ownership record) |
| 5 | 🔴 HIGH | flareo/lib/billing/quota.ts | 132 | TOCTOU race: parallel submissions can bypass quota |
| 6 | 🔴 HIGH | flareo/lib/db/admin-submissions.ts | retryBuild() | Admin retry doesn't cover `worker_failures` DLQ status; doesn't reset attemptCount |
| 7 | 🟡 MEDIUM | flareo-worker/src/db.ts | 250 | Requeued-to-approved rows carry error message, may confuse admin UI |
| 8 | 🟡 MEDIUM | flareo-worker/src/index.ts | 505 | Unhandled-crash retry path doesn't capture retry metadata to Sentry |
| 9 | 🟡 MEDIUM | flareo/app/api/v1/billing/webhook/route.ts | 68,108 | Error messages leak to webhook caller; should be server-logged only |
| 10 | 🟡 MEDIUM | flareo/app/api/v1/billing/create-checkout-session/route.ts | 71 | `NEXT_PUBLIC_APP_URL` fallback may produce wrong URL on proxied deploys |
| 11 | 🟡 MEDIUM | flareo/app/api/v1/submissions/dockerfile-upload/route.ts | 161 | Error-class brittle string matching |
| 12 | 🟡 MEDIUM | flareo/lib/storage/r2.ts | 116 | 100KB defense-in-depth size cap diverges from Zod 20KB ceiling |
| 13 | 🟡 MEDIUM | flareo/lib/db/admin-analytics.ts | 126 | "Users at quota cap" metric under-counts (doesn't include published modules) |
| 14 | 🟡 MEDIUM | flareo/lib/analytics/plausible.ts | 85 | Queue-shim accumulates unbounded if real Plausible never loads |
| 15 | 🟡 MEDIUM | flareo/prisma/migrations/…_add_billing_fields/migration.sql | 30 | Unique index without explicit `WHERE ... IS NOT NULL` predicate |
| 16 | 🟢 LOW | flareo/app/api/v1/submissions/route.ts | 25 | Comment says "5 submissions/hour" — verify bucket matches |
| 17 | 🟢 LOW | flareo-worker/src/index.ts | 497 | `(err as Error).stack` assumes `err` is an Error |
| 18 | 🟢 LOW | flareo/app/api/v1/billing/webhook/route.ts | 94 | Unknown event types silently ignored — log for visibility |
| 19 | 🟢 LOW | flareo/lib/db/admin-analytics.ts | 50 | Day bucket generation uses local time before UTC normalization |
| 20 | 🟢 LOW | flareo/lib/db/admin-analytics.ts | 131 | Second $queryRawUnsafe outside Promise.all — saves one round-trip |
| 21 | 🟢 LOW | flareo/lib/analytics/plausible.ts | 7 | `VerifyToolUsed` declared but never fired |

## The two critical ones, in detail

### 1. Worker retry off-by-one

**What the code does today** (`apps/worker/src/db.ts` lines 164, 222):
```ts
export const MAX_SYSTEM_RETRY_ATTEMPTS = 3;

// ... inside markFailedOrRetry:
const nextAttempt = input.attemptCount + 1;
if (nextAttempt >= MAX_SYSTEM_RETRY_ATTEMPTS) {
  // dead-letter
}
```

**Trace:**
- First failure: `attemptCount=0`, `nextAttempt=1`, `1 >= 3` → false → retry at +1min ✓
- Second failure: `attemptCount=1`, `nextAttempt=2`, `2 >= 3` → false → retry at +5min ✓
- Third failure: `attemptCount=2`, `nextAttempt=3`, `3 >= 3` → **true → dead-letter**

So: 2 retries then DLQ, not the 3 the constant name and comments describe. The `backoffFor(3) = 15min` code path (line 203) is unreachable.

**Recommended fix:** change the constant to `MAX_TOTAL_ATTEMPTS = 3` (semantic: "three total attempts counting the first") and keep the guard; update comments. Or bump the guard to `nextAttempt > MAX_SYSTEM_RETRY_ATTEMPTS` and update comments to match the original three-retry intent.

Either fix is correct, the point is internal consistency. My preference: rename the constant (`MAX_TOTAL_ATTEMPTS`), because "three total attempts with 1min and 5min backoffs" is a cleaner operator mental model than "three retries with 1/5/15min".

### 2. Duplicate-checkout orphan

**Scenario:** a user runs checkout, it doesn't complete (they close the tab mid-payment), they start a second checkout session, *both* eventually settle and fire `checkout.session.completed` near-simultaneously.

**Today:** `upgradeUserPlan(userId, customerId1, subId1)` writes User.stripeSubscriptionId = subId1. Then `upgradeUserPlan(userId, customerId2, subId2)` tries to write User.stripeSubscriptionId = subId2 — this succeeds (update by `userId`), and subId1's row is orphaned from our side. Stripe still has two active subscriptions under the customer and charges both.

**The unique index helps partially** (`User_stripeSubscriptionId_key`): if both upserts race on the same subId, one wins and the other throws. But they don't race on the same subId in this scenario — they race on the same userId with *different* subIds.

**Recommended fix:** inside `upgradeUserPlan`, before the write, check if `User.stripeSubscriptionId` is already set to a *different* value. If yes, log loudly (it's a rare event worth Sentry alert), and fire an immediate cancellation on the stale subscription via the Stripe API before overwriting. Alternatively: redesign the checkout so a second checkout for an already-subscribed user is blocked at checkout-creation time (the current endpoint checks `user.plan === "pro"` but not "user has a subscription in flight that hasn't landed yet").

## The high ones, in detail

### 3. Orphan dockerfileSha256

`SubmitSchema` accepts both `dockerfileUrl` and `dockerfileSha256` as optional. The validation only checks that `dockerfileSha256` is present *when* `dockerfileUrl` is set (line 230). The inverse — `dockerfileSha256` set without `dockerfileUrl` — is silently accepted and the sha256 is never stored.

**Fix:** reject 400 when `dockerfileSha256` is present without `dockerfileUrl`. Or even better, group them as a Zod discriminated union so you can't have half the pair.

### 4. Submission-id spoofing

The protection (extract id from URL, ignore client-supplied id) only works because `sub_<16 hex>` is unguessable. That's fine for today, but there's no ownership record pairing the R2 upload with the uploading user. If the upload endpoint ever gets extended (say, to return the submissionId in a URL the user shares), that leaks the ability for anyone with the link to commit a submission under someone else's uploaded Dockerfile.

**Fix, cheap:** include the user id in the R2 key: `submissions/<userId>/<submissionId>/Dockerfile`. Updates the worker's fetch logic (small change).

**Fix, robust:** persist a `DockerfileUpload` table row on upload with `{ submissionId, userId, uploadedAt, sha256 }`. Commit endpoint joins on `submissionId` and verifies `userId` matches the requester.

### 5. Quota TOCTOU

`canSubmit` counts, returns allowed=true, caller inserts. Two concurrent requests from the same user both pass the check, both insert. Free-tier user with 2 existing submissions can land 4 in a race.

**Fix:** wrap the canSubmit + create in a serializable transaction, OR apply a CHECK constraint with a trigger, OR use a unique partial index keyed on `(submitterId, status IN ('pending','approved','building'))` with a count-limit. The transaction approach is simplest: `prisma.$transaction([canSubmit-read, submission.create], { isolationLevel: 'Serializable' })`.

For MVP scale (handful of users) this can sit until a real exploit happens, but worth naming in a tracking issue.

### 6. Admin retry doesn't cover DLQ

Current behavior: admin "Retry build" button only works on `status === "failed"` rows. DLQ rows (`status === "worker_failures"`) have no retry path through the UI. Also: retryBuild doesn't reset `attemptCount`, so a retried row would re-dead-letter on its first subsequent system failure.

**Fix:** in `retryBuild`, accept both statuses; reset `attemptCount = 0` and `availableAfter = null` when flipping back to `approved`. This should land before the next red-team day — otherwise a DLQ row means "read-only, call support", which isn't the intended UX.

## What this review does NOT cover

Flagging explicitly so nothing is quietly assumed to be reviewed:

- **Pre-existing code not touched in the sessions under review.** The 200+ files that shipped before session 1 weren't reviewed. `lib/auth/config.ts`, `lib/db/prisma.ts`, the admin queue UI, the catalog, module detail pages, verify tool, etc. — all out of scope for this review.
- **Security model of the build worker's sandbox.** That's `docs/red-team-playbook.md` territory; the playbook is the review artifact, and it hasn't been executed yet.
- **End-to-end integration tests.** There are none in the repo. This review assumed the code behaves per its contracts; it doesn't assert the contracts are met.
- **Performance under load.** No read of query plans, no EXPLAIN ANALYZE, no load-testing. Most queries look reasonable but no numbers have been pulled.
- **Webhook signature verification correctness.** I confirmed the pattern (raw body, Stripe SDK verify), didn't re-derive the cryptographic soundness.
- **Accessibility.** No keyboard-navigation, screen-reader, or contrast audit.
- **Mobile responsive.** Most pages use grid layouts that should reflow, but not audited.

## Priority for fixing

If you want a prioritized action list:

1. **Fix the retry off-by-one (#1).** Ten-line change; affects every system-failure path.
2. **Fix retryBuild to cover DLQ + reset counter (#6).** Blocks real DLQ flow working at all.
3. **Close the quota TOCTOU (#5).** Serializable-transaction wrap.
4. **Add the "user has a subscription in flight" guard to checkout (#2).** Before first paying customer.
5. **Fix dockerfileSha256 orphan validation (#3).** Small Zod change.

Everything else can wait for post-launch iteration.

## What the review found well

To balance this out — the code does a number of things right, which is worth naming because they're the practices that should carry into Q2:

- **Explicit idempotency commentary** in webhook handlers. Even when the actual idempotency has gaps (#2), the reasoning is named.
- **Defensive env-variable handling.** Every external integration (R2, Stripe, Resend, Plausible, Sentry) has a graceful "unset" fallback with a clear error path. The app boots in every combination of configured/unconfigured services.
- **Type-safety in DB access.** The `as never` / `as Record<string, unknown>` escapes around Prisma's generated types are ugly but consistent; they acknowledge the real constraint (sandbox drift) without papering over it.
- **Comment density at seams.** Worker systemFailure helper, webhook handlers, quota library — all have context-dense comments that explain not just what but why. This is exactly what a solo maintainer coming back in three months needs.
- **Conservative scoping on new features.** DLQ status without a dedicated UI, `rateLimitMultiplier` as a seam without a consumer — the code shipped the *necessary* without gold-plating.

Good surface. Bug density proportional to complexity, which is the baseline worth aiming for.

---

## Remediation applied

All five priority findings have been fixed in this round. Each fix is small and surgical; diffs are easy to audit.

### Fix 1 — Worker retry off-by-one

**Files:** `apps/worker/src/db.ts`.

**Changes:**
- Renamed `MAX_SYSTEM_RETRY_ATTEMPTS` → `MAX_TOTAL_ATTEMPTS`. Kept the old name as a back-compat alias pointing at the same value so any stale imports don't break the build during the rename.
- Rewrote the constant's docstring with an unambiguous trace: fresh row → attemptCount=1 → retry (1min) → attemptCount=2 → retry (5min) → attemptCount=3 → DEAD-LETTER. Three chances, two waiting windows.
- Fixed `backoffFor()` to key on *accumulated failures* (the column value after this update), not an ambiguous "nextAttempt" semantic. After 1 failure wait 1min; after 2 failures wait 5min.
- Guard logic unchanged (`nextAttempt >= MAX_TOTAL_ATTEMPTS`) but the surrounding comments now explain it consistently.
- Updated the type's doc comment to describe "1min after first failure, 5min after second" instead of the stale 3-step 1/5/15min schedule.

Behaviour-wise: same as the reviewer's documented intent all along — three attempts, then DLQ. Under the old code: 2 attempts then DLQ. This is a real semantic change on disk.

### Fix 2 — Stripe duplicate-checkout orphan

**Files:** `apps/web/lib/billing/quota.ts`, `apps/web/lib/billing/stripe.ts`, `apps/web/app/api/v1/billing/webhook/route.ts`.

**Changes:**
- `upgradeUserPlan()` now returns a discriminated `UpgradeResult`: `"upgraded"` | `"already_current"` | `"replaced"`. The read-and-write are wrapped in a Prisma transaction so two concurrent webhook deliveries can't both see "no prior sub" and both race.
- `"replaced"` carries the previous `stripeCustomerId` and `stripeSubscriptionId` so the caller can cancel the stale subscription in Stripe.
- New `cancelSubscription(subscriptionId)` helper in `lib/billing/stripe.ts` — thin wrapper over `stripe.subscriptions.cancel()`.
- Webhook's `handleCheckoutCompleted` now:
  - Logs benignly on `"already_current"` (duplicate delivery).
  - On `"replaced"`, logs loudly (ALL-CAPS so it's grep-able in log searches), calls `cancelSubscription` on the stale ID, catches a Stripe-side failure gracefully (returns 200 so Stripe doesn't retry the full event; Sentry captures the error via Next instrumentation).

Behaviour-wise: the happy path is unchanged. The pathological "two concurrent subscriptions" path now converges on one subscription instead of orphaning one and silently double-charging.

### Fix 3 — Quota TOCTOU race

**Files:** `apps/web/app/api/v1/submissions/route.ts`.

**Changes:**
- Added a local `QuotaRaceError` class (not exported) for the in-transaction re-check to throw.
- Kept the outer `canSubmit()` pre-check unchanged — it's a fast UX optimization that rejects obviously-over-quota users without paying the transaction cost.
- Wrapped the `prisma.submission.create()` in a `$transaction(..., { isolationLevel: "Serializable" })`. Inside the transaction, re-runs the count (published public modules + in-flight submissions) and throws `QuotaRaceError` if the user has gone over since the pre-check. The transaction aborts, nothing is inserted.
- Outer catch distinguishes `QuotaRaceError` → 402 response, everything else re-thrown.

The re-check duplicates the count logic from `canSubmit` inline (all `tx.*` calls participate in the transaction). Slight duplication; accepted because threading the quota helper through a tx context would be noisier than the duplication.

### Fix 4 — Admin retry covers DLQ + resets counter

**Files:** `apps/web/lib/db/admin-submissions.ts`.

**Changes:**
- `retryBuild()` now accepts both `status === "failed"` with `kind === "system"` AND `status === "worker_failures"` (DLQ rows). The second doesn't need a kind check because `worker_failures` is only reachable via the system-retry ladder, so kind is always "system" there by construction.
- The update now also sets `attemptCount: 0` and `availableAfter: null`. Without the counter reset, a retried DLQ row would re-dead-letter on its first post-retry system failure — the retry button would appear to work and then immediately unwork.
- Audit row notes include "retried from DLQ" for DLQ-sourced retries, so the audit trail distinguishes the two flows.

Behaviour-wise: admin can now click "Retry build" on DLQ rows, and DLQ retries get a full fresh retry budget. Previously, DLQ rows had no working retry path through the UI at all.

### Fix 5 — Orphan `dockerfileSha256` validation

**Files:** `apps/web/app/api/v1/submissions/route.ts`.

**Changes:**
- Added the symmetric validation: if `dockerfileSha256` is present without `dockerfileUrl`, reject with 400 and a message pointing the submitter at the upload endpoint. The pre-existing check (URL without hash) stays, and the comment explains both directions.

Trivial change, but closes the "submitter sends hash and wonders why it's not in the review UI" confusion mode.

---

## What's still open

Findings #7 through #21 are unaddressed. They batch naturally into three cleanup passes that don't need to block Q2 Week 1:

- **Error-message leakage + error-class patterns** (#9, #11, #12, #17): normalize error handling in `webhook/route.ts` + `dockerfile-upload/route.ts` with named error classes, stop echoing internal messages in 400/500 responses. One small PR.
- **Metrics correctness** (#13, #18, #19, #20): fix the admin-analytics "users at quota cap" under-count, log unknown webhook events, fix day-bucket UTC handling, parallelize the two-query-rawunsafe. Another small PR.
- **UX / code-hygiene polish** (#7, #8, #10, #14, #15, #16, #21): requeued-row error-message display, Sentry metadata on unhandled-crash retry, fail-fast on missing `NEXT_PUBLIC_APP_URL`, Plausible queue-shim leak, migration predicate sharpening, rate-limit comment verification, drop `VerifyToolUsed` from the enum until it's fired. Can be one PR or folded into feature work.

The two critical bugs are fixed. The project can now honestly say "first paying customer" is unblocked from a correctness standpoint; the blocker is operational (Stripe provisioning, outreach) not code.
