import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import { regenerateAllVerdicts } from "@/lib/db/policy";
import { apiError } from "@/lib/validation/schemas";

/**
 * POST /api/v1/admin/policy/regenerate
 *
 * Re-evaluate the active admission policy against every public module
 * and refresh the cached ModulePolicyVerdict rows. Used after a policy
 * revision lands so consumer-facing verdicts reflect the new rules
 * without waiting for the next scheduled rebuild.
 *
 * Bounded by the public-module count (12 at launch). For a much
 * larger catalog this should move to a background job; for now the
 * synchronous path is fine and gives the admin immediate feedback.
 *
 * Reviewer/admin only.
 */
export const runtime = "nodejs";

export async function POST() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  let rows: ModuleShape[];
  try {
    rows = (await prisma.module.findMany({
      where: { visibility: "public" } as never,
    })) as ModuleShape[];
  } catch (err) {
    return NextResponse.json(
      apiError(
        "db_error",
        err instanceof Error ? err.message : "module list failed",
      ),
      { status: 503 },
    );
  }

  const modules = rows.map(shapeToModule);
  try {
    const result = await regenerateAllVerdicts(modules);
    return NextResponse.json(
      { evaluated: result.evaluated },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      apiError(
        "evaluation_error",
        err instanceof Error ? err.message : "evaluation failed",
      ),
      { status: 503 },
    );
  }
}
