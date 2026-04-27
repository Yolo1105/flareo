# Publisher profile pages — Track A marketplace feature #2

Public profile pages at `/@username`. Builds on the reviews feature (review cards now meaningfully link to authors) and closes a loop the rest of the app already hinted at — module hero's "by AUTHOR" line becomes a link instead of a dead string.

## What shipped

### Schema + migration

Three new columns on `User`:

- `username` — nullable text, case-insensitive unique (functional unique index on `lower(username)`)
- `bio` — nullable text, up to 500 chars (API cap)
- `websiteUrl` — nullable text, up to 200 chars (API cap)

Migration `20260424150000_add_user_profile_fields` is a three-step operation:

1. `ALTER TABLE` adds all three columns nullable
2. A PL/pgSQL `DO $$ ... $$` block **auto-generates usernames** for existing rows:
   - Base candidate: lowercase(local-part of email), sanitized to `[a-z0-9-]`, with runs collapsed and leading/trailing dashes stripped
   - Users without email fall back to `user-<first 8 of cuid>`
   - Collisions de-duplicated with `-1`, `-2`, … suffix
   - Truncated to 30 chars with trailing-dash cleanup
3. `CREATE UNIQUE INDEX ... ON (lower(username))` applied AFTER the backfill so constraint failures can't interrupt the loop

### Validation (`lib/validation/username.ts`)

- `USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{2,29}$/` — shape regex
- `RESERVED_USERNAMES` — set of route names (`admin`, `api`, `docs`, `catalog`, `verify`, `login`, `modules`, `submissions`, …) plus product-owned handles (`flareo`, `support`, `team`) plus generic identifiers (`me`, `you`, `system`, `null`). Maintained as a Set in code, not DB — adding a reserved word doesn't need a migration.
- `usernameError(raw)` — returns null when valid, ordered cheap-to-expensive error messages otherwise
- `usernameSchema` — Zod wrapper around `usernameError`
- `bioSchema`, `websiteUrlSchema` — matching Zod schemas for the other two fields

### Profile route: `/@username` → `/u/[username]` rewrite

Next.js doesn't allow `@` in directory names (interpreted as route group), so the actual route lives at `app/(marketing)/u/[username]/page.tsx` and middleware rewrites `/@handle` → `/u/handle`. The rewrite:

- Fires before auth gating (profile pages are public)
- Validates the handle shape before rewriting (malformed falls through to 404)
- Lowercases the handle on the way (DB lookup is case-insensitive anyway but normalization keeps URLs canonical)
- Preserves query string and any path suffix

Matcher extended to `["/app/:path*", "/api/:path*", "/@:handle*"]`.

### Public profile page

`app/(marketing)/u/[username]/page.tsx` — server component. Fetches:

- `getPublicProfile(username)` → profile + userId, null on unknown or soft-deleted
- `getPublicModulesForUser(userId)` → their public modules (private excluded even if viewer is owner — profile page is public)
- `getReviewsByUser(userId, 20)` → reviews they've written

Layout:

1. **Hero** — avatar (initials fallback), `@handle` + optional display name, `PUBLISHER` badge when they have ≥1 module, bio, join year, website link (with `rel="nofollow"`), three stat tiles (modules / reviews / pulls · 30d)
2. **Published modules** — sortable table linking to `/modules/<slug>`, with trust color-coded
3. **Reviews written** — cards with star rating, title, linked module, body excerpt (280 chars then "…")

Zero-states for both sections handle the "new publisher, no modules" and "new reviewer, no reviews" cases.

### Self-service editing

