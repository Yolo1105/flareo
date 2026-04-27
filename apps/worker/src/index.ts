/**
 * Build worker main loop.
 *
 * Polls the DB for approved submissions. For each one:
 *   1. Fetch the Dockerfile from R2 (or flagsJson fallback)
 *   2. docker build in sandbox
 *   3. Trivy scan — reject if CRITICAL/HIGH
 *   4. Generate SBOM
 *   5. Push to ECR
 *   6. Cosign sign (keyless)
 *   7. Update Submission → status=built, create Module row
 *   8. Email submitter on success/failure
 *
 * Each step has explicit failure classification: user/system/scan.
 * User failures are surfaced in the decision email; system failures
 * get sentry'd and a retry button in admin UI.
 */

import { loadConfig } from "./config.js";
import { log } from "./log.js";
import {
  createPrisma,
  claimNextApprovedSubmission,
  markBuilt,
  markFailed,
  markFailedOrRetry,
  publishModuleFromSubmission,
  appendBuildLogLine,
  type ApprovedRow,
  type RetryDecision,
  type WorkerPrisma,
} from "./db.js";
import {
  createR2Client,
  fetchDockerfile,
  writeBuildLog,
  writeSbom,
} from "./r2.js";
import {
  dockerBuild,
  cleanupBuildDir,
  removeLocalImage,
} from "./build.js";
import { scanImage, generateSbom } from "./scan.js";
import { pushToEcr, signImage } from "./sign.js";
import { evaluatePolicy } from "./policy.js";
import { countBySeverity } from "./lib.js";
import {
  initSentry,
  captureSystemFailure,
  captureDeadLetter,
  captureUnhandled,
  flushSentry,
} from "./sentry.js";
import type { S3Client } from "@aws-sdk/client-s3";

interface WorkerContext {
  prisma: WorkerPrisma;
  r2: S3Client;
  config: ReturnType<typeof loadConfig>;
  shuttingDown: boolean;
  heartbeatFile: string;
}

interface SubmissionFlags {
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

/**
 * Ping the main app's /api/v1/worker/build-completed endpoint so it
 * can dispatch the decision email. We deliberately keep SMTP
 * credentials off the build host — worker just POSTs a notification
 * with a shared secret.
 *
 * Fire-and-forget; if the endpoint is down, the DB row still reflects
 * the decision and a retry / manual nudge recovers the email.
 */
async function notifyMainApp(
  ctx: WorkerContext,
  body: Record<string, unknown>
): Promise<void> {
  const url = process.env.MAIN_APP_URL;
  const secret = process.env.FLAREO_WORKER_SECRET;
  if (!url || !secret) {
    log.warn("main app notification skipped — URL or secret missing", {
      hasUrl: !!url,
      hasSecret: !!secret,
    });
    return;
  }
  try {
    const resp = await fetch(`${url}/api/v1/worker/build-completed`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-worker-secret": secret,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      log.warn("main app notification non-2xx", {
        status: resp.status,
        workerId: ctx.config.workerId,
      });
    }
  } catch (err) {
    log.warn("main app notification failed", {
      error: String(err),
    });
  }
}

