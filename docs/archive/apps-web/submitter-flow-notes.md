# Submitter-facing submission tracking — the last UX gap

Closes the "I submitted — now what?" gap. Before this session, after a user submitted via the publish wizard, they were redirected to `/app/modules` — which wouldn't show their submission because in-flight rows aren't Module rows yet. They'd see the dashboard look identical to before they submitted, and be left wondering if anything actually happened.

## What shipped

### `lib/db/my-submissions.ts` (new)

Submitter-scoped query helpers mirroring `admin-submissions.ts`:

- `listMySubmissions(userId)` — every submission the user has ever created, newest first. Returns the full timeline/result details the UI needs; deliberately omits admin-internal fields like `decidedById`.
- `getMySubmission(userId, submissionId)` — fetch one, but only if it belongs to the caller. Returns null on either "doesn't exist" or "exists but isn't yours" — collapsed so the API can't be probed for other users' submission ids.
- `MySubmission` interface — narrower than `AdminSubmission`. Category, description, upstream URL are parsed out of `flagsJson` at the query layer so the UI doesn't have to.

### `/app/submissions` — list page

Two groups, in-flight first:

- **In flight** (pending / approved / building / changes_requested) — highlighted section. This is what the user came to check.
- **History** — terminal states (built / failed / rejected / scan_rejected / worker_failures).

Each row shows module name + version, visibility badge, submitted-ago, status pill with tone-appropriate color, and the short submission id. Rows link to `/app/submissions/[id]`.

Zero-state explains what a submission is and points to `/app/publish`.

### `/app/submissions/[id]` — detail page

The page has three jobs:

1. **Answer "what do I need to know / do?" at a glance.** A status banner at the top, tone-matched to state: info during pending/approved/building, warn for changes_requested, bad for rejected/failed/stalled, good for built. Banner copy is different per state — building says "watch the log below," changes_requested tells them to resubmit from /app/publish, rejected surfaces the error message.

2. **Show the facts the submitter cares about.** Two-column card with Manifest (module, version, visibility, category, upstream URL as clickable link) and Timeline (submitted, build started, build completed, duration, decided, digest on success).

3. **Stream the live build log.** Reuses `LiveBuildLog` directly — same component the admin detail page uses. Shown for any state where a log exists (building / built / failed / scan_rejected / worker_failures); omitted for pure-pending because there's nothing to stream yet.

Plus a terminal-state footer with an R2 archived-log download link when `buildLogUrl` is set.

Built row links through to `/modules/<slug>` — "View public page" once the module is live.

### Sidebar — new "My submissions" entry

Inserted in the WORKSPACE group between "My modules" and "Publish". Numbering shifted: OPERATIONS moves from 04-08 to 05-09, ACCOUNT from 09-10 to 10-11.

### Post-publish redirect

The publish wizard's `router.push("/app/modules")` after a successful submit changed to `router.push(`/app/submissions/${data.submissionId}`)` — the user now lands on their submission's live-updating detail page instead of a list that doesn't show it.

## Access control — how leakage is prevented

`getMySubmission` returns null both when the submission doesn't exist AND when it exists but belongs to another user. The detail page calls `notFound()` on null → Next.js 404. A submitter trying to guess another user's submission id sees the same 404 they'd see for a made-up id. No 403 — no existence leak.

## Reuse instead of duplication

The detail page imports `LiveBuildLog` from `@/components/sections/app-admin/LiveBuildLog`. The component doesn't care whether the caller is an admin or a submitter — it polls `/api/v1/submissions/[id]/build-log` which already enforces "submitter OR admin" access on the server side (done in the streaming session). One component, two pages.

## Deliberately NOT built

- **Cancel submission button.** A pending submission could theoretically be cancelled by the submitter (`status: "pending" → "cancelled"`). No endpoint exists today, and the audit log enum only has "approved / rejected / requested_changes / retried / cancelled" so the machinery is close but not connected. Future session if needed.
- **Resubmit button on changes_requested.** The banner tells users to resubmit from `/app/publish`. A deep-link that pre-fills the wizard with the previous manifest + reviewer feedback would be nicer. Not mechanical — requires URL state shape + wizard support for initial-values. Follow-up.
- **Per-submission timeline event list.** Today timeline is just the fixed fields (submitted, build started, built, decided). A richer event stream (pulled from SubmissionAudit rows) would show the chain of reviewer actions. Not hard, but not needed for the baseline "where is my submission?" question.
- **Email deep-links.** Decision emails today link to `/app/modules` or the rejection reason inline. Updating them to link to `/app/submissions/[id]` is a 2-line fix in `lib/email/submission-emails.ts` — not included to keep this session tight, but worth a follow-up since it's the most natural inbound path.

## User workflow now fully closes

Before: publish wizard → (vanishes into the void) → email arrives 5 days later.

After:
1. Publish wizard submits →
2. Lands on `/app/submissions/[id]` with "Awaiting reviewer" banner and a pointer to email notification timing →
3. Admin approves → user's page auto-updates (they can refresh; no push) to "Approved — queued" →
4. Worker picks up → **live log streams** →
5. Terminal: banner swaps to "Built and live" with a link to the public module page, OR to rejected with the reason shown inline →
6. User can revisit `/app/submissions` anytime to see history.

Every step has a visible UI surface. Nothing disappears into the void.

## What about reviews / ratings?

Not built, not recommended as an add. The trust signal here is cryptographic (signatures, SBOMs, CVE scans, republish receipts) — adding social stars would muddle the pitch. If a future pivot calls for community/social signals, that's a dedicated session with its own schema (`ModuleReview` table), moderation story, and UI design. Don't bundle it with "track my submission."

## Track A + bug fix + submitter flow state

- ✅ Track A complete (all 6 feature items)
- ✅ Bug fix pass complete (critical + high + 5 of 7 mediums fixed)
- ✅ Submitter flow complete — this session

The user-experience loop for "containerize my stuff and check it into the marketplace" is now fully closed from a code/UX standpoint. Week 1 operational verification (red-team, 5 non-maintainer submissions, unattended weekend, Stripe prod, Plausible prod) remains the external-dependency blocker.
