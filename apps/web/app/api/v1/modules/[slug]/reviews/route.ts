import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { getUserPlan } from "@/lib/billing/quota";
import { apiError, slugSchema } from "@/lib/validation/schemas";
import {
  listReviewsForModule,
  upsertReview,
  getReviewAggregate,
} from "@/lib/db/reviews";

/**
 * GET /api/v1/modules/[slug]/reviews
 *   → { reviews, aggregate }
 *
 * POST /api/v1/modules/[slug]/reviews
 *   body: { rating: 1..5, title, body }
 *   → { review, created }
 *
 * List is public (hides hidden reviews). POST requires auth.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ slug: string }>;
}

const PostSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(5).max(120),
  body: z.string().trim().min(20).max(4000),
});

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  const key = keyForRequest(userId, req.headers);
  const plan = userId ? await getUserPlan(userId) : "free";
  const limit = await checkLimit("modules-list", key, plan);
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many requests"),
      { status: 429, headers },
    );
  }

  const { slug: raw } = await ctx.params;
  const parsed = slugSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(apiError("bad_slug", "invalid slug"), {
      status: 400,
      headers,
    });
  }

  const [reviews, aggregate] = await Promise.all([
    listReviewsForModule(parsed.data),
    getReviewAggregate(parsed.data),
  ]);

  return NextResponse.json(
    { reviews, aggregate },
    { status: 200, headers },
  );
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in to post a review"),
      { status: 401 },
    );
  }

  const key = keyForRequest(userId, req.headers);
  const plan = await getUserPlan(userId);
  // Stricter bucket than list — prevents review-spam even if rate-
  // limiter shared across endpoints. Reuse auth-signin's tight 10/10min.
  const limit = await checkLimit("user-writes", key, plan);
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "slow down — you can post another review soon"),
      { status: 429, headers },
    );
  }

  const { slug: raw } = await ctx.params;
  const slugParsed = slugSchema.safeParse(raw);
  if (!slugParsed.success) {
    return NextResponse.json(apiError("bad_slug", "invalid slug"), {
      status: 400,
      headers,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        "bad_request",
        "invalid review",
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      ),
      { status: 400, headers },
    );
  }

  const result = await upsertReview({
    moduleSlug: slugParsed.data,
    authorId: userId,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  if (!result.ok) {
    const status = result.reason === "module_not_found" ? 404 : 409;
    return NextResponse.json(
      apiError(
        result.reason,
        result.reason === "module_not_found"
          ? "module not found"
          : "you can't review your own module",
      ),
      { status, headers },
    );
  }

  return NextResponse.json(
    { review: result.review, created: result.created },
    { status: result.created ? 201 : 200, headers },
  );
}
