import type { Metadata } from "next";
import Link from "next/link";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { getAdminAnalytics } from "@/lib/db/admin-analytics";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { hoursAgo, hoursSince } from "@/lib/utils/time";

export const metadata: Metadata = {
  title: "Analytics · admin",
};

// Force dynamic — the whole point is current numbers.
export const dynamic = "force-dynamic";

/**
 * Admin-only product-health dashboard. Reads from the DB directly;
 * doesn't depend on Plausible being up or configured.
 *
 * Different from /app/admin/worker (operational pipeline health) —
 * this one answers "how is the business doing" at a glance:
 *   - how many users, on which plans
 *   - what's the submission trend over the last week
 *   - how many free users are hitting the quota cap (signal for
 *     pricing-tier calibration)
 *   - how many modules are public vs private
 *   - DLQ pain (mirrored from worker stats)
 */
export default async function AdminAnalyticsPage() {
  await requireAdminPage();

  const stats = await getAdminAnalytics();

  const maxDaily = Math.max(1, ...stats.submissionsLast7Days.map((d) => d.count));

  // Compute a couple of derived numbers the UI shows explicitly.
  const proAttachRate =
    stats.totalUsers > 0
      ? Math.round((stats.paidUsers / stats.totalUsers) * 100 * 10) / 10
      : 0;
  const quotaPressureRate =
    stats.freeUsers > 0
      ? Math.round((stats.usersAtQuotaCap / stats.freeUsers) * 100 * 10) / 10
      : 0;
  const totalSubmissions = Object.values(stats.submissionsByStatus).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <>
      <ViewHeader
        eyebrow="ANALYTICS"
        title="Product health"
        subtitle="Where the business stands right now. Reload for a fresh reading."
        actions={
          <Link
            href="/app/admin/worker"
            className="border border-hairline px-4 py-2 font-mono text-[11px] tracking-[0.08em] text-ink-softer hover:text-ink"
          >
            Worker health →
          </Link>
        }
      />

      <div className="space-y-6 px-7 py-7">
        {/* Users */}
        <section className="border border-hairline bg-canvas-deep">
          <div className="border-b border-hairline px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-accent">
            USERS
          </div>
          <div className="grid grid-cols-4 gap-px bg-hairline">
            <Number
              label="TOTAL"
              value={stats.totalUsers}
              sub={stats.totalUsers === 0 ? "no signups yet" : undefined}
            />
            <Number label="FREE" value={stats.freeUsers} />
            <Number
              label="PRO"
              value={stats.paidUsers}
              sub={proAttachRate > 0 ? `${proAttachRate}% attach` : undefined}
              tone={stats.paidUsers > 0 ? "good" : "neutral"}
            />
            <Number
              label="AT QUOTA CAP"
              value={stats.usersAtQuotaCap}
              sub={
                stats.freeUsers > 0
                  ? `${quotaPressureRate}% of free`
                  : undefined
              }
              tone={
                quotaPressureRate > 20
                  ? "warn"
                  : stats.usersAtQuotaCap > 0
                    ? "neutral"
                    : "neutral"
              }
            />
          </div>
        </section>

        {/* Submissions trend */}
        <section className="border border-hairline bg-canvas-deep">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
            <div className="font-mono text-[10px] tracking-[0.14em] text-accent">
              SUBMISSIONS · LAST 7 DAYS
            </div>
            <div className="font-mono text-[10.5px] text-ink-ghost">
              {stats.submissionsLast7Days.reduce((a, b) => a + b.count, 0)} in
              the window · {totalSubmissions} all-time
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-hairline">
            {stats.submissionsLast7Days.map((d) => {
              const heightPct = (d.count / maxDaily) * 100;
              const isToday =
                d.date === new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={d.date}
                  className="flex flex-col items-center gap-2 bg-canvas-deep px-3 py-4"
                >
                  <div className="flex h-16 w-full items-end">
                    <div
                      className={`w-full transition-all ${
                        d.count === 0
                          ? "bg-hairline"
                          : isToday
                            ? "bg-accent"
                            : "bg-ink-mute"
                      }`}
                      style={{ height: `${Math.max(2, heightPct)}%` }}
                    />
                  </div>
                  <div className="font-display text-[18px] font-black tracking-[-0.02em] text-ink">
                    {d.count}
                  </div>
                  <div className="font-mono text-[10px] text-ink-ghost">
                    {d.date.slice(5)}
                    {isToday && (
                      <span className="ml-1 text-accent">·now</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Submissions by status + modules + lifecycle health */}
        <div className="grid grid-cols-2 gap-6">
          <section className="border border-hairline bg-canvas-deep">
            <div className="border-b border-hairline px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-accent">
              SUBMISSIONS BY STATUS · ALL TIME
            </div>
            {totalSubmissions === 0 ? (
              <div className="px-5 py-6 font-body text-[13px] text-ink-ghost">
                No submissions yet. The first one lands here.
              </div>
            ) : (
              <table className="w-full font-body text-[12.5px]">
                <tbody>
                  {STATUS_ORDER.filter(
                    (s) => (stats.submissionsByStatus[s] ?? 0) > 0,
                  ).map((status) => {
                    const count = stats.submissionsByStatus[status] ?? 0;
                    const pct = (count / totalSubmissions) * 100;
                    return (
                      <tr
                        key={status}
                        className="border-b border-hairline last:border-0"
                      >
                        <td className="w-24 px-5 py-2 font-mono text-[11px] text-ink-softer">
                          {STATUS_LABEL[status] ?? status.toUpperCase()}
                        </td>
                        <td className="py-2">
                          <div className="h-[6px] bg-canvas">
                            <div
                              className={`h-full ${STATUS_TONE[status] ?? "bg-ink-mute"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="w-16 px-5 py-2 text-right font-mono text-[12px] text-ink">
                          {count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="border border-hairline bg-canvas-deep">
            <div className="border-b border-hairline px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-accent">
              CATALOG & LIFECYCLE
            </div>
            <div className="grid grid-cols-2 gap-px bg-hairline">
              <Number label="PUBLIC MODULES" value={stats.publicModules} />
              <Number
                label="PRIVATE MODULES"
                value={stats.privateModules}
                sub="pro-tier only"
              />
              <Number
                label="DEAD-LETTERED"
                value={stats.deadLetterCount}
                tone={stats.deadLetterCount > 0 ? "warn" : "neutral"}
                sub={
                  stats.deadLetterCount > 0
                    ? "see worker health"
                    : "pipeline clean"
                }
              />
              <Number
                label="LAST BUILT"
                value={
                  stats.lastBuiltAt
                    ? hoursAgo(stats.lastBuiltAt)
                    : "never"
                }
                sub={
                  stats.lastBuiltAt && hoursSince(stats.lastBuiltAt) > 24
                    ? "possibly idle"
                    : undefined
                }
              />
            </div>
          </section>
        </div>

        {/* Plausible pointer */}
        <section className="border border-hairline bg-canvas px-5 py-4">
          <div className="mb-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            WHERE ELSE TO LOOK
          </div>
          <div className="font-body text-[12.5px] leading-[1.6] text-ink-softer">
            This page covers everything the DB already knows. Page views,
            entry pages, referrers, and the SubmissionCreated /
            SubmissionQuotaBlocked / UpgradeClicked custom events live
            in{" "}
            <a
              href="https://plausible.io/flareo.app"
              className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
              target="_blank"
              rel="noopener"
            >
              the Plausible dashboard
            </a>
            . Pipeline operational health lives on{" "}
            <Link href="/app/admin/worker" className="text-accent">
              /app/admin/worker
            </Link>
            .
          </div>
        </section>
      </div>
    </>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────

const STATUS_ORDER = [
  "pending",
  "approved",
  "building",
  "built",
  "changes_requested",
  "failed",
  "scan_rejected",
  "worker_failures",
  "rejected",
];

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  approved: "APPROVED",
  building: "BUILDING",
  built: "BUILT",
  changes_requested: "CHANGES",
  failed: "FAILED",
  scan_rejected: "SCAN ✗",
  worker_failures: "DLQ",
  rejected: "REJECTED",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warn",
  approved: "bg-accent",
  building: "bg-accent",
  built: "bg-good",
  changes_requested: "bg-warn",
  failed: "bg-bad",
  scan_rejected: "bg-bad",
  worker_failures: "bg-bad",
  rejected: "bg-ink-softer",
};

function Number({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  const valueClass =
    tone === "good"
      ? "text-good"
      : tone === "warn"
        ? "text-warn"
        : tone === "bad"
          ? "text-bad"
          : "text-ink";
  return (
    <div className="bg-canvas-deep px-5 py-5">
      <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
        {label}
      </div>
      <div
        className={`font-display text-[30px] font-black leading-none tracking-[-0.03em] ${valueClass}`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-2 font-mono text-[10.5px] text-ink-ghost">
          {sub}
        </div>
      )}
    </div>
  );
}
