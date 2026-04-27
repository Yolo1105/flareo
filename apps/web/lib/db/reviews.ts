/**
 * User-review helpers for modules. Reads, writes, aggregates, and
 * moderation primitives.
 *
 * Access rules baked in at this layer:
 *   - Public reads exclude hidden reviews; admin reads can include
 *     them via the `includeHidden` flag.
 *   - Writes go through upsertReview which enforces one-per-(user,
 *     module) and rejects self-reviews (publisher reviewing their
 *     own module).
 *   - Admin moderation endpoints call `setModeration` which stamps
 *     hiddenById + hiddenAt when flipping to "hidden".
 */

import { prisma } from "@/lib/db/prisma";

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0);
}

export type ModerationState = "visible" | "flagged" | "hidden";

export interface ReviewRow {
  id: string;
  moduleSlug: string;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  rating: number;
  title: string;
  body: string;
  moderation: ModerationState;
  flagReason: string | null;
  createdAt: string; // ISO
  updatedAt: string;
}

export interface ReviewAggregate {
  count: number;         // visible reviews only
  average: number | null; // null when count === 0
  /** Counts per star bucket, visible reviews only. 1..5 array. */
  histogram: [number, number, number, number, number];
}

interface DbRow {
  id: string;
  moduleSlug: string;
  authorId: string;
  rating: number;
  title: string;
  body: string;
  moderation: string;
  flagReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
}

function rowToReview(r: DbRow): ReviewRow {
  return {
    id: r.id,
    moduleSlug: r.moduleSlug,
    authorId: r.authorId,
    authorName: r.author?.name ?? null,
    authorImage: r.author?.image ?? null,
    rating: r.rating,
    title: r.title,
    body: r.body,
    moderation: (r.moderation as ModerationState) ?? "visible",
    flagReason: r.flagReason,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/**
 * Reviews for one module, newest first. Public by default (hidden
 * reviews excluded). Admin pages can pass `includeHidden` for
 * moderation tooling.
 */
export async function listReviewsForModule(
  slug: string,
  opts: { includeHidden?: boolean; limit?: number } = {},
): Promise<ReviewRow[]> {
  const where = opts.includeHidden
    ? { moduleSlug: slug }
    : { moduleSlug: slug, moderation: { not: "hidden" } };
  const rows = (await prisma.moduleReview.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" } as never,
    take: opts.limit ?? 50,
    include: {
      author: { select: { name: true, image: true } },
    } as never,
  })) as DbRow[];
  return rows.map(rowToReview);
}

/**
 * Aggregate stats for display on the catalog + module detail hero.
 * "count" and "average" reflect the moderation=visible set only;
 * flagged reviews ARE included (still public until hidden), hidden
 * ones are not.
 */
export async function getReviewAggregate(
  slug: string,
): Promise<ReviewAggregate> {
  const rows = (await prisma.moduleReview.findMany({
    where: {
      moduleSlug: slug,
      moderation: { not: "hidden" },
    } as never,
    select: { rating: true } as never,
  })) as Array<{ rating: number }>;

  if (rows.length === 0) {
    return { count: 0, average: null, histogram: [0, 0, 0, 0, 0] };
  }

  const hist: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of rows) {
    const clipped = Math.max(1, Math.min(5, r.rating));
    hist[clipped - 1]++;
    sum += clipped;
  }
  return {
    count: rows.length,
    average: Math.round((sum / rows.length) * 10) / 10,
    histogram: hist,
  };
}

/**
 * Batch aggregate fetch for the catalog list — avoids N+1.
 * Returns a Map keyed by slug.
 */
export async function getAggregatesForSlugs(
  slugs: string[],
): Promise<Map<string, ReviewAggregate>> {
  if (slugs.length === 0) return new Map();
  const rows = (await prisma.moduleReview.findMany({
    where: {
      moduleSlug: { in: slugs },
      moderation: { not: "hidden" },
    } as never,
    select: { moduleSlug: true, rating: true } as never,
  })) as Array<{ moduleSlug: string; rating: number }>;

  const groups = new Map<string, number[]>();
  for (const r of rows) {
    const arr = groups.get(r.moduleSlug) ?? [];
    arr.push(Math.max(1, Math.min(5, r.rating)));
    groups.set(r.moduleSlug, arr);
  }

  const result = new Map<string, ReviewAggregate>();
  for (const slug of slugs) {
    const ratings = groups.get(slug) ?? [];
    if (ratings.length === 0) {
      result.set(slug, { count: 0, average: null, histogram: [0, 0, 0, 0, 0] });
      continue;
    }
    const hist: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of ratings) {
      hist[r - 1]++;
      sum += r;
    }
    result.set(slug, {
      count: ratings.length,
      average: Math.round((sum / ratings.length) * 10) / 10,
      histogram: hist,
    });
  }
  return result;
}

export interface UpsertInput {
  moduleSlug: string;
  authorId: string;
  rating: number;
  title: string;
  body: string;
}

export type UpsertResult =
  | { ok: true; review: ReviewRow; created: boolean }
  | { ok: false; reason: "module_not_found" | "self_review" };

/**
 * Create or update the author's review for this module. One row per
 * (slug, author); a second submission overwrites the first and
 * updatedAt advances.
 *
 * Rejects self-reviews: a user who is the module's publisher cannot
 * review their own module.
 */
