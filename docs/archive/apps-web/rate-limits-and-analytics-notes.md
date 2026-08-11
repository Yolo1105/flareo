# Plan-aware rate limits + VerifyToolUsed wiring — Track A #5 and #6

Two items finished together since both are small. #5 wires the existing `PLAN_LIMITS[plan].rateLimitMultiplier` seam into actual rate-limit enforcement; #6 fires the declared `VerifyToolUsed` Plausible event from the verify page.

## Track A #5 — Plan-aware rate limits

Before this session: the seam existed (`rateLimitMultiplier: 1` on free, `5` on pro) but nothing read it. Pro users got the same limits as free users.

After this session: the hot-path API routes look up the caller's plan and pass it to `checkLimit`, which scales the bucket's configured limit by the plan's multiplier.

### `lib/ratelimit/index.ts` changes

- `LimitResult.plan: PlanKey` added so every rate-limit response carries its origin plan. The response header `X-RateLimit-Plan` surfaces it to clients.
- `effectiveLimit(bucket, plan)` — single helper computing `BUCKETS[bucket].limit * PLAN_LIMITS[plan].rateLimitMultiplier`, floored to guard against future fractional multipliers.
- **Upstash cache keyed by `(bucket, plan)`** — switched `upstashLimiters` from `Partial<Record<LimitBucket, Ratelimit>>` to `Map<string, Ratelimit>`. Cache key is `${bucket}|${plan}`. Bounded: 5 buckets × 2 plans = 10 entries max. Each cached limiter gets its own Upstash prefix (`flareo:ratelimit:${bucket}:${plan}`) so upgrading a user to pro doesn't carry their free-tier hit counter into the larger bucket.
- **In-memory cache** — storage key now `${bucket}:${plan}:${key}` for the same reason. Prevents counter bleed across plans in dev and for anonymous-to-authenticated transitions within a single session.
- `checkLimit(bucket, key, plan="free")` — new optional third param. Default of `"free"` preserves behavior for existing callers that haven't been updated.

### Routes updated

The three hottest v1 API paths now look up plan and pass it through:

- `/api/v1/verify` — already had auth logic for picking the `verify-auth` vs `verify-anon` bucket; now also calls `getUserPlan(userId)` for authenticated callers and passes it.
- `/api/v1/modules` — listing endpoint used by the CLI.
- `/api/v1/modules/[slug]` — detail endpoint used by the web UI and the CLI.

All three use the same pattern:

```ts
const userId = session?.user?.id;
const plan = userId ? await getUserPlan(userId) : "free";
const limit = await checkLimit(bucket, key, plan);
```

### Routes deliberately NOT updated

14 other `checkLimit` callers (account settings, billing, waitlist, dockerfile-upload, whoami, submissions, by-digest lookups) continue with the default `"free"` plan. They're low-volume and the DB round-trip to look up plan would add more latency than the higher limit is worth. Easy to extend later if a bottleneck appears.

### Effective limits (free vs pro)

With today's PLAN_LIMITS:

| Bucket        | Free limit/hour | Pro limit/hour |
|---------------|-----------------|----------------|
| verify-auth   | 600             | 3,000          |
| modules-list  | 300             | 1,500          |
| whoami        | 120             | (not scaled)   |
| verify-anon   | 60              | (not scaled — no auth) |
| auth-signin   | 10              | (not scaled)   |

Pro gets 5× on the two scaled buckets. If a future multiplier lands between 1 and 5 (say a team plan at 3×), the scaling math works unchanged — just add the plan entry to `PLAN_LIMITS`.

### What could still go wrong

- **Plan invalidation during a running window.** If a user upgrades mid-hour, their free-tier counter is frozen in `flareo:ratelimit:verify-auth:free:user:<id>` and the pro counter starts from zero in `flareo:ratelimit:verify-auth:pro:user:<id>`. For the remainder of the hour they effectively get free+pro windows back-to-back. This is slightly *over*-generous to the upgrader, which is the right direction for error — never *under*-generous.
- **Plan lookup added to the hot path.** `getUserPlan()` does a single indexed row read. In practice Prisma will cache the user record for the request lifecycle, and `/api/v1/verify` already does `auth()` which hydrates the session. Still, worth watching if verify latency grows.
- **`X-RateLimit-Plan` header leaks plan info to observers.** It's shown to the client making the request (who already knows their plan) but also visible in response logs if anyone's watching. Not sensitive — but worth knowing.

## Track A #6 — VerifyToolUsed event wiring

The `VerifyToolUsed` event was declared in `lib/analytics/plausible.ts` with a four-value `result` enum (`ok | signature_mismatch | scan_failed | unknown_image`) but never fired. The admin analytics dashboard had an empty cell for it. Wired in `components/sections/verify/VerifyTool.tsx`.

### What shipped

`VerifyTool.run()` now fires `trackEvent("VerifyToolUsed", { result })` on every code path that reaches a terminal state:

- **429 rate-limited** → `unknown_image` (surfaces rate-limit pressure in Plausible)
- **400 bad request** → `unknown_image`
- **Network error in the catch block** → `unknown_image`
- **Success path** — maps `ApiVerifyResult.status` through:
  - `verified` / `signed` → `ok`
  - `invalid` → `signature_mismatch` (signature bad OR CVE count over threshold — both are trust-signal failures)
  - `unsigned` → `scan_failed` (no signature is itself a failure mode distinct from "can't find it")
  - anything else → `unknown_image`

The mapping is documented inline so the rationale survives future API changes. If the API status enum widens, this mapping is the one place to update.

### Verification

After deploying to a Plausible-configured environment, firing a handful of verifies with each example button should yield:

- `public.ecr.aws/flareo/vaultwarden:latest` → result=ok
- `ghcr.io/sigstore/cosign:v2.4.1` → result=ok (signed by the sigstore team; our verifier treats that as "signed" → `ok`)
- `nginx:1.27` → result=scan_failed (unsigned)
- `alpine:3.20` → result=scan_failed (unsigned)
- Any random string like `not-a-real-image` → result=unknown_image

The admin analytics dashboard's Plausible event summary should populate once a few events land.

## Track A progress

- ✅ #1 Private module submission flow
- ✅ #2 DLQ dismissal UI
- ✅ #3 Canary rebuild observability
- ✅ #5 Plan-aware rate limits — this session
- ✅ #6 VerifyToolUsed event wiring — this session
- ⏸️ #4 Build log streaming — not yet started; the biggest remaining Track A item

Track A is effectively complete for the "show all features" goal except for #4 (build log streaming), which is a bigger session on its own because it requires worker-side incremental log writes and a streaming endpoint on the main app. Everything else advertised on the pricing page, documented in the runbooks, or hinted at in the admin UI now works end-to-end.
