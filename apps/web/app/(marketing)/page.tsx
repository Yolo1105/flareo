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
 *   03 Metrics — live counts of what's been verified
 *   03a Catalog preview — top 4 modules by deploys
 *   04 Featured — editorially curated picks (NEW, marketplace surface)
 *   05 Reviews wall — operator quotes (NEW, marketplace surface)
 *   06 Compose preview — multi-module example
 *   07 Pricing — entry point to /pricing
 *
 * Both Featured and Reviews are conditional. They render nothing
 * when the DB is empty (or unreachable), so a fresh / unseeded
 * deployment shows the original landing flow without empty stubs.
 */
export default async function LandingPage() {
  let featured: FeaturedLandingItem[] = [];
  let reviews: ReviewRow[] = [];

  try {
    const items = await listActiveFeatured(4);
    featured = items.map((f) => ({ module: f.module, blurb: f.blurb }));
  } catch {
    // DB unreachable — Featured strip omits itself, no error UI.
  }

  try {
    reviews = await listReviewsForLandingWall(4);
  } catch {
    // Same — silently omit.
  }

  return (
    <>
      <HeroSection />
      <Marquee />
      <InstallSection />
      <ProblemSection />
      <BeforeAfterSection />
      <PipelineTerminal />
      <MetricsStrip />
      <CatalogPreview />
      <FeaturedStrip items={featured} />
      <ReviewsWall reviews={reviews} />
      <ComposePreview />
      <PricingPreview />
    </>
  );
}
