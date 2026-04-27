import type { Metadata } from "next";
import Link from "next/link";
import { hasDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import { getAggregatesForSlugs, type ReviewAggregate } from "@/lib/db/reviews";
import type { Module } from "@/lib/types";
import { PageHero } from "@/components/ui/PageHero";
import { TrustScore } from "@/components/sections/marketplace/TrustScore";

export const metadata: Metadata = {
  title: "Compare modules",
  description:
    "Pick two modules in the same category and see them side by side — Trust Score, CVE counts, SBOM size, last update, deploy count.",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  a?: string;
  b?: string;
}

/**
 * /compare-modules — pick two modules, see them side by side.
 *
 * The proposal called this Idea 8: "Pick two similar modules →
 * side-by-side Trust Scores, CVE counts, SBOM sizes, last-update
 * dates, deploy counts. Turns the marketplace from browsing into
 * decision-making."
 *
 * Two modes:
 *   - Picker mode: ?a or ?b missing → show two-column module picker
 *     with the modules grouped by category so visitors compare
 *     like-with-like.
 *   - Compare mode: both ?a and ?b present → render the side-by-side
 *     comparison with all the signals the proposal called out.
 *
 * Designed to be linked into directly, e.g.
 * /compare-modules?a=vaultwarden&b=gitea — supports sharing a
 * specific comparison via copy-paste of the URL.
 */
export default async function CompareModulesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const allModules = await safeListAllModules();

  // Resolve picks. If either is missing or invalid, we render the picker.
  const a = params.a ? allModules.find((m) => m.slug === params.a) : null;
  const b = params.b ? allModules.find((m) => m.slug === params.b) : null;

  const showCompare = a && b && a.slug !== b.slug;

  return (
    <>
      <PageHero
        eyebrow="COMPARE / DECISION TOOL"
        prompt={
          showCompare
            ? `flareo compare ${a.slug} ${b.slug}`
            : "flareo compare <module-a> <module-b>"
        }
        promptComment="# turn browsing into decision-making"
        title={
          <>
            Two modules,
            <br />
            one screen.
          </>
        }
      >
        <p className="max-w-[680px] font-body text-[15px] leading-[1.55] text-ink-softer">
          When you&apos;re deciding between similar modules — two photo
          servers, two reverse proxies, two password managers — line them
          up against each other on the things that matter for production:
          Trust Score, CVE posture, rebuild freshness, deploy count, what
          operators are saying.
        </p>
      </PageHero>

      {showCompare ? (
        <CompareView a={a} b={b} allModules={allModules} />
      ) : (
        <PickerView
          allModules={allModules}
          selectedA={a?.slug ?? null}
          selectedB={b?.slug ?? null}
        />
      )}
    </>
  );
}

// ─── data helpers ─────────────────────────────────────────────────

async function safeListAllModules(): Promise<Module[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = (await prisma.module.findMany({
      where: { visibility: "public" } as never,
      orderBy: { trust: "desc" } as never,
    })) as ModuleShape[];
    return rows.map(shapeToModule);
  } catch {
    return [];
  }
}

async function safeAggregates(slugs: string[]): Promise<Record<string, ReviewAggregate>> {
  if (slugs.length === 0) return {};
  try {
    const map = await getAggregatesForSlugs(slugs);
    return Object.fromEntries(map.entries());
  } catch {
    return {};
  }
}

// ─── Picker view (no selection yet) ───────────────────────────────

