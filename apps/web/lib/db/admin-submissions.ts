/**
 * Admin-side submission queries. Gated behind role="admin" at the
 * endpoint level, not here — these functions trust the caller has
 * already checked.
 *
 * The lifecycle states managed here:
 *
 *   pending → approved | rejected | changes_requested
 *   approved → building (claimed by worker) → built | failed | scan_rejected
 *   changes_requested → pending (resubmitted) | rejected
 *   failed (system error) → approved (retry) | rejected
 */

import { prisma } from "./prisma";

/**
 * Accessor for the SubmissionAudit table. Cast through `unknown`
 * because the generated Prisma client types lag behind schema
 * changes in some environments. The underlying runtime client
 * always has the delegate after `prisma generate`.
 */
interface SubmissionAuditDelegate {
  create(args: {
    data: {
      submissionId: string;
      reviewerId: string;
      action: string;
      notes: string | null;
      grantedNetwork?: boolean;
    };
  }): Promise<unknown>;
}
function auditTable(): SubmissionAuditDelegate {
  return (
    prisma as unknown as { submissionAudit: SubmissionAuditDelegate }
  ).submissionAudit;
}

export interface AdminSubmission {
  id: string;
  moduleName: string; // = slug
  version: string;
  author: string;
  submittedAt: string; // ISO
  status: string;
  /** "public" | "private" — catalog visibility the submission targets. */
  visibility: string;
  dockerfileUrl: string | null;
  requiresNetwork: boolean;
  buildStartedAt: string | null;
  buildCompletedAt: string | null;
  buildErrorKind: string | null;
  buildErrorMessage: string | null;
  buildLogUrl: string | null;
  resultImageRef: string | null;
  resultDigest: string | null;
  resultSbomUrl: string | null;
  resultRekorIndex: string | null;
  submitter: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: string;
  } | null;
  flags: AdminSubmissionFlags;
  decidedAt: string | null;
  decidedById: string | null;
}

export interface AdminSubmissionFlags {
  slug: string;
  description: string;
  category: string;
  license: string;
  upstreamUrl: string;
  contactEmail: string;
  submittedByUserId?: string | null;
  submittedByEmail?: string | null;
  dockerfile?: string | null;
}

// Shape returned by Prisma. Keep type-compatible even before the new
// columns land in the Prisma client — they're nullable so older rows
// still satisfy this shape.
interface SubmissionRow {
  id: string;
  moduleName: string;
  version: string;
  author: string;
  submittedAt: Date;
  status: string;
  flagsJson: string;
  dockerfileUrl: string | null;
  requiresNetwork: boolean;
  buildStartedAt: Date | null;
  buildCompletedAt: Date | null;
  buildErrorKind: string | null;
  buildErrorMessage: string | null;
  buildLogUrl: string | null;
  resultImageRef: string | null;
  resultDigest: string | null;
  resultSbomUrl: string | null;
  resultRekorIndex: string | null;
  submitterId: string | null;
  decidedAt: Date | null;
  decidedById: string | null;
  // Visibility of the targeted module. Pre-migration rows default to
  // "public" via the column default, so older rows satisfy this
  // shape without a backfill.
  visibility?: string | null;
}

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
}

function parseFlags(flagsJson: string): AdminSubmissionFlags {
  try {
    return JSON.parse(flagsJson) as AdminSubmissionFlags;
  } catch {
    return {
      slug: "",
      description: "",
      category: "",
      license: "",
      upstreamUrl: "",
      contactEmail: "",
    };
  }
}

