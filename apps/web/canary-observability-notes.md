# Canary rebuild observability — Track A #3

Makes the republish evidence chain visible in the UI. Two surfaces: a per-module rebuild history section on module detail pages (public-facing — surfaces lastRebuiltAt), and an admin-only log across all modules with a failures filter (operational).

## What shipped

### Schema + migration

- **`prisma/schema.prisma`**
  - `Module.lastRebuiltAt DateTime?` — already existed (schema was ahead of me). Kept.
  - New `ModuleRebuild` model: `id`, `moduleSlug` (FK to Module), `attemptedAt`, `durationMs` (nullable for crashes), `outcome` (one of `success | upstream_unchanged | build_failed | scan_failed`), `resultDigest` (nullable), `notes` (nullable text). Three indexes: `(moduleSlug, attemptedAt)`, `(attemptedAt)`, `(outcome)`, each covering a distinct read pattern.
  - `Module.rebuilds ModuleRebuild[]` back-relation.
- **`prisma/migrations/20260424100000_add_module_rebuild/migration.sql`** — additive. CREATE TABLE + three CREATE INDEX statements. ON DELETE CASCADE on the FK so deleting a Module cleans its rebuild history.

### Query helpers (`lib/db/module-rebuilds.ts`, new)

One file centralizes all reads and the one write:

- `listRecentRebuildsForModule(slug, limit=10)` — per-module rebuild history, newest first. Empty array on unknown slug.
- `listRecentRebuildsAdmin({ show, limit })` — admin log across all modules. `show: "failures"` filters to `build_failed | scan_failed`, excluding `upstream_unchanged` (benign no-op).
- `getRebuildLogSummary()` — header stats for the admin log: 24h success/unchanged/failed counts + last-attempt timestamp. Four parallel counts against the partial indexes.
- `recordRebuildAttempt(input)` — append-plus-denormalize in a single Prisma transaction. Writes the ModuleRebuild row and, on `success` or `upstream_unchanged` outcomes, updates `Module.lastRebuiltAt`. Failed outcomes deliberately do NOT advance `lastRebuiltAt` — last-successful is a more useful data point than last-attempted.
- `RebuildOutcome` type alias + `RebuildAttempt` interface exported for UI typings.

### Module type + mapper

- **`lib/types/index.ts`** — `Module.lastRebuiltAt?: string | null` added. Optional to keep backward-compat for any fixture code that creates Module literals without it.
- **`lib/db/queries.ts`** — `ModuleShape.lastRebuiltAt: Date | null` added, `shapeToModule` serializes it to ISO string.

### Module detail page

- **`components/sections/module-detail/RebuildHistorySection.tsx`** (new) — the public-facing surface. Four-column hero stats grid:
  - **Last rebuilt** — color-coded: green if ≤48h (fresh), amber if >48h (stale, past daily cadence), grey if never. Shows "just now" / "N h ago" / "never".
  - **Successes · 7D** — count of `success` outcomes in the fetched set that fall inside the last 7 days. Green when > 0.
  - **Unchanged · 7D** — count of `upstream_unchanged`. Neutral tone; clarified as "benign no-ops" in the sub-label so non-operator viewers don't read it as a failure.
  - **Failures · 7D** — count of `build_failed + scan_failed`. Bad-toned when > 0.
  - Attempt table below: when, outcome pill, duration, 12-char digest prefix.
  - Zero-state copy for first-rebuild-hasn't-happened-yet.
  - Trailing paragraph that explains the daily-rebuild contract in plain English, including the `status: failing` CVE-flip behavior.
- **`app/(marketing)/modules/[slug]/page.tsx`** — fetches `listRecentRebuildsForModule(slug, 10)` alongside the module row, renders `<RebuildHistorySection>` as the last section. Wrapped in a best-effort try/catch so a DB outage or empty table still renders the page with the empty-state copy.

### Admin rebuild log

- **`app/app/admin/rebuilds/page.tsx`** (new) — admin-only. Five-column summary header:
  - Last attempt (green if ≤25h, warn if longer, grey if never)
  - Success · 24h
  - Unchanged · 24h
  - Failed · 24h (bad when > 0)
  - Chain health — derived: GREEN if zero failures AND last attempt ≤25h; AMBER otherwise.
  - Filter bar with "All outcomes" / "Failures only" chips (URL state via `?show=failures`).
  - Row table with module slug linking to module detail page. 100-row cap per query.
  - Closing paragraph explaining the relationship between `lastRebuiltAt` (denormalized) and `ModuleRebuild` (log).

### Sidebar

- **`components/layout/app/Sidebar.tsx`** — new admin-only entry "07 · Rebuild log" between Worker health and Analytics. ACCOUNT section entries renumbered to 09/10.

### Canary script integration

