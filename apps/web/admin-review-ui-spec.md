# Admin review UI — spec

The reviewer's side of the submission → build → publish loop. The user-facing submission flow is covered in `build-worker-spec.md` and `/docs/submitting-dockerfiles`. This doc is specifically about the reviewer's experience.

Written for Week 11 of Q1. The build worker goes in at Weeks 11-13, but the admin UI is what makes it usable — without it the reviewer has to hand-run SQL to approve submissions, which doesn't scale past ten.

## What the reviewer sees

Three screens, in order of how often they're used:

1. **Queue** (`/app/admin`) — list of pending submissions, one row per submission
2. **Detail** (`/app/admin/submissions/<id>`) — full Dockerfile review, approve / reject buttons
3. **Post-decision** (same URL, different state) — tracks build status after approval

Each covered below.

## Screen 1: the queue

One page, one table. The reviewer should open this page 2-3 times a day and know within 60 seconds whether anything needs their attention.

### Columns

| Column        | Content                                                                 |
|---------------|-------------------------------------------------------------------------|
| ID            | `FL-SUB-0234` — short, copy-pasteable                                    |
| Submitter     | Display name + email from the User table                                |
| Slug          | Proposed module slug, e.g. `my-app`                                     |
| Submitted     | Relative time: "14m ago", "2 days ago"                                  |
| Status        | One of: pending, approved, building, built, rejected, failed, scan_rejected |
| Priority      | `PRO` badge if submitter is on paid tier; otherwise blank                |
| Waiting since | For pending: hours since submission; for building: hours since approved |

Sortable by **waiting since** descending by default — oldest waiting first. This surfaces SLA violations before they become complaints.

### Top-of-page stats strip

Four numbers, at a glance:

- **Pending count** — how many submissions need review
- **Oldest pending** — longest wait time in the queue. If this is >24h for a pro submission or >5 days for free, it's red.
- **Built today** — completed successfully in the last 24h
- **Failed today** — failures in the last 24h

If "failed today" is non-zero, the reviewer clicks it to see the failure list. Most failed builds are user errors (bad Dockerfile) that resolve themselves when the user resubmits. Some are system errors that need me to look at the worker logs.

### Filters

Three filter chips above the table:

- **Status** — default "pending"; other values toggle rows in/out
- **Tier** — "all" / "free" / "pro" — useful when pro-tier queue is backed up and we want to focus there
- **Age** — "all" / ">24h" / ">72h" — highlights SLA-risk items

Filters are query-string-persisted so the reviewer can bookmark "show me everything waiting more than 24 hours on pro tier."

### What I deliberately left out

- No infinite scroll. Pagination at 50 per page. Queue volume is expected to be <30 pending at any given time; if we're consistently over 50 we have a bigger problem than UI pagination.
- No bulk actions ("approve all"). Approving submissions without reading their Dockerfiles defeats the purpose. One at a time is a feature, not a limitation.
- No real-time auto-refresh via websockets. Manual refresh. A reviewer checking the queue 2-3x a day doesn't need live updates and websockets are a maintenance cost.

## Screen 2: the detail view

This is where the real work happens. When a reviewer clicks a row, they should be able to make an approve/reject decision in under 5 minutes for a typical submission, under 15 for a complex one.

### Layout

Three-column split, fixed widths:

```
┌────────────────┬──────────────────────────┬──────────────────┐
│ Submitter info │   Dockerfile             │  Decision panel  │
│ 280px          │   fluid                  │  320px           │
│                │                          │                  │
│ - name, email  │   Syntax-highlighted     │  Approve button  │
│ - joined date  │   Rendered with          │  Reject button   │
│ - submissions  │   hadolint warnings      │  Notes field     │
│   history      │   inline                 │  Checklist       │
│ - tier         │                          │  Similar submissions │
│                │                          │                  │
└────────────────┴──────────────────────────┴──────────────────┘
```

### Left column: submitter context

What the reviewer needs to know about who's submitting:

- **Display name and email**
- **GitHub username** (clickable, opens their GitHub profile in a new tab — the reviewer should be able to check their history in 30 seconds)
- **Account age** — "joined 14 days ago" vs. "joined 2 years ago" is a trust signal
- **Previous submissions** — list of their prior submissions with approve/reject status and link. Pattern recognition: if someone has 5 approved and 1 rejected, their new submission deserves a more generous read. If they have 3 rejected and this is their 4th, read more carefully.
- **Tier** — free / pro / enterprise. Affects SLA, not decision quality.
- **Contact email** — clickable mailto, for quick clarifying questions before decision

