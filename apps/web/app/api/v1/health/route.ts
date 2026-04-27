import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/v1/health
 *
 * Liveness + DB connectivity check. Instatus polls this. Returns 200
 * when both the app and the database are reachable, 503 otherwise.
 *
 * We deliberately keep the DB check cheap: a single `SELECT 1`-like
 * query via Prisma's `$queryRaw`. No full-table scans.
 */
export const runtime = "nodejs";

// Don't cache this route ever.
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbLatencyMs = -1;

  try {
    const dbStart = Date.now();
    await prisma.$queryRawUnsafe("SELECT 1");
    dbLatencyMs = Date.now() - dbStart;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? "ok" : "degraded";
  const httpStatus = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      checks: {
        database: { ok: dbOk, latencyMs: dbLatencyMs },
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      respondedInMs: Date.now() - startedAt,
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
