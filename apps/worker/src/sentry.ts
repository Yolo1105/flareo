/**
 * Sentry integration for the build worker.
 *
 * The worker is long-running and unattended; Sentry is what turns
 * "a build failed at 2am" into a push notification that wakes the
 * operator. We want three things captured:
 *
 *   1. Unhandled crashes (uncaughtException, unhandledRejection) —
 *      caught in main().
 *   2. kind="system" build failures — caught at each markFailedOrRetry
 *      call site in index.ts.
 *   3. The final dead-letter transition when retries exhaust — also
 *      at the markFailedOrRetry call site, with a higher severity.
 *
 * We intentionally do NOT capture kind="user" or kind="scan" failures.
 * Those are bad submissions, not worker problems; alerting on them
 * would train the operator to ignore Sentry.
 *
 * Sentry is optional. If SENTRY_DSN is unset, init is a no-op and
 * captureError / captureDeadLetter fall through to console logging
 * only. The worker stays fully functional without Sentry.
 */

import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry(dsn: string | null, workerId: string): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    // Tag every event with the worker id so multi-worker deploys
    // are distinguishable in the Sentry UI.
    initialScope: {
      tags: { component: "flareo-worker", worker_id: workerId },
    },
    // Don't collect traces — we're not doing performance monitoring,
    // just error reporting. Keeps the free-tier quota usable.
    tracesSampleRate: 0,
    // Event submissions are best-effort; a Sentry outage should not
    // take down the worker. @sentry/node honors this by default but
    // being explicit costs nothing.
    sendClientReports: false,
  });
  initialized = true;
}

/**
 * Capture a system-kind build failure. Tagged with submissionId and
 * kind so the Sentry search is useful.
 *
 * When Sentry isn't initialized, silently returns — the caller has
 * already logged to stdout.
 */
export function captureSystemFailure(args: {
  submissionId: string;
  moduleName: string;
  message: string;
  attempt: number;
  willRetry: boolean;
  err?: unknown;
}): void {
  if (!initialized) return;

  // Construct a synthetic Error if none was provided so Sentry has
  // a stack. The stack will point at this file which is usually not
  // useful; the message and tags are what the operator reads.
  const err =
    args.err instanceof Error
      ? args.err
      : new Error(`build worker system failure: ${args.message}`);

  Sentry.withScope((scope) => {
    scope.setLevel(args.willRetry ? "warning" : "error");
    scope.setTag("submission_id", args.submissionId);
    scope.setTag("module_name", args.moduleName);
    scope.setTag("error_kind", "system");
    scope.setTag("attempt", String(args.attempt));
    scope.setTag("will_retry", String(args.willRetry));
    scope.setExtra("message", args.message);
    Sentry.captureException(err);
  });
}

/**
 * Capture the dead-letter transition. Higher severity than a regular
 * system failure: by the time we get here, three attempts have
 * already failed and the submission needs human intervention.
 */
export function captureDeadLetter(args: {
  submissionId: string;
  moduleName: string;
  message: string;
  finalAttempt: number;
}): void {
  if (!initialized) return;

  const err = new Error(
    `build worker dead-lettered ${args.submissionId}: ${args.message}`,
  );

  Sentry.withScope((scope) => {
    scope.setLevel("fatal");
    scope.setTag("submission_id", args.submissionId);
    scope.setTag("module_name", args.moduleName);
    scope.setTag("error_kind", "system");
    scope.setTag("dead_lettered", "true");
    scope.setTag("final_attempt", String(args.finalAttempt));
    scope.setExtra("message", args.message);
    Sentry.captureException(err);
  });
}

/**
 * Capture an unhandled error — uncaughtException or a wrapped
 * processSubmission crash. Higher severity than a known failure kind.
 *
 * When called from a submission-processing context, pass `submission`
 * so the Sentry event is tagged with the in-flight submission's id
 * and module name. Without it, operators see "worker crashed" with
 * no pointer to what it was working on.
 */
export function captureUnhandled(
  err: unknown,
  context: string,
  submission?: {
    submissionId: string;
    moduleName: string;
    attempt?: number;
  },
): void {
  if (!initialized) return;
  const asError =
    err instanceof Error ? err : new Error(String(err));
  Sentry.withScope((scope) => {
    scope.setLevel("fatal");
    scope.setTag("context", context);
    if (submission) {
      scope.setTag("submission_id", submission.submissionId);
      scope.setTag("module_name", submission.moduleName);
      if (submission.attempt !== undefined) {
        scope.setTag("attempt", String(submission.attempt));
      }
    }
    Sentry.captureException(asError);
  });
}

/**
 * Flush pending Sentry events before shutdown. The worker's graceful
 * shutdown path should await this so in-flight captures don't get
 * dropped when the process exits.
 */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!initialized) return;
  try {
    await Sentry.flush(timeoutMs);
  } catch {
    // Nothing to do — we're shutting down anyway.
  }
}
