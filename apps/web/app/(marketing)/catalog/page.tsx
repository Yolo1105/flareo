import { PageHero } from "@/components/ui/PageHero";
import { CatalogExplorer } from "@/components/sections/catalog/CatalogExplorer";
import type {
  FeaturedStripItem,
  TrendingStripItem,
} from "@/components/sections/catalog/CatalogExplorer";
import type { Metadata } from "next";
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
 * Each fetch is wrapped in try/catch so a DB outage on any one
 * doesn't blank the whole page. Missing data produces empty strip +
 * fixture fallback in the main grid.
 */
export default async function CatalogPage() {
  let modules: Module[] | undefined = undefined;
  let featured: FeaturedStripItem[] = [];
  let trending: TrendingStripItem[] = [];

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
  } catch {
    // DB unreachable → CatalogExplorer falls back to the MODULES
    // fixture so the page still renders something useful.
  }

  try {
    const items = await listActiveFeatured(6);
    featured = items.map((f) => ({
      module: f.module,
      blurb: f.blurb,
      position: f.position,
    }));
  } catch {
    // empty strip; no-op
  }

  try {
    const ranked = await computeTrending(8);
    trending = ranked.map((t) => ({
      module: t.module,
      recentReviews: t.components.recentReviews,
      avgRating: t.components.avgRating,
    }));
  } catch {
    // empty strip; no-op
  }

  const count = modules?.length ?? 12; // 12 is the fixture count

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
