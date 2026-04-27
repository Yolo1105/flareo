/**
 * Catalog curation helpers — Featured (editorial, admin-picked) and
 * Trending (algorithmic).
 *
 * Featured rows are straight DB reads.
 *
 * Trending is computed from signals already in the DB: recent review
 * activity, rebuild recency, trust score, and a minor pulls-30d
 * factor. This is NOT pull-growth-rate — the product doesn't track
 * daily pull deltas yet — but it's a defensible proxy for "modules
 * gaining community attention." The computation lives in one place
 * so it can be swapped for a real pull-delta signal later without
 * touching callers.
 */

import { hasDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import type { Module } from "@/lib/types";
import { shapeToModule, moduleExistsBySlug } from "./queries";
import type { ModuleShape } from "./queries";

// ─── Featured ────────────────────────────────────────────────────

export interface FeaturedItem {
  id: string;
  module: Module;
  position: number;
  blurb: string | null;
  featuredAt: string;   // ISO
  expiresAt: string | null;
  curatorName: string | null;
}

interface FeaturedRow {
  id: string;
  moduleSlug: string;
  position: number;
  blurb: string | null;
  featuredAt: Date;
  expiresAt: Date | null;
  module: ModuleShape & {
    publisher?: { username: string | null } | null;
  };
  curator: { name: string | null } | null;
}

function rowToFeatured(r: FeaturedRow): FeaturedItem {
  const m = shapeToModule(r.module);
  return {
    id: r.id,
    module: {
      ...m,
      publisherUsername: r.module.publisher?.username ?? null,
    },
    position: r.position,
    blurb: r.blurb,
    featuredAt: r.featuredAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
    curatorName: r.curator?.name ?? null,
  };
}

/**
 * Public list for the catalog strip. Filters out expired rows,
 * orders by position ascending, caps at `limit` (default 6).
 * Defensive against slug rows whose Module was deleted — Prisma's
 * relation returns null, which we filter out.
 */
export async function listActiveFeatured(limit = 6): Promise<FeaturedItem[]> {
  if (!hasDatabaseUrl()) return [];
  const now = new Date();
  const rows = (await prisma.moduleFeatured.findMany({
    where: {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    } as never,
    orderBy: { position: "asc" } as never,
    take: limit,
    include: {
      module: {
        include: {
          publisher: { select: { username: true } },
        },
      },
      curator: { select: { name: true } },
    } as never,
  })) as FeaturedRow[];
  return rows
    .filter((r) => r.module != null && r.module.visibility === "public")
    .map(rowToFeatured);
}

/**
 * Admin view — all featured rows including expired ones, ordered by
 * featuredAt desc so the most recent editorial picks are at the top
 * of the editor.
 */
export async function listAllFeaturedAdmin(): Promise<FeaturedItem[]> {
  const rows = (await prisma.moduleFeatured.findMany({
    orderBy: { featuredAt: "desc" } as never,
    include: {
      module: {
        include: {
          publisher: { select: { username: true } },
        },
      },
      curator: { select: { name: true } },
    } as never,
  })) as FeaturedRow[];
  return rows.filter((r) => r.module != null).map(rowToFeatured);
}

export interface UpsertFeaturedInput {
  moduleSlug: string;
  position: number;
  blurb: string | null;
  expiresAt: Date | null;
  curatorId: string;
}

export type UpsertFeaturedResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: "module_not_found" | "module_private" };

/**
 * Admin upsert. If the module's visibility flipped to private since
 * it was last featured, reject the upsert — private modules in a
 * public strip would be a leakage surface.
 */
export async function upsertFeatured(
  input: UpsertFeaturedInput,
): Promise<UpsertFeaturedResult> {
  const mod = await moduleExistsBySlug(input.moduleSlug);
  if (!mod) return { ok: false, reason: "module_not_found" };
  if (mod.visibility !== "public") {
    return { ok: false, reason: "module_private" };
  }

  const existing = (await prisma.moduleFeatured.findUnique({
    where: { moduleSlug: input.moduleSlug } as never,
  })) as { id: string } | null;

  await prisma.moduleFeatured.upsert({
    where: { moduleSlug: input.moduleSlug } as never,
    create: {
      moduleSlug: input.moduleSlug,
      position: input.position,
      blurb: input.blurb,
      expiresAt: input.expiresAt,
      curatorId: input.curatorId,
    } as never,
    update: {
      position: input.position,
      blurb: input.blurb,
      expiresAt: input.expiresAt,
      curatorId: input.curatorId,
    } as never,
  });

  return { ok: true, created: !existing };
}

export async function removeFeatured(moduleSlug: string): Promise<boolean> {
  const result = await prisma.moduleFeatured.deleteMany({
    where: { moduleSlug } as never,
  });
  return result.count > 0;
}

// ─── Trending ────────────────────────────────────────────────────

