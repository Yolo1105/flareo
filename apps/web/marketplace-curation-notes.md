# Featured / Trending curation — Track A marketplace feature #3

Third of four marketplace features. Two catalog strips: **Featured** (editorially curated, admin-picked) and **Trending** (algorithmically computed from existing signals). Together they turn the catalog from a flat list into a discovery surface.

## Honest framing up front

**The Trending algorithm is NOT pull-growth-rate.** We don't track daily pull deltas anywhere in the system today — `Module.pulls30d` is a single rolling number, not a time series. So "Trending" here means "gaining community attention" — measured by recent review velocity, average rating, rebuild freshness, and trust. I committed to this tradeoff explicitly rather than building a fake-but-plausible signal out of `pulls30d` alone.

The ranking formula lives in one function (`computeTrending` in `lib/db/curation.ts`) so swapping in a real pull-delta signal later is a one-function change. When a `ModulePullDaily` table lands (not in scope for this session), the inputs swap without rewriting callers.

## What shipped

### Schema

`ModuleFeatured` model with:
- `moduleSlug` (unique, FK → Module, cascade delete)
- `position` (1-6 convention, not DB-enforced so the admin can reorder freely)
- `blurb` (nullable, max 200 chars at API) — optional editorial line below the module card
- `featuredAt`, `expiresAt` (nullable for indefinite), `curatorId` (FK → User)
- Two indexes: `position` (for public read ordering) and `featuredAt` (for admin history view)

Migration `20260424160000_add_module_featured`. Back-relations added: `User.featuredModules` (named `"moduleFeaturedCurator"`), `Module.featured` (single-optional).

### Query helpers (`lib/db/curation.ts`)

**Featured side:**
- `listActiveFeatured(limit=6)` — public read. Filters expired, orders by position, excludes private modules as a safety net.
- `listAllFeaturedAdmin()` — admin read. Includes expired, orders by `featuredAt` desc.
- `upsertFeatured(input)` — admin write. Returns discriminated union with `module_not_found` / `module_private` rejection reasons. Blocks featuring a private module (leakage guard).
- `removeFeatured(slug)` — admin delete.

**Trending side:**
- `computeTrending(limit=8)` — pulls all public verified/failing modules, groups review counts over the last 14 days + all-time averages, excludes anything currently featured (avoid double promotion), scores each module, returns the top N with score > 0.

The formula:
```
score = 2.0 * log1p(recent_reviews_14d)     // primary signal
      + 0.6 * sigmoid(avg_rating - 3)        // rating quality
      + 0.4 * freshness(days_since_rebuild)  // recently reverified
      + 0.2 * (trust / 100)                  // baseline quality
      + 0.1 * log1p(pulls30d) / 10           // minor pulls factor
```

Freshness: `1 / (1 + days_since_rebuild / 7)` — 1.0 on rebuild day, 0.5 at a week, ~0 past three weeks. Returns a `TrendingEntry` with the score decomposed (`components: { recentReviews, avgRating, daysSinceRebuild, trust, pulls30d }`) so the ranking is debuggable, not a black box.

### Admin API (`app/api/v1/admin/featured/route.ts`)

- `POST` upsert with Zod body validation: `moduleSlug` (matches slug regex), `position` 1-6, optional `blurb` (≤200 chars), optional `expiresAt` (ISO date-time or null)
- `DELETE` by `?slug=<>` query param
- Both endpoints gated via `requireAdmin`, same gate used by the rest of `/app/admin/*`

### Admin UI (`/app/admin/featured`)

Server-rendered page with three sections:

1. **Add a feature** — `FeaturedEditor` in `create` mode. Dropdown pool of all public modules not currently featured. Position defaults to one past the current active count.
2. **Active features** — each rendered as an editable card via `FeaturedEditor` in `edit` mode. Position, blurb, expiresAt are inline-editable. Remove button prompts confirm.
3. **Expired features** — same cards visually dimmed with an EXPIRED badge. Admin can adjust `expiresAt` to re-activate without starting over.

`FeaturedEditor` is a dual-mode component (create/edit) that shares the three inputs — the only variable is whether the module slug comes from a dropdown or is fixed. Client-side calls the admin API, calls `router.refresh()` on success.

Sidebar entry "10 · Featured curation" added to OPERATIONS. Analytics shifted from 10 to 11; Account numbering shifted from 11/12 to 12/13.

### Public catalog integration

