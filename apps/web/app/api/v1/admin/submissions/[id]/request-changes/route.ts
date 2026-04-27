import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requestChanges } from "@/lib/db/admin-submissions";
import { apiError } from "@/lib/validation/schemas";
import { sendChangesRequestedEmail } from "@/lib/email/submission-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const BodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "message must be at least 10 characters")
    .max(4000),
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

  const submission = await requestChanges({
    submissionId: id,
    reviewerId: gate.userId,
    message: parsed.data.message,
  });

  if (!submission) {
    return NextResponse.json(
      apiError(
        "invalid_transition",
        "changes can only be requested on pending submissions"
      ),
      { status: 409 }
    );
  }

  void sendChangesRequestedEmail(submission, parsed.data.message).catch(
    (e: unknown) => {
      console.error("changes-requested email failed", {
        submissionId: id,
        error: e,
      });
    }
  );

  return NextResponse.json({ submission });
}
