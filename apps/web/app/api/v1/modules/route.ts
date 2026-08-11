import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { modulesListQuerySchema, apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { getUserPlan } from "@/lib/billing/quota";
import { auth } from "@/lib/auth/config";

/**
 * GET /api/v1/modules
 *
 * Query parameters:
 *   q        optional text search across slug, name, description, tags
 *   category optional category filter
 *   limit    default 50, max 100
 *   cursor   slug of the last item returned, for pagination
 *
 * Returns:
 *   {
 *     modules: ModuleSummary[],
 *     nextCursor: string | null
 *   }
 *
 * This is the CLI's primary read endpoint. It must be fast and cheap.
 * We intentionally project a small summary shape, not the full Module
 * row, so responses stay under 5 KB for 50 items.
 */
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const key = keyForRequest(userId, req.headers);
  const plan = userId ? await getUserPlan(userId) : "free";
  const limit = await checkLimit("modules-list", key, plan);
  const headers = rateLimitHeaders(limit);

  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many requests"),
      { status: 429, headers }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = modulesListQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  });
  if (!query.success) {
    return NextResponse.json(
      apiError("bad_query", "invalid query parameters", query.error.issues),
      { status: 400, headers }
    );
  }

  // Build the Prisma `where` clause. We only return verified modules
  // from the public catalog. Private modules, if any, are hidden from
  // this endpoint; there's a separate admin-only listing elsewhere.
  const where: Record<string, unknown> = {
    visibility: "public",
    status: { in: ["verified", "failing"] },
  };
  if (query.data.category) {
    where.category = query.data.category;
  }
  if (query.data.q) {
    const q = query.data.q;
    where.OR = [
      { slug: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
    ];
  }

  // Cursor pagination: skip items up to and including `cursor`.
  const take = query.data.limit;
  const findArgs: {
    where: Record<string, unknown>;
    orderBy: ({ deploys: "desc" } | { slug: "asc" })[];
    take: number;
    cursor?: { slug: string };
    skip?: number;
  } = {
    where,
    orderBy: [{ deploys: "desc" }, { slug: "asc" }],
    take: take + 1, // one extra to know if there's a next page
  };
  if (query.data.cursor) {
    findArgs.cursor = { slug: query.data.cursor };
    findArgs.skip = 1;
  }

  const rows = (await prisma.module.findMany(findArgs)) as Array<
    Record<string, unknown>
  >;

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? (page[page.length - 1]!.slug as string) : null;

  // Project to summary shape. Don't leak internal fields like trust
  // sub-scores, Rekor index, or signer identity here — those live on
  // the detail endpoint.
  const modules = page.map((m) => ({
    slug: m.slug,
    name: m.name,
    version: m.version,
    author: m.author,
    description: m.description,
    category: m.category,
    status: m.status,
    slsa: m.slsa,
    trust: m.trust,
    tags: m.tags,
    cves: {
      critical: m.cveCritical,
      high: m.cveHigh,
      medium: m.cveMedium,
      low: m.cveLow,
    },
    deploys: m.deploys,
    digest: m.digest,
    previewable: m.previewable,
    lastRebuiltAt: m.lastRebuiltAt ?? null,
  }));

  return NextResponse.json(
    { modules, nextCursor },
    { status: 200, headers }
  );
}
