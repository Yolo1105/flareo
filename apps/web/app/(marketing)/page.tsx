import { HeroSection } from "@/components/sections/landing/HeroSection";
import { Marquee } from "@/components/sections/landing/Marquee";
import { InstallSection } from "@/components/sections/landing/InstallSection";
import { ProblemSection } from "@/components/sections/landing/ProblemSection";
import { BeforeAfterSection } from "@/components/sections/landing/BeforeAfterSection";
import { PipelineTerminal } from "@/components/sections/landing/PipelineTerminal";
import { MetricsStrip } from "@/components/sections/landing/MetricsStrip";
import { CatalogPreview } from "@/components/sections/landing/CatalogPreview";
import {
  FeaturedStrip,
  type FeaturedLandingItem,
} from "@/components/sections/landing/FeaturedStrip";
import { ReviewsWall } from "@/components/sections/landing/ReviewsWall";
import { ComposePreview } from "@/components/sections/landing/ComposePreview";
import { PricingPreview } from "@/components/sections/landing/PricingPreview";
import { listActiveFeatured } from "@/lib/db/curation";
import { listReviewsForLandingWall, type ReviewRow } from "@/lib/db/reviews";
import { getCatalogStats, type CatalogStats } from "@/lib/db/stats";
import { hasDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import type { Module } from "@/lib/types";

// Force dynamic so the homepage refreshes featured + reviews on each
// load without needing revalidation. Both queries are cheap (small
// table scans) so the cost is acceptable; if traffic grows past a
// point where this matters, switch to ISR with a 5-minute window.
export const dynamic = "force-dynamic";

/**
 * Landing page composition.
 *
 * Section order tells a story:
 *   01 Hero — headline + tagline
 *   01a Marquee — at-a-glance brand bar
 *   01b Install — first concrete CTA
 *   02 Problem — why this exists at all
 *   02a Pipeline terminal — how the verification works (animated)
 *   03 Metrics — live counts from getCatalogStats()
 *   03a Catalog preview — top modules
 *   04 Featured — editorially curated picks
 *   05 Reviews wall — operator quotes
 *   06 Compose preview — multi-module example
 *   07 Pricing — entry point to /pricing
 *
 * Featured, Reviews, Metrics, and CatalogPreview omit themselves when
 * the DB is empty or unreachable. Never fall back to fixture modules.
 */
export default async function LandingPage() {
  let featured: FeaturedLandingItem[] = [];
  let reviews: ReviewRow[] = [];
  let stats: CatalogStats | null = null;
  let previewModules: Module[] = [];

  try {
    const items = await listActiveFeatured(4);
    featured = items.map((f) => ({ module: f.module, blurb: f.blurb }));
  } catch (err) {
    console.error("[landing] failed to load featured strip", err);
  }

  try {
    reviews = await listReviewsForLandingWall(4);
  } catch (err) {
    console.error("[landing] failed to load reviews wall", err);
  }

  try {
    stats = await getCatalogStats();
  } catch (err) {
    console.error("[landing] failed to load catalog stats", err);
  }

  if (hasDatabaseUrl()) {
    try {
      const rows = (await prisma.module.findMany({
        where: { visibility: "public" } as never,
      })) as ModuleShape[];
      previewModules = rows.map(shapeToModule);
    } catch (err) {
      console.error("[landing] failed to load catalog preview modules", err);
    }
  }

  return (
    <>
      <HeroSection />
      <Marquee />
      <InstallSection />
      <ProblemSection />
      <BeforeAfterSection />
      <PipelineTerminal />
      {stats ? <MetricsStrip stats={stats} /> : null}
      <CatalogPreview modules={previewModules} />
      <FeaturedStrip items={featured} />
      <ReviewsWall reviews={reviews} />
      <ComposePreview />
      <PricingPreview />
    </>
  );
}
