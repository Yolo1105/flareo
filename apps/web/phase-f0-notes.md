# Phase F0 — preview-analytics scaffolding

This phase ships the instrumentation that produces the data the F1 (per-user previews) decision needs. **No new product features.** The work is purely measurement; the next 30 days are spent waiting for the result.

## Why this phase exists

horizon-2-plan.md, Bet 2, set an explicit kill criterion for per-user Firecracker previews: `<5%` of shared-preview visitors doing anything beyond click-around → defer. Building per-user previews against feeling, not evidence, would be a 6-8 week mistake. We don't have engagement data because the shared previews shipped without any.

F0 fixes that. Then the 30-day clock runs.

## What ships

### In `deploy/preview/`

The Hetzner-box Caddyfile gets an `(inject_analytics)` snippet that uses the `replace-response` plugin to inject a tiny script tag before `</head>` on HTML responses. The script POSTs a pageview to Plausible's events API tagged with the module slug. The xcaddy build script picks up the plugin.

The Plausible site identifier is `preview.flareo.dev`, separate from the main `flareo.dev` site, so preview-side traffic and main-site traffic live in their own dashboards.

### In `apps/web/`

Three additions:

1. **`PreviewConversion` event added to `lib/analytics/plausible.ts`** — typed Plausible event with `sourceModule` (slug) + `target` (signup / verify / docs_install / pricing / marketplace / module_detail) props. Already-typed wrapper means typo'd event names get caught at typecheck.

2. **`PreviewLinkClicked` event added to `lib/analytics/plausible.ts`** — fired on the forward trip when a visitor clicks the preview link on a module detail page. Pairs with `PreviewConversion` (return trip) to compute click-through rates.

3. **`<PreviewConversionDetector>` client component** at `components/analytics/PreviewConversionDetector.tsx`. Drops on conversion-relevant pages. Reads `document.referrer` on mount; if it matches `s-<slug>-demo.preview.flareo.dev`, fires `PreviewConversion` with the slug as `sourceModule` and the page's role as `target`. Renders nothing.

   Currently dropped on:
   - `/signup` (`target="signup"`)
   - `/verify` (`target="verify"`)
   - `/pricing` (`target="pricing"`)
   - `/marketplace` (`target="marketplace"`)
   - `/docs/install` (`target="docs_install"`)

4. **The `Preview this module` button** on the module detail page (`ModuleHero.tsx`) gets Plausible className-tagged event tokens (the existing pattern referenced in `lib/analytics/plausible.ts`) so a click fires `PreviewLinkClicked` with `moduleSlug` and `signedIn` props. The `userSignedIn` boolean is plumbed from the page component.

## How the data combines

| Funnel step | Where measured | Plausible event |
|---|---|---|
| Visitor lands on `/modules/<slug>` | main site, automatic | `pageview` (default) |
| Visitor clicks "Preview this module" | main site | `PreviewLinkClicked` (`moduleSlug`, `signedIn`) |
| Visitor lands on the preview subdomain | preview site | `pageview` (`module=<slug>`) |
| Visitor leaves preview, lands on a conversion-relevant main-site page | main site | `PreviewConversion` (`sourceModule`, `target`) |

Conversion rate = (count of `PreviewConversion` events) / (unique visitors on `preview.flareo.dev`)

## The decision gate at day 30

Mark the date the analytics-wired Caddy reloads on production. Day 30 from that date, pull the numbers and read them against the kill criteria from HORIZON_2_PLAN:

| Conversion rate | Decision | Next session |
|---|---|---|
| `< 5%` | Original kill criterion fires. Don't build per-user previews. | Reallocate the 6-8 weeks to docs / conversion / revenue work. |
| `5-15%` | Weak signal. Build something cheaper than per-user. | F1-alt: pick CLI `flareo run --ephemeral`, per-session shared reset, or recorded walkthroughs. |
| `> 15%` | Real demand. Build per-user previews. | F1: scaffold the user-facing surface against a stub allocator. |

These criteria are pre-committed. Don't argue with them at day 30.

## What this phase does NOT do

- **No per-user preview infrastructure.** The Hetzner box still runs shared previews; the only change is that we measure them now.
- **No new admin dashboard for preview analytics.** Read the data on plausible.io directly. Building a dashboard before there's data to read would be premature.
- **No client-side preview launcher UI.** That's F1, conditional on the data.
- **No Firecracker, no Fly.io substrate.** Phase F2a/b, conditional on F1 surviving.

## Files added

- `apps/web/components/analytics/PreviewConversionDetector.tsx` — new
- `apps/web/phase-f0-notes.md` — this file
- `deploy/preview/` — README's "Phase F0 analytics" section is new

## Files modified

- `apps/web/lib/analytics/plausible.ts` — added `PreviewConversion` and `PreviewLinkClicked` to the typed event union and prop map
- `apps/web/components/sections/module-detail/ModuleHero.tsx` — added `userSignedIn` prop; tagged the preview Button with `plausible-event-*` className tokens
- `apps/web/app/(marketing)/modules/[slug]/page.tsx` — passes `userSignedIn` to ModuleHero
- `apps/web/app/(marketing)/signup/page.tsx` — drops `<PreviewConversionDetector target="signup" />`
- `apps/web/app/(marketing)/verify/page.tsx` — drops detector for `target="verify"`
- `apps/web/app/(marketing)/pricing/page.tsx` — drops detector for `target="pricing"`
- `apps/web/app/(marketing)/marketplace/page.tsx` — drops detector for `target="marketplace"`
- `apps/web/app/docs/install/page.tsx` — drops detector for `target="docs_install"`
- `deploy/preview/caddy/Caddyfile` — added `(inject_analytics)` snippet + `import inject_analytics` to each preview block
- `deploy/preview/caddy/build-caddy.sh` — added `replace-response` plugin to xcaddy

## What's required before this works in production

The wiring is in code. Production needs:

1. **Plausible account configured.** Create a `preview.flareo.dev` site in Plausible. Add `PreviewConversion` and `PreviewLinkClicked` as goals on the existing `flareo.dev` site (Plausible needs goals registered to surface them prominently in the dashboard, but it accepts the events regardless).
2. **Caddy rebuilt and redeployed** on the Hetzner box. `bash build-caddy.sh && sudo install -m 0755 ./caddy /usr/local/bin/caddy && sudo systemctl restart caddy`. ~3 minutes total.
3. **Smoke test.** Hit a preview URL; check DevTools Network for the `plausible.io/api/event` POST; confirm Plausible's `preview.flareo.dev` dashboard shows the pageview within a minute.
4. **The 30-day clock starts.** Note the date in this file or in your project journal.

If you want me to do something while the clock runs (it's 30 calendar days; sessions can resume any time):

- Sessions on operational hardening, refactor, doc polish, type-safety cleanup — fine, none of these affect the F0 measurement.
- A new session on F1 scaffolding (per-user preview UI against a stub allocator) — possible but premature. Wait for the data unless you've decided to make the bet without evidence.
- Sessions on flareo-cli, flareo-admission — fine, those are separate repos.

## End of phase

This phase is "shipped" when production has the analytics-wired Caddy live. The decision at day 30 closes it. Either:

- F0 → F1 (conditional on >15% rate)
- F0 → F1-alt (conditional on 5-15% rate)
- F0 → done (conditional on <5% rate)

Three branches, all pre-committed, no relitigation at day 30.
