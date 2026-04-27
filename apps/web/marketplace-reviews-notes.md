# User reviews — Track A marketplace feature #1

First of four marketplace features. User-written reviews and 1-5 star ratings on modules, with moderation tooling for handling abuse.

**Important scope note:** this is new direction not specified in Q1/Q2 planning docs or any horizon plan. User opted into building it with explicit acknowledgment of the scope change. The trust-pitch reconciliation (homepage copy, pricing page, /verify messaging) is NOT part of this session — the product still leads with cryptographic receipts as the primary trust signal; reviews are additive.

## What shipped

### Schema

`ModuleReview` model with `(moduleSlug, authorId)` unique constraint — one review per user per module, edits overwrite. Three status values by convention: `visible` (default), `flagged` (a reader reported it), `hidden` (admin removed it). Rating is plain integer; API validates 1-5.

Three indexes cover the access patterns:
- `(moduleSlug, createdAt)` — per-module newest-first list
- `(moderation, createdAt)` — admin moderation queue
- `authorId` — "this user's reviews" (future profile-page lookup)

Back-relations added to `User.moduleReviews` and `Module.reviews`. Migration `20260424140000_add_module_review`.

### Query helpers (`lib/db/reviews.ts`)

- `listReviewsForModule(slug, { includeHidden, limit })` — public read; hides hidden by default
- `getReviewAggregate(slug)` → `{ count, average, histogram: [5star, 4star, …] }` — visible reviews only
- `getAggregatesForSlugs(slugs)` — batch fetch for catalog list (N+1 avoidance, deferred in UI wiring for this session)
- `upsertReview(input)` → discriminated union result with `self_review` rejection when author === publisher
- `flagReview({ reviewId, reason })` — any authenticated user can flag; idempotent
- `setModeration({ reviewId, state, adminId })` — admin-only; stamps `hiddenById` + `hiddenAt` on hide, clears on restore
- `listReviewsForModeration(limit)` — admin queue feed (flagged + hidden, newest first)
- `getMyReview(slug, userId)` — viewer's own review or null (drives edit vs. write UX)

Moderation-on-edit behavior: editing a review resets `flagged` back to `visible` (otherwise flags are permanent badges of shame). `hidden` status is preserved — editing can't un-hide.

### API endpoints

- `GET /api/v1/modules/[slug]/reviews` — public; returns `{ reviews, aggregate }`. Rate-limited on modules-list bucket.
- `POST /api/v1/modules/[slug]/reviews` — auth required; body `{ rating, title, body }` → 201 on create, 200 on update. Rate-limited on `auth-signin` bucket (tight 10/10min) to prevent review-spam.
- `POST /api/v1/reviews/[id]/flag` — auth required; body `{ reason }`. Tight rate limit. 404 if review doesn't exist or already hidden (idempotent no-op).
- `POST /api/v1/admin/reviews/[id]/moderate` — admin-only; body `{ state: "visible" | "hidden" }`.

Self-review rejection (publisher reviewing their own module) lives in `upsertReview` and surfaces as 409 `self_review` at the API.

### Public module-detail UI

`components/sections/module-detail/ReviewsSection.tsx` renders on every public module page after the rebuild history section. Three regions:

1. **Aggregate banner** — two-panel: big-number average with stars + histogram bar chart (5 rows, one per star bucket)
2. **Write form** — opens in-place from a "Write a review" button. Includes rating picker (5 clickable stars), title (5-120 chars), body (20-4000 chars, live counter). When the viewer already has a review, the form opens pre-filled in "EDIT YOUR REVIEW" mode. Hidden entirely for publishers reviewing their own module; replaced with "Sign in to review" prompt for anonymous viewers.
3. **Review cards** — newest first, one per review. Star display, title, author name, date, body (preserves line breaks). Per-card "Report this review" action expands into a flag form with a required reason.

Page-level data fetching is best-effort — DB unreachable or a fixture-only module produces empty state gracefully, page doesn't fail.

### Admin moderation UI

`/app/admin/reviews` — two-section page:
- **Flagged** — awaiting admin decision. Each card shows the flag reason prominently.
- **Hidden** — previously actioned, available to restore if the decision was wrong.

