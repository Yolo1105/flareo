import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/validation/schemas";
import { verifyWorkerSecret } from "@/lib/auth/worker-auth";
import { getAdminSubmission } from "@/lib/db/admin-submissions";
import {
  sendBuildSuccessEmail,
  sendBuildFailedEmail,
} from "@/lib/email/submission-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called by the build worker when a build finishes. The worker has
 * already written the result row to the DB; this endpoint exists only
 * to dispatch the decision email. Separating email-sending from the
 * worker keeps the worker free of SMTP credentials.
 *
 * Authenticated via a shared secret header. The secret lives in
 * FLAREO_WORKER_SECRET on both the main app and the worker — same
 * name on both sides; set the env var to the same value.
 */

const SuccessSchema = z.object({
  submissionId: z.string(),
  result: z.literal("success"),
  digest: z.string(),
  imageRef: z.string(),
  signerIdentity: z.string(),
  signerIssuer: z.string(),
  rekorIndex: z.string(),
  sbomUrl: z.string(),
  // Policy outcome (added when the worker grew an admission-policy
  // gate). Optional + nullable for backward compat — older worker
  // versions that don't set them still parse cleanly. When the
  // verdict is `fail` or unavailable, the worker holds the publish
  // and `published=false`; the email copy below reflects that.
  policyVerdict: z.enum(["pass", "warn", "fail"]).nullable().optional(),
  policyRevision: z.number().int().nullable().optional(),
  policyHoldReason: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

const FailureSchema = z.object({
  submissionId: z.string(),
  result: z.enum(["failed", "scan_rejected"]),
  cveList: z.array(z.string()).optional(),
});

const BodySchema = z.discriminatedUnion("result", [
  SuccessSchema,
  FailureSchema,
]);

export async function POST(req: NextRequest) {
  const authFailure = verifyWorkerSecret(req, "worker/build-completed");
  if (authFailure) return authFailure;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
    });
  }

  const parsed = BodySchema.safeParse(raw);
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

  const data = parsed.data;
  const submission = await getAdminSubmission(data.submissionId);
  if (!submission) {
    return NextResponse.json(apiError("not_found", "submission not found"), {
      status: 404,
    });
  }

  if (data.result === "success") {
    const email =
      submission.submitter?.email ?? submission.flags.contactEmail ?? null;
    const name =
      submission.submitter?.name ??
      (email ? email.split("@")[0] : "there") ??
      "there";
    if (email) {
      void sendBuildSuccessEmail({
        submitterEmail: email,
        submitterName: name,
        id: submission.id,
        slug: submission.moduleName,
        digest: data.digest,
        imageRef: data.imageRef,
        signerIdentity: data.signerIdentity,
        signerIssuer: data.signerIssuer,
        rekorIndex: data.rekorIndex,
        sbomUrl: data.sbomUrl,
        // Optional policy fields. Email helper renders the
        // "held by policy" copy when `published === false`.
        policyVerdict: data.policyVerdict ?? null,
        policyRevision: data.policyRevision ?? null,
        policyHoldReason: data.policyHoldReason ?? null,
        published: data.published ?? true,
      }).catch((e: unknown) => {
        console.error("[worker/build-completed] success email failed", {
          submissionId: submission.id,
          error: e,
        });
      });
    }
  } else {
    void sendBuildFailedEmail(submission, {
      cveList: "cveList" in data ? data.cveList : undefined,
    }).catch((e: unknown) => {
      console.error("[worker/build-completed] failure email failed", {
        submissionId: submission.id,
        error: e,
      });
    });
  }

  return NextResponse.json({ ok: true });
}
