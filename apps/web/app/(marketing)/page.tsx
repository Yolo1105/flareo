import { HeroSection } from "@/components/sections/landing/HeroSection";
import { Marquee } from "@/components/sections/landing/Marquee";
import { VerifyCta } from "@/components/sections/landing/VerifyCta";
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

// ISR: refresh featured / reviews / stats every five minutes. The root
// layout no longer awaits auth(), so this can actually be cached.
export const revalidate = 300;

/** Columns CatalogPreview (via shapeToModule) actually reads. */
const PREVIEW_SELECT = {
  id: true,
  slug: true,
  name: true,
  version: true,
  author: true,
  description: true,
  tags: true,
  category: true,
  status: true,
  slsa: true,
  trust: true,
  trustVulns: true,
  trustSlsa: true,
  trustSignature: true,
  trustSbom: true,
  cveCritical: true,
  cveHigh: true,
  cveMedium: true,
  cveLow: true,
  deploys: true,
  updatedHours: true,
  size: true,
  digest: true,
  previewable: true,
  visibility: true,
  pulls30d: true,
  building: true,
  lastRebuiltAt: true,
} as const;

/**
 * Landing page composition.
 *
 * Section order tells a story:
 *   01 Hero — headline + primary CTA to /verify
 *   01a Marquee — at-a-glance brand bar
 *   01b Verify — live VerifyTool (image ref → digest / signer / Rekor)
 *   01c Install — CLI install path
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
  const db = hasDatabaseUrl();

  const [featuredR, reviewsR, statsR, modulesR] = await Promise.allSettled([
    listActiveFeatured(4),
    listReviewsForLandingWall(4),
    getCatalogStats(),
    db
      ? prisma.module.findMany({
          where: { visibility: "public" },
          orderBy: { trust: "desc" },
          take: 6,
          select: PREVIEW_SELECT,
        })
      : Promise.resolve([] as ModuleShape[]),
  ]);

  let featured: FeaturedLandingItem[] = [];
  if (featuredR.status === "fulfilled") {
    featured = featuredR.value.map((f) => ({
      module: f.module,
      blurb: f.blurb,
    }));
  } else {
    console.error("[landing] failed to load featured strip", featuredR.reason);
  }

  let reviews: ReviewRow[] = [];
  if (reviewsR.status === "fulfilled") {
    reviews = reviewsR.value;
  } else {
    console.error("[landing] failed to load reviews wall", reviewsR.reason);
  }

  let stats: CatalogStats | null = null;
  if (statsR.status === "fulfilled") {
    stats = statsR.value;
  } else {
    console.error("[landing] failed to load catalog stats", statsR.reason);
  }

  let previewModules: Module[] = [];
  if (modulesR.status === "fulfilled") {
    previewModules = (modulesR.value as ModuleShape[]).map(shapeToModule);
  } else {
    console.error(
      "[landing] failed to load catalog preview modules",
      modulesR.reason,
    );
  }

  return (
    <>
      <HeroSection />
      <Marquee />
      <VerifyCta />
      <InstallSection />
      <ProblemSection />
      <BeforeAfterSection />
      <PipelineTerminal />
      {stats ? <MetricsStrip stats={stats} /> : null}
      <CatalogPreview
        modules={previewModules}
        totalCount={stats?.moduleCount}
      />
      <FeaturedStrip items={featured} />
      <ReviewsWall reviews={reviews} />
      <ComposePreview />
      <PricingPreview />
    </>
  );
}