### Middle column: the Dockerfile

The thing being reviewed. Rendered as:

- **Syntax highlighting** — Dockerfile-specific, not generic. Keywords (`FROM`, `RUN`, `COPY`, etc.) highlighted, string values in a different color, comments grayed.
- **Line numbers** — so the reviewer can reference "line 14 has the problem" in a rejection note.
- **Hadolint warnings inline** — non-blocking but shown. Warnings like "consider pinning FROM to a digest" display as a subtle margin annotation, not a blocker. Reviewer decides whether warnings justify rejection.
- **Syntax errors as errors** — if the Dockerfile doesn't parse, show a red block at the top saying "this won't build." Still allow approve in case the reviewer wants to override, but with strong warning.

Above the Dockerfile, a metadata bar with:

- **Proposed slug, name, version, category**
- **Upstream URL** (the `upstreamUrl` field from submission) — clickable
- **`requiresNetwork`** flag — highlighted if true. This is the "reviewer, pay attention" signal.
- **License** as declared
- **Description** as declared

If `requiresNetwork` is true, the metadata bar has an extra row: "Submitter has requested network access during build. Whitelist applies (npm, pypi, debian mirrors). Review carefully."

### Right column: decision panel

Two primary buttons:

- **Approve and queue build** — large, primary color. On click: modal confirmation ("This will trigger an automated build. Continue?"), then flips status to `approved` and the worker picks it up within 30s.
- **Reject** — large, secondary color. Opens a required text box for the rejection reason, then sends email to submitter with the reason and marks `status=rejected`.

Below the primary buttons, a secondary option:

- **Request changes (not rejection)** — for cases where the Dockerfile is 90% there but needs one tweak. Sends email with the specific change needed, doesn't reject — keeps the submission in pending state. Submitter edits and the same row gets re-reviewed.

Above the buttons, the reviewer's checklist:

```
REVIEW CHECKLIST
[ ] Dockerfile parses cleanly (hadolint)
[ ] Base image is on the approved list (or network-opt-in is set)
[ ] No RUN commands attempt network calls
[ ] Dependencies are vendored in context
[ ] Final image uses non-root USER (soft check)
[ ] ENTRYPOINT/CMD is present and sensible
[ ] Upstream URL resolves to a real repo
[ ] Slug doesn't collide with existing module
[ ] Submitter isn't on the abuse list
```

Checkboxes are local-only (not saved server-side). The reviewer can walk through them; the UI doesn't enforce all must be checked before approving. The value is in the reminder, not the gating.

Below the buttons, a **notes field** that is saved with the decision:

- For approvals: internal note, not emailed. "Approved despite warning on line 8 because user explained on GitHub that base image X is intentional."
- For rejections: **this becomes the email body.** The reviewer is writing directly to the submitter. UI should make that explicit with a preview.

Below notes, a helper section: **similar submissions** — if any recent submission used the same `upstreamUrl`, or a similar slug, or the same base image, show links to those. Detects "same person, multiple accounts" patterns and "we rejected this exact Dockerfile last week."

### What I deliberately left out

- **No edit-Dockerfile-and-approve.** The reviewer doesn't get to modify the submitter's Dockerfile. If it needs changes, the submitter makes them. Keeping this line clean avoids blame-assignment problems ("you changed my Dockerfile and now it's broken").
- **No version-by-version diff.** If the same user resubmits after a rejection, their new submission is a new row. No "what changed from v1." Too much complexity for too little benefit; the reviewer can scan the new Dockerfile in 60 seconds anyway.
- **No collaborative review.** One reviewer per submission. No "assign to Bob, Bob comments, then Alice approves" workflow. Overkill for a team of one; probably still overkill at team of five.
- **No approval SLAs enforced by UI.** We display how long a submission has been waiting; we don't block the reviewer from looking at newer ones first. Solo reviewer, trust them to prioritize.

## Screen 3: post-decision state

Same URL as the detail view, but the decision panel changes based on status.

### If status = approved

- Decision panel replaced with: "Approved 14m ago by dani-garcia. Waiting for build worker to pick up."
- If worker has started: "Building since 8m ago. Estimated 4 more minutes."
- Live tail of build log available via a collapsible section (polls `/api/v1/worker/build-log/<submission-id>` every 3 seconds while building)
- No action buttons; you can't un-approve once the worker has started.

