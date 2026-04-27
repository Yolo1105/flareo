import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { retryBuild } from "@/lib/db/admin-submissions";
import { apiError } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, ctx: Ctx) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  const submission = await retryBuild({
    submissionId: id,
    reviewerId: gate.userId,
  });

  if (!submission) {
    return NextResponse.json(
      apiError(
        "invalid_transition",
        "retry is only valid for system-failed or dead-lettered builds"
      ),
      { status: 409 }
    );
  }

  return NextResponse.json({ submission });
}
