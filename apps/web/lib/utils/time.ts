/**
 * Format an ISO-8601 timestamp as a human-friendly "ago" string.
 * Used across admin queues, submission detail pages, and rebuild
 * history to keep the rendered format consistent.
 *
 * Granularity tiers:
 *   < 1h     → "7m ago"
 *   < 24h    → "3h ago"
 *   ≥ 24h    → "2d ago"
 *
 * Floor of 1m means "just now" always renders as "1m ago". Intentional —
 * keeping one format saves a string branch and avoids operators
 * having to distinguish "just submitted" from a seconds-old row.
 *
 * Accepts an ISO string OR a Date. Tolerant of the common case where
 * callers have either.
 */
export function hoursAgo(at: string | Date): string {
  const iso = typeof at === "string" ? at : at.toISOString();
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diffMs / 3_600_000);
  if (h < 1) {
    const m = Math.max(1, Math.floor(diffMs / 60_000));
    return `${m}m ago`;
  }
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/**
 * Numeric hours-since variant. Rounded floor. Used where the consumer
 * needs the numeric value to decide rendering (e.g. "if >48h, warn").
 */
export function hoursSince(at: string | Date): number {
  const iso = typeof at === "string" ? at : at.toISOString();
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000),
  );
}
