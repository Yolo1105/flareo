/**
 * SPECULATIVE — see decisions.md G-3 / G-4.
 *
 * Module provenance read helpers. The provenance row tracks SLSA
 * level and reproducible-build status for each module. Until L3
 * work happens, all rows are slsaLevel=2 / reproducible=false.
 *
 * **Feature-gated.** Reads return null/zeros when the feature is
 * disabled. This is fail-closed: any UI that displays provenance
 * just shows nothing when G-3 hasn't fired, which is the correct
 * pre-G-3 behavior. Writes silently no-op when disabled, so worker
 * code that calls upsertProvenance during build can ship before
 * G-3 fires without polluting the table.
 */
import { prisma } from "./prisma";
import { requireFeature } from "@/lib/speculative/flags";

export interface ProvenanceRow {
  moduleSlug: string;
  slsaLevel: number;
  reproducible: boolean;
  l3AttestedAt: Date | null;
  reproducedAt: Date | null;
  diffArtifactUrl: string | null;
  updatedAt: Date;
}

/**
 * Get the provenance row for a module. Returns null if no row
 * exists (which is the default state until canary writes one), or
 * if the feature is disabled.
 */
export async function getProvenance(
  moduleSlug: string,
): Promise<ProvenanceRow | null> {
  if (!requireFeature("slsaL3")) {
    return null;
  }
  const row = (await prisma.moduleProvenance.findUnique({
    where: { moduleSlug } as never,
  })) as ProvenanceRow | null;
  return row;
}

/**
 * Upsert the provenance row. Worker calls this after each canary
 * rebuild with the SLSA/reproducible status of the build.
 *
 * No-ops silently when the feature is disabled — this lets worker
 * code call upsertProvenance unconditionally; the env-var flip
 * activates the table population.
 */
export async function upsertProvenance(
  args: Omit<ProvenanceRow, "updatedAt">,
): Promise<void> {
  if (!requireFeature("slsaL3")) {
    return;
  }
  await prisma.moduleProvenance.upsert({
    where: { moduleSlug: args.moduleSlug } as never,
    update: {
      slsaLevel: args.slsaLevel,
      reproducible: args.reproducible,
      l3AttestedAt: args.l3AttestedAt,
      reproducedAt: args.reproducedAt,
      diffArtifactUrl: args.diffArtifactUrl,
    } as never,
    create: args as never,
  });
}

/**
 * Aggregate counts for the admin dashboard "L3 readiness" widget.
 * Returns the number of modules at each SLSA level + how many have
 * been verified reproducible. Returns all-zeros when the feature
 * is disabled — admin widgets just render an empty state.
 */
export async function provenanceSummary(): Promise<{
  slsaL2: number;
  slsaL3: number;
  reproducible: number;
  total: number;
}> {
  if (!requireFeature("slsaL3")) {
    return { slsaL2: 0, slsaL3: 0, reproducible: 0, total: 0 };
  }
  const rows = (await prisma.moduleProvenance.findMany({
    select: { slsaLevel: true, reproducible: true } as never,
  })) as { slsaLevel: number; reproducible: boolean }[];
  return {
    slsaL2: rows.filter((r) => r.slsaLevel === 2).length,
    slsaL3: rows.filter((r) => r.slsaLevel === 3).length,
    reproducible: rows.filter((r) => r.reproducible).length,
    total: rows.length,
  };
}
