import { notFound } from "next/navigation";
import { MODULES } from "@/lib/data/modules";
import { getModuleBySlug } from "@/lib/db/queries";
import { listRecentRebuildsForModule } from "@/lib/db/module-rebuilds";
import {
  listReviewsForModule,
  getReviewAggregate,
} from "@/lib/db/reviews";
import { ModuleHero } from "@/components/sections/module-detail/ModuleHero";
import { TrustBreakdown } from "@/components/sections/module-detail/TrustBreakdown";
import { ReceiptsSection } from "@/components/sections/module-detail/ReceiptsSection";
import { DeploySection } from "@/components/sections/module-detail/DeploySection";
import { SbomSection } from "@/components/sections/module-detail/SbomSection";
import { RebuildHistorySection } from "@/components/sections/module-detail/RebuildHistorySection";
import { ReviewsSection } from "@/components/sections/module-detail/ReviewsSection";
import { ReportProblemPanel } from "@/components/sections/module-detail/ReportProblemPanel";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

// Revalidate every 60s so new modules show up without a rebuild. The
// static params list comes from the bundled fixtures so the build can
// complete even if the database is unreachable at build time. At
// request time the page reads live data from Postgres only — never
// the fixture catalog.
//
// Session-dependent UI (write review, report, preview CTA) reads the
// session on the client via useSession — awaiting auth() here would
// force the whole page dynamic and void this ISR window.
export const revalidate = 60;

export async function generateStaticParams() {
  // Build-time path discovery only — not live catalog state.
  return MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const mod = await getModuleBySlug(slug);
    if (mod) {
      return {
        title: `${mod.name.toLowerCase()}@${mod.version}`,
        description: `${mod.description}. Signed provenance, upstream digest recorded. Trust score ${mod.trust}, verified by Flareo.`,
      };
    }
  } catch (err) {
    console.error(`[modules/${slug}] metadata: database unreachable`, err);
  }
  return { title: "Module not found" };
}

export default async function ModuleDetailPage({ params }: Props) {
  const { slug } = await params;

  let mod = null;
  try {
    mod = await getModuleBySlug(slug);
  } catch (err) {
    console.error(`[modules/${slug}] database unreachable`, err);
  }
  if (!mod) notFound();
  const moduleNonNull: NonNullable<typeof mod> = mod!;

  const [rebuildsR, reviewsR, aggregateR] = await Promise.allSettled([
    listRecentRebuildsForModule(slug, 10),
    listReviewsForModule(slug),
    getReviewAggregate(slug),
  ]);

  const rebuilds =
    rebuildsR.status === "fulfilled" ? rebuildsR.value : [];
  if (rebuildsR.status === "rejected") {
    console.error(
      `[modules/${slug}] failed to load rebuild history`,
      rebuildsR.reason,
    );
  }

  const reviews = reviewsR.status === "fulfilled" ? reviewsR.value : [];
  const aggregate =
    aggregateR.status === "fulfilled"
      ? aggregateR.value
      : {
          count: 0,
          average: null as number | null,
          histogram: [0, 0, 0, 0, 0] as [
            number,
            number,
            number,
            number,
            number,
          ],
        };
  if (reviewsR.status === "rejected" || aggregateR.status === "rejected") {
    console.error(
      `[modules/${slug}] failed to load reviews`,
      reviewsR.status === "rejected"
        ? reviewsR.reason
        : aggregateR.status === "rejected"
          ? aggregateR.reason
          : undefined,
    );
  }

  return (
    <>
      <ModuleHero module={moduleNonNull} />
      <TrustBreakdown module={moduleNonNull} />
      <ReceiptsSection module={moduleNonNull} />
      <DeploySection module={moduleNonNull} />
      <SbomSection module={moduleNonNull} />
      <RebuildHistorySection module={moduleNonNull} rebuilds={rebuilds} />
      <ReviewsSection
        module={moduleNonNull}
        reviews={reviews}
        aggregate={aggregate}
      />
      <ReportProblemPanel module={moduleNonNull} />
    </>
  );
}