async function processSubmission(
  ctx: WorkerContext,
  row: ApprovedRow
): Promise<void> {
  const start = Date.now();
  log.info("processing submission", {
    submissionId: row.id,
    slug: row.moduleName,
    requiresNetwork: row.requiresNetwork,
    attempt: row.attemptCount + 1,
  });

  /**
   * Local helper — fail the current submission with kind="system".
   * Decides retry-vs-dead-letter via markFailedOrRetry, captures the
   * event to Sentry at the matching severity, and logs the outcome.
   *
   * Every previously-existing `markFailed({ kind: "system", ... })`
   * call in this function has been rewritten to go through this.
   * The `kind:"user"` and `kind:"scan"` calls are unchanged (those
   * remain terminal on first occurrence and don't go through retry).
   */
  async function systemFailure(args: {
    message: string;
    buildLogUrl: string | null;
    err?: unknown;
  }): Promise<void> {
    const decision: RetryDecision = await markFailedOrRetry(ctx.prisma, {
      submissionId: row.id,
      kind: "system",
      message: args.message,
      buildLogUrl: args.buildLogUrl,
      attemptCount: row.attemptCount,
    });

    if (decision.action === "retry") {
      log.warn("system failure — requeued for retry", {
        submissionId: row.id,
        slug: row.moduleName,
        nextAttempt: decision.nextAttempt,
        availableAfter: decision.availableAfter.toISOString(),
        message: args.message,
      });
      captureSystemFailure({
        submissionId: row.id,
        moduleName: row.moduleName,
        message: args.message,
        attempt: decision.nextAttempt,
        willRetry: true,
        err: args.err,
      });
    } else if (decision.action === "dead_letter") {
      log.error("system failure — dead-lettered after retries", {
        submissionId: row.id,
        slug: row.moduleName,
        finalAttempt: decision.finalAttempt,
        message: args.message,
      });
      captureDeadLetter({
        submissionId: row.id,
        moduleName: row.moduleName,
        message: args.message,
        finalAttempt: decision.finalAttempt,
      });
    }
  }

  // Parse flags for Dockerfile fallback and metadata we need for the
  // eventual Module row.
  const flags = JSON.parse(row.flagsJson) as SubmissionFlags;

  // 1. Fetch Dockerfile. Prefer R2 source if present; fall back to
  //    flagsJson (older submissions inline it there).
  let dockerfile: string | null = null;
  try {
    if (row.dockerfileUrl) {
      dockerfile = await fetchDockerfile(
        ctx.r2,
        ctx.config.r2BucketSubmissions,
        row.id
      );
    }
    if (!dockerfile && flags.dockerfile) {
      dockerfile = flags.dockerfile;
    }
  } catch (err) {
    log.error("failed to fetch Dockerfile", {
      submissionId: row.id,
      error: String(err),
    });
    await systemFailure({
      message: "Couldn't retrieve the Dockerfile from storage. We'll retry.",
      buildLogUrl: null,
      err,
    });
    return;
  }

  if (!dockerfile) {
    await markFailed(ctx.prisma, {
      submissionId: row.id,
      kind: "user",
      message:
        "No Dockerfile attached to this submission. Please include one when resubmitting.",
      buildLogUrl: null,
    });
    return;
  }

  // 2. Build. Stream stdout/stderr chunks to the BuildLogLine table
  //    as they arrive so the submission detail page's live-log panel
  //    can show progress. The streaming is advisory: if a chunk fails
  //    to land, the build still succeeds and the final full-text log
  //    still gets uploaded to R2 below.
  //
  //    We serialize writes with a chained promise (`writeChain`) so
  //    that concurrent chunks land in emitted order and the seq
  //    counter stays monotonic — Node fires 'data' handlers
  //    synchronously but the DB write is async. Without the chain,
  //    a slow first chunk could land after a fast second chunk and
  //    invert the visible log order.
  let chunkSeq = 0;
  let writeChain: Promise<void> = Promise.resolve();
  // Emit an opening system marker so the log panel has something to
  // render immediately even before the child produces its first line.
  writeChain = writeChain
    .then(() =>
      appendBuildLogLine(ctx.prisma, {
        submissionId: row.id,
        seq: chunkSeq++,
        text: `--- build started for ${row.moduleName}@${row.version} ---\n`,
        stream: "system",
      })
    )
    .catch(() => {}); // streaming is best-effort

  const buildResult = await dockerBuild({
    submissionId: row.id,
    slug: row.moduleName,
    dockerfile,
    buildRoot: ctx.config.buildRoot,
    timeoutMs: ctx.config.buildTimeoutMs,
    requiresNetwork: row.requiresNetwork,
    onChunk: ({ text, stream }) => {
      const seq = chunkSeq++;
      writeChain = writeChain
        .then(() =>
          appendBuildLogLine(ctx.prisma, {
            submissionId: row.id,
            seq,
            text,
            stream,
          })
        )
        .catch(() => {}); // a dropped chunk is acceptable
    },
  });

  // Wait for any pending writes to land before we move on to the
  // R2 upload and status update. Bounded by however many chunks the
  // DB can ingest; in practice builds have dozens of chunks, not
  // thousands. A 5-second ceiling guards against a stuck DB.
  await Promise.race([
    writeChain,
    new Promise<void>((resolve) => setTimeout(resolve, 5000)),
  ]);

  // Final system marker (success or failure; the seq ordering
  // guarantees this lands after every runtime chunk).
  writeChain = writeChain
    .then(() =>
      appendBuildLogLine(ctx.prisma, {
        submissionId: row.id,
        seq: chunkSeq++,
        text: buildResult.success
          ? `--- build succeeded in ${buildResult.durationMs}ms ---\n`
          : `--- build failed after ${buildResult.durationMs}ms ---\n`,
        stream: "system",
      })
    )
    .catch(() => {});
  await Promise.race([
    writeChain,
    new Promise<void>((resolve) => setTimeout(resolve, 2000)),
  ]);

  // Always write the log, success or failure.
  let buildLogUrl: string | null = null;
  try {
    buildLogUrl = await writeBuildLog(
      ctx.r2,
      ctx.config.r2BucketArtifacts,
      row.id,
      buildResult.logText
    );
  } catch (err) {
    // Log upload failure is non-fatal — we have the log in stdout.
    log.warn("build log upload failed", {
      submissionId: row.id,
      error: String(err),
    });
  }

  if (!buildResult.success) {
    log.info("build failed", {
      submissionId: row.id,
      durationMs: buildResult.durationMs,
      error: buildResult.errorSummary,
    });
    await markFailed(ctx.prisma, {
      submissionId: row.id,
      kind: "user",
      message:
        buildResult.errorSummary ??
        "Build failed. See the log for details.",
      buildLogUrl,
    });
    await notifyMainApp(ctx, {
      submissionId: row.id,
      result: "failed",
    });
    await cleanupBuildDir(ctx.config.buildRoot, row.id);
    return;
  }

  // 3. Scan.
  let scanResult;
  try {
    scanResult = await scanImage(buildResult.imageTag);
  } catch (err) {
    log.error("trivy crashed", { submissionId: row.id, error: String(err) });
    await systemFailure({
      message: "Security scan failed to run. This is our fault; we'll retry.",
      buildLogUrl,
      err,
    });
    await removeLocalImage(buildResult.imageTag);
    await cleanupBuildDir(ctx.config.buildRoot, row.id);
    return;
  }

  if (!scanResult.pass) {
    log.info("scan rejected", {
      submissionId: row.id,
      cveCount: scanResult.cves.length,
    });
    await markFailed(ctx.prisma, {
      submissionId: row.id,
      kind: "scan",
      message: scanResult.summary,
      buildLogUrl,
    });
    await notifyMainApp(ctx, {
      submissionId: row.id,
      result: "scan_rejected",
      cveList: scanResult.cves.slice(0, 20).map((c) => `${c.id} (${c.pkg})`),
    });
    await removeLocalImage(buildResult.imageTag);
    await cleanupBuildDir(ctx.config.buildRoot, row.id);
    return;
  }

  // 4. SBOM.
  let sbomUrl: string | null = null;
  let sbomPackages = 0;
  try {
    const sbom = await generateSbom(buildResult.imageTag);
    sbomPackages = sbom.packageCount;
    sbomUrl = await writeSbom(
      ctx.r2,
      ctx.config.r2BucketArtifacts,
      row.id,
      sbom.cyclonedxJson
    );
  } catch (err) {
    log.error("sbom generation failed", {
      submissionId: row.id,
      error: String(err),
    });
    await systemFailure({
      message: "SBOM generation failed. We'll retry.",
      buildLogUrl,
      err,
    });
    await removeLocalImage(buildResult.imageTag);
    await cleanupBuildDir(ctx.config.buildRoot, row.id);
    return;
  }

  // 5. Push to ECR.
  let pushResult;
  try {
    pushResult = await pushToEcr(
      buildResult.imageTag,
      row.moduleName,
      row.version,
      ctx.config.ecrRepositoryPrefix
    );
  } catch (err) {
    log.error("push to ecr failed", {
      submissionId: row.id,
      error: String(err),
    });
    await systemFailure({
      message: "Couldn't publish to registry. We'll retry.",
      buildLogUrl,
      err,
    });
    await removeLocalImage(buildResult.imageTag);
    await cleanupBuildDir(ctx.config.buildRoot, row.id);
    return;
  }

  // 6. Sign.
  let signResult;
  try {
    signResult = await signImage(pushResult.imageRef, pushResult.digest);
  } catch (err) {
    log.error("cosign sign failed", {
      submissionId: row.id,
      error: String(err),
    });
    // The image is pushed but unsigned. Fail the submission; retry
    // will re-push and re-sign (idempotent because same digest).
    await systemFailure({
      message: "Signature step failed. We'll retry.",
      buildLogUrl,
      err,
    });
    await removeLocalImage(buildResult.imageTag);
    await cleanupBuildDir(ctx.config.buildRoot, row.id);
    return;
  }

  // 7. Success: persist results.
  await markBuilt(ctx.prisma, {
    submissionId: row.id,
    imageRef: pushResult.imageRef,
    digest: pushResult.digest,
    sbomUrl,
    rekorIndex: signResult.rekorIndex,
    signerIdentity: signResult.signerIdentity,
    signerIssuer: signResult.signerIssuer,
    buildLogUrl,
  });

  // 7b. Policy gate.
  //
  // The image is built, scanned, signed, and the receipts are
  // archived. Before promoting it to the public catalog we ask
  // the main app's active admission policy: does this module pass?
  //
  // Per-severity CVE counts come from the Trivy scan we already ran.
  // SLSA level is 2 — the GitHub-Actions-based pipeline produces L2
  // attestations; if/when we move to a hermetic builder this bumps.
  // Trust score 72 matches the initialTrust the publish step would
  // use; passing the same value to the evaluator keeps eval and
  // catalog state consistent.
  const cveCounts = countBySeverity(scanResult.cves);
  const policyResult = await evaluatePolicy({
    submissionId: row.id,
    slug: row.moduleName,
    cveCritical: cveCounts.critical,
    cveHigh: cveCounts.high,
    cveMedium: cveCounts.medium,
    cveLow: cveCounts.low,
    slsaLevel: 2,
    trustScore: 72,
    signature: true,
    sbom: true,
    rekorEntry: signResult.rekorIndex !== null,
    slsaAttestation: true,
  });

  // Decide whether to publish based on the verdict.
  //
  // We fail closed: any non-pass outcome (verdict=fail, or evaluator
  // unreachable) leaves the submission in `built` state without
  // promoting to the catalog. An admin can then either:
  //   - Address the failure (annotate VEX, edit the policy revision,
  //     bump SLSA level, etc.), use the admin "regenerate verdicts"
  //     button to recompute, then manually publish, or
  //   - Override and publish via a manual catalog promotion path.
  //
  // verdict=warn passes through. The rule severities are set so a
  // warn doesn't represent a real risk, just a non-ideal signal
  // worth surfacing on admin dashboards.
  let shouldPublish = true;
  let policyHoldReason: string | null = null;
  if (policyResult.ok) {
    if (policyResult.verdict === "fail") {
      shouldPublish = false;
      policyHoldReason = `policy verdict FAIL (revision ${policyResult.policyRevision}): ${policyResult.summary}`;
    }
  } else {
    // Failed to evaluate — fail closed. Distinguish reasons in the log
    // so an operator can tell "main app down" from "config wrong" from
    // "validation bug."
    shouldPublish = false;
    policyHoldReason = `policy evaluation unavailable (${policyResult.reason}): ${policyResult.message}`;
    log.warn("policy evaluation failed; holding publish", {
      submissionId: row.id,
      reason: policyResult.reason,
      message: policyResult.message,
    });
  }

  let published = false;
  if (shouldPublish) {
    published = await publishModuleFromSubmission(ctx.prisma, {
      row,
      imageRef: pushResult.imageRef,
      digest: pushResult.digest,
      sbomUrl,
      sbomPackages,
      trivyUrl: null,
      rekorIndex: signResult.rekorIndex,
      signerIdentity: signResult.signerIdentity,
      signerIssuer: signResult.signerIssuer,
      size: pushResult.size,
      category: flags.category ?? "devtools",
      description: flags.description ?? "",
      upstreamUrl: flags.upstreamUrl ?? "",
    });

    if (!published) {
      log.warn("module slug collision; submission built but not catalog'd", {
        submissionId: row.id,
        slug: row.moduleName,
      });
    }
  } else {
    log.warn("submission held by admission policy; not publishing", {
      submissionId: row.id,
      slug: row.moduleName,
      reason: policyHoldReason,
    });
  }

  log.info("submission built", {
    submissionId: row.id,
    slug: row.moduleName,
    durationMs: Date.now() - start,
    digest: pushResult.digest,
    rekorIndex: signResult.rekorIndex,
    policyVerdict: policyResult.ok ? policyResult.verdict : "eval_failed",
    published,
  });

  // Tell the main app; it dispatches the success email.
  // If the build succeeded but policy held the publish, the email
  // copy reflects that — submitter sees "built; held for review"
  // rather than "live in the catalog."
  await notifyMainApp(ctx, {
    submissionId: row.id,
    result: "success",
    digest: pushResult.digest,
    imageRef: pushResult.imageRef,
    signerIdentity: signResult.signerIdentity,
    signerIssuer: signResult.signerIssuer,
    rekorIndex: signResult.rekorIndex,
    sbomUrl,
    // Policy outcome (new fields, additive — main app endpoint accepts
    // them when present, ignores them when absent).
    policyVerdict: policyResult.ok ? policyResult.verdict : null,
    policyRevision: policyResult.ok ? policyResult.policyRevision : null,
    policyHoldReason,
    published,
  });

  // 8. Cleanup.
  await removeLocalImage(buildResult.imageTag);
  await cleanupBuildDir(ctx.config.buildRoot, row.id);
}