export interface TrendingEntry {
  module: Module;
  score: number;
  /** Decomposition of the score so the admin can debug rankings. */
  components: {
    recentReviews: number;    // count of reviews in the last 14 days
    avgRating: number | null; // null when no reviews
    daysSinceRebuild: number | null;
    trust: number;
    pulls30d: number;
  };
}

/**
 * Compute a trending ranking. Honest framing: this is "gaining
 * attention" not "viral growth" — the product doesn't track per-day
 * pull deltas. The formula combines signals already in the DB:
 *
 *   score = 2.0 * log1p(recent_reviews)         // primary
 *         + 0.6 * sigmoid(avg_rating - 3)       // rating quality
 *         + 0.4 * freshness(days_since_rebuild) // recently reverified
 *         + 0.2 * (trust / 100)                 // baseline quality
 *         + 0.1 * log1p(pulls30d) / 10          // minor pulls factor
 *
 * Weights are tuned so a newly-reviewed module with decent trust
 * outranks a stale-but-high-pulls module. Change them if the ranking
 * feels off in practice.
 *
 * Returns up to `limit` modules sorted by score desc. Always excludes
 * private modules and modules already in the featured strip (avoid
 * double-promotion).
 */
export async function computeTrending(limit = 8): Promise<TrendingEntry[]> {
  if (!hasDatabaseUrl()) return [];
  const now = Date.now();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 3600 * 1000);

  // Pull the candidate set: all verified public modules. This is a
  // small set for this product — don't over-engineer with a materialized
  // view. If it grows past a few hundred we paginate by some pre-filter.
  const modules = (await prisma.module.findMany({
    where: {
      visibility: "public",
      status: { in: ["verified", "failing"] },
    } as never,
    include: {
      publisher: { select: { username: true } },
    } as never,
  })) as Array<
    ModuleShape & { publisher?: { username: string | null } | null }
  >;

  if (modules.length === 0) return [];

  const slugs = modules.map((m) => m.slug);

  // One batch query for recent reviews, one for all-time-average.
  // Separating "recent count" from "avg rating" because a module
  // with many old 5-star reviews should still rate well, but only
  // trend when new reviews land.
  const recentRows = (await prisma.moduleReview.groupBy({
    by: ["moduleSlug"],
    where: {
      moduleSlug: { in: slugs },
      moderation: { not: "hidden" },
      createdAt: { gte: fourteenDaysAgo },
    } as never,
    _count: { _all: true } as never,
  })) as Array<{ moduleSlug: string; _count: { _all: number } }>;

  const avgRows = (await prisma.moduleReview.groupBy({
    by: ["moduleSlug"],
    where: {
      moduleSlug: { in: slugs },
      moderation: { not: "hidden" },
    } as never,
    _avg: { rating: true } as never,
  })) as Array<{ moduleSlug: string; _avg: { rating: number | null } }>;

  const recentCountBySlug = new Map(
    recentRows.map((r) => [r.moduleSlug, r._count._all]),
  );
  const avgRatingBySlug = new Map(
    avgRows.map((r) => [r.moduleSlug, r._avg.rating]),
  );

  // Skip modules currently in the featured strip — trending and
  // featured shouldn't double up. A separate query here keeps the
  // catalog-side data flow simple.
  const featuredRows = (await prisma.moduleFeatured.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    } as never,
    select: { moduleSlug: true } as never,
  })) as Array<{ moduleSlug: string }>;
  const featuredSet = new Set(featuredRows.map((r) => r.moduleSlug));

  const log1p = (n: number) => Math.log1p(Math.max(0, n));
  const sigmoid = (n: number) => 1 / (1 + Math.exp(-n));

  const entries: TrendingEntry[] = modules
    .filter((m) => !featuredSet.has(m.slug))
    .map((m) => {
      const recentReviews = recentCountBySlug.get(m.slug) ?? 0;
      const avgRating = avgRatingBySlug.get(m.slug) ?? null;
      const daysSinceRebuild = m.lastRebuiltAt
        ? (now - new Date(m.lastRebuiltAt).getTime()) / (24 * 3600 * 1000)
        : null;

      // Freshness: 1.0 if rebuilt today, 0.5 at 7 days, ~0 past 21.
      const freshness =
        daysSinceRebuild === null
          ? 0
          : Math.max(0, 1 / (1 + daysSinceRebuild / 7));

      const ratingQuality =
        avgRating !== null ? sigmoid(avgRating - 3) : 0;

      const score =
        2.0 * log1p(recentReviews) +
        0.6 * ratingQuality +
        0.4 * freshness +
        0.2 * (m.trust / 100) +
        0.1 * (log1p(m.pulls30d) / 10);

      const base = shapeToModule(m);
      return {
        module: {
          ...base,
          publisherUsername: m.publisher?.username ?? null,
        },
        score,
        components: {
          recentReviews,
          avgRating,
          daysSinceRebuild,
          trust: m.trust,
          pulls30d: m.pulls30d,
        },
      };
    })
    .filter((e) => e.score > 0) // don't surface zero-signal modules
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return entries;
}
