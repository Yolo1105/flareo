/**
 * Worker dashboard queries.
 *
 * The 5-numbers-at-8-AM check. Intentionally not a full observability
 * stack — just what the Q1 plan's Week 14 section calls out:
 *
 *   "Queue depth dashboard. Simple page at /app/admin/worker showing
 *    queued count, in-flight build, recent wins/losses. Not a full
 *    observability stack; just the 5 numbers I'd check at 8 AM."
 *
 * The five numbers:
 *   1. approvedQueued     — waiting for the worker to pick up
 *   2. building            — in-flight right now (0 or 1 in the current
 *                            one-worker design)
 *   3. oldestApprovedHours — "is the worker stalled?"
 *   4. builtLastHour       — throughput signal (wins)
 *   5. failedLastHour      — throughput signal (losses)
 *
 * Plus a derived `signal` ∈ {green, amber, red} with a one-line reason,
 * for the "at-a-glance did-anything-break" read at the top of the page.
 *
 * We also return the current in-flight build (so operators can see
 * slug + elapsed time) and the last N terminal-state submissions
 * (so operators can spot consecutive-failure patterns quickly).
 *
 * Read-only. Nothing here mutates. Writes to Submission come from the
 * worker's callbacks, not this layer.
 */

import { prisma } from "./prisma";

export interface WorkerDashboardStats {
  approvedQueued: number;
  building: number;
  oldestApprovedHours: number | null;
  builtLastHour: number;
  failedLastHour: number;
  scanRejectedLastHour: number;
  medianBuildDurationMs: number | null;
  /**
   * Total rows currently sitting in the dead-letter queue
   * ("worker_failures" status). These are submissions that exhausted
   * the 3-attempt system-error retry budget and need a human to
   * investigate before either retrying or rejecting them.
   *
   * When >0, the dashboard shows a dedicated banner steering the
   * operator to the DLQ filter on /app/admin.
   */
  deadLetterCount: number;
  signal: "green" | "amber" | "red";
  signalReason: string;
}

export interface InFlightBuild {
  submissionId: string;
  moduleName: string;
  version: string;
  buildStartedAt: Date;
  elapsedSec: number;
  requiresNetwork: boolean;
}

export type TerminalStatus =
  | "built"
  | "failed"
  | "scan_rejected"
  | "worker_failures";

export interface RecentTerminal {
  submissionId: string;
  moduleName: string;
  version: string;
  status: TerminalStatus;
  buildStartedAt: Date | null;
  buildCompletedAt: Date | null;
  durationMs: number | null;
  buildErrorKind: string | null;
  buildErrorMessage: string | null;
}

/**
 * Compute the five headline numbers plus the health signal.
 *
 * Runs 7 queries in parallel; each is an index scan (status, or
 * status+buildCompletedAt covered by the compound index). Should be
 * sub-100ms on any realistic catalog size.
 */
