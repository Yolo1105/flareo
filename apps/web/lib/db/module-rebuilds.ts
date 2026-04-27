/**
 * Read + write helpers for the ModuleRebuild audit log.
 *
 * Read paths (public, admin):
 *   - listRecentRebuildsForModule  — module detail page's "rebuild
 *     history" section. Cheap index read, cached at request time.
 *   - listRecentRebuildsAdmin      — admin-only log across all modules
 *     with optional outcome filtering.
 *
 * Write path (canary script, called once per module per rebuild cycle):
 *   - recordRebuildAttempt — append a ModuleRebuild row AND update
 *     Module.lastRebuiltAt in a single transaction so the denormalized
 *     timestamp stays consistent with the audit log.
 *
 * All reads go through Prisma's findMany rather than raw SQL so a
 * Postgres → SQLite swap in the test harness stays painless.
 */

import { hasDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";

export type RebuildOutcome =
  | "success"
  | "upstream_unchanged"
  | "scan_failed"
  | "build_failed";

export interface RebuildAttempt {
  id: string;
  moduleSlug: string;
  attemptedAt: string;   // ISO string at the boundary
  durationMs: number | null;
  outcome: RebuildOutcome;
  resultDigest: string | null;
  notes: string | null;
}

interface Row {
  id: string;
  moduleSlug: string;
  attemptedAt: Date;
  durationMs: number | null;
  outcome: string;
  resultDigest: string | null;
  notes: string | null;
}

function rowToAttempt(r: Row): RebuildAttempt {
  return {
    id: r.id,
    moduleSlug: r.moduleSlug,
    attemptedAt: r.attemptedAt.toISOString(),
    durationMs: r.durationMs,
    outcome: (r.outcome as RebuildOutcome),
    resultDigest: r.resultDigest,
    notes: r.notes,
  };
}

/**
 * Most recent N rebuild attempts for a single module, newest first.
 * Caller passes the module's slug; we don't look up the module row.
 * A slug that doesn't exist returns [] (the relation is ON DELETE
 * CASCADE, so an absent Module means no rebuilds).
 */
export async function listRecentRebuildsForModule(
  slug: string,
  limit: number = 10,
): Promise<RebuildAttempt[]> {
  if (!hasDatabaseUrl()) return [];
  const rows = (await prisma.moduleRebuild.findMany({
    where: { moduleSlug: slug } as never,
    orderBy: { attemptedAt: "desc" } as never,
    take: limit,
  })) as Row[];
  return rows.map(rowToAttempt);
}

export interface AdminRebuildFilter {
  /** "all" (default) | "failures" — convenience for the log UI. */
  show?: "all" | "failures";
  limit?: number;
}

/**
 * Admin log across all modules. "failures" filter includes both
 * build_failed and scan_failed; it excludes upstream_unchanged because
 * that's a benign no-op, not a failure.
 */
export async function listRecentRebuildsAdmin(
  filter: AdminRebuildFilter = {},
): Promise<RebuildAttempt[]> {
  const take = filter.limit ?? 50;
  const where =
    filter.show === "failures"
      ? { outcome: { in: ["build_failed", "scan_failed"] } }
      : {};
  const rows = (await prisma.moduleRebuild.findMany({
    where: where as never,
    orderBy: { attemptedAt: "desc" } as never,
    take,
  })) as Row[];
  return rows.map(rowToAttempt);
}

/**
 * Summary counts for the admin log header: last-24h success /
 * skipped / failed. Cheap; three parallel counts against the
 * partial indexes.
 */
export interface RebuildLogSummary {
  last24h: {
    success: number;
    unchanged: number;
    failed: number;
  };
  lastAttemptAt: string | null;
}

export async function getRebuildLogSummary(): Promise<RebuildLogSummary> {
  const since = new Date(Date.now() - 24 * 3600 * 1000);

  const [success, unchanged, failed, latest] = await Promise.all([
    prisma.moduleRebuild.count({
      where: { attemptedAt: { gte: since }, outcome: "success" } as never,
    }),
    prisma.moduleRebuild.count({
      where: {
        attemptedAt: { gte: since },
        outcome: "upstream_unchanged",
      } as never,
    }),
    prisma.moduleRebuild.count({
      where: {
        attemptedAt: { gte: since },
        outcome: { in: ["build_failed", "scan_failed"] },
      } as never,
    }),
    prisma.moduleRebuild.findFirst({
      orderBy: { attemptedAt: "desc" } as never,
      select: { attemptedAt: true } as never,
    }) as Promise<{ attemptedAt: Date } | null>,
  ]);

  return {
    last24h: { success, unchanged, failed },
    lastAttemptAt: latest?.attemptedAt.toISOString() ?? null,
  };
}

/**
 * Append a ModuleRebuild row and, on success, update
 * Module.lastRebuiltAt in the same transaction.
 *
 * Called by the canary rebuild script (scripts/canary/...). The
 * script passes an already-computed outcome + optional digest + notes.
 * On "success" and "upstream_unchanged" the Module.lastRebuiltAt is
 * updated; on the two failure outcomes, lastRebuiltAt is NOT touched
 * because the last SUCCESSFUL rebuild is a more useful data point to
 * display than "we tried and failed".
 */
export interface RecordRebuildInput {
  moduleSlug: string;
  outcome: RebuildOutcome;
  durationMs: number | null;
  resultDigest?: string | null;
  notes?: string | null;
}

export async function recordRebuildAttempt(
  input: RecordRebuildInput,
): Promise<RebuildAttempt> {
  const advancesLastRebuilt =
    input.outcome === "success" || input.outcome === "upstream_unchanged";

  const row = await prisma.$transaction(async (tx: typeof prisma) => {
    const inserted = (await tx.moduleRebuild.create({
      data: {
        moduleSlug: input.moduleSlug,
        outcome: input.outcome,
        durationMs: input.durationMs,
        resultDigest: input.resultDigest ?? null,
        notes: input.notes ?? null,
      } as never,
    })) as Row;

    if (advancesLastRebuilt) {
      await tx.module.update({
        where: { slug: input.moduleSlug },
        data: { lastRebuiltAt: new Date() } as never,
      });
    }

    return inserted;
  });

  return rowToAttempt(row);
}
