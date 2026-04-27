import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import {
  getWorkerDashboardStats,
  getInFlightBuild,
  getRecentTerminalSubmissions,
  type TerminalStatus,
} from "@/lib/db/worker-stats";

export const metadata: Metadata = {
  title: "Worker · admin",
};

export const dynamic = "force-dynamic";

/**
 * The 8 AM check-in page. Shows the five numbers the Q1 plan calls out
 * (approved-queued, building, oldest-age, built-last-hour, failed-last-hour)
 * plus median build duration, a health signal at the top, in-flight build
 * detail, and the last 10 terminal-state submissions so operators can
 * spot consecutive-failure patterns.
 *
 * Reload-to-refresh (no auto-refresh) — this is a check-in view, not a
 * live dashboard. Operators who want a live view can open it in a
 * browser tab and use the browser's own refresh-every-N-seconds
 * extension if they want that.
 */

// Terminal-status → display tone. Kept local so admin-only statuses
// don't pollute the public StatusBadge component.
const TERMINAL_TONE: Record<
  TerminalStatus,
  { label: string; className: string }
> = {
  built: { label: "BUILT ✓", className: "text-good border-good" },
  failed: { label: "FAILED", className: "text-bad border-bad" },
  scan_rejected: {
    label: "SCAN REJECTED",
    className: "text-warn border-warn",
  },
  worker_failures: {
    label: "DLQ · EXHAUSTED",
    className: "text-bad border-bad",
  },
};

function fmtDuration(ms: number | null): string {
  if (ms === null) return "—";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec - min * 60;
  return rem === 0 ? `${min}m` : `${min}m ${rem}s`;
}

function fmtElapsed(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec - min * 60;
  return rem === 0 ? `${min}m` : `${min}m ${rem}s`;
}

function fmtAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const SIGNAL_TONE: Record<"green" | "amber" | "red", string> = {
  green: "border-good bg-good/10 text-good",
  amber: "border-warn bg-warn/10 text-warn",
  red: "border-bad bg-bad/10 text-bad",
};

