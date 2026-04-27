/**
 * Admin analytics queries. Separate from worker-stats.ts (operational
 * health) because this is product-health, not pipeline-health: it
 * answers "how is the business doing" not "is the worker up".
 *
 * Everything here is DB-only — no Plausible dependency, no external
 * service dependency. Plausible covers page-view funnels; this file
 * covers state we already persist.
 *
 * All queries run in parallel. Count queries are covered by existing
 * indexes on Submission.status and User.plan.
 */

import { prisma } from "@/lib/db/prisma";
import { PLAN_LIMITS } from "@/lib/billing/quota";

export interface AdminAnalytics {
  /** Total registered users (not soft-deleted). */
  totalUsers: number;
  /** Split by plan. Free + paid = totalUsers. */
  freeUsers: number;
  paidUsers: number;

  /** All-time module counts by visibility. */
  publicModules: number;
  privateModules: number;

  /** All-time submission counts by status. */
  submissionsByStatus: Record<string, number>;

  /** Submissions created in the last 7 days, bucketed by day.
   *  Sorted ascending by date. Useful for a small sparkline. */
  submissionsLast7Days: Array<{ date: string; count: number }>;

  /** Count of free-tier users whose combined public-module footprint
   *  (published modules + in-flight submissions) meets or exceeds the
   *  free-tier cap. Matches canSubmit() semantics exactly — a user
   *  counted here would be rejected if they tried to submit right now. */
  usersAtQuotaCap: number;

  /** Dead-letter queue size right now. Mirrored from worker-stats so
   *  an operator looking at the analytics dashboard sees pipeline
   *  pain without navigating away. */
  deadLetterCount: number;

  /** Last built timestamp, if any. */
  lastBuiltAt: Date | null;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  // Generate the 7 day bucket skeleton (today at midnight UTC, six
  // days before). We fill counts after the query.
  const dayBuckets: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    dayBuckets.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
  }

  const [
    totalUsers,
    freeUsers,
    paidUsers,
    publicModules,
    privateModules,
    submissionsGroup,
    submissionsLast7Rows,
    deadLetterCount,
    lastBuilt,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { deletedAt: null, plan: "free" } as never,
    }),
    prisma.user.count({
      where: { deletedAt: null, plan: "pro" } as never,
    }),
    prisma.module.count({ where: { visibility: "public" } as never }),
    prisma.module.count({ where: { visibility: "private" } as never }),
    // groupBy over statuses gives us the counts in one round-trip.
    prisma.submission.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    // Raw SQL for per-day counts — Prisma's groupBy doesn't have a
    // date-truncation aggregator. Postgres-specific; if we ever
    // switch to a different DB this would need adapting. Safe
    // against SQL injection because sevenDaysAgo is a parameterized
    // value.
    prisma.$queryRawUnsafe<Array<{ day: Date; count: bigint }>>(
      `SELECT date_trunc('day', "submittedAt") AS day, COUNT(*) AS count
       FROM "Submission"
       WHERE "submittedAt" >= $1
       GROUP BY day
       ORDER BY day ASC`,
      sevenDaysAgo,
    ),
    prisma.submission.count({
      where: { status: "worker_failures" } as never,
    }),
    prisma.submission.findFirst({
      where: { status: "built" },
      orderBy: { buildCompletedAt: "desc" },
      select: { buildCompletedAt: true } as never,
    }) as Promise<{ buildCompletedAt: Date | null } | null>,
  ]);

  const submissionsByStatus: Record<string, number> = {};
  for (const row of submissionsGroup) {
    const count = (row as { _count?: { _all?: number } })._count?._all ?? 0;
    submissionsByStatus[(row as { status: string }).status] = count;
  }

  // Fill the 7-day skeleton with actual counts.
  const counts = new Map<string, number>();
  for (const row of submissionsLast7Rows) {
    const day = row.day.toISOString().slice(0, 10);
    counts.set(day, Number(row.count));
  }
  const submissionsLast7Days = dayBuckets.map((date) => ({
    date,
    count: counts.get(date) ?? 0,
  }));

  // "At quota cap" — mirrors canSubmit() semantics: a free user is
  // at cap when published-module-count + in-flight-submission-count
  // reaches the free-tier limit. Earlier versions of this query only
  // counted in-flight, which systematically under-counted (a user with
  // 3 published modules and 0 in-flight was invisible despite being
  // at cap). The rewrite below matches the real enforcement rule.
  //
  // The cap value comes from PLAN_LIMITS so it tracks the plan table.
  // The UNION ALL pattern treats a published Module and an in-flight
  // Submission identically for counting purposes. Users with neither
  // contribute zero rows and are excluded by the HAVING clause.
  //
  // Guard: if the free tier is ever set to "unlimited" (it isn't today,
  // but the type system allows it), the query becomes meaningless; we
  // short-circuit to 0 in that case.
  const freePlanLimit = PLAN_LIMITS.free.maxConcurrentPublicModules;
  let usersAtQuotaCap = 0;
  if (freePlanLimit !== "unlimited") {
    const freeUsersAtCap = (await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*)::bigint AS count FROM (
         SELECT u.id
         FROM "User" u
         WHERE u.plan = 'free'
           AND u."deletedAt" IS NULL
           AND (
             COALESCE((
               SELECT COUNT(*) FROM "Module" m
                WHERE m."publisherId" = u.id
                  AND m.visibility = 'public'
             ), 0)
             +
             COALESCE((
               SELECT COUNT(*) FROM "Submission" s
                WHERE s."submitterId" = u.id
                  AND s.status IN ('pending', 'approved', 'building')
             ), 0)
           ) >= $1
       ) capped`,
      freePlanLimit,
    )) as Array<{ count: bigint }>;
    usersAtQuotaCap = Number(freeUsersAtCap[0]?.count ?? 0);
  }

  return {
    totalUsers,
    freeUsers,
    paidUsers,
    publicModules,
    privateModules,
    submissionsByStatus,
    submissionsLast7Days,
    usersAtQuotaCap,
    deadLetterCount,
    lastBuiltAt: lastBuilt?.buildCompletedAt ?? null,
  };
}
