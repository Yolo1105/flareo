import { Counter } from "@/components/interactive/Counter";

/**
 * Four big numbers across the landing — MODULES, BUILDS, SCAN PASS,
 * STAGE P50 — with count-up animations when visible.
 */
export function MetricsStrip() {
  return (
    <section className="grid grid-cols-1 border-b border-hairline bg-canvas-panel md:grid-cols-4">
      <div className="border-b border-hairline px-7 py-8 md:border-b-0 md:border-r">
        <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          MODULES · VERIFIED
        </div>
        <div className="font-display text-[44px] font-black leading-[1] tracking-[-0.03em] text-ink">
          <Counter to={12} />
        </div>
        <div className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          in public catalog today
        </div>
      </div>

      <div className="border-b border-hairline px-7 py-8 md:border-b-0 md:border-r">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          BUILDS <span className="font-normal tracking-[0.08em] text-ink-ghost">· 7 DAY</span>
        </div>
        <div className="font-display text-[44px] font-black leading-[1] tracking-[-0.03em] text-ink">
          <Counter to={41} />
        </div>
        <div className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          full pipeline runs
        </div>
      </div>

      <div className="border-b border-hairline px-7 py-8 md:border-b-0 md:border-r">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          SCAN PASS <span className="font-normal tracking-[0.08em] text-ink-ghost">· 7 DAY</span>
        </div>
        <div className="flex items-baseline gap-1.5 font-display text-[44px] font-black leading-[1] tracking-[-0.03em] text-good">
          <Counter to={87} />
          <span className="font-mono text-[14px] font-normal tracking-[0.02em] text-ink-faint">%</span>
        </div>
        <div className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          builds with 0 critical CVEs
        </div>
      </div>

      <div className="px-7 py-8">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          STAGE P50 <span className="font-normal tracking-[0.08em] text-ink-ghost">· 7 DAY</span>
        </div>
        <div className="flex items-baseline gap-1.5 font-display text-[44px] font-black leading-[1] tracking-[-0.03em] text-ink">
          <Counter to={340} />
          <span className="font-mono text-[14px] font-normal tracking-[0.02em] text-ink-faint">ms</span>
        </div>
        <div className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          median stage execution
        </div>
      </div>
    </section>
  );
}
