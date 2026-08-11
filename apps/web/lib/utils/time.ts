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

/**
 * Catalog / marketplace display for Module.lastRebuiltAt.
 * Absolute calendar date plus a longer relative hint, e.g.
 * "2026-08-14 · 3 weeks ago". Null/missing → "not yet republished"
 * so the field stays visible when the republish pipeline hasn't run.
 */
export function formatLastRebuiltAt(
  at: string | Date | null | undefined,
): string {
  if (at == null || at === "") return "not yet republished";
  const d = typeof at === "string" ? new Date(at) : at;
  if (Number.isNaN(d.getTime())) return "not yet republished";
  const absolute = d.toISOString().slice(0, 10);
  return `${absolute} · ${relativeAgoLong(d)}`;
}

/** Relative hint used by formatLastRebuiltAt ("3 weeks ago", etc.). */
function relativeAgoLong(d: Date): string {
  const diffMs = Math.max(0, Date.now() - d.getTime());
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
