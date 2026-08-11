# Private module submission flow

Implements Track-A item #1: close the gap where the pricing page advertises "up to 20 private modules" for Pro but `/api/v1/submissions` only accepted public. End-to-end private flow now works, with plan-gated access.

## What shipped

### Schema + migration

- **`prisma/schema.prisma`** — `Submission.visibility` column added, `String @default("public")`. Mirrors the shape of `Module.visibility`.
- **`prisma/migrations/20260424090000_add_submission_visibility/migration.sql`** — additive, non-destructive. Existing rows default to "public", matching pre-migration behavior.
- No new index. Visibility is filtered alongside status in existing hot paths; adding a compound index now would be premature.

### Quota library (`lib/billing/quota.ts`)

Generalized from "public-module-only" to "per-visibility bucket" semantics:

- New `Visibility` type alias (`"public" | "private"`)
- `ModuleUsage` interface replaces `PublicModuleUsage` (kept as a type alias for back-compat)
- `getModuleUsage(userId, visibility, db?)` — the generalized usage reader
- `getPublicModuleUsage(userId, db?)` — kept as a thin wrapper calling the new function with `visibility="public"`
- `canSubmit(userId, visibility, db?)` — now takes the desired visibility and returns one of two failure reasons:
  - `plan_requires_upgrade` — the user's plan has a cap of 0 for this visibility (free + private → always this). UI should render as "upgrade to pro", not "cancel something."
  - `quota_exceeded` — the plan allows it but the user is at their cap.

The `CanSubmitResult.reason` union widens from `"quota_exceeded"` to `"quota_exceeded" | "plan_requires_upgrade"` — existing callers that only check `allowed: false` keep working; UI code that renders distinct copy per reason now has the hook it needs.

### Submissions endpoint (`app/api/v1/submissions/route.ts`)

- Schema: new `visibility: z.enum(["public", "private"]).default("public")` field. Default preserves pre-visibility client behavior.
- Pre-check: `canSubmit(userId, data.visibility)` so the 402 response distinguishes "upgrade needed" from "cap hit."
- Error body: now includes `visibility` in the details block so client code can render the right copy.
- Serializable transaction re-check: reads `published + inFlight` scoped to the target visibility against the plan's matching cap. A private submission doesn't consume public quota and vice versa.
- Insert: writes `visibility: data.visibility` onto the Submission row.

### Worker (`apps/worker/src/db.ts`)

- `ApprovedRow.visibility` added to the interface.
- Claim query now reads the `visibility` column.
- `publishModuleFromSubmission` — the Module insert's hard-coded `'public'` literal at position 20 is now `$20`, with `row.visibility` passed as the 20th arg. Private submissions end up as private modules on publish; public stays public.

### Publish wizard (`components/sections/app-publish/PublishWizard.tsx`)

- New `userPlan` prop (defaults to `"free"` defensively).
- `visibility` state, defaulting to `"public"`.
- Step 2 (manifest) gets a new VISIBILITY section right after PREVIEWABLE:
  - Pro users: interactive radio for "public · listed in the shared catalog" vs "private · visible only to you and admins"
  - Free users: the private option is disabled with a `title=` explaining why, the whole card has `opacity-70`, and there's a small "PRO UNLOCKS PRIVATE" pill + an "Upgrade to Pro →" link to `/app/settings/billing`
- Step 4 (review) JSON preview includes the `"visibility"` field
- POST body sends `visibility`

### Publish page (`app/app/publish/page.tsx`)

- Reads `await getUserPlan(session.user.id)` server-side
- Passes the value as `userPlan` to the wizard so the toggle renders correctly on first paint — no flicker, no client round-trip

### Module detail API (`app/api/v1/modules/[slug]/route.ts`)

Access control rewritten to distinguish "doesn't exist" from "exists but you can't see it":

- Public modules: accessible to everyone (including anonymous).
- Private modules: accessible to the owner (matching `publisherId`) or to an admin (`session.user.role === "admin"`).
- Other users get a 404, not a 403. Intentional — don't leak the existence of private modules via status code differentiation.

The JSON response now includes `visibility` so client UI can render badges/gating.

### Module hero (`components/sections/module-detail/ModuleHero.tsx`)

New PRIVATE pill rendered next to the status badge when `module.visibility === "private"`. Accent-colored with a tooltip ("Private module — visible only to you and admins. Not listed in the public catalog.").

### Admin queue (`app/app/admin/page.tsx`)

- Small `PRIV` pill next to the version in each admin-queue row for private submissions
- Sourced from `AdminSubmission.visibility` which now flows from the DB through `rowToAdminSubmission`