function rowToAdminSubmission(
  row: SubmissionRow,
  submitter: UserRow | null
): AdminSubmission {
  return {
    id: row.id,
    moduleName: row.moduleName,
    version: row.version,
    author: row.author,
    submittedAt: row.submittedAt.toISOString(),
    status: row.status,
    visibility: row.visibility ?? "public",
    dockerfileUrl: row.dockerfileUrl,
    requiresNetwork: row.requiresNetwork,
    buildStartedAt: row.buildStartedAt?.toISOString() ?? null,
    buildCompletedAt: row.buildCompletedAt?.toISOString() ?? null,
    buildErrorKind: row.buildErrorKind,
    buildErrorMessage: row.buildErrorMessage,
    buildLogUrl: row.buildLogUrl,
    resultImageRef: row.resultImageRef,
    resultDigest: row.resultDigest,
    resultSbomUrl: row.resultSbomUrl,
    resultRekorIndex: row.resultRekorIndex,
    submitter: submitter
      ? {
          id: submitter.id,
          name: submitter.name,
          email: submitter.email,
          image: submitter.image,
          createdAt: submitter.createdAt.toISOString(),
        }
      : null,
    flags: parseFlags(row.flagsJson),
    decidedAt: row.decidedAt?.toISOString() ?? null,
    decidedById: row.decidedById,
  };
}

// ─── Queries ─────────────────────────────────────────────────────────

export interface ListSubmissionsFilter {
  status?: string | string[];
  minAgeHours?: number;
  limit?: number;
}

/**
 * List submissions for the admin queue. Default: pending only,
 * sorted oldest-first so SLA violations surface.
 */
export async function listAdminSubmissions(
  filter: ListSubmissionsFilter = {}
): Promise<AdminSubmission[]> {
  const statuses = filter.status
    ? Array.isArray(filter.status)
      ? filter.status
      : [filter.status]
    : ["pending"];

  const where: Record<string, unknown> = { status: { in: statuses } };
  if (filter.minAgeHours) {
    const cutoff = new Date(Date.now() - filter.minAgeHours * 3600 * 1000);
    where.submittedAt = { lt: cutoff };
  }

  const rows = (await prisma.submission.findMany({
    where,
    orderBy: { submittedAt: "asc" }, // oldest first
    take: filter.limit ?? 50,
  })) as SubmissionRow[];

  // Batch-load submitters. Avoids N+1.
  const submitterIds = Array.from(
    new Set(rows.map((r) => r.submitterId).filter((s): s is string => !!s))
  );
  const submitters =
    submitterIds.length > 0
      ? ((await prisma.user.findMany({
          where: { id: { in: submitterIds } },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        })) as UserRow[])
      : [];
  const byId = new Map(submitters.map((u) => [u.id, u]));

  return rows.map((r) =>
    rowToAdminSubmission(r, r.submitterId ? byId.get(r.submitterId) ?? null : null)
  );
}

/**
 * Load one submission with its submitter, for the detail view.
 */
