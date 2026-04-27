import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { savePolicy } from "@/lib/db/policy";
import { parsePolicy } from "@/lib/policy/schema";
import { apiError } from "@/lib/validation/schemas";

/**
 * PUT /api/v1/admin/policy
 *
 * Save a new policy revision. Body:
 *   {
 *     policyJson: string,  // full policy document as JSON text
 *     notes:      string,  // changelog entry, ≥5 chars
 *   }
 *
 * Validates against PolicySchema before insert. The new revision
 * becomes active immediately (active = MAX(revision)). Older
 * revisions stay in the audit trail.
 *
 * Reviewer/admin only — the policy controls who gets admitted to
 * the catalog, so editing it is a privileged operation.
 */
export const runtime = "nodejs";

interface PutBody {
  policyJson?: unknown;
  notes?: unknown;
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return NextResponse.json(
      apiError("bad_json", "request body must be valid JSON"),
      { status: 400 },
    );
  }

  if (typeof body.policyJson !== "string") {
    return NextResponse.json(
      apiError("bad_request", "policyJson (string) is required"),
      { status: 400 },
    );
  }
  if (typeof body.notes !== "string") {
    return NextResponse.json(
      apiError("bad_request", "notes (string) is required"),
      { status: 400 },
    );
  }

  const parsed = parsePolicy(body.policyJson);
  if (!parsed.ok) {
    return NextResponse.json(
      apiError("validation", parsed.error),
      { status: 400 },
    );
  }

  const result = await savePolicy({
    policy: parsed.policy,
    notes: body.notes,
    authorId: guard.userId,
  });
  if (!result.ok) {
    const status = result.reason === "validation" ? 400 : 503;
    return NextResponse.json(
      apiError(result.reason, result.message),
      { status },
    );
  }

  return NextResponse.json({ revision: result.revision }, { status: 200 });
}