### Admin detail (`app/app/admin/[id]/page.tsx`)

- Subtitle gets a `PRIVATE` badge when applicable, after the status indicator
- Reviewer can tell at a glance whether this submission would go to the public catalog or the submitter's private namespace

### Admin submissions library (`lib/db/admin-submissions.ts`)

- `AdminSubmission.visibility: string` added to the interface
- `SubmissionRow.visibility?: string | null` added (nullable for type-compatibility during the migration window; pre-migration rows default via the column's SQL default)
- `rowToAdminSubmission` propagates the field, defaulting to `"public"` if somehow null

## Deliberately NOT touched this session

- **Billing page private-quota meter.** `/app/settings/billing` currently shows only public-module usage. Adding a second meter for private-module usage is a small follow-up; the existing meter still works correctly for public.
- **Admin queue visibility filter.** No `?visibility=private` query param on `/app/admin`. Easy add later if a reviewer asks.
- **Catalog-side display.** The public catalog (`/api/v1/modules`) already filters `visibility: "public"`; no change needed there. Private modules stay invisible to the catalog by design.
- **CLI support for `--private`.** Out of scope; CLI work is its own session.
- **Email content mentioning visibility.** Decision emails don't explicitly say "your private module was published"; they just say "published". Minor wording pass worth doing eventually.

## Pre-existing bug flagged (not fixed)

In `apps/worker/src/db.ts`'s `publishModuleFromSubmission`, the JS args passed to the `INSERT INTO "Module"` query appear to pass `row.submitterId` at positional arg 13, which in the SQL corresponds to `"upstreamRef"` — not `publisherId` (that's arg 19, also correctly `row.submitterId`).

Concretely, the args at positions 12-15 line up with the SQL columns as:

| Position | SQL column | JS arg |
|----------|------------|--------|
| $12 | imageRef | args.imageRef |
| $13 | upstreamRef | **row.submitterId ← likely wrong** |
| $14 | sbomUrl | args.sbomUrl |
| $15 | sbomPackages | args.sbomPackages |

Effect: published modules have been storing a user id as their `upstreamRef` (which should be the upstream repo URL). Pre-existing, not introduced by this session. Deserves its own fix + a one-off migration to heal affected rows (if any exist in prod). Logging it here and in `KNOWN_LOOSE_ENDS.md` so it doesn't get lost.

## How to verify locally

```sh
cd apps/web
npm install
npx prisma migrate dev  # applies the new visibility migration
npm run dev
```

**Without a pro account:**
1. Sign in, navigate to `/app/publish`
2. Step 2 shows the PREVIEWABLE toggle as before, plus a new VISIBILITY toggle
3. VISIBILITY card is dimmed (opacity-70), the "private" option is disabled with a tooltip, and there's a PRO UNLOCKS PRIVATE pill visible
4. An "Upgrade to Pro →" link appears under the card
5. Step 4 review JSON shows `"visibility": "public"` regardless
6. Submitting works; resulting Submission row has `visibility = "public"` in Postgres

**With a pro account (set plan='pro' in DB directly for testing):**
1. Step 2 VISIBILITY toggle is interactive
2. Choose private, advance through steps 3-4
3. Review JSON shows `"visibility": "private"`
4. Submit — submission lands with `visibility = "private"`
5. After approval, the worker publishes and the resulting Module row has `visibility = "private"`
6. Navigate to `/modules/<your-slug>` — you see it with a PRIVATE badge on the hero; public catalog at `/catalog` does NOT show it; `/api/v1/modules/<slug>` returns 200 for you, 404 for anyone else

**Test access control:**
1. Open the private module's URL in a private browser window (not logged in) → 404
2. Sign in as a different (non-admin) user → still 404
3. Sign in as an admin user → 200 with full detail

**Test quota enforcement:**
1. As a free user, submit with `visibility: "private"` via CLI or direct POST → 402 `plan_requires_upgrade`
2. As a pro user at 20 private modules, submit a 21st → 402 `quota_exceeded` with plan=pro visibility=private in details

## Next sessions (track A, continuing)

- #2 DLQ dismissal UI — retry + give-up buttons with audit-log reasons
- #3 Canary rebuild observability — "last rebuilt" on module pages + an admin-only rebuild log
- #5 Plan-aware rate limits — wire `rateLimitMultiplier` into the bucket selection
- #6 VerifyToolUsed event — 4-line follow-up firing the declared event from the verify page result handler

Plus the flagged upstreamRef bug when you're ready to address pre-existing issues.
