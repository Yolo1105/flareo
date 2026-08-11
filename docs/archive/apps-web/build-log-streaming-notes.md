# Build log streaming — Track A #4

Closes the last gap in the Track A feature surface. Before this session, a submission in `building` state showed a blank "Building now. Typical completion 2-5 minutes." placeholder — builds were opaque. Now the admin detail page shows a live, polling log viewer with real-time output from the docker build child process.

## Architecture

Three-layer design, deliberately plain:

1. **Worker streams chunks to Postgres** as they arrive from the docker child process
2. **Main app polling endpoint** returns new chunks after a cursor
3. **Client component polls** every ~1.5s while building

No Redis, no SSE, no WebSockets. Builds are rare enough that DB write volume is negligible; polling is trivially deployable on serverless; a log is a sequence of small rows which is exactly what Postgres is good at.

## Schema + migration

- **`prisma/schema.prisma`** — new `BuildLogLine` model:
  - `id` (cuid), `submissionId` (FK → Submission, ON DELETE CASCADE), `seq` (monotonic int per submission), `text`, `stream` ("stdout" | "stderr" | "system"), `emittedAt`.
  - Unique index on `(submissionId, seq)` — enables the worker's ON CONFLICT DO NOTHING upsert (idempotent replay if a chunk got queued twice).
  - Compound index on `(submissionId, emittedAt)` for eventual cleanup queries.
- **`prisma/migrations/20260424110000_add_build_log_line/migration.sql`** — `CREATE TABLE` + 2 indexes + FK.

## Worker changes

### `src/build.ts`

- `BuildArgs.onChunk?: (chunk: { text, stream }) => void` — new optional callback invoked from the child's stdout/stderr 'data' handlers.
- The handlers now call `onChunk` after pushing to the local buffer. Errors inside `onChunk` are swallowed — streaming must never affect the build outcome.
- Existing `logText` final-buffer behavior is unchanged; the R2 upload at build completion still works as before.

### `src/db.ts`

- New `appendBuildLogLine(prisma, { submissionId, seq, text, stream })` using raw SQL with `ON CONFLICT DO NOTHING`. Id is a random 24-char hex prefix (`blog_...`) to keep the raw-SQL path self-contained. Takes the submissionId + seq as the idempotency key.

### `src/index.ts`

Wired in the main `claim → build → publish` flow:

- Before calling `dockerBuild`, writes a system marker (`--- build started for $name@$version ---`).
- Passes an `onChunk` callback to `dockerBuild` that fires-and-forgets a DB write. A **serialized promise chain** (`writeChain`) ensures concurrent chunks land in seq order — Node fires 'data' handlers synchronously but DB writes are async, so without chaining a slow first write could invert order.
- Per-submission `chunkSeq` counter assigns monotonic `seq` values.
- After `dockerBuild` returns, waits up to 5s for the chain to drain before the R2 upload + status update. Bounded so a stuck DB can't wedge the worker.
- Finally writes a closing system marker (`--- build succeeded in Nms ---` or `--- build failed after Nms ---`) with a 2s drain ceiling.

### Why serialized, not parallel

The docker child emits 'data' events in order but the Promises resolve in DB-latency order. Parallel writes would produce out-of-order `seq` values. Chaining `writeChain = writeChain.then(() => append(...))` forces sequential completion without blocking the 'data' handler itself — the handler returns immediately after appending to the chain.

## Main app changes

### `app/api/v1/submissions/[id]/build-log/route.ts` (new)

```
GET /api/v1/submissions/{id}/build-log?after={seq}&limit={n}
→ { lines, lastSeq, complete, status }
```

- **Auth-required.** Anonymous gets 401 (not 404) — different from the module detail page's privacy-first 404, because "/build-log" already reveals the submission exists contextually.
- **Owner or admin.** Non-owner authenticated user gets 404 to avoid leaking submission existence.
- **Returns up to 500 lines per call** above the `after` cursor, ordered by seq ascending.
- **Reports submission status** so the client knows when to stop polling.
- **Rate-limited on the `modules-list` bucket** (300/hr free, 1500/hr pro). A client polling every 1.5s during a 10-minute build makes ~400 requests — comfortably within the pro bucket, tight for free. Free users polling multiple tabs might hit 429; the client backs off 3× on rate-limit rather than stopping.

### `components/sections/app-admin/LiveBuildLog.tsx` (new)

