import type { Metadata } from "next";
import { hasDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import {
  listActiveFeatured,
  computeTrending,
  type FeaturedItem,
  type TrendingEntry,
} from "@/lib/db/curation";
import {
  getAggregatesForSlugs,
  listReviewsForLandingWall,
  type ReviewAggregate,
  type ReviewRow,
} from "@/lib/db/reviews";
import type { Module } from "@/lib/types";
import { PageHero } from "@/components/ui/PageHero";
import { MarketplaceHeroStrip } from "@/components/sections/marketplace/MarketplaceHeroStrip";
import { MarketplaceSpotlight } from "@/components/sections/marketplace/MarketplaceSpotlight";
import { MarketplaceCategoryRow } from "@/components/sections/marketplace/MarketplaceCategoryRow";
import { MarketplaceReviewBoard } from "@/components/sections/marketplace/MarketplaceReviewBoard";
import { MarketplacePublishCTA } from "@/components/sections/marketplace/MarketplacePublishCTA";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Discover, preview, and take away verified containers. The Flareo marketplace surfaces editorial picks, trending modules, and what operators are saying — all backed by full provenance.",
};

export const revalidate = 300;

/**
 * /marketplace — the demand-side discovery surface.
 *
 * Distinct from /catalog (which is a dense grid for browsing every
 * module by name/category/tag). Marketplace is the curated, full-bleed
 * presentation: editor's picks with rich card treatment, trending modules
 * with per-module signals, category rows that group like-with-like,
 * inline review excerpts so the social proof is visible without a click,
 * and a publish CTA at the bottom for the supply side.
 *
 * Honest framing
 * --------------
 * The proposal frames Flareo as "discover, verify, try, take away."
 * This page is the discover surface. Verify happens on /modules/<slug>.
 * Try happens via the preview/sandbox link on each card. Take-away is
 * promised in the deploy snippet section on the module detail page.
 *
 * Server-rendered with multiple parallel fetches; each in its own
 * try/catch so a failure on one section doesn't break the whole page.
 */
export default async function MarketplacePage() {
  // Parallel fetch with individual fallbacks. Same posture as /catalog:
  // empty data shows a graceful gap rather than failing the page render.
  const [featured, trending, allModules, recentReviews] = await Promise.all([
    safeListFeatured(),
    safeComputeTrending(),
    safeListAllModules(),
    safeListReviews(),
  ]);

  // Per-module aggregates for inline ★ rating display on cards.
  const aggregateSlugs = [
    ...featured.map((f) => f.module.slug),
    ...trending.map((t) => t.module.slug),
    ...allModules.map((m) => m.slug),
  ];
  const aggregates = await safeGetAggregates(Array.from(new Set(aggregateSlugs)));

  // Choose a single hero "spotlight" from featured[0] when available;
  // falls back to the highest-trust module otherwise.
  const spotlight =
    featured[0]?.module ??
    [...allModules].sort((a, b) => b.trust - a.trust)[0] ??
    null;
  const spotlightAggregate =
    spotlight && aggregates[spotlight.slug]
      ? aggregates[spotlight.slug]
      : null;

  // Group remaining modules by category for the row presentation.
  const remainingForRows = allModules.filter(
    (m) => !featured.some((f) => f.module.slug === m.slug),
  );
  const byCategory = groupByCategory(remainingForRows);

  return (
    <>
      <PageHero
        eyebrow="Marketplace"
        prompt="flareo browse --catalog --sort=editorial"
        promptComment="discover, verify, try, take away"
        title={
          <>
            Verified containers,
            <br />
            ready to try.
          </>
        }
      >
        <p className="max-w-[680px] font-body text-[15.5px] leading-[1.55] text-ink-softer">
          Every module on this marketplace was built in our pipeline,
          scanned by Trivy, signed by cosign, and attested with SLSA
          provenance. Click any module to preview it live, read what
          operators say, and take away a working compose file.
        </p>
      </PageHero>

      <MarketplaceHeroStrip
        modulesIndexed={allModules.length}
        featuredCount={featured.length}
        trendingCount={trending.length}
        reviewsCount={recentReviews.length}
      />

      {spotlight && (
        <MarketplaceSpotlight
          module={spotlight}
          blurb={featured[0]?.blurb ?? null}
          aggregate={spotlightAggregate}
        />
      )}

      {featured.length > 1 && (
        <MarketplaceCategoryRow
          eyebrow="04 / EDITORIAL"
          title="More featured modules"
          subtitle="Hand-picked by the Flareo team for production-readiness and operator endorsement."
          modules={featured.slice(1).map((f) => ({
            module: f.module,
            blurb: f.blurb,
            aggregate: aggregates[f.module.slug] ?? null,
          }))}
        />
      )}

      {trending.length > 0 && (
        <MarketplaceCategoryRow
          eyebrow="05 / TRENDING"
          title="What's gaining attention this week"
          subtitle="Computed from recent reviews, rebuild freshness, and trust score. Updated continuously."
          modules={trending.slice(0, 6).map((t) => ({
            module: t.module,
            blurb: trendingBlurb(t),
            aggregate: aggregates[t.module.slug] ?? null,
          }))}
        />
      )}

      {Object.entries(byCategory).map(([category, modules], i) => (
        <MarketplaceCategoryRow
          key={category}
          eyebrow={`${String(6 + i).padStart(2, "0")} / CATEGORY`}
          title={prettyCategory(category)}
          subtitle={categoryBlurb(category)}
          modules={modules.slice(0, 6).map((m) => ({
            module: m,
            blurb: null,
            aggregate: aggregates[m.slug] ?? null,
          }))}
        />
      ))}

      {recentReviews.length > 0 && (
        <MarketplaceReviewBoard reviews={recentReviews} />
      )}

      <MarketplacePublishCTA />
    </>
  );
}