export async function upsertReview(input: UpsertInput): Promise<UpsertResult> {
  // Verify the module exists and check publisher identity in one query.
  const mod = (await prisma.module.findUnique({
    where: { slug: input.moduleSlug },
    select: { publisherId: true } as never,
  })) as { publisherId: string | null } | null;

  if (!mod) return { ok: false, reason: "module_not_found" };
  if (mod.publisherId && mod.publisherId === input.authorId) {
    return { ok: false, reason: "self_review" };
  }

  const existing = (await prisma.moduleReview.findUnique({
    where: {
      moduleSlug_authorId: {
        moduleSlug: input.moduleSlug,
        authorId: input.authorId,
      },
    } as never,
  })) as { id: string } | null;

  const row = (await prisma.moduleReview.upsert({
    where: {
      moduleSlug_authorId: {
        moduleSlug: input.moduleSlug,
        authorId: input.authorId,
      },
    } as never,
    create: {
      moduleSlug: input.moduleSlug,
      authorId: input.authorId,
      rating: input.rating,
      title: input.title,
      body: input.body,
    } as never,
    update: {
      rating: input.rating,
      title: input.title,
      body: input.body,
      // Edits reset moderation state — a user can't edit-around a
      // flag. If the new edit is also problematic it'll get flagged
      // again. Admin hide persists through edits? No, that would
      // let a hidden review reappear via edit. Preserve it.
      // Implementation: only reset "flagged" back to "visible" on
      // edit; keep "hidden" as "hidden".
      ...(existing
        ? {
            // Reset flagged back to visible. Keep hidden as hidden.
            // Raw SQL would be cleaner but Prisma's API requires this
            // two-step dance.
          }
        : {}),
    } as never,
    include: {
      author: { select: { name: true, image: true } },
    } as never,
  })) as DbRow;

  // Post-write moderation reset. Only flagged → visible; hidden stays.
  if (existing && row.moderation === "flagged") {
    await prisma.moduleReview.update({
      where: { id: row.id },
      data: { moderation: "visible", flagReason: null } as never,
    });
    row.moderation = "visible";
    row.flagReason = null;
  }

  return { ok: true, review: rowToReview(row), created: !existing };
}

/**
 * Flag a review as inappropriate. Anyone authenticated can do this;
 * rate-limited elsewhere. Idempotent — flagging an already-flagged
 * review just replaces the reason.
 */
export async function flagReview(args: {
  reviewId: string;
  reason: string;
}): Promise<{ ok: boolean }> {
  const updated = await prisma.moduleReview.updateMany({
    where: {
      id: args.reviewId,
      moderation: { not: "hidden" }, // can't flag an already-hidden row
    } as never,
    data: {
      moderation: "flagged",
      flagReason: args.reason,
    } as never,
  });
  return { ok: updated.count > 0 };
}

/**
 * Admin-only: flip a review to hidden (takes it out of public lists)
 * or back to visible. Stamps hiddenById/hiddenAt on the hidden
 * transition; clears them on visible.
 */
export async function setModeration(args: {
  reviewId: string;
  state: "visible" | "hidden";
  adminId: string;
}): Promise<{ ok: boolean }> {
  const data =
    args.state === "hidden"
      ? {
          moderation: "hidden",
          hiddenById: args.adminId,
          hiddenAt: new Date(),
        }
      : {
          moderation: "visible",
          flagReason: null,
          hiddenById: null,
          hiddenAt: null,
        };
  const updated = await prisma.moduleReview.update({
    where: { id: args.reviewId },
    data: data as never,
  });
  return { ok: !!updated };
}

/**
 * Admin queue feed: flagged reviews first, then hidden (for review
 * of admin's own earlier decisions). Ordered by createdAt desc.
 */
export async function listReviewsForModeration(
  limit = 50,
): Promise<ReviewRow[]> {
  const rows = (await prisma.moduleReview.findMany({
    where: {
      moderation: { in: ["flagged", "hidden"] },
    } as never,
    orderBy: { createdAt: "desc" } as never,
    take: limit,
    include: {
      author: { select: { name: true, image: true } },
    } as never,
  })) as DbRow[];
  return rows.map(rowToReview);
}

/**
 * User's own review for a module, or null. Used by the module detail
 * page to render "edit your review" vs "write a review" UX.
 */
export async function getMyReview(
  slug: string,
  userId: string,
): Promise<ReviewRow | null> {
  const row = (await prisma.moduleReview.findUnique({
    where: {
      moduleSlug_authorId: {
        moduleSlug: slug,
        authorId: userId,
      },
    } as never,
    include: {
      author: { select: { name: true, image: true } },
    } as never,
  })) as DbRow | null;
  return row ? rowToReview(row) : null;
}

/**
 * Pick a handful of substantive recent reviews for the homepage
 * "What operators are saying" wall. Filters out reviews with
 * thin bodies (< 80 chars feels like noise on a marketing surface)
 * and reviews on private modules. Returns reviews ordered newest-
 * first so the wall always feels alive.
 *
 * `limit` defaults to 4 — enough for a 2x2 grid on the landing
 * without overflowing into a wall of text. Caller passes a different
 * value if rendering a wider strip.
 *
 * The query intentionally does NOT exclude flagged-but-not-hidden
 * reviews. Marketing surfaces should reflect what catalog visitors
 * actually see, and flagged-state reviews stay publicly visible
 * until an admin hides them.
 */
export async function listReviewsForLandingWall(
  limit = 4,
): Promise<ReviewRow[]> {
  if (!hasDatabaseUrl()) return [];
  // 4× the limit as candidate pool, then narrow client-side. Body-
  // length filter is hard to express in Prisma without a raw query
  // so the over-fetch is the simplest correct approach.
  const candidates = (await prisma.moduleReview.findMany({
    where: {
      moderation: { not: "hidden" },
      module: { visibility: "public" },
    } as never,
    orderBy: { createdAt: "desc" } as never,
    take: limit * 4,
    include: {
      author: { select: { name: true, image: true } },
    } as never,
  })) as DbRow[];

  return candidates
    .filter((r) => r.body.trim().length >= 80)
    .slice(0, limit)
    .map(rowToReview);
}
