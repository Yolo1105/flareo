# Module reports inbox — Track A marketplace feature #4

Last of four marketplace features. Per-module "report a problem" inbox routing user-filed reports to an admin triage queue. Reports cover module-level issues (broken, malicious, wrong metadata, legal concern) rather than abusive reviews (that's #1).

## What shipped

### Schema

`ModuleReport` model with:
- `moduleSlug` (FK → Module, cascade delete)
- `reporterId` (FK → User, cascade delete)
- `category` — convention-enum `"broken" | "malicious" | "metadata" | "legal" | "other"`
- `body` — 20-4000 chars at API
- `state` — convention-enum `"open" | "investigating" | "resolved" | "dismissed"` (default `"open"`)
- `resolutionNote` — admin-only internal note
- `triagedById` (FK → User, **ON DELETE SET NULL** — admin deletion doesn't nuke report history)
- `triagedAt`, `createdAt`, `updatedAt`

Three indexes:
- `(state, createdAt)` — admin queue: open first, newest
- `(moduleSlug, createdAt)` — per-module history (future publisher dashboard)
- `(reporterId, createdAt)` — per-reporter, used for API rate-limit lookup

Back-relations: `User.filedReports` and `User.triagedReports` (two named relations since User appears twice on the table), `Module.reports`.

Migration `20260424170000_add_module_report`. No unique constraint on (slug, reporter) by design — a user can have multiple historical reports on a module. Rate limiting lives at the API.

### Query helpers (`lib/db/reports.ts`)

- `REPORT_CATEGORIES` + `REPORT_STATES` + `REPORT_CATEGORY_LABELS` — source of truth for allowed values, exported for use in Zod schemas and UI dropdowns
- `createReport(input)` → discriminated union with three rejection reasons:
  - `module_not_found`
  - `duplicate_open` — an open/investigating report from this user on this module already exists
  - `rate_limited` — 7-day cooldown per (user, module) across any state, with `retryAfterHours`
- `listReportsForAdmin({ includeClosed, limit })` — admin queue; defaults to open+investigating only
- `triageReport({ reportId, newState, resolutionNote, adminId })` — rejects transitions from terminal states (resolved/dismissed). Stamps triagedById + triagedAt on first transition out of "open".
- `getReportsByReporter(userId)` — user's own reports; no UI this round but exported for future "my reports" page
- `countOpenReports()` — for future sidebar badge (not wired this session — the existing sidebar doesn't have dynamic badges)

### APIs

- `POST /api/v1/modules/[slug]/report` — authenticated users only, rate-limited on auth-signin bucket, Zod-validated body. 201 on create, 404/409/429 on the three rejection reasons.
- `POST /api/v1/admin/reports/[id]/triage` — admin-only, transitions report state with optional resolution note. 409 `terminal` when trying to move a resolved/dismissed report.

### Public UI

`components/sections/module-detail/ReportProblemPanel.tsx` renders at the bottom of every module detail page. Collapsed by default — just a "Report a problem →" link in a strip. Clicking expands to a form with:
- Category dropdown (with human-readable labels)
- Body textarea with category-specific placeholder text (e.g. "broken" gets "What happens? What did you expect?")
- Live char counter with min-20 warning
- Footer disclaimer: "Reports go to a human admin. They are NOT sent to the publisher directly."

Anonymous viewers see the link but get a sign-in prompt with callbackUrl preserved. Post-submit shows a success banner with an honest caveat that email notifications aren't wired for this surface yet.

### Admin UI

`/app/admin/reports` — four-section page:
1. **Open** (warn tone) — reports awaiting first triage
2. **Investigating** (accent tone) — admin acknowledged, in-progress
3. **Resolved** (good tone, only with `?history=1`) — with resolution note visible
4. **Dismissed** (muted, only with `?history=1`)

Default view hides resolved/dismissed; query param `?history=1` includes them. Keeps the inbox focused on actionable items.

Each report card shows:
- Module slug (linked to public detail)
- Reporter name + `@handle` (linked to profile if username available)
- Category label
- Report body in a quote-block
- Resolution note if present, with admin attribution + date
- Triage action strip for non-terminal states

`ReportTriageActions` client component handles the state transitions:
- "Start investigating" (open only) — single-click, no note
- "Resolve…" — opens inline textarea for the resolution note
- "Dismiss…" — opens inline textarea for the dismissal reason

Both resolve/dismiss confirm via a secondary button.

Sidebar entry "11 · Module reports" added to OPERATIONS. Analytics shifted from 11 to 12; Account numbering shifted from 12/13 to 13/14.

## Intentional design choices

- **Admin-only routing, not publisher-direct.** Publishers don't have an inbound-reports view because the publisher dashboard is a separate sub-project. Admin acts as the human filter and can manually notify publishers when needed.
- **7-day cooldown, not strict 1-per-month.** 7 days balances "allow the same user to file a new report when a prior issue recurs" against "prevent weaponized spam."
- **Duplicate-open rejection (409).** Two open reports from the same user on the same module would be noise. One open report carries the full weight.
- **Terminal states are terminal.** Once resolved or dismissed, no resurrection. Admin files a fresh report if the issue recurs. Keeps the state machine linear and the audit trail queryable.
- **Self-report is ALLOWED.** Publishers often discover their own modules broke (upstream change, CVE landed) before anyone else does. Self-reports from a publisher are treated identically to external reports.
- **No email notifications.** Both to admin (on new report) and to reporter (on triage). The UI hints that email will come later but doesn't promise it. Adding reliably-delivered admin notifications is a separate operational concern.

## What this does NOT do

- **No email flow.** Mentioned above. Would use the existing `lib/email` pipeline.
- **No publisher-facing reports view.** Requires a publisher dashboard, which is its own project.
- **No dynamic sidebar badge for open report count.** `countOpenReports` is exported but the current `Sidebar` uses static `badge: "4"` values — wiring dynamic counts per-admin is a sub-session.
- **No bulk actions.** Admin triages one at a time. Bulk "mark all resolved" etc. not built.
- **No report attachments.** No file uploads, no screenshot attachments. Plain text only. Screenshots are a moderation-safety surface (could contain PII, CSAM) that needs its own scanning pipeline.
- **No automated severity scoring.** Admin judges each report on its merits.
- **No user-facing "my reports" page.** `getReportsByReporter` is exported for future use but no page wires it.
- **No cross-referencing with review flags.** A pattern of "user X flags many reviews AND files many dismissed reports" would be a useful abuse signal. Not built.

## How to verify

1. Apply migration. ModuleReport table exists.
2. Sign in as a non-admin user. Navigate to any module's public detail page. Scroll to the footer — "Report a problem →" link.
3. Click, fill category + body (>20 chars), submit. 201. Success banner appears.
4. Try to submit a second report on the same module from the same user. 409 "duplicate_open" — banner shows the error.
5. Sign in as admin, navigate to `/app/admin/reports`. Open section shows one report card with the details and triage buttons.
6. Click "Start investigating" → card moves to Investigating section.
7. Click "Resolve…" → textarea appears. Enter note, confirm. Card moves to Resolved (visible only with `?history=1`).
8. As the original reporter, attempt to file another report on the same module. Still rejected — now as `rate_limited` with the retryAfterHours field populated, since the 7-day cooldown applies to ANY recent report regardless of state.
9. As admin, try to triage the already-resolved report to `investigating`. 409 `terminal`.

## Track A marketplace — COMPLETE

- ✅ #1 User reviews + ratings
- ✅ #2 Publisher profile pages
- ✅ #3 Featured / Trending curation
- ✅ **#4 Per-module reports inbox — this session**

All four marketplace features built. Next: Track B polish items (cancel submission, resubmit deep-link, email deep-links, BuildLogLine cron, ANSI color in live log, SLA badge, README/DEMO_WALKTHROUGH). Those are actually in the docs/planning and remain the sensible things to finish before calling the project done.
