import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { getUserPlan } from "@/lib/billing/quota";
import { apiError } from "@/lib/validation/schemas";
import { flagReview } from "@/lib/db/reviews";

/**
 * POST /api/v1/reviews/[id]/flag
 *   body: { reason: string }
 *
 * Any authenticated user can flag any review. Rate-limited to prevent
 * weaponized flag-spam (an angry reviewer flagging every competing
 * review). Flags don't hide the review — admin does, via the
 * moderation queue.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const BodySchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in to flag a review"),
      { status: 401 },
    );
  }

  const key = keyForRequest(userId, req.headers);
  const plan = await getUserPlan(userId);
  const limit = await checkLimit("user-writes", key, plan);
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many flags; try again in a few minutes"),
      { status: 429, headers },
    );
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("bad_request", "reason must be 5-500 characters"),
      { status: 400, headers },
    );
  }

  const { ok } = await flagReview({
    reviewId: id,
    reason: parsed.data.reason,
  });

  if (!ok) {
    // Review doesn't exist or is already hidden. Either way, no-op.
    return NextResponse.json(
      apiError("not_found", "review not found or already hidden"),
      { status: 404, headers },
    );
  }

  return NextResponse.json(
    { flagged: true, reviewId: id },
    { status: 200, headers },
  );
}
