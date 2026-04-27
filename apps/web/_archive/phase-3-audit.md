# Phase 3 — accessibility + performance audit

A read-through audit of the codebase against WCAG AA contrast, semantic HTML, focus management, and query / bundle hygiene. Documents what was found, what was fixed in this session, and what's deferred with rationale.

## Real findings — fixed this session

### Contrast: `ink-ghost` and `ink-faint` failed WCAG AA at any size

Both color tokens are used heavily for tiny mono labels (9.5–13px), well below the WCAG "large text" threshold (24px regular / 18px bold) where the relaxed 3.0 contrast applies. The original values:

| token        | hex      | contrast on canvas | WCAG AA |
|--------------|----------|---:|---|
| `ink-ghost`  | `#544A43` | 2.09 | **fail at any size** |
| `ink-faint`  | `#7A7268` | 3.79 | fail for normal text |

`ink-ghost` is used in 95 files; `ink-faint` in dozens more. Every one of those mono labels was unreadable for users with even mild low vision.

**Fixed in `app/globals.css`:**
- `ink-ghost`: `#544A43` → `#90806C` (4.70 on canvas; passes AA)
- `ink-faint`: `#7A7268` → `#A89682` (6.29 on canvas; passes AA comfortably)

Warm undertone preserved — both new values move along the brown-grey curve rather than shifting hue. Visual distinction maintained: the new ramp ink-faint (6.29) → ink-softer (5.91) → ink-ghost (4.70) keeps three usable muted tiers.

The fix is at the design-token layer, so it propagates everywhere ink-ghost / ink-faint were used without touching individual components.

### N+1 query on `/app/admin/vex`

The VEX admin index was running one `listForModule(slug)` query per module, in parallel via `Promise.all`. With 12 modules at launch this is ~12 round-trips on every page load. At any catalog growth this becomes a hot path.

**Fixed:**
- New `countsBySlug()` helper in `lib/db/vex.ts` using a single `prisma.vexStatement.groupBy({ by: ["moduleSlug"] })` call
- `/app/admin/vex/page.tsx` rewritten to call `countsBySlug()` once instead of fanning out

12 round-trips → 1. Scales to any module count without changing this page's load time.

### Modal overlays missing `role="dialog"` and `aria-modal`

Three modal overlays — `CommandPalette`, `NotificationDrawer`, `ShortcutOverlay` — rendered as plain `<div>` / `<aside>` without the modal semantics screen readers need to announce them as such. Users on screen readers couldn't tell when a modal opened.

**Fixed:**
- All three overlays: added `role="dialog"`, `aria-modal="true"`, and a descriptive `aria-label`
- Escape key handling already existed in `AppShellProvider.tsx` — that's good
- Backdrop buttons already had `aria-label="Close..."` — that's good

What's NOT fixed (deferred): focus trapping. A correct modal traps Tab inside the dialog and restores focus to the opener on close. None of these overlays do that, and a correct implementation needs ~50 lines per modal or a focus-trap dependency. The `inputRef.current?.focus()` in `CommandPalette` puts initial focus inside the modal but doesn't trap. That gap is documented as a follow-up.

## Findings — verified and deferred with reason

### `<img>` instead of Next `<Image>` for user avatars

Three files use `<img>` for OAuth-provider user avatars (Sidebar, profile page, admin submission detail). Each has the `// eslint-disable-next-line @next/next/no-img-element` suppression.

**Why deferred:** Switching to Next `<Image>` requires configuring `images.remotePatterns` in `next.config.js` for every OAuth provider that might serve avatar images (GitHub, Google, GitLab in the future). Without that config, `<Image>` errors at runtime. The current `<img>` approach is safe — just unoptimized. ~30KB-100KB of avatar bandwidth across page loads is acceptable; this isn't a critical perf issue.

The `alt=""` on these images is correct WCAG: the visible username sits next to the avatar in every case, making the avatar decorative per the spec.

### 88 `<button>` elements without `type="button"`

A common React/HTML antipattern: in a `<form>` context, an unattributed `<button>` defaults to `type="submit"` and submits the form on click.

**Verified safe:** Only 2 files actually contain `<form>` elements (`SignupForm`, `ApiKeysManager`), and in both, the buttons inside have explicit `type="submit"` or `type="button"` correctly. The other 86 buttons sit outside any form context — the default is a no-op there.

Documented but not changed. A future cleanup could add `type="button"` everywhere as a defensive default; not worth the diff churn now.

### Two large components: `VerifyTool` (534 lines), `PublishWizard` (528 lines)

Both are above the 500-line threshold where component splitting becomes a maintenance question. Both are also tightly cohesive — the verify tool's three-stage rendering (cosign / trivy / slsa) is one logical screen, and the publish wizard's six-step flow has shared state that doesn't decompose cleanly.

**Documented, not refactored.** The proposal flagged neither as performance problems. Splitting just for line-count would create artificial seams.

### `<details>` not used for collapsibles

The `ReceiptsDrawer` is a click-to-expand mechanism using `useState` instead of native `<details>`. The native element is keyboard-accessible by default and announces itself correctly to screen readers.

**Why I kept the manual implementation:** the drawer is a card-internal toggle that needs to stop click propagation to the parent `<Link>`. Native `<details>` makes that interaction harder to control. The component does set `aria-expanded` on the toggle button, so screen readers get the expanded/collapsed state.

## Performance — green findings

These passed the audit cleanly. No changes needed:

- **Server components everywhere on marketing pages.** Only `error.tsx` is client-component. All marketplace, pipeline, FAQ, roadmap, etc. are server-rendered.
- **Promise.all on parallel reads.** Marketplace page does 4 parallel DB queries via `Promise.all`. Module detail does 2. API routes consistently use parallel reads.
- **No accidental client-component imports.** None of the heavy interactive components are imported into server pages without isolation.
- **Database operations have indexes for the common queries.** Spot-checked `ModuleReview`, `ModuleReport`, `Module.publisherId`, `Build.startedAt` — all have appropriate indexes for the read paths.
- **Static assets are minimal.** No video, no large images. The only `<img>` instances are user avatars served from external OAuth providers.

## Files modified

- `app/globals.css` — bumped `ink-faint` and `ink-ghost` color tokens to AA-passing values
- `lib/db/vex.ts` — added `countsBySlug()` helper for groupBy aggregation
- `app/app/admin/vex/page.tsx` — replaced N+1 with single groupBy query
- `components/overlays/CommandPalette.tsx` — added `role="dialog"`, `aria-modal`, `aria-label`
- `components/overlays/NotificationDrawer.tsx` — same
- `components/overlays/ShortcutOverlay.tsx` — same

## Deferred items (with rationale, suitable for a follow-up session)

1. **Focus trap in modals.** Each of the 3 modals needs ~50 lines of focus-trap logic, OR a dependency like `focus-trap-react` (~5KB). Defensible follow-up.
2. **Next `<Image>` for avatars.** Needs `next.config.js` `images.remotePatterns` for each OAuth provider. Bigger change than it looks.
3. **Defensive `type="button"` everywhere.** ~88 single-line additions. Pure defensive hygiene; no actual bug to fix.
4. **Lighthouse run against an actual deployed instance.** Can only happen post-deploy with real network conditions; not a code-time audit.

## What's still on the original "(2)" list

Two remaining items from the engineering pick:
- **CNB auto-detect** (Q3-roadmap, Phase 2 next session)
- **OPA policy gate** (Q4-roadmap, Phase 2 session after that)

Per your stated order — `b then c then d` (audit → CNB → OPA) — phase 3 is now complete.
