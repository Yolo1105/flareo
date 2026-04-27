/**
 * Rate limiting for v1 public API endpoints.
 *
 * Production: Upstash Redis (REST API, works from Vercel's edge and
 * serverless functions without connection-pooling drama). Free tier
 * gives 10,000 commands per day which is enough for the closed beta.
 *
 * Development: in-memory sliding window. Data is lost on server restart
 * but that's fine for `npm run dev`.
 *
 * The two paths share a common `checkLimit()` contract so call sites
 * don't know or care which backend is live.
 *
 * Environment variables:
 *   UPSTASH_REDIS_REST_URL   set → production mode
 *   UPSTASH_REDIS_REST_TOKEN set → production mode
 *   if either is missing, falls back to in-memory
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { PLAN_LIMITS, type PlanKey } from "@/lib/billing/quota";

export type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the caller can retry. */
  retryAfter: number;
  /** Which plan's multiplier shaped this bucket. */
  plan: PlanKey;
};

export type LimitBucket =
  | "verify-anon"
  | "verify-auth"
  | "modules-list"
  | "auth-signin"
  | "user-writes"
  | "whoami";

// ─── shared config ───────────────────────────────────────────────

interface BucketConfig {
  /** Max requests per window. */
  limit: number;
  /** Window size in seconds. */
  windowSeconds: number;
}

const BUCKETS: Record<LimitBucket, BucketConfig> = {
  // /api/v1/verify without an auth token.
  "verify-anon": { limit: 60, windowSeconds: 3600 },
  // /api/v1/verify with an API key or NextAuth session.
  "verify-auth": { limit: 600, windowSeconds: 3600 },
  // /api/v1/modules listing.
  "modules-list": { limit: 300, windowSeconds: 3600 },
  // Auth endpoints — keep the tight limit so a brute-force attempt
  // against signin or similar auth-state-changing endpoints can't be
  // amplified by burning unrelated user actions on the same bucket.
  "auth-signin": { limit: 10, windowSeconds: 600 },
  // Authenticated "write something" endpoints where the act isn't
  // authenticating — posting reviews, flagging reviews, filing
  // reports, editing profile, etc. Prevents any single user-write
  // endpoint from running unconstrained, while giving enough headroom
  // that a user who just wrote a review doesn't get locked out of
  // editing their own profile two minutes later. Deliberately more
  // generous than auth-signin because these don't gate authentication.
  "user-writes": { limit: 60, windowSeconds: 600 },
  // /api/v1/whoami.
  "whoami": { limit: 120, windowSeconds: 3600 },
};

// ─── production backend: Upstash ──────────────────────────────────

// Cached limiters, keyed by `${bucket}|${plan}`. Bounded at 2 plans ×
// the number of buckets, so memory impact is negligible. The cache
// isn't invalidated on plan change because a user's plan change
// invalidates their bucket by changing the key suffix anyway.
const upstashLimiters = new Map<string, Ratelimit>();
let upstashClient: Redis | null = null;

function effectiveLimit(bucket: LimitBucket, plan: PlanKey): number {
  const base = BUCKETS[bucket].limit;
  const mult = PLAN_LIMITS[plan].rateLimitMultiplier;
  // Multipliers are positive integers today (free=1, pro=5). Floor
  // defensively so a future fractional multiplier can't produce a
  // non-integer Upstash configuration.
  return Math.floor(base * mult);
}

function getUpstashLimiter(
  bucket: LimitBucket,
  plan: PlanKey,
): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!upstashClient) {
    upstashClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  const cacheKey = `${bucket}|${plan}`;
  let cached = upstashLimiters.get(cacheKey);
  if (!cached) {
    const limit = effectiveLimit(bucket, plan);
    const { windowSeconds } = BUCKETS[bucket];
    cached = new Ratelimit({
      redis: upstashClient,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      // Prefix includes plan so a user upgrading to pro doesn't
      // carry their free-tier counter into the larger bucket.
      prefix: `flareo:ratelimit:${bucket}:${plan}`,
      analytics: false,
    });
    upstashLimiters.set(cacheKey, cached);
  }
  return cached;
}

// ─── dev backend: in-memory sliding window ───────────────────────

interface MemEntry {
  // Timestamps of requests within the window, in ms since epoch.
  hits: number[];
}

const memStore = new Map<string, MemEntry>();

function checkMem(
  bucket: LimitBucket,
  key: string,
  plan: PlanKey,
  now: number,
): LimitResult {
  const limit = effectiveLimit(bucket, plan);
  const { windowSeconds } = BUCKETS[bucket];
  const windowMs = windowSeconds * 1000;
  // Plan included in the storage key so the same user ID counted under
  // free and the same user ID after upgrade don't share a counter.
  const storageKey = `${bucket}:${plan}:${key}`;
  const entry = memStore.get(storageKey) ?? { hits: [] };

  // Drop hits outside the window.
  const cutoff = now - windowMs;
  entry.hits = entry.hits.filter((t) => t > cutoff);

  if (entry.hits.length >= limit) {
    const oldestHit = entry.hits[0];
    const retryAfter = Math.ceil((oldestHit + windowMs - now) / 1000);
    memStore.set(storageKey, entry);
    return {
      success: false,
      limit,
      remaining: 0,
      retryAfter: Math.max(1, retryAfter),
      plan,
    };
  }

  entry.hits.push(now);
  memStore.set(storageKey, entry);
  return {
    success: true,
    limit,
    remaining: limit - entry.hits.length,
    retryAfter: 0,
    plan,
  };
}

// ─── public contract ──────────────────────────────────────────────

/**
 * Check (and count) one request against the bucket for this key.
 *
 * `key` should be the most specific identifier you have. Order of
 * preference: authenticated user ID > API key ID > IP. The caller
 * decides which one is appropriate for the route.
 *
 * Optional `plan` scales the bucket limit by the plan's
 * `rateLimitMultiplier`. Anonymous callers should pass "free"
 * (or omit entirely). Routes that already looked up the user's
 * plan for other reasons should pass it to avoid re-fetching.
 */
export async function checkLimit(
  bucket: LimitBucket,
  key: string,
  plan: PlanKey = "free",
): Promise<LimitResult> {
  const upstash = getUpstashLimiter(bucket, plan);
  if (upstash) {
    const result = await upstash.limit(key);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      retryAfter: result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      plan,
    };
  }
  return checkMem(bucket, key, plan, Date.now());
}

/**
 * Build rate-limit response headers per RFC-9331-style convention.
 * Add these to every 200 and 429 response from a rate-limited endpoint.
 */
export function rateLimitHeaders(r: LimitResult): Record<string, string> {
  const h: Record<string, string> = {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Plan": r.plan,
  };
  if (!r.success) {
    h["Retry-After"] = String(r.retryAfter);
  }
  return h;
}

/**
 * Derive a stable rate-limit key from a NextRequest. Looks at auth
 * state first, falls back to IP. In Vercel, the IP comes from
 * `x-forwarded-for`; in dev it comes from the raw connection.
 */
export function keyForRequest(
  userId: string | null | undefined,
  headers: Headers
): string {
  if (userId) return `user:${userId}`;
  const fwd = headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0]!.trim() : "unknown";
  return `ip:${ip}`;
}
