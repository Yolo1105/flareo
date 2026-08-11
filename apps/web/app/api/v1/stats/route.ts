import { NextResponse } from "next/server";
import { getCatalogStats } from "@/lib/db/stats";

/**
 * GET /api/v1/stats
 *
 * Aggregate numbers for the landing page MetricsStrip. All values
 * computed from real Postgres state via getCatalogStats(); no seeding,
 * no hardcoding. Cached at the edge for 60 seconds so heavy landing
 * traffic doesn't stampede the DB.
 */
export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const stats = await getCatalogStats();
  return NextResponse.json(stats);
}
