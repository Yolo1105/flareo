import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { upsert, deleteByModuleCve } from "@/lib/db/vex";
import type { VexStatus, VexJustification } from "@/lib/db/vex";
import { apiError } from "@/lib/validation/schemas";

/**
 * PUT /api/v1/modules/[slug]/vex/[cve]
 * DELETE /api/v1/modules/[slug]/vex/[cve]
 *
 * Reviewer-only endpoints for managing VEX annotations on a module's
 * Trivy findings. PUT upserts (creates or replaces) the statement for
 * a single (module, cve) pair; DELETE removes the annotation, which
 * makes the CVE "unannotated" again — Trivy still reports it but no
 * VEX statement exists.
 *
 * Reviewer-only at this stage. The proposal also mentioned a
 * publisher-side annotation surface (so module authors can mark
 * their own findings) but the policy work for that — what publishers
 * can claim about themselves vs what we'd require us to vouch for
 * — earns its own session.
 *
 * The slug + cve in the URL are the unique key for the underlying
 * row. The body carries the status, justification, impactStatement.
 */
export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ slug: string; cve: string }>;
}

interface PutBody {
  status?: unknown;
  justification?: unknown;
  impactStatement?: unknown;
  cveSeverity?: unknown;
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { slug, cve } = await ctx.params;

  if (!slug || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
    return NextResponse.json(
      apiError("invalid_slug", "invalid module slug"),
      { status: 400 },
    );
  }

  // Decode the CVE — Next.js passes it URL-decoded already, but
  // double-check the shape.
  if (!/^CVE-\d{4}-\d{4,7}$/.test(cve)) {
    return NextResponse.json(
      apiError("invalid_cve", "cve must be CVE-YYYY-NNNN..NNNN"),
      { status: 400 },
    );
  }

  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return NextResponse.json(
      apiError("bad_json", "request body must be valid JSON"),
      { status: 400 },
    );
  }

  if (typeof body.status !== "string") {
    return NextResponse.json(
      apiError("bad_request", "status field is required"),
      { status: 400 },
    );
  }

  // Coerce optional fields. Empty strings and undefined both
  // become null so DB nullability is consistent.
  const justification =
    typeof body.justification === "string" && body.justification.length > 0
      ? (body.justification as VexJustification)
      : null;
  const impactStatement =
    typeof body.impactStatement === "string" && body.impactStatement.length > 0
      ? body.impactStatement
      : null;

  // cveSeverity is optional. Empty string and missing both become
  // null (= unknown severity, evaluator falls back to heuristic).
  // Bounded set check happens in lib/db/vex.ts:validateUpsert so the
  // typo path is uniform between the API and any direct callers.
  const cveSeverity =
    typeof body.cveSeverity === "string" && body.cveSeverity.length > 0
      ? (body.cveSeverity.toLowerCase() as
          | "critical"
          | "high"
          | "medium"
          | "low"
          | "unknown")
      : null;

  const result = await upsert({
    moduleSlug: slug,
    cve,
    cveSeverity,
    status: body.status as VexStatus,
    justification,
    impactStatement,
    authorId: guard.userId,
  });

  if (!result.ok) {
    const status =
      result.reason === "module_not_found"
        ? 404
        : result.reason === "validation"
          ? 400
          : 503;
    return NextResponse.json(
      apiError(result.reason, result.message),
      { status },
    );
  }

  return NextResponse.json(result.statement, { status: 200 });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { slug, cve } = await ctx.params;

  if (!slug || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
    return NextResponse.json(
      apiError("invalid_slug", "invalid module slug"),
      { status: 400 },
    );
  }
  if (!/^CVE-\d{4}-\d{4,7}$/.test(cve)) {
    return NextResponse.json(
      apiError("invalid_cve", "cve must be CVE-YYYY-NNNN..NNNN"),
      { status: 400 },
    );
  }

  const ok = await deleteByModuleCve(slug, cve);
  // Idempotent: 200 on found-and-deleted, 200 on already-absent. The
  // caller's intent is "this CVE should not be annotated" and that's
  // true in both cases.
  return NextResponse.json({ ok, slug, cve }, { status: 200 });
}