Each card has `ModerationActions`: "Hide review" (on flagged/visible) or "Restore" (on hidden) or "Dismiss flag (keep visible)" (on flagged). Wired to `/api/v1/admin/reviews/[id]/moderate` with `router.refresh()` on success.

Admin sidebar gains "09 · Review moderation" (was Analytics at 09; Analytics shifted to 10). Account numbering shifted 11/12.

## Deliberately NOT in this session

- **Catalog-list row aggregates.** The existing `CatalogExplorer` is a client component driven entirely by a static `MODULES` fixture. Wiring review aggregates requires refactoring it to accept DB-sourced modules via a server-fetched prop. Defer — aggregate display on module detail is where the signal adds most; catalog-row stars are polish.
- **Verified-pull badge.** "This reviewer actually pulled the image" would be a strong anti-spam signal. Requires correlating reviewer identity with registry pulls — the registry doesn't track user identity on pull. Non-trivial; deferred.
- **Upvotes on reviews.** "Was this review helpful?" Yes/No. Not needed for MVP; adds moderation load.
- **Markdown in review bodies.** Currently plain text with `whitespace-pre-wrap`. Rich body support + sanitization is a session of its own (XSS surface).
- **Nested replies.** Publishers replying to reviews. Worth considering; scoped to a future session because publisher-reply needs its own UI + notification story.
- **Email notification when a review lands on your module.** Needs the email template + a publisher preferences UI. Out of scope.
- **Profile pages / author links.** Review cards show author name but don't link anywhere. Becomes live when `/@username` profile pages ship (next marketplace feature).
- **Trust-pitch reconciliation in homepage / pricing / verify copy.** Reviews as a feature are additive; the current product copy still leads with cryptographic receipts. Consider updating the homepage to mention "plus community reviews" after all four marketplace features land, not piecemeal.

## How to verify

Seed some reviews for visual testing:

```sql
-- Pick an existing module slug (not one the current user publishes) and user id:
INSERT INTO "ModuleReview" (id, "moduleSlug", "authorId", rating, title, body, moderation, "createdAt", "updatedAt")
VALUES
  ('rev_seed_1', 'vaultwarden', '<some-user-id>', 5,
   'Running this in production for 6 months, zero issues',
   'Replaced the upstream vaultwarden image with this one after a CVE forced us to patch in a hurry. The SLSA L3 provenance and daily rebuilds mean we no longer need to maintain our own fork. The SBOM caught a transitive dependency we didn''t know we had.',
   'visible', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('rev_seed_2', 'vaultwarden', '<another-user-id>', 4,
   'Solid but the size is larger than upstream',
   'Image is ~15MB larger than the stock vaultwarden image because of the additional scan instrumentation. Fair tradeoff for the receipts but worth knowing if you''re pulling on every deploy.',
   'visible', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');
```

Then:

1. Open `/modules/vaultwarden` (public, unauthenticated). Scroll to the bottom — "Community reviews" section with average 4.5, count 2, histogram 1 bar at 5 + 1 bar at 4, and two cards.
2. Sign in as a user who has NOT reviewed the module, NOT the publisher. Top-of-section gets a "Write a review" button. Click → form opens. Submit with valid rating+title+body → 201, page refreshes, new review appears.
3. Resubmit (edit) — form pre-fills with the existing review, label changes to "EDIT YOUR REVIEW". Update body, submit → 200, review updates in place.
4. As a different authenticated user, click "Report this review" on any card → reason form appears, enter a reason → 200, card shows "flagged for moderation review".
5. Sign in as admin, navigate to `/app/admin/reviews`. Flagged review appears in the flagged section with its reason shown. Click "Hide review" → card moves to Hidden section on refresh. Module detail page no longer shows the review to non-admin viewers.
6. Publisher of a module opening their own module page sees the "You're the publisher" notice instead of the write form.

## Track A marketplace — item 1 of 4 done

- ✅ #1 User reviews + ratings — this session
- ⏸️ #2 Publisher profile pages (`/@username`) — next up
- ⏸️ #3 Featured / Trending curation on catalog
- ⏸️ #4 Per-module "report a problem" inbox

Three sessions left for Track A marketplace, then Track B polish items.