- **`scripts/canary/update-module-metadata.ts`** — after the existing `module.upsert`, now appends a `ModuleRebuild` row. Outcome derived from the computed `status`:
  - `status === "verified"` → `outcome: "success"`, `resultDigest` set
  - `status === "failing"` → `outcome: "scan_failed"`, `notes: "Trivy found N critical, M high CVEs"`
  - `build_failed` and `upstream_unchanged` are NOT emitted by this script because:
    - `build_failed` means the shell wrapper exited non-zero before reaching this script
    - `upstream_unchanged` skips the rebuild entirely; the shell wrapper is expected to write that log row directly via its own small DB insert
  - Optional env var `FLAREO_REBUILD_DURATION_MS` read via `optInt` (nullable — passed to DB as null when unset).

## Deliberately NOT touched

- **`rebuild-canary.sh` — upstream_unchanged + build_failed log rows.** The TypeScript side handles the two outcomes it can attest to directly (success and scan_failed). The shell wrapper should write log rows for the two outcomes it owns (upstream_unchanged and build_failed), ideally via a small helper that calls a `record-rebuild-outcome.ts` script. Worth doing but scoped for a follow-up to keep this session tight. Without it, the admin log shows gaps in those two cases.
- **Backfill migration for pre-existing modules.** The migration creates an empty ModuleRebuild table. Pre-existing `lastRebuiltAt` timestamps on Module rows remain authoritative for "when was the last rebuild" but have no corresponding log rows. The history section's empty-state copy handles this gracefully ("The first republish run will appear here once this module has been through the pipeline"). A one-shot seeder that synthesizes a `success` row per currently-verified module from `lastRebuiltAt` would make the UI less empty on day 1 — not critical; skipped.
- **Retry-from-admin for failed rebuilds.** The admin log shows failures but doesn't have a "retry this rebuild" button. Rebuilds are triggered by cron on the shell wrapper's schedule; retry means re-running that wrapper. A future admin action could POST to a `/api/v1/admin/modules/[slug]/rebuild` endpoint that shells out, but that's a bigger session.
- **Per-module rebuild SLA badge.** Could compute "this module has had 3 consecutive failures" and render a warn badge on the module detail hero. Useful for trust signaling; skipped to keep scope tight.

## How to verify locally

```sh
cd apps/web
npx prisma migrate dev    # applies the new ModuleRebuild migration
npm run dev
```

**Seed some rebuild rows for a visual test:**

```sql
-- in psql, for any existing module slug:
INSERT INTO "ModuleRebuild" (id, "moduleSlug", "attemptedAt", "durationMs", outcome, "resultDigest", notes)
VALUES
  (gen_random_uuid()::text, 'vaultwarden', NOW() - INTERVAL '2 hours', 187432, 'success',
   'sha256:a7b2c4d8e9f123456789abcdef0123456789abcdef0123456789abcdef01', NULL),
  (gen_random_uuid()::text, 'vaultwarden', NOW() - INTERVAL '26 hours', 91284, 'upstream_unchanged',
   NULL, 'upstream digest sha256:5f4e3d2c1b0a...'),
  (gen_random_uuid()::text, 'vaultwarden', NOW() - INTERVAL '50 hours', 204831, 'scan_failed',
   NULL, 'Trivy found 1 critical, 3 high CVEs'),
  (gen_random_uuid()::text, 'vaultwarden', NOW() - INTERVAL '3 days', 176544, 'success',
   'sha256:b8c3d5e9f012345678...', NULL);

UPDATE "Module" SET "lastRebuiltAt" = NOW() - INTERVAL '2 hours' WHERE slug = 'vaultwarden';
```

Then:

1. Open `/modules/vaultwarden` — at the bottom, "Rebuild history" section with four stat tiles and a four-row table.
   - LAST REBUILT: `2h ago` in green
   - SUCCESSES · 7D: 2 (green)
   - UNCHANGED · 7D: 1 (neutral)
   - FAILURES · 7D: 1 (red)
2. Sign in as an admin, navigate to `/app/admin/rebuilds`:
   - Summary header: LAST ATTEMPT 2h ago (green), SUCCESS 2, UNCHANGED 1, FAILED 1 (red), CHAIN HEALTH AMBER (because of the failure).
   - Click "Failures only" chip → scoped to the scan_failed row.
   - Click the module slug in a row → navigates to the module detail page.
3. Sidebar shows "07 · Rebuild log" under OPERATIONS (admin only).

**Canary script self-test:**

```sh
FLAREO_SLUG=vaultwarden \
FLAREO_REBUILD_DURATION_MS=194821 \
# ...all the usual FLAREO_* env vars the script requires... \
npx ts-node scripts/canary/update-module-metadata.ts
```

After running, inspect `ModuleRebuild` — should have a new row with `outcome=success` if CVE counts were zero, otherwise `scan_failed`.

## Track A progress

- ✅ #1 Private module submission flow
- ✅ #2 DLQ dismissal UI
- ✅ #3 Canary rebuild observability — this session
- ⏸️ #5 Plan-aware rate limits
- ⏸️ #6 VerifyToolUsed event wiring

Two items left. Both smaller than this session.