export async function getAdminSubmission(
  id: string
): Promise<AdminSubmission | null> {
  const row = (await prisma.submission.findUnique({
    where: { id },
  })) as SubmissionRow | null;
  if (!row) return null;

  let submitter: UserRow | null = null;
  if (row.submitterId) {
    submitter = (await prisma.user.findUnique({
      where: { id: row.submitterId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    })) as UserRow | null;
  }

  return rowToAdminSubmission(row, submitter);
}

/**
 * Find submissions "similar" to this one. Used in the detail view to
 * detect repeat submissions (same user re-trying after rejection) and
 * multi-account abuse (same upstream URL from different accounts).
 *
 * Similarity is intentionally loose: any of:
 *   - same upstream URL
 *   - same slug as a recent rejection
 *   - same submitter, any prior submission
 */
export async function findSimilarSubmissions(
  submission: AdminSubmission
): Promise<AdminSubmission[]> {
  const conditions: Record<string, unknown>[] = [];
  if (submission.flags.upstreamUrl) {
    conditions.push({
      flagsJson: { contains: submission.flags.upstreamUrl },
    });
  }
  conditions.push({ moduleName: submission.moduleName });
  if (submission.submitter?.id) {
    conditions.push({ submitterId: submission.submitter.id });
  }

  const rows = (await prisma.submission.findMany({
    where: {
      OR: conditions,
      NOT: { id: submission.id },
    },
    orderBy: { submittedAt: "desc" },
    take: 10,
  })) as SubmissionRow[];

  return rows.map((r) => rowToAdminSubmission(r, null));
}

// ─── State transitions ──────────────────────────────────────────────

export interface ApproveArgs {
  submissionId: string;
  reviewerId: string;
  notes?: string;
  grantNetwork?: boolean;
}

export async function approveSubmission(
  args: ApproveArgs
): Promise<AdminSubmission | null> {
  const existing = (await prisma.submission.findUnique({
    where: { id: args.submissionId },
  })) as SubmissionRow | null;
  if (!existing) return null;

  // Only approvable if currently pending or changes_requested.
  // Retrying a system-failed build uses a separate function.
  if (existing.status !== "pending" && existing.status !== "changes_requested") {
    return null;
  }

  const row = (await prisma.submission.update({
    where: { id: args.submissionId },
    data: {
      status: "approved",
      decidedAt: new Date(),
      decidedById: args.reviewerId,
      requiresNetwork: args.grantNetwork ?? false,
    },
  })) as SubmissionRow;

  await auditTable().create({
    data: {
      submissionId: args.submissionId,
      reviewerId: args.reviewerId,
      action: "approved",
      notes: args.notes ?? null,
      grantedNetwork: args.grantNetwork ?? false,
    },
  });

  return rowToAdminSubmission(row, null);
}

export interface RejectArgs {
  submissionId: string;
  reviewerId: string;
  reason: string; // Required — this is the email body.
  /**
   * True when this rejection is the "give up" action on a dead-
   * lettered row. Tagged in the audit log so admins can distinguish
   * normal rejections (reviewer deemed the submission unfit) from
   * DLQ give-ups (build failed repeatedly, human declared the cause
   * persistent). Same Submission.status outcome in both cases; the
   * difference lives in the audit trail.
   */
  fromDlq?: boolean;
}

export async function rejectSubmission(
  args: RejectArgs
): Promise<AdminSubmission | null> {
  const existing = (await prisma.submission.findUnique({
    where: { id: args.submissionId },
  })) as SubmissionRow | null;
  if (!existing) return null;

  // Rejection is valid from any non-terminal state. Terminal states:
  // built, rejected. You can reject from pending, changes_requested,
  // failed, scan_rejected, worker_failures, even approved (rare —
  // reviewer had second thoughts before worker started).
  if (existing.status === "built" || existing.status === "rejected") {
    return null;
  }

  const row = (await prisma.submission.update({
    where: { id: args.submissionId },
    data: {
      status: "rejected",
      decidedAt: new Date(),
      decidedById: args.reviewerId,
    },
  })) as SubmissionRow;

  // Audit log distinguishes DLQ give-ups from normal rejections.
  // The action value stays "rejected" for both (status is what the
  // outer world observes) but the notes prefix makes the origin
  // searchable in audit queries.
  const auditNotes = args.fromDlq
    ? `[gave up on DLQ] ${args.reason}`
    : args.reason;

  await auditTable().create({
    data: {
      submissionId: args.submissionId,
      reviewerId: args.reviewerId,
      action: "rejected",
      notes: auditNotes,
    },
  });

  return rowToAdminSubmission(row, null);
}

export interface RequestChangesArgs {
  submissionId: string;
  reviewerId: string;
  message: string; // Required — this is the email body.
}

export async function requestChanges(
  args: RequestChangesArgs
): Promise<AdminSubmission | null> {
  const existing = (await prisma.submission.findUnique({
    where: { id: args.submissionId },
  })) as SubmissionRow | null;
  if (!existing || existing.status !== "pending") return null;

  const row = (await prisma.submission.update({
    where: { id: args.submissionId },
    data: {
      status: "changes_requested",
    },
  })) as SubmissionRow;

  await auditTable().create({
    data: {
      submissionId: args.submissionId,
      reviewerId: args.reviewerId,
      action: "requested_changes",
      notes: args.message,
    },
  });

  return rowToAdminSubmission(row, null);
}

export interface RetryArgs {
  submissionId: string;
  reviewerId: string;
}

/**
 * Retry a system-failed build. Valid for two statuses:
 *   - "failed"           with buildErrorKind="system" — the
 *                        classic case: a transient system error
 *                        that didn't exhaust the retry budget but
 *                        an admin wants to kick sooner.
 *   - "worker_failures"  — DLQ rows. These exhausted the automated
 *                        retry budget (MAX_TOTAL_ATTEMPTS) and parked
 *                        themselves for human review. An admin can
 *                        decide the underlying infra issue is fixed
 *                        and request another run.
 *
 * User-caused failures ("user") and scan rejections ("scan") can't
 * be retried through this path — the submitter has to fix their
 * Dockerfile and resubmit. Those terminal states return null.
 *
 * Critically, we reset `attemptCount` to 0 and `availableAfter` to
 * null when flipping back to "approved". Without the reset, a DLQ
 * row with attemptCount=3 would re-dead-letter on its very first
 * system failure after retry — usable once, then stuck again.
 * The reset gives the fresh retry a full MAX_TOTAL_ATTEMPTS budget.
 */
export async function retryBuild(
  args: RetryArgs
): Promise<AdminSubmission | null> {
  const existing = (await prisma.submission.findUnique({
    where: { id: args.submissionId },
  })) as SubmissionRow | null;
  if (!existing) return null;

  // Two allowed source statuses. DLQ rows don't need a
  // buildErrorKind check because `worker_failures` is only reached
  // via the system-failure retry ladder, so kind is always "system".
  const isSystemFailed =
    existing.status === "failed" && existing.buildErrorKind === "system";
  const isDeadLettered = existing.status === "worker_failures";
  if (!isSystemFailed && !isDeadLettered) {
    return null;
  }

  const row = (await prisma.submission.update({
    where: { id: args.submissionId },
    data: {
      status: "approved",
      buildStartedAt: null,
      buildCompletedAt: null,
      buildErrorKind: null,
      buildErrorMessage: null,
      // Reset retry accounting. The next failure starts fresh with
      // the full MAX_TOTAL_ATTEMPTS budget, and the worker's claim
      // query picks the row up immediately (availableAfter = null).
      ...({
        attemptCount: 0,
        availableAfter: null,
      } as Record<string, unknown>),
    } as never,
  })) as SubmissionRow;

  await auditTable().create({
    data: {
      submissionId: args.submissionId,
      reviewerId: args.reviewerId,
      action: "retried",
      notes: isDeadLettered ? "retried from DLQ" : null,
    },
  });

  return rowToAdminSubmission(row, null);
}

// ─── Queue stats for the top of the admin page ──────────────────────

export interface QueueStats {
  pendingCount: number;
  oldestPendingHours: number | null;
  builtLast24h: number;
  failedLast24h: number;
  /** Rows currently parked in worker_failures awaiting human action. */
  deadLetteredCount: number;
}

export async function getQueueStats(): Promise<QueueStats> {
  const day = new Date(Date.now() - 24 * 3600 * 1000);

  const [pending, oldest, built, failed, deadLettered] = await Promise.all([
    prisma.submission.count({ where: { status: "pending" } }),
    prisma.submission.findFirst({
      where: { status: "pending" },
      orderBy: { submittedAt: "asc" },
      select: { submittedAt: true },
    }),
    prisma.submission.count({
      where: { status: "built", buildCompletedAt: { gte: day } },
    }),
    prisma.submission.count({
      where: {
        status: { in: ["failed", "scan_rejected"] },
        buildCompletedAt: { gte: day },
      },
    }),
    prisma.submission.count({ where: { status: "worker_failures" } }),
  ]);

  const oldestRow = oldest as { submittedAt: Date } | null;
  return {
    pendingCount: pending,
    oldestPendingHours: oldestRow
      ? Math.floor(
          (Date.now() - oldestRow.submittedAt.getTime()) / (3600 * 1000)
        )
      : null,
    builtLast24h: built,
    failedLast24h: failed,
    deadLetteredCount: deadLettered,
  };
}