Client component. Recursive-setTimeout polling (not setInterval, so a slow response can't stack up queued calls). State machine:

1. First mount — shows "waiting for first chunk…" spinner
2. First response with lines — renders them, sets cursor, schedules next poll
3. Subsequent responses — appends new lines, advances cursor
4. Response with `complete: true` or terminal status — stops polling, shows "final · $status"
5. 401/404 — shows access error, stops
6. 429 — backs off 3× the interval, retries
7. Other errors — shows inline, retries at 2× interval

UX details:

- **Auto-scroll to bottom** when new lines arrive — unless the user scrolled up to read earlier output, in which case it pauses auto-scroll and shows a "jump to latest ↓" button.
- **Stream coloring**: stderr in `text-bad/90`, system markers in accent, stdout in softer ink.
- **Streaming indicator**: pulsing green dot + "streaming" label while live; "final · status" once terminal.
- **Line count** in header.
- Max panel height 480px, content scrolls within.

### Admin detail page wiring

`app/app/admin/[id]/page.tsx` — imports `LiveBuildLog`, renders it as a section after the build-result block whenever status is `building | built | failed | scan_rejected | worker_failures`. For terminal states, the component still renders so historical builds show their log; it just polls once and stops (the response comes back with `complete: true`).

## What could go wrong, and what happens

- **Worker crashes mid-build** — log lines up to the last successful write are preserved; the submission transitions to `failed` via the retry/DLQ logic which has its own system markers. The log panel renders those existing rows.
- **DB connection slow or down** — worker's `writeChain` catches errors (`.catch(() => {})`) so a single failed write doesn't break the chain. The rest of the build continues and R2 upload still runs at the end.
- **Client tab left open on a stuck build** — polling continues until either the build completes or the user closes the tab. No server-side connection resource burns.
- **Many clients polling the same submission** — each poll is a point query on `(submissionId, seq > cursor)` using the unique index. Even 10 open tabs is ~7 reqs/sec, which is nothing.
- **Very long builds producing MBs of log** — BuildLogLine rows pile up but stay cheap in Postgres. Cleanup is a future optimization (e.g. a cron that deletes rows for submissions whose terminal state was reached >30 days ago). Not implemented this session.
- **Rate-limit hit on a free user with multiple tabs** — client backs off to 4.5s intervals after 429s; the 5-10 minute build window is enough that even the slow cadence keeps up.

## Deliberately NOT touched

- **Cleanup job for old log rows.** Should delete `BuildLogLine` rows for terminal submissions after N days (mirroring the R2 archival copy). The BuildLogLine table grows unboundedly without it. Small script or migration trigger; separate session.
- **User-facing submission detail page.** There's no `/app/submissions/[id]` page today — users see their submissions via dashboard aggregates. The admin detail page has the LiveBuildLog; adding a user-facing version that reuses the component is a straightforward follow-up.
- **Log export / download button.** R2's `buildLogUrl` is already exposed for failures; a "download full log" button on the LiveBuildLog panel could link to it once the build completes. Trivial, not included.
- **Syntax highlighting / ANSI color parsing.** Docker emits ANSI escape codes in its output; today those render as raw characters in the log panel. Parsing them into colored spans is a polish item.
- **Worker-side batching.** Currently 1 chunk = 1 DB row. For a build emitting hundreds of small chunks, batching (coalesce chunks within N ms into one row) would reduce write volume. Unnecessary at current scale.

## How to verify locally

```sh
cd apps/web
npx prisma migrate dev       # applies the BuildLogLine migration
# Start the worker pointed at the same DB
cd ../worker && npm run dev &
cd ../flareo && npm run dev
```

1. Submit a module via `/app/publish` with a real Dockerfile (e.g. `FROM alpine:3.20; RUN apk add --no-cache curl`).
2. Sign in as admin, navigate to `/app/admin` → click the new submission → the detail page shows:
   - BUILD RESULT section with "Building now..." placeholder
   - Just below: the new BUILD LOG panel with a pulsing green dot and "streaming" label
3. As the worker processes the build, lines appear in the panel in real time, color-coded by stream.
4. On completion, the panel transitions to "final · built" (or "final · failed") and stops polling.
5. Scroll up while streaming — the "jump to latest ↓" button appears, auto-scroll pauses. Click it to resume.

**Seed data for visual testing without a real build:**

```sql
-- Pick any existing submission id:
UPDATE "Submission" SET status = 'building', "buildStartedAt" = NOW()
WHERE id = 'sub_...';

-- Append synthetic log lines:
INSERT INTO "BuildLogLine" (id, "submissionId", seq, text, stream, "emittedAt")
VALUES
  ('blog_seed_0', 'sub_...', 0,
   '--- build started for vaultwarden@1.32.5 ---' || chr(10), 'system', NOW() - INTERVAL '10 seconds'),
  ('blog_seed_1', 'sub_...', 1,
   '#1 [internal] load build definition from Dockerfile' || chr(10), 'stdout', NOW() - INTERVAL '9 seconds'),
  ('blog_seed_2', 'sub_...', 2,
   '#2 [internal] load .dockerignore' || chr(10), 'stdout', NOW() - INTERVAL '8 seconds'),
  ('blog_seed_3', 'sub_...', 3,
   '#3 [1/5] FROM alpine:3.20' || chr(10), 'stdout', NOW() - INTERVAL '7 seconds'),
  ('blog_seed_4', 'sub_...', 4,
   'WARNING: the requested image platform does not match the detected host platform' || chr(10), 'stderr', NOW() - INTERVAL '6 seconds'),
  ('blog_seed_5', 'sub_...', 5,
   '#4 [2/5] RUN apk add --no-cache curl' || chr(10), 'stdout', NOW() - INTERVAL '5 seconds');
```

Then open `/app/admin/[that-submission-id]` — panel shows the 6 seeded lines, keeps polling for more, and the stderr warning renders in red.

## Track A complete

- ✅ #1 Private module submission flow
- ✅ #2 DLQ dismissal UI
- ✅ #3 Canary rebuild observability
- ✅ #4 Build log streaming — this session
- ✅ #5 Plan-aware rate limits
- ✅ #6 VerifyToolUsed event wiring

All six Track A items are landed. The "show all features" demo surface is complete.

## What this leaves unfinished in the project

For the project overall (not the demo goal):

- **Pre-existing upstreamRef bug** flagged in `private-module-notes.md` — worker stores user IDs in the upstream-URL column.
- **Code review findings still open**: #4 submission-id spoofing, #7 requeued-rows-carry-stale-error, #8 unhandled-crash Sentry enrichment, #10 NEXT_PUBLIC_APP_URL fallback, #11 error-string brittle matching, #12 100KB vs 20KB Zod divergence, #15 unique index WHERE predicate, plus 5 low-priority items.
- **Week 1 verification** still unexecuted (red-team day, non-maintainer submissions, unattended weekend, Stripe prod, Plausible prod) — all external-to-code items the user has to execute.
- **Build log cleanup job** — mentioned above, not implemented. Write volume will grow unboundedly without it.

The demo is feature-complete. The operational validation still hasn't happened, but that's by design based on the reframe.
