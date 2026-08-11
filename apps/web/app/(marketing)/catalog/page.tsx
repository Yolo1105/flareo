import { PageHero } from "@/components/ui/PageHero";
import { CatalogExplorer } from "@/components/sections/catalog/CatalogExplorer";
import type {
  FeaturedStripItem,
  TrendingStripItem,
} from "@/components/sections/catalog/CatalogExplorer";
import type { Metadata } from "next";
import { hasDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule } from "@/lib/db/queries";
import type { ModuleShape } from "@/lib/db/queries";
import type { Module } from "@/lib/types";
import { listActiveFeatured, computeTrending } from "@/lib/db/curation";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "The Flareo module catalog — verified, signed, and cryptographically attested containers with full SBOMs.",
};

export const dynamic = "force-dynamic";

/**
 * Catalog — main discovery surface.
 *
 * Server-fetches three independent data sets in parallel:
 *   1. Full module list (public, any status) — drives the main grid
 *   2. Active featured (admin-picked) — Featured strip at top
 *   3. Trending (computed) — Trending strip below Featured
 *
 * Featured/trending failures produce empty strips. A failure loading
 * the main module list renders an explicit unavailable state — never
 * the lib/data/modules.ts fixture.
 */
export default async function CatalogPage() {
  let modules: Module[] | null = null;
  let featured: FeaturedStripItem[] = [];
  let trending: TrendingStripItem[] = [];

  if (hasDatabaseUrl()) {
    try {
      // Main grid: ALL public modules, any verification status. The
      // client-side filter bar narrows by category/query/sort.
      const rows = (await prisma.module.findMany({
        where: { visibility: "public" } as never,
        include: {
          publisher: { select: { username: true } },
        } as never,
      })) as Array<
        ModuleShape & { publisher?: { username: string | null } | null }
      >;
      modules = rows.map((r) => ({
        ...shapeToModule(r),
        publisherUsername: r.publisher?.username ?? null,
      }));
    } catch (err) {
      console.error("[catalog] failed to load modules from database", err);
    }
  } else {
    console.error("[catalog] DATABASE_URL is not set; catalog unavailable");
  }

  try {
    const items = await listActiveFeatured(6);
    featured = items.map((f) => ({
      module: f.module,
      blurb: f.blurb,
      position: f.position,
    }));
  } catch (err) {
    console.error("[catalog] failed to load featured strip", err);
  }

  try {
    const ranked = await computeTrending(8);
    trending = ranked.map((t) => ({
      module: t.module,
      recentReviews: t.components.recentReviews,
      avgRating: t.components.avgRating,
    }));
  } catch (err) {
    console.error("[catalog] failed to load trending strip", err);
  }

  if (modules === null) {
    return (
      <>
        <PageHero
          eyebrow="CATALOG / UNAVAILABLE"
          prompt="flareo search --all"
          promptComment="# catalog temporarily unreachable"
          title={
            <>
              VERIFICATION LEDGER.
              <br />
              NOT GALLERY.
            </>
          }
        >
          Every module below has been built in a hermetic sandbox, scanned
          for CVEs, signed with cosign, attested with SLSA L2 or L3, and had
          its SBOM published. Click any row for the full receipts.
        </PageHero>
        <div className="px-8 py-16">
          <div className="border border-dashed border-hairline bg-canvas-deep p-12 text-center">
            <div className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-warn">
              CATALOG UNAVAILABLE
            </div>
            <p className="mx-auto max-w-[480px] font-body text-[14px] leading-[1.55] text-ink-softer">
              The module catalog could not be loaded from the database. This
              is not an empty catalog — the data source is temporarily
              unreachable. Try again shortly.
            </p>
          </div>
        </div>
      </>
    );
  }

  const count = modules.length;

  return (
    <>
      <PageHero
        eyebrow={`CATALOG / ${count} MODULE${count === 1 ? "" : "S"}`}
        prompt="flareo search --all"
        promptComment="# everything verified, everything signed"
        title={
          <>
            VERIFICATION LEDGER.
            <br />
            NOT GALLERY.
          </>
        }
      >
        Every module below has been built in a hermetic sandbox, scanned
        for CVEs, signed with cosign, attested with SLSA L2 or L3, and had
        its SBOM published. Click any row for the full receipts.
      </PageHero>
      <CatalogExplorer
        modules={modules}
        featured={featured}
        trending={trending}
      />
    </>
  );
}
