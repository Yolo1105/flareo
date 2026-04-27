import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  listAdminSubmissions,
  getQueueStats,
} from "@/lib/db/admin-submissions";
import { apiError } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map((x) => x.trim()) : undefined)),
  minAgeHours: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : undefined))
    .refine((n) => n === undefined || (Number.isFinite(n) && n >= 0), {
      message: "minAgeHours must be a non-negative number",
    }),
  limit: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : undefined))
    .refine((n) => n === undefined || (Number.isFinite(n) && n > 0 && n <= 200), {
      message: "limit must be 1..200",
    }),
  includeStats: z
    .string()
    .optional()
    .transform((s) => s === "1" || s === "true"),
});

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    minAgeHours: searchParams.get("minAgeHours") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    includeStats: searchParams.get("includeStats") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        "bad_request",
        "invalid query",
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        }))
      ),
      { status: 400 }
    );
  }

  const [submissions, stats] = await Promise.all([
    listAdminSubmissions({
      status: parsed.data.status,
      minAgeHours: parsed.data.minAgeHours,
      limit: parsed.data.limit,
    }),
    parsed.data.includeStats ? getQueueStats() : Promise.resolve(null),
  ]);

  return NextResponse.json({
    submissions,
    stats,
  });
}
