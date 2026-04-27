import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { apiError } from "@/lib/validation/schemas";
import { triageReport, REPORT_STATES } from "@/lib/db/reports";

/**
 * POST /api/v1/admin/reports/[id]/triage
 *   body: { state: ReportState, resolutionNote?: string | null }
 *
 * Admin-only. Moves a report between states. Stamps triagedBy +
 * triagedAt on the first transition out of "open". Resolved and
 * dismissed are terminal — subsequent transition attempts return 409.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const BodySchema = z.object({
  state: z.enum(REPORT_STATES),
  resolutionNote: z.string().trim().max(2000).nullable().optional(),
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
      apiError("bad_request", "triage validation failed"),
      { status: 400 },
    );
  }

  const result = await triageReport({
    reportId: id,
    newState: parsed.data.state,
    resolutionNote: parsed.data.resolutionNote ?? null,
    adminId: gate.userId,
  });

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json(apiError("not_found", "report not found"), {
        status: 404,
      });
    }
    if (result.reason === "terminal") {
      return NextResponse.json(
        apiError(
          "terminal",
          "this report is already resolved or dismissed; file a new one if the issue recurs",
        ),
        { status: 409 },
      );
    }
    return NextResponse.json(apiError("bad_request", "invalid state"), {
      status: 400,
    });
  }

  return NextResponse.json({ ok: true, state: parsed.data.state }, {
    status: 200,
  });
}
