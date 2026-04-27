# Session 1 — login placeholder + /marketplace

Built the demand-side marketplace as a distinct page from /catalog, plus a demo-mode login bypass so the authenticated surface is testable without OAuth setup. This is Session 1 of 2 (Session 2 = /pipeline page; the marketplace's "See the pipeline live" CTA links to /pipeline and will 404 until that ships).

## What's new

### Login placeholder

`POST /api/demo-signin?as=admin|publisher|submitter|reviewer` upserts the requested seeded demo user, creates a NextAuth session row directly in Prisma, sets the session cookie, and redirects.

**Two layers of production protection:**

1. **`NODE_ENV === "production"` returns 410** — even if `DEMO_MODE=1` accidentally leaks into a prod deploy, the route hard-refuses.
2. **`DEMO_MODE !== "1"` returns 404** — the route effectively doesn't exist when not opted-in. 404 not 403 so a probe can't tell whether it's gated-and-rejecting or absent.

Login page (`/login`) renders a "DEMO MODE — DEV ONLY" panel listing 4 sign-in shortcuts only when `DEMO_MODE=1` is set. Each maps to a seeded user from `prisma/seed.ts` so the dashboard, admin queue, and submission history are all populated post-sign-in.

To use: set `DEMO_MODE=1` in `.env.local`, run `SEED=1 npx prisma db seed`, navigate to `/login`, click any demo role. You'll land at `/app/admin` (admin) or `/app` (others).

### `/marketplace` distinct page

Distinct discovery surface from `/catalog`. Where catalog is a dense filterable grid for browsing every module, marketplace is the curated, full-bleed presentation:

| Section | Source | Notes |
|---|---|---|
| `PageHero` | static | "Verified containers, ready to try" pitch |
| `MarketplaceHeroStrip` | DB counts | 4 honest stat tiles: modules / featured / trending / reviews |
| `MarketplaceSpotlight` | `featured[0]` or highest-trust fallback | Full-bleed hero module with TrustScore, deploy snippet, editor's note, "Try in 15s sandbox" |
| `MarketplaceCategoryRow` × N | featured (extra), trending, then by category | 3-column rich card rows with inline aggregate ratings |
| `MarketplaceReviewBoard` | recent reviews | 6-card review board, each links to `/modules/<slug>#reviews` |
| `MarketplacePublishCTA` | static | Orange supply-side CTA at bottom — "See the pipeline live →" + "Submit a module" |

Every section is conditional: empty-DB → section omits itself rather than showing a placeholder. So a fresh checkout shows the hero + publish CTA cleanly even before seeding.

### Trust Score component

The proposal's "single number that consolidates provenance + SBOM + zero critical CVEs + VEX + signature + policy pass + minimal base." Color-graded ≥90 good / ≥70 warn / <70 bad. Used on spotlight (large) and on every card (medium).

### Nav reorder

`Pipeline → Marketplace → Catalog → Verify → Docs → Pricing` (was: Pipeline → Catalog → Verify → Docs → Pricing). Marketplace becomes the primary discovery destination; Catalog is the dense alternative for power users who want filters.

Module detail pages (`/modules/<slug>`) stay highlighted as Marketplace in the nav since that's the most likely arrival path now.

## Files created

- `app/api/demo-signin/route.ts` — env-gated demo sign-in endpoint
- `app/(marketing)/marketplace/page.tsx` — server-rendered marketplace
- `components/sections/marketplace/MarketplaceHeroStrip.tsx`
- `components/sections/marketplace/MarketplaceSpotlight.tsx`
- `components/sections/marketplace/MarketplaceCategoryRow.tsx`
- `components/sections/marketplace/MarketplaceReviewBoard.tsx`
- `components/sections/marketplace/MarketplacePublishCTA.tsx`
- `components/sections/marketplace/TrustScore.tsx`
- `components/sections/marketplace/Stars.tsx`

## Files modified

- `app/(marketing)/login/page.tsx` — added `DemoSignInPanel`
- `lib/data/nav.ts` — added Marketplace nav item, renumbered, updated `getActiveNav`

## Known temporary state

- **`/pipeline` link 404s** — that's Session 2. The "See the pipeline live →" CTA on the marketplace publish band points there.

## Try it

```bash
# in apps/web/.env.local
DEMO_MODE=1
DATABASE_URL=postgresql://...
AUTH_SECRET=...

# then
SEED=1 npx prisma db seed
npm run dev
```

Visit:
1. `/marketplace` — see the new distinct discovery page
2. `/login` — see the DEMO MODE panel
3. Click "Admin Reviewer" → land at `/app/admin` with the seeded queue populated
4. Click "Publisher (mai-ops)" → land at `/app` with 3 published modules visible

## Session 2 preview

Next session will build:
- `/pipeline` page (after login) showing the proposal's full 8-stage pipeline with each stage's actual artifact rendered (real SBOM JSON snippet, real provenance attestation, real cosign signature line, real policy decision)
- Built stages render real artifacts; unbuilt stages (VEX, policy gate, CNB auto-detect) clearly labeled "specification only — see roadmap"
- This closes the proposal's "preview has to be a real experience, not a claim" loop
