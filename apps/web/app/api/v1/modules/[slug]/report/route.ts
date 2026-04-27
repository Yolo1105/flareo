import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { apiError, slugSchema } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { getUserPlan } from "@/lib/billing/quota";
import { createReport, REPORT_CATEGORIES } from "@/lib/db/reports";

/**
 * POST /api/v1/modules/[slug]/report
 *   body: { category: ReportCategory, body: string (20-4000) }
 *
 * Authenticated users only. Server-side guards:
 *   - Module must exist.
 *   - No existing open/investigating report from this user on this
 *     module (prevents duplicate-submit race).
 *   - 7-day cooldown per (user, module) to limit weaponized reports.
 *   - Rate-limited on the tight auth-signin bucket on top of the
 *     7-day per-module rule.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ slug: string }>;
}

const BodySchema = z.object({
  category: z.enum(REPORT_CATEGORIES),
  body: z.string().trim().min(20).max(4000),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in to report a module"),
      { status: 401 },
    );
  }

  const key = keyForRequest(userId, req.headers);
  const plan = await getUserPlan(userId);
  const limit = await checkLimit("user-writes", key, plan);
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many reports; try again in a few minutes"),
      { status: 429, headers },
    );
  }

  const { slug: raw } = await ctx.params;
  const slugParsed = slugSchema.safeParse(raw);
  if (!slugParsed.success) {
    return NextResponse.json(apiError("bad_slug", "invalid slug"), {
      status: 400,
      headers,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        "bad_request",
        "report validation failed",
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      ),
      { status: 400, headers },
    );
  }

  const result = await createReport({
    moduleSlug: slugParsed.data,
    reporterId: userId,
    category: parsed.data.category,
    body: parsed.data.body,
  });

  if (!result.ok) {
    if (result.reason === "module_not_found") {
      return NextResponse.json(apiError("not_found", "module not found"), {
        status: 404,
        headers,
      });
    }
    if (result.reason === "duplicate_open") {
      return NextResponse.json(
        apiError(
          "duplicate_open",
          "you already have an open report on this module; an admin is reviewing it",
        ),
        { status: 409, headers },
      );
    }
    if (result.reason === "rate_limited") {
      return NextResponse.json(
        apiError(
          "rate_limited",
          `you recently reported this module; try again in ${result.retryAfterHours ?? 0} hour${result.retryAfterHours === 1 ? "" : "s"}`,
        ),
        { status: 429, headers },
      );
    }
  }

  return NextResponse.json(
    { ok: true, reportId: "report" in result ? result.report.id : null },
    { status: 201, headers },
  );
}