// ─── data helpers ─────────────────────────────────────────────────

async function safeListFeatured(): Promise<FeaturedItem[]> {
  try {
    return await listActiveFeatured(8);
  } catch (err) {
    console.error("[marketplace] failed to load featured", err);
    return [];
  }
}

async function safeComputeTrending(): Promise<TrendingEntry[]> {
  try {
    return await computeTrending(8);
  } catch (err) {
    console.error("[marketplace] failed to load trending", err);
    return [];
  }
}

async function safeListAllModules(): Promise<Module[]> {
  if (!hasDatabaseUrl()) {
    console.error("[marketplace] DATABASE_URL is not set; modules empty");
    return [];
  }
  try {
    const rows = (await prisma.module.findMany({
      where: { visibility: "public" } as never,
      include: {
        publisher: { select: { username: true } },
      } as never,
    })) as Array<
      ModuleShape & { publisher?: { username: string | null } | null }
    >;
    return rows.map((r) => {
      const m = shapeToModule(r);
      // Re-attach publisher username when present — shapeToModule
      // doesn't carry it through.
      return r.publisher?.username
        ? { ...m, publisherUsername: r.publisher.username }
        : m;
    });
  } catch (err) {
    console.error("[marketplace] failed to load modules from database", err);
    return [];
  }
}

async function safeListReviews(): Promise<ReviewRow[]> {
  try {
    return await listReviewsForLandingWall(6);
  } catch (err) {
    console.error("[marketplace] failed to load reviews", err);
    return [];
  }
}

async function safeGetAggregates(
  slugs: string[],
): Promise<Record<string, ReviewAggregate>> {
  if (slugs.length === 0) return {};
  try {
    const map = await getAggregatesForSlugs(slugs);
    return Object.fromEntries(map.entries());
  } catch (err) {
    console.error("[marketplace] failed to load review aggregates", err);
    return {};
  }
}

// ─── presentation helpers ─────────────────────────────────────────

function groupByCategory(modules: Module[]): Record<string, Module[]> {
  const groups: Record<string, Module[]> = {};
  for (const m of modules) {
    const key = m.category || "other";
    (groups[key] ??= []).push(m);
  }
  // Sort each group by trust desc — the row should lead with the
  // strongest module in that category.
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => b.trust - a.trust);
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

function categoryBlurb(c: string): string {
  switch (c) {
    case "auth":
      return "Identity providers, SSO gateways, and access tooling — verified end-to-end so security review is short.";
    case "monitoring":
      return "Uptime, metrics, and alerting modules. Republish receipts catch upstream regressions before they reach your dashboards.";
    case "media":
      return "Self-hosted media servers and photo libraries. GPU acceleration intact, codec support preserved.";
    case "networking":
      return "Reverse proxies, ingress controllers, and certificate automation. The infrastructure plumbing that everything else depends on.";
    case "git":
      return "Self-hosted git forge alternatives. Source-of-truth tooling that earns its trust score.";
    case "security":
      return "Defense-in-depth tooling. Note: even security modules ship with full SBOM + signature.";
    default:
      return "Modules in this category, ordered by trust score.";
  }
}

/** Format a single-line trending explanation from the score components. */
function trendingBlurb(t: TrendingEntry): string {
  const c = t.components;
  const reasons: string[] = [];
  if (c.recentReviews > 0) {
    reasons.push(
      `${c.recentReviews} new review${c.recentReviews === 1 ? "" : "s"}`,
    );
  }
  if (c.avgRating !== null && c.avgRating >= 4) {
    reasons.push(`${c.avgRating.toFixed(1)}★ avg`);
  }
  if (c.daysSinceRebuild !== null && c.daysSinceRebuild < 2) {
    reasons.push("rebuilt today");
  }
  if (reasons.length === 0) return "Climbing the trust-weighted ranking.";
  return reasons.join(" · ");
}
