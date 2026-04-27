import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/v1/stats
 *
 * Aggregate numbers for the landing page hero and the MetricsStrip
 * section. All values computed from real Postgres state; no seeding,
 * no hardcoding. Cached at the edge for 60 seconds so heavy landing
 * traffic doesn't stampede the DB.
 *
 * Returned fields match what the marketing components consume. If you
 * add a new stat to the landing, add it here too.
 */
export const runtime = "nodejs";
export const revalidate = 60; // cache for 1 minute

type ModuleRow = {
  cveCritical: number;
  cveHigh: number;
  cveMedium: number;
  cveLow: number;
  lastRebuiltAt: Date | null;
};

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      moduleCount: 0,
      verifiedCount: 0,
      builds7d: 0,
      scanPassPct: 100,
      openCves: 0,
      lastRebuildAt: null,
    });
  }

  const [moduleCount, modulesUnknown, verifiedCount] = await Promise.all([
    prisma.module.count({ where: { visibility: "public" } }),
    prisma.module.findMany({
      where: { visibility: "public" },
      select: {
        cveCritical: true,
        cveHigh: true,
        cveMedium: true,
        cveLow: true,
        lastRebuiltAt: true,
      },
    }),
    prisma.module.count({
      where: { visibility: "public", status: "verified" },
    }),
  ]);
  const modules = modulesUnknown as ModuleRow[];

  // 7-day build count: number of canary rebuilds that hit in the last 7 days.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const builds7d = modules.filter(
    (m) => m.lastRebuiltAt && m.lastRebuiltAt >= sevenDaysAgo
  ).length;

  // Scan pass rate: fraction of modules with zero critical or high.
  const passing = modules.filter(
    (m) => m.cveCritical === 0 && m.cveHigh === 0
  ).length;
  const scanPassPct =
    modules.length === 0 ? 100 : Math.round((passing / modules.length) * 100);

  // Total open CVE count across the catalog.
  const openCves = modules.reduce(
    (sum, m) =>
      sum + m.cveCritical + m.cveHigh + m.cveMedium + m.cveLow,
    0
  );

  // Most recent rebuild timestamp, for "Last refreshed".
  const mostRecentRebuild = modules
    .map((m) => m.lastRebuiltAt)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return NextResponse.json({
    moduleCount,
    verifiedCount,
    builds7d,
    scanPassPct,
    openCves,
    lastRebuildAt: mostRecentRebuild?.toISOString() ?? null,
  });
}
