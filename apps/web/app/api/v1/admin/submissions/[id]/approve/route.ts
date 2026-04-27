import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { approveSubmission } from "@/lib/db/admin-submissions";
import { apiError } from "@/lib/validation/schemas";
import { sendApprovalEmail } from "@/lib/email/submission-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const BodySchema = z.object({
  notes: z.string().max(2000).optional(),
  grantNetwork: z.boolean().optional(),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine for approve — notes are optional.
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

  const submission = await approveSubmission({
    submissionId: id,
    reviewerId: gate.userId,
    notes: parsed.data.notes,
    grantNetwork: parsed.data.grantNetwork,
  });

  if (!submission) {
    return NextResponse.json(
      apiError(
        "invalid_transition",
        "submission cannot be approved from its current state"
      ),
      { status: 409 }
    );
  }

  // Fire-and-forget email. Errors are logged, not returned to the
  // admin — the decision already succeeded; email is a notification.
  void sendApprovalEmail(submission).catch((e: unknown) => {
    console.error("approval email failed", { submissionId: id, error: e });
  });

  return NextResponse.json({ submission });
}