**`CatalogExplorer` was refactored** from fixture-only to prop-driven. It now accepts:
- `modules?: Module[]` — DB-sourced list; falls back to the `MODULES` fixture when undefined or empty (preserved so DB-outage doesn't blank the catalog)
- `featured?: FeaturedStripItem[]` — renders as a Featured strip above the filter bar, hidden when empty
- `trending?: TrendingStripItem[]` — renders as a Trending strip below Featured, hidden when empty

Both strips are pure visual additions — they don't interfere with the existing filter/sort/search flow. A user can still ignore them and work through the main grid.

**Featured strip design:** 3-column (2 on mobile) grid of editorial cards. Each shows status badge, SLSA level, module name, trust score, description (line-clamped to 2 lines), and the optional editorial blurb in an accent-bordered quote block.

**Trending strip design:** 4-column compact ranking list with `#1`, `#2`, `#3`…. Each shows the module name, recent-review count, and average rating if available. Includes a short caveat: "ranked by recent reviews + fresh rebuilds + trust — not raw pull counts" — transparency about what the signal means.

**Catalog page (`app/(marketing)/catalog/page.tsx`)** rewritten as a server component. Three parallel try/catch'd fetches:
1. Full public module list with publisher username included
2. `listActiveFeatured(6)` → FeaturedStripItem[]
3. `computeTrending(8)` → TrendingStripItem[]

Each try/catch is independent so any one fetch's failure doesn't block the other two. Main grid's `count` in the page hero comes from DB when available, fixture count (12) otherwise.

## Intentional design choices

- **Featured bypasses Trending.** A module in the Featured strip is skipped by `computeTrending` — otherwise the top of the page would show the same modules twice. If an admin un-features a module that was about to trend, it surfaces in Trending on the next page render automatically.
- **Positions aren't globally unique.** Two features at position 3 render in insertion order, not an error. Editorial curation is a rough ordering, not an array index — the admin resolves conflicts by re-saving.
- **Private modules blocked from featuring.** The `upsertFeatured` rejection and `listActiveFeatured` defensive filter are both in place. Even if a module's visibility flips after it was featured, the public strip won't leak it.
- **Score > 0 filter on trending.** A module with literally no attention signal (no reviews, no recent rebuilds, zero-trust) isn't "trending" — it's absent. The filter keeps the strip meaningful on small datasets.
- **Blurb is optional.** Many features are just "this is worth your time." Required editorial copy would block admin productivity. The UI treats blurb absence as normal.

## What this does NOT do

- **No per-category featured.** The Featured strip is global. A "Featured in Security" per-category strip would require UX that I don't want to add unprompted.
- **No "Why this is trending" explainer tooltip.** The components are computed and exposed in `TrendingEntry` but not surfaced in the UI. Adding a hover tooltip with the score breakdown would be nice; not in this session.
- **No A/B testing or rotation.** Featured is whatever the admin picks. No "rotate weekly" scheduler, no seasonal promotions, no time-of-day variation.
- **No publisher self-submission for featuring.** Features are editorial only. A "suggest for featuring" flow from the publisher is marketplace territory that adds moderation load.
- **No trending-history archive.** Last week's trending is gone the moment next week's compute runs. If a historical record ever matters, add a nightly snapshot table.
- **No user-personalized recommendations.** Trending is the same for every viewer. Personalization requires behavioral data that isn't collected.

## How to verify

1. Apply the migration. ModuleFeatured table exists, no rows.
2. Sign in as admin, navigate to `/app/admin/featured` — empty state.
3. Pick a module from the dropdown, set position=1, add a blurb, save. 201. Card appears in Active section.
4. Add two more features. They render in position order.
5. Set one's `expiresAt` to yesterday, save. Card moves to Expired section, disappears from public catalog.
6. Navigate to `/catalog` (public, no auth needed). Featured strip renders above the filter bar with active picks.
7. Post a review on one of several modules. Navigate back to `/catalog`. Trending strip appears (assuming at least one module has a computed score > 0).
8. Feature the trending module. It moves from Trending to Featured on the next refresh — no more duplication.
9. Remove a featured module via the admin editor. It drops off the public strip immediately.

## Track A marketplace progress

- ✅ #1 User reviews + ratings
- ✅ #2 Publisher profile pages
- ✅ **#3 Featured / Trending curation — this session**
- ⏸️ #4 Per-module "report a problem" inbox

One Track A session left, then Track B polish.