export async function getWorkerDashboardStats(): Promise<WorkerDashboardStats> {
  const hourAgo = new Date(Date.now() - 3600 * 1000);

  const [
    approvedQueued,
    building,
    oldestApproved,
    builtLastHour,
    failedLastHour,
    scanRejectedLastHour,
    recentBuilt,
    deadLetterCount,
  ] = await Promise.all([
    prisma.submission.count({ where: { status: "approved" } }),
    prisma.submission.count({ where: { status: "building" } }),
    prisma.submission.findFirst({
      where: { status: "approved" },
      orderBy: { submittedAt: "asc" },
      select: { submittedAt: true },
    }),
    prisma.submission.count({
      where: { status: "built", buildCompletedAt: { gte: hourAgo } },
    }),
    prisma.submission.count({
      where: { status: "failed", buildCompletedAt: { gte: hourAgo } },
    }),
    prisma.submission.count({
      where: {
        status: "scan_rejected",
        buildCompletedAt: { gte: hourAgo },
      },
    }),
    // Last 20 successful builds for the median. 20 is arbitrary but
    // enough to damp down the signal without needing a rolling window.
    prisma.submission.findMany({
      where: {
        status: "built",
        buildStartedAt: { not: null },
        buildCompletedAt: { not: null },
      },
      orderBy: { buildCompletedAt: "desc" },
      take: 20,
      select: { buildStartedAt: true, buildCompletedAt: true },
    }),
    // DLQ count is an all-time count (not a sliding window) because
    // a submission in worker_failures stays there until a human
    // acts on it. The number only shrinks via admin action; letting
    // it go unbounded would just be honest.
    prisma.submission.count({ where: { status: "worker_failures" } }),
  ]);

  const oldestRow = oldestApproved as { submittedAt: Date } | null;
  const oldestApprovedHours = oldestRow
    ? Math.floor(
        (Date.now() - oldestRow.submittedAt.getTime()) / (3600 * 1000),
      )
    : null;

  // Median build duration. Using the true median (middle element of
  // the sorted array) rather than mean so one 10-minute outlier doesn't
  // skew the number operators look at.
  type DurationRow = {
    buildStartedAt: Date | null;
    buildCompletedAt: Date | null;
  };
  const durations = (recentBuilt as DurationRow[])
    .filter(
      (r): r is { buildStartedAt: Date; buildCompletedAt: Date } =>
        r.buildStartedAt !== null && r.buildCompletedAt !== null,
    )
    .map((r) => r.buildCompletedAt.getTime() - r.buildStartedAt.getTime())
    .sort((a, b) => a - b);
  const medianBuildDurationMs =
    durations.length > 0 ? durations[Math.floor(durations.length / 2)] : null;

  // Health signal, in rough severity order.
  //
  // RED when:
  //   - oldest approved submission > 24h (worker clearly not picking up),
  //   - or more than 10 failures in the last hour (something is
  //     systematically broken; this threshold is deliberately generous
  //     because one bad Dockerfile pattern can spray 3-5 fails),
  //   - or dead-letter queue has 5+ entries (retry budget has been
  //     blown through multiple times; systemic issue).
  //
  // AMBER when:
  //   - queue has items, nothing is building, and oldest > 6h (worker
  //     might be stalled but not obviously stuck yet), or
  //   - 6-10 failures in the last hour (elevated but not catastrophic),
  //   - or DLQ has 1-4 entries (human action needed, but not urgent).
  //
  // GREEN otherwise.
  let signal: "green" | "amber" | "red" = "green";
  let signalReason = "Queue flowing; no alerts.";

  const totalFailuresLastHour = failedLastHour + scanRejectedLastHour;

  if (oldestApprovedHours !== null && oldestApprovedHours > 24) {
    signal = "red";
    signalReason = `Oldest approved submission is ${oldestApprovedHours}h old. Worker likely stalled — check systemd on the build host.`;
  } else if (totalFailuresLastHour > 10) {
    signal = "red";
    signalReason = `${totalFailuresLastHour} failures in the last hour. Check Sentry for a systemic issue.`;
  } else if (deadLetterCount >= 5) {
    signal = "red";
    signalReason = `${deadLetterCount} submissions in DLQ. Retry budget repeatedly exhausted — check /app/admin?status=worker_failures.`;
  } else if (
    approvedQueued > 0 &&
    building === 0 &&
    oldestApprovedHours !== null &&
    oldestApprovedHours > 6
  ) {
    signal = "amber";
    signalReason = `${approvedQueued} submission(s) approved, nothing building, oldest ${oldestApprovedHours}h. Worker may be stuck.`;
  } else if (totalFailuresLastHour >= 6) {
    signal = "amber";
    signalReason = `${totalFailuresLastHour} failures in the last hour. Elevated, worth a look.`;
  } else if (deadLetterCount > 0) {
    signal = "amber";
    signalReason = `${deadLetterCount} submission(s) in DLQ awaiting human review.`;
  }

  return {
    approvedQueued,
    building,
    oldestApprovedHours,
    builtLastHour,
    failedLastHour,
    scanRejectedLastHour,
    medianBuildDurationMs,
    deadLetterCount,
    signal,
    signalReason,
  };
}

/**
 * The submission the worker is currently building, if any. With one
 * worker this is 0 or 1 rows; we order by buildStartedAt DESC anyway
 * so the behavior is sensible if we ever scale to multiple workers
 * and show the freshest one here.
 */
export async function getInFlightBuild(): Promise<InFlightBuild | null> {
  const row = (await prisma.submission.findFirst({
    where: { status: "building" },
    orderBy: { buildStartedAt: "desc" },
    select: {
      id: true,
      moduleName: true,
      version: true,
      buildStartedAt: true,
      requiresNetwork: true,
    },
  })) as {
    id: string;
    moduleName: string;
    version: string;
    buildStartedAt: Date | null;
    requiresNetwork: boolean;
  } | null;

  if (!row || !row.buildStartedAt) return null;

  return {
    submissionId: row.id,
    moduleName: row.moduleName,
    version: row.version,
    buildStartedAt: row.buildStartedAt,
    elapsedSec: Math.floor(
      (Date.now() - row.buildStartedAt.getTime()) / 1000,
    ),
    requiresNetwork: row.requiresNetwork,
  };
}

/**
 * The last N submissions that ended in a terminal state. Used to spot
 * consecutive-failure patterns ("three scan_rejected in a row —
 * something upstream is bad") at a glance.
 */
export async function getRecentTerminalSubmissions(
  limit: number,
): Promise<RecentTerminal[]> {
  const rows = (await prisma.submission.findMany({
    where: {
      status: {
        in: ["built", "failed", "scan_rejected", "worker_failures"],
      },
      buildCompletedAt: { not: null },
    },
    orderBy: { buildCompletedAt: "desc" },
    take: limit,
    select: {
      id: true,
      moduleName: true,
      version: true,
      status: true,
      buildStartedAt: true,
      buildCompletedAt: true,
      buildErrorKind: true,
      buildErrorMessage: true,
    },
  })) as Array<{
    id: string;
    moduleName: string;
    version: string;
    status: string;
    buildStartedAt: Date | null;
    buildCompletedAt: Date | null;
    buildErrorKind: string | null;
    buildErrorMessage: string | null;
  }>;

  return rows.map((r) => ({
    submissionId: r.id,
    moduleName: r.moduleName,
    version: r.version,
    status: r.status as TerminalStatus,
    buildStartedAt: r.buildStartedAt,
    buildCompletedAt: r.buildCompletedAt,
    durationMs:
      r.buildStartedAt && r.buildCompletedAt
        ? r.buildCompletedAt.getTime() - r.buildStartedAt.getTime()
        : null,
    buildErrorKind: r.buildErrorKind,
    buildErrorMessage: r.buildErrorMessage,
  }));
}
