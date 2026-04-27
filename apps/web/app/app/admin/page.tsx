import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import {
  listAdminSubmissions,
  getQueueStats,
} from "@/lib/db/admin-submissions";
import { hoursAgo } from "@/lib/utils/time";

export const metadata: Metadata = {
  title: "Admin queue",
};

export const dynamic = "force-dynamic";

// Status → display tone mapping. Kept local because these are admin-only
// concepts and we don't want them polluting the public StatusBadge.
const STATUS_TONE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "PENDING",
    className: "text-warn border-warn",
  },
  approved: {
    label: "APPROVED",
    className: "text-accent border-accent",
  },
  building: {
    label: "BUILDING",
    className: "text-accent border-accent",
  },
  built: {
    label: "BUILT ✓",
    className: "text-good border-good",
  },
  rejected: {
    label: "REJECTED",
    className: "text-ink-faint border-hairline",
  },
  failed: {
    label: "FAILED",
    className: "text-bad border-bad",
  },
  scan_rejected: {
    label: "SCAN ✗",
    className: "text-bad border-bad",
  },
  changes_requested: {
    label: "CHANGES",
    className: "text-warn border-warn",
  },
  worker_failures: {
    label: "DLQ",
    className: "text-bad border-bad",
  },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; age?: string }>;
}) {
  await requireAdminPage();

  const params = await searchParams;
  const statusFilter = params.status ?? "pending";
  const ageFilter = params.age;

  const statuses =
    statusFilter === "all"
      ? [
          "pending",
          "approved",
          "building",
          "built",
          "rejected",
          "failed",
          "scan_rejected",
          "changes_requested",
          "worker_failures",
        ]
      : statusFilter.split(",").map((s) => s.trim());

  const minAgeHours =
    ageFilter === ">24h" ? 24 : ageFilter === ">72h" ? 72 : undefined;

  const [submissions, stats] = await Promise.all([
    listAdminSubmissions({
      status: statuses,
      minAgeHours,
      limit: 100,
    }),
    getQueueStats(),
  ]);

  const isOldestOverSla =
    stats.oldestPendingHours !== null && stats.oldestPendingHours > 24;

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN &middot; MODERATION"
        title="Submission queue."
        subtitle={`${stats.pendingCount} pending. Review each submission carefully; approval triggers an automated build.`}
      />

      {/* Sub-nav — quick access to the worker dashboard for operator checks. */}
      <div className="flex items-baseline gap-5 border-b border-hairline bg-canvas-deep px-7 py-2.5 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
        <span className="text-accent">REVIEW QUEUE</span>
        <Link
          href="/app/admin/worker"
          className="hover:text-accent"
        >
          WORKER DASHBOARD →
        </Link>
      </div>

      {/* Queue-pause banner when overwhelmed. */}
      {stats.pendingCount > 20 && (
        <div className="border-b border-warn bg-warn/10 px-7 py-3 font-mono text-[12px] text-warn">
          Queue depth exceeds 20. Consider temporarily pausing new
          submissions until the backlog is cleared.
        </div>
      )}

      {/* DLQ banner — surface parked rows that need human action. */}
      {stats.deadLetteredCount > 0 && statusFilter !== "worker_failures" && (
        <div className="flex items-center gap-3 border-b border-bad bg-bad/[0.08] px-7 py-3">
          <span className="block h-2 w-2 shrink-0 rounded-full bg-bad meta-pulse" />
          <span className="font-mono text-[11.5px] tracking-[0.04em] text-bad">
            <span className="font-semibold">
              {stats.deadLetteredCount} submission
              {stats.deadLetteredCount === 1 ? "" : "s"} dead-lettered
            </span>
            {" · "}
            <span className="text-bad/85">
              build failed three times, parked for human review. Retry or
              give up.
            </span>
          </span>
          <Link
            href="/app/admin?status=worker_failures"
            className="ml-auto border border-bad px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] text-bad hover:bg-bad hover:text-canvas"
          >
            Review DLQ →
          </Link>
        </div>
      )}

      <section className="grid grid-cols-4 border-b border-hairline bg-canvas-panel">
        <div className="border-r border-hairline px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            PENDING
          </div>
          <div
            className={`font-display text-[28px] font-black leading-[1] tracking-[-0.03em] ${
              stats.pendingCount > 10 ? "text-warn" : "text-ink"
            }`}
          >
            {stats.pendingCount}
          </div>
        </div>
        <div className="border-r border-hairline px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            OLDEST AGE
          </div>
          <div
            className={`font-display text-[28px] font-black leading-[1] tracking-[-0.03em] ${
              isOldestOverSla ? "text-bad" : "text-ink"
            }`}
          >
            {stats.oldestPendingHours === null
              ? "—"
              : `${stats.oldestPendingHours}h`}
          </div>
        </div>
        <div className="border-r border-hairline px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            BUILT 24H
          </div>
          <div className="font-display text-[28px] font-black leading-[1] tracking-[-0.03em] text-good">
            {stats.builtLast24h}
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
            FAILED 24H
          </div>
          <div
            className={`font-display text-[28px] font-black leading-[1] tracking-[-0.03em] ${
              stats.failedLast24h > 0 ? "text-bad" : "text-ink-faint"
            }`}
          >
            {stats.failedLast24h}
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-hairline bg-canvas-panel px-7 py-3">
        <span className="mr-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
          STATUS:
        </span>
        {[
          { k: "pending", label: "Pending" },
          { k: "approved,building", label: "Building" },
          { k: "built", label: "Built" },
          { k: "failed,scan_rejected", label: "Failed" },
          {
            k: "worker_failures",
            label:
              stats.deadLetteredCount > 0
                ? `DLQ · ${stats.deadLetteredCount}`
                : "DLQ",
          },
          { k: "rejected", label: "Rejected" },
          { k: "all", label: "All" },
        ].map((f) => {
          const isDlq = f.k === "worker_failures" && stats.deadLetteredCount > 0;
          return (
            <Link
              key={f.k}
              href={`/app/admin?status=${encodeURIComponent(f.k)}${
                ageFilter ? `&age=${encodeURIComponent(ageFilter)}` : ""
              }`}
              className={`border px-2.5 py-1 font-mono text-[11px] tracking-[0.02em] transition-colors ${
                statusFilter === f.k
                  ? "border-accent bg-accent/10 text-accent"
                  : isDlq
                    ? "border-bad/60 bg-bad/[0.06] text-bad hover:bg-bad/[0.12]"
                    : "border-hairline text-ink-faint hover:border-ink-ghost hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="mx-3 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
          AGE:
        </span>
        {[
          { k: "", label: "All" },
          { k: ">24h", label: ">24h" },
          { k: ">72h", label: ">72h" },
        ].map((f) => (
          <Link
            key={f.k}
            href={`/app/admin?status=${encodeURIComponent(statusFilter)}${
              f.k ? `&age=${encodeURIComponent(f.k)}` : ""
            }`}
            className={`border px-2.5 py-1 font-mono text-[11px] tracking-[0.02em] transition-colors ${
              (ageFilter ?? "") === f.k
                ? "border-accent bg-accent/10 text-accent"
                : "border-hairline text-ink-faint hover:border-ink-ghost hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <section className="px-7 py-7">
        {submissions.length === 0 ? (
          <div className="border border-dashed border-hairline p-8 text-center font-mono text-[11.5px] text-ink-ghost">
            Nothing matches this filter.
          </div>
        ) : (
          <div className="border border-hairline bg-canvas-deep">
            <div className="grid grid-cols-[120px_1fr_180px_120px_120px_80px] gap-4 border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint">
              <div>ID</div>
              <div>MODULE / SUBMITTER</div>
              <div>UPSTREAM</div>
              <div>SUBMITTED</div>
              <div>WAITING</div>
              <div className="text-right">STATUS</div>
            </div>
            {submissions.map((s, i) => {
              const tone = STATUS_TONE[s.status] ?? {
                label: s.status.toUpperCase(),
                className: "text-ink-faint border-hairline",
              };
              const waiting =
                s.status === "pending"
                  ? hoursAgo(s.submittedAt)
                  : s.buildStartedAt
                  ? hoursAgo(s.buildStartedAt)
                  : "—";
              return (
                <Link
                  key={s.id}
                  href={`/app/admin/${s.id}`}
                  className={`grid grid-cols-[120px_1fr_180px_120px_120px_80px] items-center gap-4 px-5 py-3 transition-colors hover:bg-canvas-panel ${
                    i < submissions.length - 1 ? "border-b border-hairline" : ""
                  }`}
                >
                  <span className="truncate font-mono text-[10.5px] tracking-[0.04em] text-ink-ghost">
                    {s.id}
                  </span>
                  <div className="min-w-0">
                    <div className="mb-0.5 flex items-baseline gap-2">
                      <span className="truncate font-display text-[14.5px] font-black leading-[1.1] tracking-[-0.015em] text-ink">
                        {s.moduleName}
                      </span>
                      <span className="font-mono text-[10px] text-ink-mute">
                        v{s.version}
                      </span>
                      {s.visibility === "private" && (
                        <span
                          className="border border-accent bg-accent/[0.08] px-1.5 py-[1px] font-mono text-[9px] font-medium tracking-[0.1em] text-accent"
                          title="Private — this module won't appear in the public catalog."
                        >
                          PRIV
                        </span>
                      )}
                    </div>
                    <div className="truncate font-body text-[12px] text-ink-softer">
                      {s.submitter?.name ?? s.submitter?.email ?? s.author}
                    </div>
                  </div>
                  <span className="truncate font-mono text-[11px] text-ink-softer">
                    {s.flags.upstreamUrl
                      ? s.flags.upstreamUrl.replace(/^https:\/\//, "")
                      : "—"}
                  </span>
                  <span className="font-mono text-[11px] text-ink-softer">
                    {hoursAgo(s.submittedAt)}
                  </span>
                  <span className="font-mono text-[11px] text-ink-softer">
                    {waiting}
                  </span>
                  <span className="text-right">
                    <span
                      className={`inline-flex items-center justify-center border px-1.5 py-0 font-mono text-[9.5px] font-medium tracking-[0.12em] ${tone.className}`}
                    >
                      {tone.label}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
