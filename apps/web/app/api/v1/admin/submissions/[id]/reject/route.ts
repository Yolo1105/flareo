import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { rejectSubmission } from "@/lib/db/admin-submissions";
import { apiError } from "@/lib/validation/schemas";
import { sendRejectionEmail } from "@/lib/email/submission-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const BodySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "rejection reason must be at least 10 characters")
    .max(4000),
  /**
   * Optional flag set by the admin UI when rejecting a DLQ row via
   * the "give up" action. Purely informational — gets surfaced in
   * the audit log's notes prefix. Ignored if absent.
   */
  fromDlq: z.boolean().optional(),
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
      apiError(
        "bad_request",
        "invalid body",
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        }))
      ),
      { status: 400 }
    );
  }

  const submission = await rejectSubmission({
    submissionId: id,
    reviewerId: gate.userId,
    reason: parsed.data.reason,
    fromDlq: parsed.data.fromDlq,
  });

  if (!submission) {
    return NextResponse.json(
      apiError(
        "invalid_transition",
        "submission cannot be rejected from its current state"
      ),
      { status: 409 }
    );
  }

  void sendRejectionEmail(submission, parsed.data.reason).catch((e: unknown) => {
    console.error("rejection email failed", { submissionId: id, error: e });
  });

  return NextResponse.json({ submission });
}
