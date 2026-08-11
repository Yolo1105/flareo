/**
 * Database access for the build worker.
 *
 * The key operation is `claimNextApprovedSubmission`, which uses
 * SELECT ... FOR UPDATE SKIP LOCKED to atomically pick one approved
 * row and flip it to "building". Even though we run one worker on
 * day one, this pattern makes a second worker trivial to add later
 * without any code change.
 *
 * All writes happen via the Prisma client shared with the main app —
 * same schema, same migrations, same source of truth.
 */

import { PrismaClient } from "@prisma/client";

export type WorkerPrisma = PrismaClient;

export function createPrisma(databaseUrl: string): WorkerPrisma {
  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    // Log slow queries only. Normal INFO spam from Prisma is useless
    // in a worker log.
    log: [
      { level: "warn", emit: "stdout" },
      { level: "error", emit: "stdout" },
    ],
  });
}

export interface ApprovedRow {
  id: string;
  moduleName: string;
  version: string;
  author: string;
  submittedAt: Date;
  submitterId: string | null;
  requiresNetwork: boolean;
  dockerfileUrl: string | null;
  flagsJson: string;
  // "public" | "private". Propagated to Module.visibility on publish.
  visibility: string;
  // Number of times this row has been claimed and failed with
  // kind="system". Zero on first pickup; bumped by markFailedOrRetry.
  // Caller passes this to markFailedOrRetry so the decision of
  // "retry vs. dead-letter" is made in the worker's error paths.
  attemptCount: number;
}

/**
 * Atomically claim one approved submission, flipping it to
 * status="building" and setting buildStartedAt. Returns null if
 * nothing is available.
 *
 * Uses a raw SQL transaction because Prisma doesn't expose the
 * SKIP LOCKED primitive we need for safe concurrent polling.
 */
