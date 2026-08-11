import type { Module } from "@/lib/types";
import type { RebuildAttempt } from "@/lib/db/module-rebuilds";
import { formatLastRebuiltAt } from "@/lib/utils/time";

interface Props {
  module: Module;
  /**
   * Last N rebuild attempts, newest first. Empty array renders a
   * zero-state rather than hiding the section — "we haven't rebuilt
   * this yet" is a useful signal, not an absence of UI.
   */
  rebuilds: RebuildAttempt[];
}

/**
 * Republish history for one module. Surfaces the evidence chain so
 * viewers can see when the pipeline last ran successfully:
 *
 *   - Last successful rebuild timestamp (absolute + relative)
 *   - Counts: last-7-day success / unchanged / failed
 *   - Table: last ~10 attempts with outcome badges
 *
 * Critical for the supply-chain trust narrative — a freshness claim
 * is worthless without the evidence chain visible in the UI.
 */
export function RebuildHistorySection({ module, rebuilds }: Props) {
  const lastRebuildLabel = formatLastRebuiltAt(module.lastRebuiltAt);
  const hasRebuild = Boolean(module.lastRebuiltAt);

  // Bucket the last 7 days of attempts (within the fetched set).
  const sevenDaysAgo = Date.now() - 7 * 24 * 3_600_000;
  const last7 = rebuilds.filter(
    (r) => new Date(r.attemptedAt).getTime() >= sevenDaysAgo,
  );
  const counts = {
    success: last7.filter((r) => r.outcome === "success").length,
    unchanged: last7.filter((r) => r.outcome === "upstream_unchanged").length,
    failed: last7.filter(
      (r) =>
        r.outcome === "build_failed" || r.outcome === "scan_failed",
    ).length,
  };

  return (
    <section className="border-b border-hairline px-8 py-12">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-display text-[28px] font-black tracking-[-0.02em] text-ink">
          Rebuild history
        </h2>
        <div className="font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
          REPUBLISH LOG
        </div>
      </div>

      {/* Hero stats */}
      <div className="mb-7 grid grid-cols-4 gap-px border border-hairline bg-hairline">
        <div className="bg-canvas-deep px-5 py-5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            LAST REBUILT
          </div>
          <div
            className={`font-mono text-[13px] font-medium leading-[1.35] tracking-[0.01em] ${
              hasRebuild ? "text-ink" : "text-ink-ghost"
            }`}
          >
            {lastRebuildLabel}
          </div>
          <div className="mt-2 font-mono text-[10.5px] text-ink-ghost">
            {hasRebuild
              ? "most recent successful republish"
              : "awaiting first republish"}
          </div>
        </div>

        <StatNumber
          label="SUCCESSES · 7D"
          value={counts.success}
          tone="good"
          sub="fresh signed images"
        />
        <StatNumber
          label="UNCHANGED · 7D"
          value={counts.unchanged}
          sub="upstream didn't move"
        />
        <StatNumber
          label="FAILURES · 7D"
          value={counts.failed}
          tone={counts.failed > 0 ? "bad" : "neutral"}
          sub={
            counts.failed > 0
              ? "flagged for human review"
              : "clean run"
          }
        />
      </div>

      {/* Attempt table */}
      {rebuilds.length === 0 ? (
        <div className="border border-dashed border-hairline bg-canvas-deep px-6 py-8 text-center font-body text-[13px] text-ink-ghost">
          No rebuild attempts yet. The first republish run will appear
          here once this module has been through the pipeline.
        </div>
      ) : (
        <div className="border border-hairline">
          <div className="grid grid-cols-[140px_1fr_100px_140px] gap-0 border-b border-hairline bg-canvas-deep px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            <div>WHEN</div>
            <div>OUTCOME</div>
            <div className="text-right">DURATION</div>
            <div className="text-right">DIGEST</div>
          </div>
          {rebuilds.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[140px_1fr_100px_140px] gap-0 border-b border-hairline px-5 py-2.5 transition-colors hover:bg-accent/[0.02] last:border-0"
            >
              <div className="font-mono text-[11.5px] text-ink-softer">
                {formatWhen(r.attemptedAt)}
              </div>
              <div className="flex items-center gap-2">
                <OutcomePill outcome={r.outcome} />
                {r.notes && (
                  <span className="truncate font-body text-[12px] text-ink-softer">
                    {r.notes}
                  </span>
                )}
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
                  ? r.resultDigest.replace(/^sha256:/, "").slice(0, 12)
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-5 font-body text-[12.5px] leading-[1.65] text-ink-softer">
        When a module is republished, Flareo rescans for CVEs and re-signs
        with cosign. If upstream hasn&apos;t changed, the existing signature
        stays valid. If a new critical CVE lands, the module flips to{" "}
        <code className="bg-canvas-deep px-1.5 text-ink">status: failing</code>{" "}
        and the deploy panel surfaces the CVE list until upstream ships a fix.
        Check <span className="text-ink">last rebuilt</span> above for when
        this module was last through the pipeline.
      </p>

      {/* Silence module to avoid lint when module is unused */}
      <span className="sr-only">{module.slug}</span>
    </section>
  );
}

function StatNumber({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: number | string;
  tone?: "good" | "bad" | "neutral";
  sub?: string;
}) {
  const toneClass =
    tone === "good"
      ? "text-good"
      : tone === "bad"
        ? "text-bad"
        : "text-ink";
  return (
    <div className="bg-canvas-deep px-5 py-5">
      <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
        {label}
      </div>
      <div
        className={`font-display text-[28px] font-black leading-none tracking-[-0.02em] ${toneClass}`}
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
      className={`inline-flex items-center border px-1.5 py-0 font-mono text-[9.5px] font-medium tracking-[0.12em] ${c.className}`}
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
