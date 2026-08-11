import { Counter } from "@/components/interactive/Counter";
import type { CatalogStats } from "@/lib/db/stats";

/**
 * Four big numbers across the landing — values from getCatalogStats().
 * Parent omits this section entirely when stats cannot be loaded.
 */
export function MetricsStrip({ stats }: { stats: CatalogStats }) {
  return (
    <section className="grid grid-cols-1 border-b border-hairline bg-canvas-panel md:grid-cols-4">
      <div className="border-b border-hairline px-7 py-8 md:border-b-0 md:border-r">
        <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          MODULES
        </div>
        <div className="font-display text-[44px] font-black leading-[1] tracking-[-0.03em] text-ink">
          <Counter to={stats.moduleCount} />
        </div>
        <div className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          modules in public catalog
        </div>
      </div>

      <div className="border-b border-hairline px-7 py-8 md:border-b-0 md:border-r">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          PIPELINE RUNS{" "}
          <span className="font-normal tracking-[0.08em] text-ink-ghost">
            · 7 DAY
          </span>
        </div>
        <div className="font-display text-[44px] font-black leading-[1] tracking-[-0.03em] text-ink">
          <Counter to={stats.builds7d} />
        </div>
        <div className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          pipeline runs, last 7 days
        </div>
      </div>

      <div className="border-b border-hairline px-7 py-8 md:border-b-0 md:border-r">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          SCAN PASS
        </div>
        <div className="flex items-baseline gap-1.5 font-display text-[44px] font-black leading-[1] tracking-[-0.03em] text-good">
          <Counter to={stats.scanPassPct} />
          <span className="font-mono text-[14px] font-normal tracking-[0.02em] text-ink-faint">
            %
          </span>
        </div>
        <div className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          modules with 0 critical or high CVEs
        </div>
      </div>

      <div className="px-7 py-8">
        <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          VERIFIED
        </div>
        <div className="font-display text-[44px] font-black leading-[1] tracking-[-0.03em] text-ink">
          <Counter to={stats.verifiedCount} />
        </div>
        <div className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          modules with verified status
        </div>
      </div>
    </section>
  );
}
