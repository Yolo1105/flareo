import Link from "next/link";
import type { Module } from "@/lib/types";

interface Props {
  module: Module;
}

/**
 * Inline trust-score breakdown panel for module detail hero. Shows
 * each contribution to the headline trust number — the proposal's
 * "as a breakdown showing each signal's contribution" element.
 *
 * The values come from Module.trustBreakdown (vulns/provenance/
 * signature/sbom). Each signal is scored 0–100 with equal weight;
 * the headline trust is their mean. Score rationale lives at
 * /docs/trust-score; this panel links there for the methodology.
 *
 * Why this exists at all: trust scores are useless without their
 * decomposition. A 96 means little until the visitor sees each
 * signal's contribution. The breakdown is the proof that the score
 * is real.
 */
export function TrustBreakdown({ module }: Props) {
  const segments = [
    {
      key: "vulns" as const,
      label: "VULNERABILITY POSTURE",
      value: module.trustBreakdown.vulns,
      max: 100,
      sub: ((): string => {
        const totalActionable =
          module.cves.critical + module.cves.high;
        if (totalActionable === 0) return "0 critical, 0 high — full credit";
        if (module.cves.critical > 0) return "critical CVEs reduce score";
        return `${module.cves.high} high CVEs — partial credit`;
      })(),
    },
    {
      key: "provenance" as const,
      label: "PROVENANCE",
      value: module.trustBreakdown.provenance,
      max: 100,
      sub: "signed provenance, upstream digest recorded",
    },
    {
      key: "signature" as const,
      label: "SIGNATURE CHAIN",
      value: module.trustBreakdown.signature,
      max: 100,
      sub: "cosign keyless · Rekor logged",
    },
    {
      key: "sbom" as const,
      label: "SBOM COMPLETENESS",
      value: module.trustBreakdown.sbom,
      max: 100,
      sub: "CycloneDX 1.5 · all components",
    },
  ];

  return (
    <section className="border-b border-hairline px-8 py-10">
      <header className="mb-5 flex items-end justify-between gap-6">
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            TRUST SCORE BREAKDOWN
          </div>
          <h2 className="font-display text-[22px] font-black leading-[1.05] tracking-[-0.02em] text-ink">
            How {module.trust} adds up.
          </h2>
        </div>
        <Link
          href="/docs/trust-score"
          className="hidden shrink-0 font-mono text-[11px] text-accent hover:text-accent-hot md:block"
        >
          methodology →
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-px border border-hairline bg-hairline md:grid-cols-4">
        {segments.map((s) => {
          const pct = Math.max(0, Math.min(1, s.value / s.max));
          const tone =
            pct >= 0.9 ? "good" : pct >= 0.6 ? "warn" : "bad";
          const color =
            tone === "good"
              ? "text-good"
              : tone === "warn"
                ? "text-warn"
                : "text-bad";
          const barColor =
            tone === "good"
              ? "bg-good"
              : tone === "warn"
                ? "bg-warn"
                : "bg-bad";
          return (
            <div
              key={s.key}
              className="flex flex-col gap-3 bg-canvas-deep p-5"
            >
              <div className="font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
                {s.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-display text-[32px] font-black leading-[0.85] tracking-[-0.025em] ${color}`}
                >
                  +{s.value}
                </span>
                <span className="font-mono text-[11px] text-ink-faint">
                  / {s.max}
                </span>
              </div>
              <div className="h-1 w-full bg-hairline-soft">
                <div
                  className={`h-full ${barColor}`}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              <div className="font-body text-[11.5px] leading-[1.5] text-ink-softer">
                {s.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-ink-ghost md:hidden">
        <span>Per-component contribution to the {module.trust} headline.</span>
        <Link
          href="/docs/trust-score"
          className="text-accent hover:text-accent-hot"
        >
          methodology →
        </Link>
      </div>
    </section>
  );
}
