import Link from "next/link";
import type { Module } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
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
            <span className="font-mono text-[11px] tracking-[0.08em] text-ink-faint">
              SLSA {module.slsa}
            </span>
            <RebuildSlaBadge lastRebuiltAt={module.lastRebuiltAt ?? null} />
            <span className="font-mono text-[11px] text-ink-faint">·</span>
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
          {module.previewable ? (
            <Button
              variant="ghost"
              href={`https://s-${module.slug}-demo.preview.flareo.dev`}
              newTab
              // Plausible's tagged-event pattern: className tokens with
              // `plausible-event-name=...` and `plausible-event-<prop>=...`
              // are picked up by the loader script and fire the named
              // event with those props. No JS handler needed; works in a
              // server component.
              //
              // Pair this `PreviewLinkClicked` (forward trip) with the
              // `PreviewConversion` event fired from the conversion-
              // detector on /signup, /verify, /pricing, etc. (return
              // trip). Together they give a click-through funnel for the
              // F0 30-day decision gate.
              className={`plausible-event-name=PreviewLinkClicked plausible-event-moduleSlug=${module.slug} plausible-event-signedIn=${userSignedIn ? "yes" : "no"}`}
            >
              Preview this module →
            </Button>
          ) : (
            <Button variant="ghost" disabled>
              Preview unavailable · local only
            </Button>
          )}
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
            SLSA LEVEL
          </div>
          <div className="font-display text-[36px] font-black leading-[1] tracking-[-0.03em] text-ink">
            {module.slsa}
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
            LAST REBUILD
          </div>
          <div className="font-display text-[36px] font-black leading-[1] tracking-[-0.03em] text-ink">
            {module.updatedHours}h
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Rebuild SLA badge — color-coded freshness signal for the daily
 * canary rebuild. The Flareo trust story rests on daily reverification;
 * this badge makes that promise visible in the hero at-a-glance.
 *
 * Thresholds (hours since last successful rebuild):
 *   < 26h   — GOOD ("REBUILT TODAY") — inside the daily-plus-grace window
 *   < 50h   — WARN ("REBUILT 24-48H") — yesterday's run, check today's
 *   < 168h  — WARN ("REBUILT THIS WEEK") — stale but still in-spec per
 *             the weekly-minimum fallback
 *   ≥ 168h  — BAD  ("REBUILD OVERDUE") — SLA violation
 *   null    — muted ("NEVER REBUILT") — pre-canary or brand-new module
 *
 * The 26h good-window gives the daily cron a 2-hour grace period so
 * a module isn't yellow just because the job ran at 02:15 yesterday
 * and is being viewed at 02:45 today.
 */
function RebuildSlaBadge({ lastRebuiltAt }: { lastRebuiltAt: string | null }) {
  if (!lastRebuiltAt) {
    return (
      <span
        className="border border-hairline px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint"
        title="No rebuilds recorded yet. New modules may not have gone through a canary rebuild cycle."
      >
        NEVER REBUILT
      </span>
    );
  }

  const hoursAgo = (Date.now() - new Date(lastRebuiltAt).getTime()) / 3_600_000;
  let label: string;
  let toneClass: string;
  let tooltip: string;

  if (hoursAgo < 26) {
    label = "REBUILT TODAY";
    toneClass = "border-good bg-good/[0.08] text-good";
    tooltip = `Verified less than ${Math.ceil(hoursAgo)}h ago via the daily canary rebuild. Signatures, SBOM, and CVE scan are fresh.`;
  } else if (hoursAgo < 50) {
    label = "REBUILT 24-48H";
    toneClass = "border-warn bg-warn/[0.08] text-warn";
    tooltip = `Last rebuilt ${Math.floor(hoursAgo)}h ago. Today's canary run should re-verify soon.`;
  } else if (hoursAgo < 168) {
    label = "REBUILT THIS WEEK";
    toneClass = "border-warn bg-warn/[0.08] text-warn";
    tooltip = `Last rebuilt ${Math.floor(hoursAgo / 24)} days ago. Inside the weekly-minimum fallback window but daily rebuilds have been skipping.`;
  } else {
    label = "REBUILD OVERDUE";
    toneClass = "border-bad bg-bad/[0.08] text-bad";
    tooltip = `Last rebuilt ${Math.floor(hoursAgo / 24)} days ago — past the weekly SLA. Receipts may be stale.`;
  }

  return (
    <span
      className={`border px-2 py-1 font-mono text-[10px] font-medium tracking-[0.14em] ${toneClass}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}