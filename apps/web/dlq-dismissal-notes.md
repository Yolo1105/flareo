# DLQ dismissal UI — Track A #2

Building on the earlier code-review fix that made `retryBuild` accept `worker_failures` rows at the API level, this session adds the missing UI affordance: a dedicated DLQ panel on the admin detail page with both retry and give-up actions, plus queue-level surfacing of DLQ count via a filter chip and a top-of-page banner.

## What shipped

### Decision panel (`components/sections/app-admin/SubmissionDecisionPanel.tsx`)

- New `isDeadLettered: boolean` prop alongside the existing `canRetry`. Treated separately because DLQ rows need both actions (retry + give up), whereas a plain `failed + system` row only needs retry.
- New `Mode = "dlq_give_up"` branch that renders a reason-required reject form, styled in the bad palette with a prominent "GIVING UP" banner explaining the semantics.
- The existing retry block (`showRetry && mode === null`) now branches on `isDeadLettered`:
  - **DLQ path:** red banner ("DEAD-LETTERED" with pulsing dot), message explaining the three-failure history, two buttons stacked — "Retry — fresh attempt budget" (accent) and "Give up — reject permanently" (red outline opening the `dlq_give_up` mode).
  - **Soft retry path:** unchanged — the pre-existing "SYSTEM FAILURE" card with a single retry button.
- The give-up submit posts to `/reject` with `fromDlq: true` so the audit record distinguishes it from a normal rejection.

### Admin detail page (`app/app/admin/[id]/page.tsx`)

- `canRetry` widened: now `true` for both `failed + buildErrorKind=system` AND `worker_failures`.
- New `isDeadLettered` prop passed through to the panel (`status === "worker_failures"`).
- `isTerminal` unchanged — DLQ is not terminal, it awaits a decision.

### Reject endpoint + library (`app/api/v1/admin/submissions/[id]/reject/route.ts` + `lib/db/admin-submissions.ts`)

- `BodySchema` on the route: optional `fromDlq: z.boolean().optional()` field, threaded into `rejectSubmission()`.
- `RejectArgs` interface: new optional `fromDlq` field documented as informational only.
- `rejectSubmission()` prefixes the audit-log `notes` with `[gave up on DLQ]` when the flag is set. Status still goes to `rejected` either way — the difference lives in the audit trail.
- Comment in `rejectSubmission` updated to explicitly list `worker_failures` among the accepted source states. No behavioral change there; the "any non-terminal state" check already covers it.

### Admin queue top-of-page (`app/app/admin/page.tsx`)

- New DLQ banner rendered right after the `>20 pending` warning banner. Only shown when `stats.deadLetteredCount > 0` AND the viewer isn't already on the DLQ filter. Red pulse indicator, count, quick explanatory text, and a "Review DLQ →" link that jumps to `?status=worker_failures`.
- DLQ filter chip: when `deadLetteredCount > 0`, label becomes "DLQ · N" and the chip renders in the bad palette (red border, tinted background) so it stands out against the other filters.

### Queue stats (`lib/db/admin-submissions.ts`)

- `QueueStats` interface: new `deadLetteredCount: number`.
- `getQueueStats()` adds the fifth count to its `Promise.all` batch.

## How this completes the DLQ loop

Before this session:
- Worker dead-letters rows correctly (retry + backoff, then park — fixed earlier)
- `retryBuild` accepts DLQ rows and resets `attemptCount` (fixed earlier)
- DLQ rows were invisible on the queue top-level — admin had to filter manually
- DLQ detail page didn't show retry button because `canRetry` excluded `worker_failures`
- No way to "give up" on a DLQ row except to manually edit the DB

After this session:
- Admin lands on `/app/admin` → if DLQ > 0, a red banner is impossible to miss
- Clicking the banner (or the highlighted DLQ filter chip) scopes the queue to DLQ rows
- Clicking into a DLQ row's detail page shows the red DEAD-LETTERED panel with both actions
- Retry re-queues with a fresh attempt budget (attemptCount reset to 0, availableAfter null)
- Give up opens a reason-required form, posts to `/reject` with `fromDlq: true`, status transitions to `rejected`, audit entry tagged `[gave up on DLQ]` so later queries can distinguish give-ups from normal rejections

## Deliberately NOT touched

- **Rejection email copy.** The submitter receives the same email template for DLQ give-ups as for normal rejections. For a launch-quality product the copy should probably differ ("after three build attempts we couldn't resolve the issue on our side…" vs. "we've decided not to accept this submission…"). Future session if/when tone matters.
- **Bulk DLQ actions.** No "retry all" / "give up all" — each row gets an individual decision, which is the right default at current scale but would hurt at thousands of rows.
- **DLQ age indicator.** No rendering of "parked for N hours." Could go on the queue row. Minor.
- **Audit log viewer.** The `[gave up on DLQ]` prefix is useful in SQL queries but there's no admin UI that surfaces the audit trail today. Worth adding alongside canary rebuild observability (Track A #3).
- **Sentry bucketing for give-ups.** A DLQ give-up probably wants a separate Sentry breadcrumb vs. a normal rejection for failure-mode analysis. Minor, can add later.

## How to verify locally

Since there aren't real DLQ rows in a dev DB by default, the fastest way to see this UI is to manually seed one:

```sh
# In psql, pick a recent submission and force it to DLQ state:
UPDATE "Submission"
SET status = 'worker_failures',
    "buildErrorKind" = 'system',
    "buildErrorMessage" = 'simulated DLQ — push to registry timed out three times',
    "attemptCount" = 3,
    "buildCompletedAt" = NOW()
WHERE id = '<some-submission-id>';
```

Then:

1. Open `/app/admin` — red banner appears at top: "1 submission dead-lettered · build failed three times, parked for human review. Retry or give up. [Review DLQ →]"
2. DLQ filter chip now reads "DLQ · 1" in the bad palette
3. Click the chip or the banner → queue scoped to the single DLQ row
4. Click into the row → admin detail page shows status: `worker_failures`
5. Right-side decision panel shows the DEAD-LETTERED red card with two buttons
6. Click "Retry" → row flips back to `approved`, attempt counter resets to 0, toast confirms "Build re-queued — attempt counter reset", page refreshes
7. Re-simulate the DLQ state, then click "Give up" instead → give-up form with red "GIVING UP" banner, requires a ≥10-character reason
8. Enter a reason, confirm → row transitions to `rejected`, submitter receives the rejection email, audit log shows `action: "rejected"` with `notes: "[gave up on DLQ] <your reason>"`

## Track A progress

- ✅ #1 Private module submission flow
- ✅ #2 DLQ dismissal UI — this session
- ⏸️ #3 Canary rebuild observability
- ⏸️ #5 Plan-aware rate limits
- ⏸️ #6 VerifyToolUsed event wiring

Three items left. Each smaller than this session.