### If status = building

Same as approved, but with a progress indicator:

- Current stage (e.g. "Stage 2/3: trivy scan")
- Build time elapsed vs. expected
- Link to "Cancel build" — only available if elapsed < 60s, to catch obvious mistakes. Otherwise the build runs to completion.

### If status = built

Success state:

- "Successfully built 3m ago. Module published as `apps/web/my-app@sha256:abc123...`"
- Link to view the module in the catalog
- Link to the SBOM in R2
- Link to the Rekor transparency log entry
- Link to the full build log (one-click copy for debugging, also accessible to the submitter via email)

### If status = failed or scan_rejected

Failure state:

- Error category (user / system / scan)
- Error summary (from `buildErrorMessage`)
- Full log link
- **"Retry build" button** for system errors (worker crashed, ECR push flaked)
- **No retry button** for user errors — the submitter needs to fix their Dockerfile and resubmit

## Email templates

Every reviewer decision triggers an email to the submitter. These are as important as the UI itself; most submitters only interact with us via these emails.

### Template 1: approval confirmation

Sent when status flips to `approved`. Before the build has run.

```
Subject: Your Flareo submission has been approved

Hi {name},

Good news — your submission for `{slug}` has been approved for
building.

  Submission ID: {id}
  Slug: {slug}
  Version: {version}

Our build worker will pick this up in the next 30 seconds or so, and
you should get a second email when the build finishes (usually 2-5
minutes).

Track progress: {dashboard_url}

— The Flareo team
```

Clear, minimal, no marketing. The submitter needs two things: confirmation their thing was read, and a link to watch it complete.

### Template 2: build success

Sent when status flips to `built`. The most important email in the system.

```
Subject: Your Flareo module `{slug}` is live

Hi {name},

Your module is published and available now:

  docker pull public.ecr.aws/flareo/{slug}@{digest}

Signed with:
  Signer: {signer_identity}
  Issuer: {signer_issuer}
  Rekor log: https://search.sigstore.dev/?logIndex={rekor_index}

Verify it yourself:
  flareo verify {slug}@{digest}

Public catalog page: {catalog_url}
SBOM: {sbom_url}

— The Flareo team
```

Includes everything the submitter needs for compliance documentation, blog posts, etc. The `flareo verify` command is deliberately shown — we want the submitter's users to run this too.

### Template 3: request for changes

Sent when the reviewer uses "request changes" instead of outright rejection.

```
Subject: Changes requested on your Flareo submission

Hi {name},

Thanks for submitting `{slug}`. A couple of things before we can
approve:

  {reviewer_notes}

Once you've made those changes, reply to this email or update the
submission via the dashboard. No need to resubmit from scratch — we've
kept your submission in the queue.

Submission ID: {id}
Dashboard: {dashboard_url}

— The Flareo team
```

The `{reviewer_notes}` is free text the reviewer typed. Goes straight into the email body, no formatting. Relies on the reviewer writing a good note, but that's a human-on-human conversation, not a UI problem.

### Template 4: rejection

Sent when the reviewer uses "reject."

```
Subject: Your Flareo submission could not be approved

Hi {name},

Unfortunately we weren't able to approve your submission for `{slug}`.

Reason:

  {reviewer_notes}

Common next steps:
  - Fix the issue above and resubmit
  - Reply to this email with questions
  - Read /docs/submitting-dockerfiles for the full requirements

Submission ID: {id} — keep this if you email us.

— The Flareo team
```

The tone matters. Rejection emails are the ones submitters share when they complain. Writing them with respect costs nothing.

### Template 5: build failed

Sent when build worker reports `failed` or `scan_rejected`.

```
Subject: Your Flareo build failed

Hi {name},

Your submission for `{slug}` built unsuccessfully. Here's what went
wrong:

  {error_message}

{if scan_rejected}
The build completed but our security scan found issues:

  {cve_list}

{end}

Full log: {log_url}

Common causes:
  - Outdated base image (update to the latest patch version)
  - Dependencies with known CVEs (update them before resubmitting)
  - Network access attempted during build (see /docs/submitting-dockerfiles
    for the no-network-during-build rule)

Fix and submit again — there's no penalty. Your previous submission
stays in the queue as `failed` for reference.

Submission ID: {id}

— The Flareo team
```

