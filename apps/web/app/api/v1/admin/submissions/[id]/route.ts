import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAdminSubmission,
  findSimilarSubmissions,
} from "@/lib/db/admin-submissions";
import { apiError } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  const submission = await getAdminSubmission(id);
  if (!submission) {
    return NextResponse.json(apiError("not_found", "submission not found"), {
      status: 404,
    });
  }
  const similar = await findSimilarSubmissions(submission);

  return NextResponse.json({ submission, similar });
}