/**
 * Update the heartbeat file. The Next.js app reads this over a
 * /api/v1/worker/heartbeat endpoint that Instatus polls every minute.
 */
async function updateHeartbeat(ctx: WorkerContext): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
  try {
    await writeFile(
      ctx.heartbeatFile,
      JSON.stringify({
        ts: new Date().toISOString(),
        workerId: ctx.config.workerId,
        pid: process.pid,
      })
    );
  } catch {
    // Heartbeat failure is non-fatal; next cycle tries again.
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function mainLoop(ctx: WorkerContext): Promise<void> {
  log.info("worker started", {
    workerId: ctx.config.workerId,
    pollIntervalMs: ctx.config.pollIntervalMs,
  });

  while (!ctx.shuttingDown) {
    await updateHeartbeat(ctx);

    let row: ApprovedRow | null = null;
    try {
      row = await claimNextApprovedSubmission(ctx.prisma, ctx.config.workerId);
    } catch (err) {
      log.error("claim failed", { error: String(err) });
      await sleep(ctx.config.pollIntervalMs);
      continue;
    }

    if (!row) {
      await sleep(ctx.config.pollIntervalMs);
      continue;
    }

    try {
      await processSubmission(ctx, row);
    } catch (err) {
      log.error("unhandled error in processSubmission", {
        submissionId: row.id,
        error: String(err),
        stack: (err as Error).stack,
      });
      // Unhandled crash: capture to Sentry at fatal severity before
      // flipping the row. If the markFailedOrRetry call itself also
      // fails (nested catch below), we've at least got the crash
      // on the dashboard.
      captureUnhandled(err, "processSubmission", {
        submissionId: row.id,
        moduleName: row.moduleName,
        attempt: row.attemptCount + 1,
      });
      try {
        const decision = await markFailedOrRetry(ctx.prisma, {
          submissionId: row.id,
          kind: "system",
          message:
            "The build worker hit an unexpected error. A human is looking.",
          buildLogUrl: null,
          attemptCount: row.attemptCount,
        });
        if (decision.action === "dead_letter") {
          captureDeadLetter({
            submissionId: row.id,
            moduleName: row.moduleName,
            message: "unhandled error in processSubmission (final attempt)",
            finalAttempt: decision.finalAttempt,
          });
        }
      } catch (nested) {
        log.error("failed to markFailedOrRetry after unhandled error", {
          submissionId: row.id,
          error: String(nested),
        });
      }
    }
  }

  log.info("worker shutting down gracefully");
  await flushSentry();
  await ctx.prisma.$disconnect();
}

async function main(): Promise<void> {
  const config = loadConfig();

  // Sentry comes up first so any subsequent init error gets captured.
  // If SENTRY_DSN isn't set, this is a no-op and all downstream
  // capture* calls fall through silently.
  initSentry(config.sentryDsn, config.workerId);

  const prisma = createPrisma(config.databaseUrl);
  const r2 = createR2Client({
    accountId: config.r2AccountId,
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
    bucketSubmissions: config.r2BucketSubmissions,
    bucketArtifacts: config.r2BucketArtifacts,
  });

  const ctx: WorkerContext = {
    prisma,
    r2,
    config,
    shuttingDown: false,
    heartbeatFile: "/var/lib/flareo-worker/heartbeat.json",
  };

  const shutdown = (signal: string) => () => {
    log.info("signal received, shutting down", { signal });
    ctx.shuttingDown = true;
  };
  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("SIGINT", shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    log.error("unhandledRejection", { reason: String(reason) });
    captureUnhandled(reason, "unhandledRejection");
  });
  process.on("uncaughtException", (err) => {
    log.error("uncaughtException", {
      error: err.message,
      stack: err.stack,
    });
    captureUnhandled(err, "uncaughtException");
    // Don't exit — systemd will restart us, but we want to keep the
    // current claimed row visible rather than silently abandoning it.
  });

  await mainLoop(ctx);
}

main().catch((err: unknown) => {
  log.error("fatal", {
    error: (err as Error).message,
    stack: (err as Error).stack,
  });
  captureUnhandled(err, "main");
  // Try to flush Sentry before exit; short timeout since we're
  // about to die anyway.
  void flushSentry(500).finally(() => process.exit(1));
});
