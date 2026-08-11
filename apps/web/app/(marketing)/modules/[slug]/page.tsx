import { notFound } from "next/navigation";
import { MODULES } from "@/lib/data/modules";
import { getModuleBySlug } from "@/lib/db/queries";
import { listRecentRebuildsForModule } from "@/lib/db/module-rebuilds";
import {
  listReviewsForModule,
  getReviewAggregate,
  getMyReview,
} from "@/lib/db/reviews";
import { auth } from "@/lib/auth/config";
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
export const revalidate = 60;

export async function generateStaticParams() {
  // Build-time path discovery only — not live catalog state.
  return MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const module = await getModuleBySlug(slug);
    if (module) {
      return {
        title: `${module.name.toLowerCase()}@${module.version}`,
        description: `${module.description}. Signed provenance, upstream digest recorded. Trust score ${module.trust}, verified by Flareo.`,
      };
    }
  } catch (err) {
    console.error(`[modules/${slug}] metadata: database unreachable`, err);
  }
  return { title: "Module not found" };
}

export default async function ModuleDetailPage({ params }: Props) {
  const { slug } = await params;

  let module = null;
  try {
    module = await getModuleBySlug(slug);
  } catch (err) {
    console.error(`[modules/${slug}] database unreachable`, err);
  }
  if (!module) notFound();
  // After notFound() (return type `never` from next/navigation), TS
  // narrows `module` to non-null. Capture as a const so the type stays
  // narrowed through downstream JSX prop checks. The non-null assertion
  // is safe here — notFound() doesn't return.
  const moduleNonNull: NonNullable<typeof module> = module!;

  // Rebuild history is best-effort — if the DB is unreachable (or the
  // ModuleRebuild table is empty because canary hasn't run yet), the
  // component's empty-state copy handles it. Don't block the page on it.
  let rebuilds: Awaited<ReturnType<typeof listRecentRebuildsForModule>> = [];
  try {
    rebuilds = await listRecentRebuildsForModule(slug, 10);
  } catch (err) {
    console.error(`[modules/${slug}] failed to load rebuild history`, err);
  }

  // Reviews — also best-effort.
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  let reviews: Awaited<ReturnType<typeof listReviewsForModule>> = [];
  let aggregate: Awaited<ReturnType<typeof getReviewAggregate>> = {
    count: 0,
    average: null,
    histogram: [0, 0, 0, 0, 0],
  };
  let myReview: Awaited<ReturnType<typeof getMyReview>> = null;
  try {
    const [r, a] = await Promise.all([
      listReviewsForModule(slug),
      getReviewAggregate(slug),
    ]);
    reviews = r;
    aggregate = a;
    if (currentUserId) {
      myReview = await getMyReview(slug, currentUserId);
    }
  } catch (err) {
    console.error(`[modules/${slug}] failed to load reviews`, err);
  }

  // Publisher check — hide the write form when the viewer owns the
  // module. publisherId lives on the Module row.
  let isPublisher = false;
  if (currentUserId) {
    const modWithPublisher = moduleNonNull as typeof moduleNonNull & {
      publisherId?: string | null;
    };
    isPublisher = modWithPublisher.publisherId === currentUserId;
  }

  return (
    <>
      <ModuleHero module={moduleNonNull} userSignedIn={Boolean(currentUserId)} />
      <TrustBreakdown module={moduleNonNull} />
      <ReceiptsSection module={moduleNonNull} />
      <DeploySection module={moduleNonNull} />
      <SbomSection module={moduleNonNull} />
      <RebuildHistorySection module={moduleNonNull} rebuilds={rebuilds} />
      <ReviewsSection
        module={moduleNonNull}
        reviews={reviews}
        aggregate={aggregate}
        currentUserId={currentUserId}
        myReview={myReview}
        isPublisher={isPublisher}
      />
      <ReportProblemPanel
        module={moduleNonNull}
        currentUserId={currentUserId}
      />
    </>
  );
}
