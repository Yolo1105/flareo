import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health endpoint for the build worker. Instatus polls this every
 * minute; three consecutive failures raise an incident.
 *
 * We don't actually read the worker's heartbeat file from here —
 * the worker writes it to a local path on its own host, which this
 * Next.js app on Vercel can't see. Instead we check "is the DB
 * making progress" as a proxy:
 *
 *   ok   = a submission was built within the last 6 hours, OR
 *          there are no submissions waiting (empty queue)
 *   warn = queue has items but none built in 6 hours
 *   fail = queue has items older than 24 hours
 *
 * For a richer signal, have the worker write its heartbeat to a
 * special row in Postgres (e.g. a `WorkerHeartbeat` table) and read
 * that here instead.
 */
export async function GET() {
  const now = Date.now();
  const sixHoursAgo = new Date(now - 6 * 3600 * 1000);
  const oneDayAgo = new Date(now - 24 * 3600 * 1000);

  const [recentBuilt, oldestPending, pendingCount] = await Promise.all([
    prisma.submission.count({
      where: {
        status: "built",
        buildCompletedAt: { gte: sixHoursAgo },
      },
    }),
    prisma.submission.findFirst({
      where: { status: "approved" },
      orderBy: { submittedAt: "asc" },
      select: { submittedAt: true },
    }) as Promise<{ submittedAt: Date } | null>,
    prisma.submission.count({
      where: { status: { in: ["approved", "building"] } },
    }),
  ]);

  let state: "ok" | "warn" | "fail" = "ok";
  let reason = "";

  if (oldestPending && oldestPending.submittedAt < oneDayAgo) {
    state = "fail";
    reason = `oldest approved submission is older than 24h and nothing has built`;
  } else if (pendingCount > 0 && recentBuilt === 0) {
    state = "warn";
    reason = `${pendingCount} in queue, no builds in the last 6h`;
  }

  const body = {
    state,
    reason,
    queueDepth: pendingCount,
    recentBuilt6h: recentBuilt,
    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: state === "fail" ? 503 : 200,
    headers: {
      "cache-control": "no-store",
    },
  });
}