- **API:** `PATCH /api/v1/account/profile` accepts `{ username?, bio?, websiteUrl? }`. Partial patches don't clobber unset fields.
  - Enforces `usernameError` + reserved-word check server-side even though client-side already does it
  - Case-insensitive uniqueness check via raw SQL on `lower(username)`
  - **Cooldown:** username changes limited to once per 24 hours (first-ever set is free). Cooldown reads from `User.profileUpdatedAt`, which is bumped only on username change (bio/website edits don't reset the window)
  - Empty-string `websiteUrl` is mapped to null so users can clear it
  - Rate-limited on `auth-signin` bucket as a secondary gate

- **UI:** new `PublicProfileEditor` component added below the existing `ProfileEditor` on `/app/settings`. Shows:
  - Username input with live shape validation (uses `usernameError` client-side before the network hop)
  - Live URL preview: `flareo.dev/@handle-as-you-type`
  - Bio textarea with 500-char counter
  - Website URL input
  - "View your public page →" link once a username is saved
  - Cooldown warning text under the username field

### Module hero integration

`Module.publisherUsername?: string | null` added. `getModuleBySlug` now includes the publisher via Prisma `include` and returns the username alongside the rest of the module data. `ModuleHero` renders the "by AUTHOR" line as a link when a username is available; plain text when not (deleted publisher or pre-migration data).

### `getAccountProfile` extended

`AccountProfile` and `UserShape` types in `lib/db/account.ts` gained `username`, `bio`, `websiteUrl` so the settings page can hand initial values to `PublicProfileEditor` without a second fetch.

## Intentional design choices

- **Usernames are public.** The `/@handle` URL and anyone browsing the profile page reveal it. Users who prefer not to have a public identity can still use the product — they just leave their username to the auto-generated value and don't share the URL. There's no "private profile" mode in this first version. Future session if demanded.
- **Soft-deleted users 404.** An account scheduled for deletion (`deletedAt` set) returns 404 from the profile route immediately, not 30 days later. Better UX than rendering a tombstone; the user's modules stay live under their slug either way.
- **Reserved list is permissive.** 30+ words reserved. Erring on the side of over-reserving rather than regretting later — a reserved word can be freed by removing it from the set, but an already-claimed handle is harder to reclaim gracefully.
- **Publisher reviews on own modules still blocked.** The reviews feature from the prior session enforces `self_review` → 409 at the upsert layer; no change here. Profile page surfaces reviews authored by the user regardless of which module they're on.

## What this does NOT do

- **No follow / followers system.** A `/@handle` page is a static view. No social graph.
- **No DMs or public feed.** Only modules + reviews are shown.
- **No publisher verification badge.** Could tie to email-verified + has-ever-had-an-approved-submission. Left for later.
- **No per-publisher trust aggregate.** The hero shows totals (module count, pulls) but not a rolled-up "publisher trust score" derived from their modules' individual scores. Open question whether such a number would be useful or misleading; not computed today.
- **No signup-time username picker.** First-time users going through OAuth flow get an auto-generated username and can change it in settings. Adding a mandatory picker to the signup flow is a UX revision with its own tradeoffs; defer.
- **No catalog-row author links.** The existing `CatalogExplorer` is fixture-driven (not DB-driven); threading the publisher username into it needs the same refactor flagged in the reviews session. Deferred again.

## How to verify

1. Apply the migration. Existing users get auto-generated usernames.
2. Sign in as a user who has at least one published module. Navigate to `/app/settings` → § PUBLIC PROFILE section. Username is pre-filled with the auto-generated value. Bio is empty. Live preview shows `flareo.dev/@yourhandle`.
3. Change username to something short or reserved (e.g. `app`) → inline red error appears immediately.
4. Change to a valid new handle + add a bio + website → Save. Toast confirms.
5. Try to change username again within 24h → 429 `too_soon`.
6. Click "view your public page →" → lands on `/@newhandle` showing hero, stat tiles, published-modules table, reviews-written cards (if any).
7. Navigate to any module's detail page → the "by AUTHOR" line in the hero is now a link to the publisher's profile.
8. Delete a reserved-word handle attempt, a collision attempt, a username with leading dash — all get specific inline error messages.

## Track A marketplace progress

- ✅ #1 User reviews + ratings
- ✅ **#2 Publisher profile pages — this session**
- ⏸️ #3 Featured / Trending curation on catalog
- ⏸️ #4 Per-module "report a problem" inbox

Two marketplace sessions left, then Track B polish.
