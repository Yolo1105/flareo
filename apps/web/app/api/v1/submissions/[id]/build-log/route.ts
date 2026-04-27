import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { getUserPlan } from "@/lib/billing/quota";
import { apiError } from "@/lib/validation/schemas";

/**
 * GET /api/v1/submissions/[id]/build-log?after=<lastSeq>
 *
 * Returns BuildLogLine rows for this submission with seq > after,
 * ordered by seq ascending. Polled by the submission detail page
 * every ~1s while status === "building". Returns up to 500 lines
 * per call; clients should follow the cursor (lastSeq in the
 * response) for subsequent polls.
 *
 * Access control:
 *   - submitter can read their own logs
 *   - admin can read any
 *   - everyone else gets 404 (not 403, for the same leak-avoidance
 *     reason as the private-module detail endpoint)
 *
 * Response shape:
 *   {
 *     lines: [{ seq, text, stream, emittedAt }],
 *     lastSeq: number,
 *     complete: boolean,     // true when status is terminal
 *     status: string
 *   }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const QuerySchema = z.object({
  after: z.coerce.number().int().nonnegative().default(-1),
  limit: z.coerce.number().int().min(1).max(500).default(500),
});

const TERMINAL_STATES = new Set([
  "built",
  "failed",
  "scan_rejected",
  "rejected",
  "worker_failures",
]);

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  // Auth-required endpoint — anonymous callers get 401 immediately
  // (not 404) because the /build-log path implies a known submission
  // context already, and a 401 is the correct signal for "log in."
  if (!userId) {
    return NextResponse.json(apiError("unauthorized", "sign in to view build logs"), {
      status: 401,
    });
  }

  const key = keyForRequest(userId, req.headers);
  const plan = await getUserPlan(userId);
  // Polling cadence is ~1s so a generous per-hour limit is necessary;
  // modules-list's 300/hr (free) / 1500/hr (pro) is within reason for
  // a single tab polling throughout a 5-10 minute build.
  const limit = await checkLimit("modules-list", key, plan);
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many log-poll requests"),
      { status: 429, headers },
    );
  }

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const query = QuerySchema.safeParse({
    after: searchParams.get("after") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  if (!query.success) {
    return NextResponse.json(
      apiError("bad_query", "invalid after/limit"),
      { status: 400, headers },
    );
  }

  const submission = (await prisma.submission.findUnique({
    where: { id },
    select: { submitterId: true, status: true } as never,
  })) as { submitterId: string | null; status: string } | null;

  if (!submission) {
    return NextResponse.json(apiError("not_found", "submission not found"), {
      status: 404,
      headers,
    });
  }

  const isOwner = submission.submitterId === userId;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    // 404 rather than 403 so the endpoint doesn't confirm existence
    // to non-owners.
    return NextResponse.json(apiError("not_found", "submission not found"), {
      status: 404,
      headers,
    });
  }

  const rows = (await prisma.buildLogLine.findMany({
    where: {
      submissionId: id,
      seq: { gt: query.data.after },
    } as never,
    orderBy: { seq: "asc" } as never,
    take: query.data.limit,
  })) as Array<{
    seq: number;
    text: string;
    stream: string;
    emittedAt: Date;
  }>;

  const lastSeq =
    rows.length > 0 ? rows[rows.length - 1].seq : query.data.after;

  return NextResponse.json(
    {
      lines: rows.map((r) => ({
        seq: r.seq,
        text: r.text,
        stream: r.stream,
        emittedAt: r.emittedAt.toISOString(),
      })),
      lastSeq,
      complete: TERMINAL_STATES.has(submission.status),
      status: submission.status,
    },
    { status: 200, headers },
  );
}
