import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { apiError } from "@/lib/validation/schemas";
import { setModeration } from "@/lib/db/reviews";

/**
 * POST /api/v1/admin/reviews/[id]/moderate
 *   body: { state: "visible" | "hidden" }
 *
 * Admin-only. Hides or un-hides a review. Stamps hiddenById +
 * hiddenAt on the hidden transition.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const BodySchema = z.object({
  state: z.enum(["visible", "hidden"]),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
    });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("bad_request", "state must be visible|hidden"),
      { status: 400 },
    );
  }

  const { ok } = await setModeration({
    reviewId: id,
    state: parsed.data.state,
    adminId: gate.userId,
  });

  if (!ok) {
    return NextResponse.json(apiError("not_found", "review not found"), {
      status: 404,
    });
  }

  return NextResponse.json(
    { moderated: true, state: parsed.data.state },
    { status: 200 },
  );
}
