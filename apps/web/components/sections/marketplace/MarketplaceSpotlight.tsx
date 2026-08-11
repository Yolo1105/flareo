import Link from "next/link";
import type { Module } from "@/lib/types";
import type { ReviewAggregate } from "@/lib/db/reviews";
import { TrustScore } from "./TrustScore";
import { Stars } from "./Stars";
import { formatLastRebuiltAt } from "@/lib/utils/time";

interface Props {
  module: Module;
  blurb: string | null;
  aggregate: ReviewAggregate | null;
}

/**
 * Top-of-marketplace spotlight. One module gets the full-bleed
 * treatment — large name, trust score, blurb if editorial, inline
 * review aggregate, "Try preview" + "Read receipts" CTAs, and a
 * one-line deploy snippet so the takeaway story is visible without
 * leaving the page.
 *
 * Picked from featured[0] when the editorial team has curated
 * something; falls back to highest-trust module otherwise. Caller
 * decides which.
 */
export function MarketplaceSpotlight({ module, blurb, aggregate }: Props) {
  return (
    <section className="border-b border-hairline px-8 py-12">
      <div className="mb-5 flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.14em] text-accent">
          ★ SPOTLIGHT
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="border border-hairline bg-canvas-deep p-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10.5px] tracking-[0.06em] text-ink-ghost">
                  {module.author}
                </span>
                <span className="text-ink-ghost">/</span>
                <span className="font-mono text-[10.5px] tracking-[0.06em] text-ink-mute">
                  v{module.version}
                </span>
                <span className="text-ink-ghost">/</span>
                <span className="font-mono text-[10.5px] tracking-[0.06em] text-good">
                  signed provenance
                </span>
              </div>
              <h2 className="font-display text-[44px] font-black leading-[0.98] tracking-[-0.03em] text-ink">
                {module.name}
              </h2>
              <p className="mt-3 max-w-[640px] font-body text-[15px] leading-[1.55] text-ink-softer">
                {module.description}
              </p>
            </div>
            <TrustScore value={module.trust} />
          </div>

          {blurb && (
            <blockquote className="mt-5 border-l-2 border-accent bg-canvas-panel p-4 font-body text-[13.5px] italic leading-[1.6] text-ink-mute">
              <span className="mb-1 block font-mono text-[9.5px] not-italic tracking-[0.14em] text-accent">
                EDITOR&apos;S NOTE
              </span>
              {blurb}
            </blockquote>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
            <Link
              href={`/modules/${module.slug}`}
              className="border border-accent bg-accent px-5 py-2.5 font-body text-[13px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-accent-hot"
            >
              See full receipts →
            </Link>
            {module.previewable && (
              <Link
                href={`/app/modules/${module.slug}/preview`}
                className="border border-hairline bg-canvas-panel px-5 py-2.5 font-body text-[13px] font-medium tracking-[0.01em] text-ink transition-colors hover:border-accent"
              >
                Try shared demo →
              </Link>
            )}
            {aggregate && aggregate.count > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <Stars value={aggregate.average ?? 0} />
                <span className="font-mono text-[11px] text-ink-mute">
                  {aggregate.average?.toFixed(1)}{" "}
                  <span className="text-ink-ghost">
                    ({aggregate.count} review{aggregate.count === 1 ? "" : "s"})
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SpecimenTile
            label="DIGEST"
            value={module.digest.replace("sha256:", "").slice(0, 24) + "…"}
            mono
          />
          <SpecimenTile label="SIZE" value={module.size} />
          <SpecimenTile
            label="CVES"
            value={
              module.cves.critical + module.cves.high === 0
                ? "0 critical · 0 high"
                : `${module.cves.critical}c · ${module.cves.high}h`
            }
            tone={
              module.cves.critical + module.cves.high === 0 ? "good" : "warn"
            }
          />
          <SpecimenTile
            label="LAST REBUILT"
            value={formatLastRebuiltAt(module.lastRebuiltAt)}
            mono
          />
          <div className="border border-dashed border-hairline bg-canvas-deep p-4">
            <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
              ONE-LINE DEPLOY
            </div>
            <pre className="overflow-x-auto font-mono text-[11.5px] leading-[1.6] text-ink">
              {`docker pull ghcr.io/flareo/${module.slug}:${module.version}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecimenTile({
  label,
  value,
  sub,
  mono,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  tone?: "good" | "warn";
}) {
  const valueClass =
    tone === "good"
      ? "text-good"
      : tone === "warn"
        ? "text-warn"
        : "text-ink";
  return (
    <div className="flex items-baseline justify-between gap-3 border border-hairline bg-canvas-deep px-4 py-3">
      <div>
        <div className="font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
          {label}
        </div>
        {sub && (
          <div className="mt-0.5 font-body text-[10.5px] text-ink-softer">
            {sub}
          </div>
        )}
      </div>
      <div
        className={`${
          mono ? "font-mono text-[12px]" : "font-body text-[14px] font-medium"
        } ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}
