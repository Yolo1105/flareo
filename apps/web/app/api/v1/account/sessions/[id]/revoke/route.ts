import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { revokeAccountSession } from "@/lib/db/account";
import { apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(apiError("unauthenticated", "sign in required"), {
      status: 401,
    });
  }

  const limit = await checkLimit(
    "auth-signin",
    keyForRequest(userId, req.headers)
  );
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(apiError("rate_limited", "try again later"), {
      status: 429,
      headers,
    });
  }

  const { id } = await ctx.params;
  if (!id || id.length < 5) {
    return NextResponse.json(apiError("bad_request", "session id required"), {
      status: 400,
      headers,
    });
  }

  const ok = await revokeAccountSession(userId, id);
  if (!ok) {
    return NextResponse.json(
      apiError("not_found", "session not found or already revoked"),
      { status: 404, headers }
    );
  }

  return NextResponse.json({ status: "revoked" }, { headers });
}