export async function claimNextApprovedSubmission(
  prisma: WorkerPrisma,
  workerId: string
): Promise<ApprovedRow | null> {
  // Interactive $transaction receives Prisma.TransactionClient (not the
  // full PrismaClient), so leave `tx` inferred rather than annotating
  // it as WorkerPrisma.
  return await prisma.$transaction(async (tx) => {
    // Skip rows whose backoff window hasn't elapsed yet. NULL
    // availableAfter means "available immediately" — which is the
    // correct behavior for both never-retried rows and rows from before
    // the retry migration.
    const rows = (await tx.$queryRawUnsafe(
      `SELECT id, "moduleName", version, author, "submittedAt",
              "submitterId", "requiresNetwork", "dockerfileUrl",
              "flagsJson", visibility, "attemptCount"
       FROM "Submission"
       WHERE status = 'approved'
         AND ("availableAfter" IS NULL OR "availableAfter" <= NOW())
       ORDER BY "submittedAt" ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    )) as ApprovedRow[];

    if (rows.length === 0) return null;

    const row = rows[0];
    await tx.$executeRawUnsafe(
      `UPDATE "Submission"
       SET status = 'building',
           "buildStartedAt" = NOW()
       WHERE id = $1`,
      row.id
    );

    // No-op log so the worker's pickup is visible even if the next
    // step takes a while.
    void workerId;
    return row;
  });
}

export interface BuildSuccessInput {
  submissionId: string;
  imageRef: string;
  digest: string;
  sbomUrl: string;
  rekorIndex: string;
  signerIdentity: string;
  signerIssuer: string;
  buildLogUrl: string | null;
}

export async function markBuilt(
  prisma: WorkerPrisma,
  input: BuildSuccessInput
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "Submission"
     SET status = 'built',
         "buildCompletedAt" = NOW(),
         "resultImageRef" = $2,
         "resultDigest" = $3,
         "resultSbomUrl" = $4,
         "resultRekorIndex" = $5,
         "buildLogUrl" = $6
     WHERE id = $1`,
    input.submissionId,
    input.imageRef,
    input.digest,
    input.sbomUrl,
    input.rekorIndex,
    input.buildLogUrl ?? null
  );
}

export interface BuildFailureInput {
  submissionId: string;
  kind: "user" | "system" | "scan";
  message: string;
  buildLogUrl: string | null;
}

export async function markFailed(
  prisma: WorkerPrisma,
  input: BuildFailureInput
): Promise<void> {
  const status = input.kind === "scan" ? "scan_rejected" : "failed";
  await prisma.$executeRawUnsafe(
    `UPDATE "Submission"
     SET status = $2,
         "buildCompletedAt" = NOW(),
         "buildErrorKind" = $3,
         "buildErrorMessage" = $4,
         "buildLogUrl" = $5
     WHERE id = $1`,
    input.submissionId,
    status,
    input.kind,
    input.message,
    input.buildLogUrl ?? null
  );
}

/**
 * Maximum number of total failures a submission can accumulate
 * before being dead-lettered. MAX_TOTAL_ATTEMPTS=3 means a row is
 * allowed to fail up to 3 times (with backoff between failures 1/2
 * and 2/3); the third failure moves the row to `worker_failures`.
 *
 * Trace with attemptCount (the column value = accumulated failures):
 *   - Fresh row (attemptCount=0) fails → attemptCount=1 → wait 1min → retry
 *   - attemptCount=1 fails → attemptCount=2 → wait 5min → retry
 *   - attemptCount=2 fails → attemptCount=3 → DEAD-LETTER
 *
 * Three chances. Two waiting windows. Exported so the admin UI can
 * render "N / 3 attempts" consistently.
 */
export const MAX_TOTAL_ATTEMPTS = 3;

/**
 * Back-compat alias. Old name was ambiguous ("retries" vs "attempts");
 * kept so a stale import elsewhere doesn't break the build while we
 * migrate callers. Remove in a follow-up once grep shows no usages.
 */
export const MAX_SYSTEM_RETRY_ATTEMPTS = MAX_TOTAL_ATTEMPTS;

export interface RetryOrFailInput extends BuildFailureInput {
  /** Current value from the ApprovedRow claim (0 on first pickup). */
  attemptCount: number;
}

/**
 * Failure-path helper that decides between retry and terminal-fail
 * based on the error kind and attempt history.
 *
 *   kind="user"   — always terminal. User's Dockerfile is broken;
 *                   retrying won't help. Behaves identically to
 *                   markFailed.
 *   kind="scan"   — always terminal. The image was built but Trivy
 *                   found critical CVEs. Retrying produces the same
 *                   scan result. Behaves identically to markFailed.
 *   kind="system" — transient; our infrastructure broke. If the row
 *                   has attempts remaining, requeue with exponential
 *                   backoff: 1min after the first failure, 5min
 *                   after the second. After MAX_TOTAL_ATTEMPTS
 *                   failures, move to the worker_failures DLQ
 *                   status for human review.
 *
 * Returns the action that was taken, so the caller can log / alert /
 * capture-to-Sentry appropriately.
 */
export type RetryDecision =
  | { action: "retry"; nextAttempt: number; availableAfter: Date }
  | { action: "dead_letter"; finalAttempt: number }
  | { action: "terminal_user" | "terminal_scan" };

/**
 * Compute the backoff window before the row becomes claimable again.
 *
 * Called right after a failure. The argument is the value that will
 * be written to `Submission.attemptCount` — i.e. the TOTAL number of
 * failures the row has now accumulated (including this one).
 *
 * After 1 accumulated failure, wait 1 min. After 2 accumulated
 * failures, wait 5 min. We never reach 3+ here because the caller
 * dead-letters instead; the fallback exists only for safety.
 */
function backoffFor(accumulatedFailures: number): number {
  if (accumulatedFailures <= 1) return 60 * 1000; // 1 min
  if (accumulatedFailures === 2) return 5 * 60 * 1000; // 5 min
  return 15 * 60 * 1000; // unreachable under current MAX_TOTAL_ATTEMPTS
}

export async function markFailedOrRetry(
  prisma: WorkerPrisma,
  input: RetryOrFailInput
): Promise<RetryDecision> {
  if (input.kind === "user") {
    await markFailed(prisma, input);
    return { action: "terminal_user" };
  }
  if (input.kind === "scan") {
    await markFailed(prisma, input);
    return { action: "terminal_scan" };
  }

  // kind === "system"
  const nextAttempt = input.attemptCount + 1;

  // nextAttempt is the attempt number this failure represents (so
  // first failure → 1, second → 2, etc). Compare >= to dead-letter
  // on the MAX_TOTAL_ATTEMPTS'th failure, giving MAX_TOTAL_ATTEMPTS-1
  // backoff-and-retry cycles before the row is parked.
  if (nextAttempt >= MAX_TOTAL_ATTEMPTS) {
    // Exhausted. Dead-letter so it stops cycling and a human can
    // look. buildCompletedAt is set so the dashboard's last-N
    // table shows it; buildLogUrl points the operator at the final
    // attempt's log.
    await prisma.$executeRawUnsafe(
      `UPDATE "Submission"
       SET status = 'worker_failures',
           "buildCompletedAt" = NOW(),
           "buildErrorKind" = 'system',
           "buildErrorMessage" = $2,
           "buildLogUrl" = $3,
           "attemptCount" = $4
       WHERE id = $1`,
      input.submissionId,
      input.message,
      input.buildLogUrl ?? null,
      nextAttempt
    );
    return { action: "dead_letter", finalAttempt: nextAttempt };
  }

  // Requeue with backoff. Status flips back to "approved" so the
  // claim query picks it up again once availableAfter passes.
  // buildCompletedAt stays NULL — this attempt isn't terminal.
  const availableAfter = new Date(Date.now() + backoffFor(nextAttempt));
  await prisma.$executeRawUnsafe(
    `UPDATE "Submission"
     SET status = 'approved',
         "attemptCount" = $2,
         "availableAfter" = $3,
         "buildStartedAt" = NULL,
         "buildErrorKind" = 'system',
         "buildErrorMessage" = $4,
         "buildLogUrl" = $5
     WHERE id = $1`,
    input.submissionId,
    nextAttempt,
    availableAfter,
    input.message,
    input.buildLogUrl ?? null
  );
  return {
    action: "retry",
    nextAttempt,
    availableAfter,
  };
}

/**
 * Create a Module row in the catalog tied to this submission. Called
 * after markBuilt when the build succeeded.
 *
 * Returns whether the insertion actually happened — if the slug was
 * taken in a race window, we log and skip.
 */
export async function publishModuleFromSubmission(
  prisma: WorkerPrisma,
  args: {
    row: ApprovedRow;
    imageRef: string;
    digest: string;
    sbomUrl: string;
    sbomPackages: number;
    trivyUrl: string | null;
    rekorIndex: string;
    signerIdentity: string;
    signerIssuer: string;
    size: string;
    category: string;
    description: string;
    /**
     * Upstream repo URL this module was built from. Read by the caller
     * from the submission's flagsJson.upstreamUrl. Displayed on the
     * module detail page's receipts section so viewers can see what
     * source tree the signed image came from.
     *
     * Historically this slot was bugged — the worker passed the
     * submitterId here, so published modules were storing user IDs
     * in the upstream-URL column. Rows written before this fix are
     * healed by the 20260424120000 migration.
     */
    upstreamUrl: string;
  }
): Promise<boolean> {
  const { row } = args;

  // Check for slug collision. In production this is unlikely because
  // the submissions endpoint rejects taken slugs at submission time,
  // but a race window exists between approval and build.
  const existing = (await prisma.$queryRawUnsafe(
    `SELECT slug FROM "Module" WHERE slug = $1`,
    row.moduleName
  )) as { slug: string }[];
  if (existing.length > 0) return false;

  // We start new modules with a conservative trust score because no
  // one has reviewed them in detail yet. The canary pipeline and
  // community reviews raise this over time.
  const initialTrust = 72;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Module" (
       id, slug, name, version, author, description, tags, category,
       status, slsa, trust,
       "trustVulns", "trustSlsa", "trustSignature", "trustSbom",
       "cveCritical", "cveHigh", "cveMedium", "cveLow",
       deploys, "updatedHours", size, digest, previewable,
       visibility, "pulls30d", building,
       "imageRef", "upstreamRef", "sbomUrl", "sbomPackages",
       "trivyUrl", "rekorIndex", "signerIdentity", "signerIssuer",
       "publisherId",
       "createdAt", "updatedAt"
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       'verified', 'L3', $9,
       30, 25, 20, 12,
       0, 0, 0, 0,
       0, 0, $10, $11, false,
       $20, 0, false,
       $12, $13, $14, $15,
       NULL, $16, $17, $18,
       $19,
       NOW(), NOW()
     )`,
    `FLA-${new Date().getFullYear()}-${Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0")}`,
    row.moduleName,
    row.moduleName.toUpperCase(),
    row.version,
    row.author,
    args.description,
    [], // tags default empty; reviewer can edit
    args.category,
    initialTrust,
    args.size,
    args.digest,
    args.imageRef,
    args.upstreamUrl,
    args.sbomUrl,
    args.sbomPackages,
    args.rekorIndex,
    args.signerIdentity,
    args.signerIssuer,
    row.submitterId,
    row.visibility
  );

  return true;
}

/**
 * Append one build-log chunk for this submission. Writes to the
 * BuildLogLine table. Uses INSERT ... ON CONFLICT DO NOTHING so
 * a re-emission with the same (submissionId, seq) is a no-op — the
 * worker's stream handlers run fast-and-loose and the idempotent
 * write is the safety net.
 *
 * Callers should generate `seq` as a monotonic counter scoped to the
 * submission. The worker uses a simple in-memory counter per in-flight
 * build since only one worker claims a given submission at a time.
 *
 * Synchronous writes here would block the docker child's stdio
 * handler and stall the build on slow database latencies. The caller
 * is expected to fire-and-forget, allowing the writes to queue
 * without backing up stdout/stderr.
 */
export async function appendBuildLogLine(
  prisma: WorkerPrisma,
  input: {
    submissionId: string;
    seq: number;
    text: string;
    stream: "stdout" | "stderr" | "system";
  }
): Promise<void> {
  // A cuid generator is not readily available in raw SQL; construct
  // a random id here. 24 hex chars is plenty of entropy for a
  // non-security surface and keeps the raw-SQL simple.
  const id = `blog_${Math.random().toString(16).slice(2, 14)}${Math.random()
    .toString(16)
    .slice(2, 14)}`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "BuildLogLine" (id, "submissionId", seq, text, stream, "emittedAt")
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT ("submissionId", seq) DO NOTHING`,
    id,
    input.submissionId,
    input.seq,
    input.text,
    input.stream
  );
}
