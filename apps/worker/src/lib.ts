/**
 * Pure helpers used by the worker pipeline. Extracted from
 * `index.ts` and `db.ts` so they can be unit-tested without
 * spinning up the worker context (Prisma client, queue, sentry).
 *
 * Anything in this file MUST be:
 *   - Pure: no I/O, no side effects, no external state
 *   - Synchronous: tested with vitest's plain `expect`
 *   - Free of imports from anywhere except types
 *
 * The retry / backoff helpers MIRROR the logic in db.ts. They're
 * extracted for testability; the source of truth lives in
 * `markFailedOrRetry`. If you change retry semantics, change BOTH
 * places (and add a test here that catches the divergence).
 */

/**
 * Bucket Trivy CVE list into per-severity counts. Trivy's severity
 * strings are uppercase ("CRITICAL", "HIGH", "MEDIUM", "LOW",
 * "UNKNOWN") and we store them as-emitted; the policy evaluator
 * expects integer counts per bucket, so this is the conversion.
 *
 * UNKNOWN-severity findings don't map cleanly to any policy bucket;
 * we treat them like LOW for counting purposes (consistent with how
 * Trivy itself defaults its --severity filter — UNKNOWN is in the
 * permissive tier).
 */
export function countBySeverity(
  cves: { severity: string }[],
): { critical: number; high: number; medium: number; low: number } {
  const out = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const cve of cves) {
    switch (cve.severity.toUpperCase()) {
      case "CRITICAL":
        out.critical += 1;
        break;
      case "HIGH":
        out.high += 1;
        break;
      case "MEDIUM":
        out.medium += 1;
        break;
      case "LOW":
      case "UNKNOWN":
        out.low += 1;
        break;
    }
  }
  return out;
}

/**
 * Mirror of MAX_TOTAL_ATTEMPTS in db.ts. Kept here so the pure
 * helpers don't import from db.ts (which would pull Prisma into
 * the test bundle). If you change this, change it in db.ts too.
 */
export const MAX_TOTAL_ATTEMPTS = 3;

/**
 * Decide whether to retry or dead-letter, given the attemptCount
 * AT THE TIME OF FAILURE (i.e. the attemptCount field as stored on
 * the Submission row before this failure increments it).
 *
 * Mirrors `if (nextAttempt >= MAX_TOTAL_ATTEMPTS) → dead_letter`
 * from db.ts:markFailedOrRetry, where `nextAttempt = attemptCount + 1`.
 *
 * Examples (with MAX_TOTAL_ATTEMPTS=3):
 *   attemptCount=0 (first failure)  -> nextAttempt=1 -> retry
 *   attemptCount=1 (second failure) -> nextAttempt=2 -> retry
 *   attemptCount=2 (third failure)  -> nextAttempt=3 -> dead-letter
 *
 * So with the default of 3, you get 2 retries (3 total attempts)
 * before dead-letter, which matches the operator-facing docstring
 * "MAX_TOTAL_ATTEMPTS-1 backoff-and-retry cycles before the row
 * is parked."
 */
export function shouldRetry(
  attemptCount: number,
  maxAttempts: number = MAX_TOTAL_ATTEMPTS,
): "retry" | "dead-letter" {
  const nextAttempt = attemptCount + 1;
  if (nextAttempt >= maxAttempts) {
    return "dead-letter";
  }
  return "retry";
}

/**
 * Step-function backoff matching `backoffFor` in db.ts.
 *
 * The argument is `accumulatedFailures`, which equals `nextAttempt`
 * in the caller (i.e. the count INCLUDING this failure). With
 * MAX_TOTAL_ATTEMPTS=3, the realistic input range is 1-2; the
 * 15-minute fallback at 3+ exists for safety but is unreachable
 * under current configuration because the caller dead-letters first.
 *
 *   accumulatedFailures=1   -> 60_000   (1 minute)
 *   accumulatedFailures=2   -> 300_000  (5 minutes)
 *   accumulatedFailures>=3  -> 900_000  (15 minutes — fallback only)
 */
export function backoffMs(accumulatedFailures: number): number {
  if (accumulatedFailures <= 1) return 60_000;
  if (accumulatedFailures === 2) return 300_000;
  return 900_000;
}
