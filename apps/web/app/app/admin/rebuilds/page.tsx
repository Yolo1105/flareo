import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import {
  listRecentRebuildsAdmin,
  getRebuildLogSummary,
} from "@/lib/db/module-rebuilds";

export const metadata: Metadata = {
  title: "Rebuild log · admin",
};

export const dynamic = "force-dynamic";

/**
 * Admin-only view of the canary rebuild chain across all modules.
 * Complement to the per-module rebuild history on module detail pages.
 *
 * Supports ?show=failures for operational triage. Default shows all
 * outcomes (success / unchanged / build_failed / scan_failed).
 */
export default async function AdminRebuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  await requireAdminPage();

  const params = await searchParams;
  const show: "all" | "failures" =
    params.show === "failures" ? "failures" : "all";

  const [summary, rows] = await Promise.all([
    getRebuildLogSummary(),
    listRecentRebuildsAdmin({ show, limit: 100 }),
  ]);

  const lastAttemptHours = summary.lastAttemptAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(summary.lastAttemptAt).getTime()) / 3_600_000,
        ),
      )
    : null;
  const healthy =
    summary.last24h.failed === 0 &&
    lastAttemptHours !== null &&
    lastAttemptHours <= 25;

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN · REBUILD LOG"
        title="Canary rebuild chain"
        subtitle="Daily re-verification of every catalog module. Upstream-unchanged outcomes are benign no-ops; build/scan failures need human triage."
        actions={
          <div className="flex gap-2">
            <Link
              href="/app/admin"
              className="border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink-softer hover:text-ink"
            >
              ← back to queue
            </Link>
            <Link
              href="/app/admin/worker"
              className="border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink-softer hover:text-ink"
            >
              worker health →
            </Link>
          </div>
        }
      />

      <div className="space-y-6 px-7 py-7">
        {/* Health summary */}
        <section className="grid grid-cols-5 gap-px border border-hairline bg-hairline">
          <Stat
            label="LAST ATTEMPT"
            value={
              lastAttemptHours === null
                ? "never"
                : lastAttemptHours === 0
                  ? "just now"
                  : `${lastAttemptHours}h ago`
            }
            tone={
              lastAttemptHours === null
                ? "neutral"
                : lastAttemptHours <= 25
                  ? "good"
                  : "warn"
            }
            sub={
              lastAttemptHours === null
                ? "canary hasn't run"
                : lastAttemptHours <= 25
                  ? "within daily window"
                  : "canary may be stuck"
            }
          />
          <Stat
            label="SUCCESS · 24H"
            value={summary.last24h.success}
            tone="good"
          />
          <Stat
            label="UNCHANGED · 24H"
            value={summary.last24h.unchanged}
            sub="benign no-ops"
          />
          <Stat
            label="FAILED · 24H"
            value={summary.last24h.failed}
            tone={summary.last24h.failed > 0 ? "bad" : "neutral"}
            sub={
              summary.last24h.failed > 0
                ? "see failures filter below"
                : "clean run"
            }
          />
          <Stat
            label="CHAIN HEALTH"
            value={healthy ? "GREEN" : "AMBER"}
            tone={healthy ? "good" : "warn"}
            sub={healthy ? "last 24h nominal" : "needs eyes"}
          />
        </section>

        {/* Filter */}
        <div className="flex items-center gap-2 border-b border-hairline bg-canvas-panel px-5 py-3">
          <span className="mr-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            SHOW:
          </span>
          {(
            [
              { k: "all", label: "All outcomes" },
              { k: "failures", label: "Failures only" },
            ] as const
          ).map((f) => (
            <Link
              key={f.k}
              href={`/app/admin/rebuilds${f.k === "failures" ? "?show=failures" : ""}`}
              className={`border px-2.5 py-1 font-mono text-[11px] tracking-[0.02em] transition-colors ${
                show === f.k
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-hairline text-ink-faint hover:border-ink-ghost hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          ))}
          <span className="ml-auto font-mono text-[10.5px] text-ink-ghost">
            showing {rows.length} most recent
          </span>
        </div>

        {/* Attempt table */}
        {rows.length === 0 ? (
          <div className="border border-dashed border-hairline bg-canvas-deep px-6 py-10 text-center font-body text-[13px] text-ink-ghost">
            {show === "failures"
              ? "No failures in the log. Pipeline is clean."
              : "No rebuild attempts have been recorded yet. The canary script writes to this log each time it runs."}
          </div>
        ) : (
          <div className="border border-hairline bg-canvas-deep">
            <div className="grid grid-cols-[130px_1fr_120px_100px_180px] gap-0 border-b border-hairline bg-canvas px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              <div>WHEN</div>
              <div>MODULE</div>
              <div>OUTCOME</div>
              <div className="text-right">DURATION</div>
              <div className="text-right">DIGEST / NOTE</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[130px_1fr_120px_100px_180px] gap-0 border-b border-hairline px-5 py-2.5 transition-colors hover:bg-accent/[0.025] last:border-0"
              >
                <div className="font-mono text-[11.5px] text-ink-softer">
                  {formatWhen(r.attemptedAt)}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/modules/${r.moduleSlug}`}
                    className="truncate font-display text-[14px] font-black text-ink hover:text-accent"
                  >
                    {r.moduleSlug}
                  </Link>
                </div>
                <div>
                  <OutcomePill outcome={r.outcome} />
                </div>
                <div className="text-right font-mono text-[11.5px] text-ink-softer">
                  {r.durationMs != null
                    ? r.durationMs < 1000
                      ? `${r.durationMs}ms`
                      : `${(r.durationMs / 1000).toFixed(1)}s`
                    : "—"}
                </div>
                <div className="truncate text-right font-mono text-[11px] text-ink-faint">
                  {r.resultDigest
                    ? r.resultDigest.replace(/^sha256:/, "").slice(0, 14)
                    : r.notes
                      ? r.notes.slice(0, 30)
                      : "—"}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="font-body text-[12px] leading-[1.65] text-ink-softer">
          The canary script runs daily against every module in the catalog.
          Rows here are append-only; the denormalized{" "}
          <code className="bg-canvas-deep px-1.5 text-ink">
            Module.lastRebuiltAt
          </code>{" "}
          column advances on{" "}
          <code className="bg-canvas-deep px-1.5 text-ink">success</code>{" "}
          or{" "}
          <code className="bg-canvas-deep px-1.5 text-ink">
            upstream_unchanged
          </code>{" "}
          outcomes. Failures are surfaced on the per-module rebuild history
          section; a module with N consecutive failures should be
          investigated.
        </p>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: number | string;
  tone?: "good" | "warn" | "bad" | "neutral";
  sub?: string;
}) {
  const toneClass =
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
        className={`font-display text-[26px] font-black leading-none tracking-[-0.02em] ${toneClass}`}
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

function OutcomePill({ outcome }: { outcome: string }) {
  const config: Record<string, { label: string; className: string }> = {
    success: {
      label: "SUCCESS",
      className: "border-good bg-good/[0.08] text-good",
    },
    upstream_unchanged: {
      label: "UNCHANGED",
      className: "border-hairline bg-canvas-deep text-ink-softer",
    },
    build_failed: {
      label: "BUILD FAIL",
      className: "border-bad bg-bad/[0.08] text-bad",
    },
    scan_failed: {
      label: "SCAN FAIL",
      className: "border-bad bg-bad/[0.08] text-bad",
    },
  };
  const c = config[outcome] ?? {
    label: outcome.toUpperCase(),
    className: "border-hairline text-ink-softer",
  };
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[9.5px] font-medium tracking-[0.12em] ${c.className}`}
    >
      {c.label}
    </span>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 14) return `${days}d ago`;
  return d.toISOString().slice(0, 10);
}
