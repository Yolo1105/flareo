# Week 19 — Analytics

This zip ships Q1 week 19 from `q1-plan.md`. The plan's ask: "Plausible (or Simple Analytics) snippet, one custom event for module published." The "or" is resolved by picking Plausible — cookieless, GDPR-compliant, no banner needed, privacy-page copy stays honest.

This session goes slightly beyond the minimum: besides the snippet and one custom event, there are four tracked events in total, a DB-backed admin analytics dashboard, and aligned privacy-page copy.

## What changed in this build

### Plausible snippet

- `components/analytics/PlausibleScript.tsx` (new) — env-gated Next `<Script>` component. Loads `script.tagged-events.js` for `className="plausible-event-name=..."` no-JS events, plus a boot-queue shim so early `window.plausible(...)` calls don't throw.
- `app/layout.tsx` — mounts `<PlausibleScript />` inside `<body>` at root. Only renders when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set, so local dev and preview deploys produce zero network calls to plausible.io.

### Typed custom-event helper

- `lib/analytics/plausible.ts` (new) — `trackEvent(event, props)` with a closed union of event names and typed per-event prop shapes. Safe to call when Plausible isn't loaded (silent no-op). Catches rare throws so an analytics bug can't break a page.

Four events are declared today:

- **SubmissionCreated** — `{ source, uploadMode, plan }` — fired when a submission succeeds on `/api/v1/submissions` POST
- **SubmissionQuotaBlocked** — `{ plan, used }` — fired when the same endpoint returns 402, with buckets `at_limit` / `near_limit` / `above_limit`
- **UpgradeClicked** — `{ origin }` — fired when the billing CTA is clicked (before the fetch, so outages don't under-count intent)
- **VerifyToolUsed** — `{ result }` — declared; the verify page's call site is a small follow-up we can land next session

All prop shapes are kept low-cardinality. Slugs, user ids, emails never go to Plausible (Plausible's free plan caps custom-prop cardinality, and even if it didn't, shipping user identifiers to a third party contradicts the privacy-page posture).

### Instrumented call sites

- `components/sections/app-publish/PublishWizard.tsx` — fires `SubmissionQuotaBlocked` on a 402 response (parses `error.details.plan` and `error.details.usage` to bucket `used`); fires `SubmissionCreated` on a successful new submission with `source: "web"`, the selected `uploadMode`, and plan (currently hardcoded to `"free"` — when we surface plan on the session, swap the literal for `session.user.plan`).
- `components/sections/app-settings/BillingCta.tsx` — fires `UpgradeClicked` at the start of `handleClick()` before the fetch, so Stripe outages don't swallow the signal.

### Admin product-health dashboard

- `lib/db/admin-analytics.ts` (new) — `getAdminAnalytics()`, one function, one Promise.all. Returns: users total / free / paid, public-module count, private-module count, submissions-by-status map, submissions-by-day for the last 7 days, users-at-quota-cap count, DLQ count, last-built timestamp.
- `app/app/admin/analytics/page.tsx` (new) — admin-gated page at `/app/admin/analytics`. Sections: users grid, 7-day submissions bar chart (today highlighted in accent), submissions-by-status breakdown with width bars, catalog & lifecycle grid, footer pointer to Plausible for pageview data and to `/app/admin/worker` for operational health.
- `components/layout/app/Sidebar.tsx` — added "07 · Analytics" under OPERATIONS (admin-only); renumbered ACCOUNT section to 08 / 09.

This dashboard is **DB-only** — it works without Plausible being configured. Plausible covers what the DB can't (page views, entry pages, referrers). The admin analytics page explicitly says where to look for each.

### Privacy page alignment

- `app/(marketing)/privacy/page.tsx` — "short version" paragraph now mentions Plausible by name and describes it honestly (cookieless, no PII, no fingerprinting, GDPR-compliant). "What we don't collect" list updated: distinguishes cross-site trackers (still none) from Plausible (present, first-party, privacy-friendly). Also fixed the stale "we don't collect payment details during closed beta (the product is free)" line — Stripe is now wired, so the accurate version is "Stripe holds them; we hold only the subscription status and an opaque customer id".
- `app/(marketing)/legal/privacy/page.tsx` — same alignment, terser: the "no analytics cookies, no tracking pixels" bullet now says "No analytics cookies. We use Plausible, which is cookieless". "No Google Analytics ..." line adds Meta pixel for completeness.

### Environment

- `.env.example` — new section:
  ```
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
  NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL=""
  ```
  First is required-in-prod. Second is optional; defaults to the hosted `plausible.io` script URL, override only if self-hosting Plausible.

## Deliberately NOT touched

- **No migration this session.** No new DB columns.
- **No Plausible pro-tier required.** Everything fits in the free tier (10k pageviews/month).
- **No cookie banner.** Plausible doesn't set cookies; under GDPR Recital 30 / PECR, cookieless analytics don't require consent. This matches what the privacy page now claims.
- **VerifyToolUsed call site.** The event is declared but not yet fired from the verify page. Small follow-up — 4 lines in the verify result handler. Didn't land this session to keep scope tight.
- **CLI-sourced SubmissionCreated events.** The `source: "cli"` variant in the event enum is there for when the CLI starts firing events (via the website's Plausible, not a separate property). That needs CLI work and is out of scope.

## How to verify locally

```sh
cd apps/web
npm run dev
```

**Without Plausible configured (dev default):**

1. Open any page, open browser DevTools → Network tab. Filter for `plausible`. You should see **zero requests** to plausible.io. That's correct.
2. In the console, run `typeof window.plausible`. Should be `"undefined"` (or a queue function that does nothing).
3. Sign in as admin, open `/app/admin/analytics`. Should render with whatever numbers the DB holds. The Plausible pointer at the bottom is a link to the (not-yet-configured) dashboard.
4. Walk the submission flow; the `trackEvent("SubmissionCreated", ...)` call fires, the helper detects no plausible function, silently no-ops. Nothing breaks.

**With Plausible configured:**

1. Create a site at plausible.io (or self-hosted). Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN="your-domain.example"`. Restart dev server.
2. Open any page. DevTools → Network should show a request to `plausible.io/api/event` on page load.
3. Walk the publish flow to completion. Plausible's "Goals" tab should show `SubmissionCreated` fire with props.
4. Walk the publish flow past the quota cap (submit 4 as a free-tier user with 3 already in-flight). `SubmissionQuotaBlocked` fires.
5. Click the Upgrade button on `/app/settings/billing`. `UpgradeClicked` fires.

## Q1 status

This was the last planned coding session of Q1.

| Piece | Status |
|---|---|
| Phase 2.5 (Weeks 11-14) | Code complete |
| Weeks 15-16 paid tier | Code complete |
| Weeks 17-18 docs | Code complete |
| Week 19 analytics | Code complete (this session) |
| Week 20 review & replan | Non-code; on you |

Real-world items that only you can do:

- Red-team day against the build worker
- Five non-maintainer submissions end-to-end
- One unattended weekend
- Stripe account provisioned, products created, webhook endpoint live
- Plausible account provisioned, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` set in prod env
- First paying customer
- Week 20 retro — pull numbers from Plausible + DB + Stripe, write 2 pages, carve up Q2