function PickerView({
  allModules,
  selectedA,
  selectedB,
}: {
  allModules: Module[];
  selectedA: string | null;
  selectedB: string | null;
}) {
  // Group by category so the picker leads with same-category options.
  const byCategory = groupByCategory(allModules);
  const categories = Object.keys(byCategory).sort();

  return (
    <section className="border-b border-hairline px-8 py-12">
      <div className="mx-auto max-w-[1080px]">
        {(selectedA || selectedB) && (
          <div className="mb-6 border border-dashed border-accent bg-accent/[0.04] p-4">
            <div className="font-mono text-[11px] tracking-[0.04em] text-accent">
              {selectedA && !selectedB && (
                <>
                  Picked <span className="text-ink">{selectedA}</span>. Now
                  pick a second module to compare.
                </>
              )}
              {!selectedA && selectedB && (
                <>
                  Picked <span className="text-ink">{selectedB}</span>. Now
                  pick a second module to compare.
                </>
              )}
              {selectedA && selectedB && selectedA === selectedB && (
                <>
                  Both picks are the same module. Choose a different second
                  module.
                </>
              )}
            </div>
          </div>
        )}

        <div className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-ink-ghost">
          PICK TWO MODULES
        </div>
        <h2 className="mb-8 font-display text-[26px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
          Same-category comparisons surface first.
        </h2>

        {categories.map((cat) => {
          const items = byCategory[cat];
          if (items.length < 2) return null;
          return (
            <section key={cat} className="mb-10">
              <header className="mb-3 flex items-baseline justify-between border-b border-hairline pb-2">
                <h3 className="font-display text-[16px] font-black tracking-[-0.02em] text-ink">
                  {prettyCategory(cat)}
                </h3>
                <span className="font-mono text-[10.5px] text-ink-ghost">
                  {items.length} modules
                </span>
              </header>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <PickerCard
                    key={m.slug}
                    module={m}
                    selectedA={selectedA}
                    selectedB={selectedB}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function PickerCard({
  module: m,
  selectedA,
  selectedB,
}: {
  module: Module;
  selectedA: string | null;
  selectedB: string | null;
}) {
  const isA = selectedA === m.slug;
  const isB = selectedB === m.slug;

  // The link parameters depend on what's already picked: if A is set,
  // clicking this fills B; if B is set, clicking fills A; if neither,
  // clicking sets A.
  const targetParams = new URLSearchParams();
  if (isA || isB) {
    // Already picked — link clears it.
    if (isA && selectedB) targetParams.set("b", selectedB);
    if (isB && selectedA) targetParams.set("a", selectedA);
  } else if (selectedA) {
    targetParams.set("a", selectedA);
    targetParams.set("b", m.slug);
  } else if (selectedB) {
    targetParams.set("a", m.slug);
    targetParams.set("b", selectedB);
  } else {
    targetParams.set("a", m.slug);
  }
  const href = `/compare-modules?${targetParams.toString()}`;

  const borderClass = isA || isB
    ? "border-accent"
    : "border-hairline hover:border-accent";
  const labelClass = isA
    ? "text-accent"
    : isB
      ? "text-accent"
      : "text-ink-ghost";

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 border bg-canvas-deep p-3 transition-colors ${borderClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[14px] font-black leading-[1.15] tracking-[-0.015em] text-ink">
          {m.name}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10.5px] text-ink-faint">
          v{m.version} · SLSA {m.slsa}
        </div>
      </div>
      <div className={`shrink-0 font-mono text-[10px] tracking-[0.12em] ${labelClass}`}>
        {isA ? "PICK A · DESELECT" : isB ? "PICK B · DESELECT" : "PICK →"}
      </div>
    </Link>
  );
}

// ─── Compare view ─────────────────────────────────────────────────

async function CompareView({
  a,
  b,
  allModules: _allModules,
}: {
  a: Module;
  b: Module;
  allModules: Module[];
}) {
  const aggregates = await safeAggregates([a.slug, b.slug]);
  const aAgg = aggregates[a.slug] ?? null;
  const bAgg = aggregates[b.slug] ?? null;

  const sameCategory = a.category === b.category;

  return (
    <>
      {/* Pick row — current picks + change link */}
      <section className="border-b border-hairline bg-canvas-deep px-8 py-4">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono text-[11px] text-ink-faint">
            <span className="text-ink-ghost">A:</span>
            <span className="text-ink">{a.name}</span>
            <span className="text-ink-ghost">·</span>
            <span className="text-ink-ghost">B:</span>
            <span className="text-ink">{b.name}</span>
            {sameCategory ? (
              <span className="ml-3 inline-flex items-center gap-1.5 border border-good/40 px-1.5 py-0.5 text-[9.5px] tracking-[0.1em] text-good">
                ✓ SAME CATEGORY
              </span>
            ) : (
              <span className="ml-3 inline-flex items-center gap-1.5 border border-warn/40 px-1.5 py-0.5 text-[9.5px] tracking-[0.1em] text-warn">
                ◆ DIFFERENT CATEGORIES
              </span>
            )}
          </div>
          <Link
            href="/compare-modules"
            className="font-mono text-[10.5px] text-accent hover:text-accent-hot"
          >
            change picks →
          </Link>
        </div>
      </section>

      {/* Headline cards — name + trust score in big type */}
      <section className="border-b border-hairline px-8 py-12">
        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-2">
          <HeadlineCard module={a} side="A" />
          <HeadlineCard module={b} side="B" />
        </div>
      </section>

      {/* Comparison rows */}
      <section className="px-8 py-12">
        <div className="mx-auto max-w-[1080px]">
          <h2 className="mb-1 font-display text-[20px] font-black tracking-[-0.025em] text-ink">
            Side by side, signal by signal.
          </h2>
          <p className="mb-8 max-w-[640px] font-body text-[13px] leading-[1.6] text-ink-softer">
            Each row is a single signal compared between A and B. Where one
            module is meaningfully better, we mark the winner — &ldquo;tied&rdquo;
            when within rounding, &ldquo;n/a&rdquo; when the signal
            doesn&apos;t apply.
          </p>

          <CompareRow
            label="Trust Score"
            sub="0-100 composite"
            aValue={a.trust}
            bValue={b.trust}
            aFormatted={String(a.trust)}
            bFormatted={String(b.trust)}
            aTone={trustTone(a.trust)}
            bTone={trustTone(b.trust)}
            higherIsBetter
          />
          <CompareRow
            label="SLSA level"
            sub="provenance attestation tier"
            aValue={parseInt(a.slsa.replace("L", ""), 10)}
            bValue={parseInt(b.slsa.replace("L", ""), 10)}
            aFormatted={a.slsa}
            bFormatted={b.slsa}
            higherIsBetter
          />
          <CompareRow
            label="Critical CVEs"
            sub="trivy scan, blocking severity"
            aValue={-a.cves.critical}
            bValue={-b.cves.critical}
            aFormatted={a.cves.critical === 0 ? "0" : String(a.cves.critical)}
            bFormatted={b.cves.critical === 0 ? "0" : String(b.cves.critical)}
            aTone={a.cves.critical === 0 ? "good" : "bad"}
            bTone={b.cves.critical === 0 ? "good" : "bad"}
            higherIsBetter
          />
          <CompareRow
            label="High CVEs"
            sub="trivy scan, actionable severity"
            aValue={-a.cves.high}
            bValue={-b.cves.high}
            aFormatted={String(a.cves.high)}
            bFormatted={String(b.cves.high)}
            higherIsBetter
          />
          <CompareRow
            label="Image size"
            sub="published OCI manifest size"
            aValue={parseSize(a.size)}
            bValue={parseSize(b.size)}
            aFormatted={a.size}
            bFormatted={b.size}
            // Smaller is better for image size
            higherIsBetter={false}
          />
          <CompareRow
            label="Last rebuild"
            sub="canary chain freshness"
            aValue={-a.updatedHours}
            bValue={-b.updatedHours}
            aFormatted={`${a.updatedHours}h ago`}
            bFormatted={`${b.updatedHours}h ago`}
            higherIsBetter
          />
          <CompareRow
            label="Lifetime deploys"
            sub="reported pulls from registry"
            aValue={a.deploys}
            bValue={b.deploys}
            aFormatted={a.deploys.toLocaleString()}
            bFormatted={b.deploys.toLocaleString()}
            higherIsBetter
          />
          <CompareRow
            label="Pulls last 30 days"
            sub="recent traction signal"
            aValue={a.pulls30d}
            bValue={b.pulls30d}
            aFormatted={a.pulls30d.toLocaleString()}
            bFormatted={b.pulls30d.toLocaleString()}
            higherIsBetter
          />
          <CompareRow
            label="Reviews"
            sub="visible operator reviews"
            aValue={aAgg?.count ?? 0}
            bValue={bAgg?.count ?? 0}
            aFormatted={aAgg ? `${aAgg.count}` : "0"}
            bFormatted={bAgg ? `${bAgg.count}` : "0"}
            higherIsBetter
          />
          <CompareRow
            label="Average rating"
            sub="from those reviews"
            aValue={aAgg?.average ?? 0}
            bValue={bAgg?.average ?? 0}
            aFormatted={aAgg?.average ? aAgg.average.toFixed(1) + "★" : "—"}
            bFormatted={bAgg?.average ? bAgg.average.toFixed(1) + "★" : "—"}
            higherIsBetter
            naIfZero
          />
          <CompareRow
            label="Preview supported"
            sub="in-browser sandbox available"
            aValue={a.previewable ? 1 : 0}
            bValue={b.previewable ? 1 : 0}
            aFormatted={a.previewable ? "yes" : "no"}
            bFormatted={b.previewable ? "yes" : "no"}
            higherIsBetter
          />
        </div>

        {/* Closing prose */}
        <div className="mx-auto mt-10 max-w-[840px] border-t border-hairline pt-8">
          <h3 className="mb-2 font-display text-[16px] font-black tracking-[-0.02em] text-ink">
            What this comparison can&apos;t tell you
          </h3>
          <p className="font-body text-[13px] leading-[1.65] text-ink-softer">
            Operational fit, feature compatibility with the rest of your
            stack, learning curve, and the maintainer&apos;s response time
            on issues. Those matter as much as the signals here, but
            they&apos;re not measurable from receipts. The numbers above
            narrow the field; the final pick is still yours.
          </p>
        </div>
      </section>
    </>
  );
}

function HeadlineCard({ module: m, side }: { module: Module; side: "A" | "B" }) {
  return (
    <article className="border border-hairline bg-canvas-deep p-6">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 border border-accent px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-accent">
            {side}
          </div>
          <div className="mb-1 font-mono text-[10.5px] tracking-[0.04em] text-ink-faint">
            {m.author} / v{m.version}
          </div>
          <h2 className="font-display text-[28px] font-black leading-[1] tracking-[-0.03em] text-ink">
            {m.name}
          </h2>
        </div>
        <TrustScore value={m.trust} size="lg" />
      </header>
      <p className="mb-4 font-body text-[13px] leading-[1.55] text-ink-softer">
        {m.description}
      </p>
      <Link
        href={`/modules/${m.slug}`}
        className="font-mono text-[11px] text-accent hover:text-accent-hot"
      >
        full module page →
      </Link>
    </article>
  );
}

interface CompareRowProps {
  label: string;
  sub: string;
  aValue: number;
  bValue: number;
  aFormatted: string;
  bFormatted: string;
  aTone?: "good" | "warn" | "bad";
  bTone?: "good" | "warn" | "bad";
  higherIsBetter: boolean;
  naIfZero?: boolean;
}

function CompareRow({
  label,
  sub,
  aValue,
  bValue,
  aFormatted,
  bFormatted,
  aTone,
  bTone,
  higherIsBetter,
  naIfZero,
}: CompareRowProps) {
  // If naIfZero is set and both are zero, the signal doesn't apply.
  const naSignal = naIfZero && aValue === 0 && bValue === 0;

  let winner: "A" | "B" | "tied" | null = null;
  if (!naSignal) {
    const diff = aValue - bValue;
    const tolerance =
      Math.max(Math.abs(aValue), Math.abs(bValue)) * 0.02; // 2% rounding band
    if (Math.abs(diff) <= tolerance) {
      winner = "tied";
    } else {
      winner = (higherIsBetter ? diff > 0 : diff < 0) ? "A" : "B";
    }
  }

  const colA = `relative px-5 py-4 ${winner === "A" ? "bg-accent/[0.06]" : ""}`;
  const colB = `relative px-5 py-4 ${winner === "B" ? "bg-accent/[0.06]" : ""}`;

  return (
    <div className="grid grid-cols-[1fr_2fr_2fr] border-b border-hairline last:border-0">
      <div className="px-5 py-4">
        <div className="font-display text-[14px] font-black tracking-[-0.015em] text-ink">
          {label}
        </div>
        <div className="mt-0.5 font-mono text-[10.5px] text-ink-faint">
          {sub}
        </div>
      </div>
      <ValueCol
        formatted={aFormatted}
        tone={aTone}
        winner={winner === "A"}
        className={colA}
      />
      <ValueCol
        formatted={bFormatted}
        tone={bTone}
        winner={winner === "B"}
        className={colB}
      />
    </div>
  );
}

function ValueCol({
  formatted,
  tone,
  winner,
  className,
}: {
  formatted: string;
  tone?: "good" | "warn" | "bad";
  winner: boolean;
  className: string;
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
    <div className={className}>
      <div className={`font-display text-[22px] font-black leading-[1.1] tracking-[-0.025em] ${toneClass}`}>
        {formatted}
      </div>
      {winner && (
        <div className="mt-1 font-mono text-[9.5px] tracking-[0.14em] text-accent">
          ← BETTER ON THIS SIGNAL
        </div>
      )}
    </div>
  );
}

// ─── presentation helpers ─────────────────────────────────────────

function groupByCategory(modules: Module[]): Record<string, Module[]> {
  const groups: Record<string, Module[]> = {};
  for (const m of modules) {
    const key = m.category || "other";
    (groups[key] ??= []).push(m);
  }
  return groups;
}

function prettyCategory(c: string): string {
  switch (c) {
    case "auth":
      return "Authentication & SSO";
    case "monitoring":
      return "Monitoring & observability";
    case "media":
      return "Media & libraries";
    case "productivity":
      return "Productivity";
    case "networking":
      return "Networking & ingress";
    case "security":
      return "Security tools";
    case "git":
      return "Git hosting";
    default:
      return c.charAt(0).toUpperCase() + c.slice(1);
  }
}

function trustTone(value: number): "good" | "warn" | "bad" {
  if (value >= 90) return "good";
  if (value >= 70) return "warn";
  return "bad";
}

/** Parse a size string like "62 MB" or "1.2 GB" into a comparable number in MB. */
function parseSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(MB|GB|KB)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "GB") return value * 1024;
  if (unit === "KB") return value / 1024;
  return value;
}
