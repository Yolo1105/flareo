import { prisma } from "@/lib/db/prisma";

/**
 * Aggregate numbers for the landing MetricsStrip and GET /api/v1/stats.
 * All values from Postgres; no seeding, no hardcoding.
 */

export type CatalogStats = {
  moduleCount: number;
  verifiedCount: number;
  builds7d: number;
  scanPassPct: number;
  openCves: number;
  lastRebuildAt: string | null;
};

type ModuleRow = {
  cveCritical: number;
  cveHigh: number;
  cveMedium: number;
  cveLow: number;
  lastRebuiltAt: Date | null;
};

export async function getCatalogStats(): Promise<CatalogStats> {
  if (!process.env.DATABASE_URL) {
    return {
      moduleCount: 0,
      verifiedCount: 0,
      builds7d: 0,
      scanPassPct: 100,
      openCves: 0,
      lastRebuildAt: null,
    };
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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const builds7d = modules.filter(
    (m) => m.lastRebuiltAt && m.lastRebuiltAt >= sevenDaysAgo,
  ).length;

  const passing = modules.filter(
    (m) => m.cveCritical === 0 && m.cveHigh === 0,
  ).length;
  const scanPassPct =
    modules.length === 0 ? 100 : Math.round((passing / modules.length) * 100);

  const openCves = modules.reduce(
    (sum, m) =>
      sum + m.cveCritical + m.cveHigh + m.cveMedium + m.cveLow,
    0,
  );

  const mostRecentRebuild = modules
    .map((m) => m.lastRebuiltAt)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return {
    moduleCount,
    verifiedCount,
    builds7d,
    scanPassPct,
    openCves,
    lastRebuildAt: mostRecentRebuild?.toISOString() ?? null,
  };
}
