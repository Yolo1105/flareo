import Link from "next/link";
import type { Module } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatLastRebuiltAt } from "@/lib/utils/time";
import { LaunchPrivatePreviewButton } from "./LaunchPrivatePreviewButton";

interface Props {
  module: Module;
  /** Whether the current viewer is signed in. Plumbed through from
   *  the page component so analytics events can include it as a
   *  prop (high-signal for whether previews convert better for
   *  signed-in vs anonymous visitors). */
  userSignedIn?: boolean;
}

export function ModuleHero({ module, userSignedIn = false }: Props) {
  const lastRebuilt = formatLastRebuiltAt(module.lastRebuiltAt);

  return (
    <section className="border-b border-hairline px-8 pb-10 pt-12">
      {/* Breadcrumb */}
      <div className="mb-7 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
        <Link href="/catalog" className="hover:text-ink">
          catalog
        </Link>
        <span className="mx-2 text-ink-ghost">/</span>
        <span className="hover:text-ink">{module.category}</span>
        <span className="mx-2 text-ink-ghost">/</span>
        <span className="text-ink">{module.slug}</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_auto]">
        <div>
          {/* Stamp row */}
          <div className="mb-5 flex items-center gap-3">
            <StatusBadge
              tone={module.status === "verified" ? "ok" : module.status === "pending" ? "warn" : "bad"}
              pulse={module.status === "verified"}
            >
              {module.status.toUpperCase()}
            </StatusBadge>
            {module.visibility === "private" && (
              <span
                className="border border-accent bg-accent/[0.08] px-2 py-1 font-mono text-[10px] font-medium tracking-[0.14em] text-accent"
                title="Private module — visible only to you and admins. Not listed in the public catalog."
              >
                PRIVATE
              </span>
            )}
            <span className="font-mono text-[11px] text-ink-faint">
              {module.id}
            </span>
          </div>

          {/* Name + version */}
          <div className="mb-4 flex items-baseline gap-4">
            <h1 className="font-display text-[72px] font-black leading-[0.95] tracking-[-0.035em] text-ink">
              {module.name}
            </h1>
            <span className="border border-hairline px-3 py-1.5 font-mono text-[13px] tracking-[0.02em] text-ink-mute">
              v{module.version}
            </span>
          </div>

          {/* Description */}
          <p className="mb-2 max-w-[640px] font-body text-[16px] leading-[1.55] text-ink-softer">
            {module.description}
          </p>
          <div className="font-mono text-[12px] tracking-[0.02em] text-ink-faint">
            by{" "}
            {module.publisherUsername ? (
              <Link
                href={`/@${module.publisherUsername}`}
                className="text-ink hover:text-accent"
              >
                {module.author}
              </Link>
            ) : (
              <span className="text-ink">{module.author}</span>
            )}
            <span className="mx-2 text-ink-ghost">·</span>
            {module.tags.join(" · ")}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button variant="ghost">Export runbook</Button>
          <Button variant="primary">Pull this module</Button>
          {/* SPECULATIVE — see decisions.md G-1.
              Per-user preview launch button. Only rendered when
              the feature flag is on (set FLAREO_FEATURE_PREVIEWS_PER_USER=true
              in env once F0 data supports F1 per decisions.md). When
              F0 says "no F1," delete this block plus the matching
              LaunchPrivatePreviewButton + the lib/preview/ + the
              speculative endpoints. The flag is the canonical grep
              target for the cleanup. */}
          {process.env.FLAREO_FEATURE_PREVIEWS_PER_USER === "true" &&
            userSignedIn &&
            module.previewable && (
              <LaunchPrivatePreviewButton slug={module.slug} />
            )}
        </div>
      </div>

      {/* Four-metric hero strip */}
      <div className="mt-10 grid grid-cols-2 border border-hairline md:grid-cols-4">
        <div className="border-b border-r border-hairline px-6 py-5 md:border-b-0">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            TRUST SCORE
          </div>
          <div
            className={`font-display text-[36px] font-black leading-[1] tracking-[-0.03em] ${
              module.trust >= 90
                ? "text-good"
                : module.trust >= 70
                  ? "text-warn"
                  : "text-bad"
            }`}
          >
            {module.trust}
          </div>
        </div>
        <div className="border-b border-hairline px-6 py-5 md:border-b-0 md:border-r">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            PROVENANCE
          </div>
          <div className="font-display text-[36px] font-black leading-[1] tracking-[-0.03em] text-ink">
            {module.trustBreakdown.provenance}
          </div>
        </div>
        <div className="border-r border-hairline px-6 py-5">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            CVE FINDINGS
          </div>
          <div
            className={`font-display text-[36px] font-black leading-[1] tracking-[-0.03em] ${
              module.cves.critical > 0 ? "text-bad" : "text-good"
            }`}
          >
            {module.cves.critical + module.cves.high + module.cves.medium + module.cves.low}
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            LAST REBUILT
          </div>
          <div
            className={`font-mono text-[13px] font-medium leading-[1.35] tracking-[0.01em] ${
              module.lastRebuiltAt ? "text-ink" : "text-ink-ghost"
            }`}
            title={lastRebuilt}
          >
            {lastRebuilt}
          </div>
        </div>
      </div>
    </section>
  );
}