Helpful, not accusatory. The "no penalty" line matters — first-time submitters often worry that a failed build counts against them.

## What the backend needs

The UI above requires the API changes listed in `build-worker-spec.md` plus a few more:

### New endpoints

- `GET /api/v1/admin/submissions` — paginated queue list with filters
- `GET /api/v1/admin/submissions/<id>` — detail view data
- `POST /api/v1/admin/submissions/<id>/approve` — flip status, trigger email
- `POST /api/v1/admin/submissions/<id>/reject` — flip status, email with reason
- `POST /api/v1/admin/submissions/<id>/request-changes` — email without flipping status
- `GET /api/v1/admin/submissions/<id>/build-log` — tail logs for ongoing builds
- `POST /api/v1/admin/submissions/<id>/retry-build` — for system-error retries
- `GET /api/v1/admin/submissions/similar?url=&slug=&baseImage=` — similar-submissions helper

All gated on `session.user.role === "admin"` — the middleware we wrote for the admin page covers this.

### New rows in the Submission table

Already covered in the build worker spec (dockerfileUrl, buildStartedAt, etc.). No further additions here.

### Audit log

Every admin action on a submission logs a row to a new table:

```prisma
model SubmissionAudit {
  id           String   @id @default(cuid())
  submissionId String
  reviewerId   String
  action       String   // "approved" | "rejected" | "requested_changes" | "retried"
  notes        String?
  createdAt    DateTime @default(now())

  submission Submission @relation(fields: [submissionId], references: [id])
  reviewer   User       @relation(fields: [reviewerId], references: [id])
}
```

Not shown in the UI (no audit view) in v1. Exists for two reasons: legal defensibility if a submitter disputes a decision, and pattern-recognition later ("this reviewer rejects 80% of submissions — are they being too strict?").

## Accessibility

A reviewer works through dozens of these a week. Small UI frictions add up. Commit to:

- **Keyboard navigation** — j/k to move between queue rows, enter to open detail. Shift-j/k to change sort. Standard Gmail-style bindings.
- **Approve/reject via keyboard** — `a` for approve (with confirmation), `r` for reject, `c` for request changes.
- **Clear focus states** — tab navigation works and the focused element is obviously focused.
- **No modal trapping** — if a confirmation dialog opens, escape dismisses it.
- **Prose column width** — the Dockerfile column doesn't exceed 100 characters per line without wrapping.

## What happens when the reviewer is overwhelmed

If I'm the only reviewer and the queue has 50 pending submissions, the UI should tell me. A banner at the top of `/app/admin`:

> Queue depth exceeds 20. Consider temporarily pausing new submissions.

One click on that banner sets a flag that causes `/api/v1/submissions` to return 503 with a "submissions paused, resuming soon" message. Ugly but honest — better than letting submitters wait 3 weeks in silence.

This isn't a feature I expect to use often. It's there for when I take a week off and the queue fills up; rather than hiring a backup reviewer, I'd pause and catch up on return.

## Ship criteria

Admin review UI is "done" (we move to polishing) when:

- I can process a submission end-to-end (queue → detail → approve → wait for build → confirm success) without touching the database directly
- Each of the 5 email templates has been sent in a real test
- The "request changes" flow has been used at least twice in testing and produced a reasonable back-and-forth
- Keyboard shortcuts work and I've tried processing 10 submissions using only the keyboard
- The queue page loads in under 500ms with 100 pending rows
- Audit log captures every action I take

If all check: ship it. If any don't: don't ship it. Each one is a real cost when this becomes the primary submission path.

## Revisit after 90 days

Once the admin UI has processed real submissions for a while, expect to revisit:

- **Missing checklist items.** I'll find patterns I didn't anticipate (e.g., "the submitter's GitHub has 0 public repos, suspicious" — should become a checklist item).
- **Template tone.** Rejection emails especially — watch for submitter replies, adjust wording based on what triggered the most productive back-and-forth.
- **Collision detection.** The "similar submissions" panel works on URL/slug/base-image. May need to add code-similarity detection if people start resubmitting renamed-but-identical Dockerfiles to evade rejection.
- **Pagination.** If queue depth stays over 50 consistently we need either a second reviewer or a more aggressive triage workflow.

None of these are day-one problems. They're the list to review at Week 20 alongside the rest of the Q1 plan.