export default async function WorkerDashboardPage() {
  await requireAdminPage();

  const [stats, inFlight, recent] = await Promise.all([
    getWorkerDashboardStats(),
    getInFlightBuild(),
    getRecentTerminalSubmissions(10),
  ]);

  const isOldestOverSla =
    stats.oldestApprovedHours !== null && stats.oldestApprovedHours > 24;

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN · WORKER"
        title="Build worker dashboard."
        subtitle="The 8 AM check. Reload to refresh."
      />

      {/* Health signal banner — first thing the operator reads. */}
      <div
        className={`border-b px-7 py-3 font-mono text-[12px] ${SIGNAL_TONE[stats.signal]}`}
      >
        <span className="font-semibold uppercase tracking-[0.14em]">
          {stats.signal}
        </span>
        <span className="ml-3">{stats.signalReason}</span>
      </div>

      {/* Dead-letter queue banner — only rendered when non-empty.
          These submissions have blown through the 3-attempt retry
          budget and need a human decision (retry manually, reject,
          or fix the underlying infra problem first). Linking to the
          pre-filtered admin queue saves one click. */}
      {stats.deadLetterCount > 0 && (
        <div className="flex items-center justify-between border-b border-bad bg-bad/10 px-7 py-3 text-[12px] text-bad">
          <div className="font-mono">
            <span className="font-semibold uppercase tracking-[0.14em]">
              DLQ
            </span>
            <span className="ml-3">
              {stats.deadLetterCount}{" "}
              {stats.deadLetterCount === 1 ? "submission" : "submissions"}{" "}
              dead-lettered after exhausting retries. Human review needed.
            </span>
          </div>
          <Link
            href="/app/admin?status=worker_failures"
            className="border border-bad px-3 py-1 font-mono tracking-[0.06em] hover:bg-bad hover:text-canvas"
          >
            Open DLQ →
          </Link>
        </div>
      )}

      {/* Five headline numbers. */}
      <section className="grid grid-cols-5 border-b border-hairline bg-canvas-panel">
        <div className="border-r border-hairline px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            APPROVED QUEUED
          </div>
          <div
            className={`font-display text-[28px] font-black leading-[1] tracking-[-0.03em] ${
              stats.approvedQueued > 5 ? "text-warn" : "text-ink"
            }`}
          >
            {stats.approvedQueued}
          </div>
        </div>

        <div className="border-r border-hairline px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            BUILDING NOW
          </div>
          <div
            className={`font-display text-[28px] font-black leading-[1] tracking-[-0.03em] ${
              stats.building > 0 ? "text-accent" : "text-ink-faint"
            }`}
          >
            {stats.building}
          </div>
        </div>

        <div className="border-r border-hairline px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            OLDEST APPROVED
          </div>
          <div
            className={`font-display text-[28px] font-black leading-[1] tracking-[-0.03em] ${
              isOldestOverSla ? "text-bad" : "text-ink"
            }`}
          >
            {stats.oldestApprovedHours === null
              ? "—"
              : `${stats.oldestApprovedHours}h`}
          </div>
        </div>

        <div className="border-r border-hairline px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            BUILT 1H
          </div>
          <div className="font-display text-[28px] font-black leading-[1] tracking-[-0.03em] text-good">
            {stats.builtLastHour}
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            FAILED 1H
          </div>
          <div
            className={`font-display text-[28px] font-black leading-[1] tracking-[-0.03em] ${
              stats.failedLastHour + stats.scanRejectedLastHour > 0
                ? "text-bad"
                : "text-ink-faint"
            }`}
          >
            {stats.failedLastHour + stats.scanRejectedLastHour}
          </div>
          {stats.scanRejectedLastHour > 0 && (
            <div className="mt-1 font-mono text-[10px] text-ink-faint">
              ({stats.scanRejectedLastHour} scan-rejected)
            </div>
          )}
        </div>
      </section>

      {/* Secondary row — median build duration. */}
      <section className="grid grid-cols-2 border-b border-hairline bg-canvas-deep">
        <div className="border-r border-hairline px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            MEDIAN BUILD (LAST 20)
          </div>
          <div className="font-display text-[22px] font-black leading-[1] tracking-[-0.03em] text-ink">
            {fmtDuration(stats.medianBuildDurationMs)}
          </div>
          <div className="mt-1 font-mono text-[10px] text-ink-faint">
            Target: p95 &lt; 15 minutes per Q1 ship criteria.
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            QUEUE ACTION
          </div>
          <div className="font-display text-[14px] leading-[1.3] text-ink">
            <Link
              href="/app/admin?status=approved"
              className="underline decoration-hairline underline-offset-4 hover:decoration-accent"
            >
              View approved queue →
            </Link>
          </div>
          <div className="mt-2 font-mono text-[10px] text-ink-faint">
            Submissions waiting for the worker.
          </div>
        </div>
      </section>

      {/* In-flight build, if any. */}
      <section className="border-b border-hairline px-7 py-5">
        <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-accent">
          IN-FLIGHT BUILD
        </div>
        {inFlight === null ? (
          <div className="font-mono text-[12px] text-ink-faint">
            Nothing building right now.
          </div>
        ) : (
          <div className="border border-hairline bg-canvas-panel px-5 py-4">
            <div className="flex items-baseline justify-between">
              <div>
                <Link
                  href={`/app/admin/${inFlight.submissionId}`}
                  className="font-display text-[18px] font-black tracking-[-0.02em] text-ink hover:text-accent"
                >
                  {inFlight.moduleName}
                  <span className="ml-2 font-mono text-[13px] font-normal text-ink-faint">
                    @{inFlight.version}
                  </span>
                </Link>
                <div className="mt-1 font-mono text-[11px] text-ink-faint">
                  {inFlight.submissionId}
                  {inFlight.requiresNetwork && (
                    <span className="ml-3 border border-warn px-1.5 py-0.5 text-[10px] text-warn">
                      NETWORK GRANTED
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-[22px] font-black leading-[1] tracking-[-0.02em] text-accent">
                  {fmtElapsed(inFlight.elapsedSec)}
                </div>
                <div className="mt-1 font-mono text-[10px] text-ink-faint">
                  since {fmtAgo(inFlight.buildStartedAt)}
                </div>
              </div>
            </div>
            {inFlight.elapsedSec > 600 && (
              <div className="mt-3 border-t border-hairline pt-3 font-mono text-[11px] text-warn">
                Build has been running for over 10 minutes. Timeout is
                10 min by default — it should self-kill shortly.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recent terminal submissions — wins and losses. */}
      <section className="px-7 py-5">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="font-mono text-[10px] tracking-[0.14em] text-accent">
            LAST {recent.length} TERMINAL
          </div>
          <div className="font-mono text-[10px] text-ink-faint">
            Scan vertically: three in a row of the same status = investigate.
          </div>
        </div>

        {recent.length === 0 ? (
          <div className="border border-hairline bg-canvas-panel px-5 py-6 text-center font-mono text-[12px] text-ink-faint">
            No terminal submissions yet.
          </div>
        ) : (
          <div className="border border-hairline">
            {recent.map((row, i) => {
              const tone = TERMINAL_TONE[row.status];
              return (
                <Link
                  key={row.submissionId}
                  href={`/app/admin/${row.submissionId}`}
                  className={`flex items-baseline justify-between px-5 py-3 text-[13px] hover:bg-canvas-panel ${
                    i < recent.length - 1 ? "border-b border-hairline" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      className={`inline-block min-w-[110px] border px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold tracking-[0.1em] ${tone.className}`}
                    >
                      {tone.label}
                    </span>
                    <span className="font-display font-bold text-ink">
                      {row.moduleName}
                    </span>
                    <span className="font-mono text-[11px] text-ink-faint">
                      @{row.version}
                    </span>
                    {row.buildErrorKind && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                        ({row.buildErrorKind})
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-4 font-mono text-[11px] text-ink-faint">
                    <span>{fmtDuration(row.durationMs)}</span>
                    <span>
                      {row.buildCompletedAt
                        ? fmtAgo(row.buildCompletedAt)
                        : "—"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
