import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { revokeOtherSessions } from "@/lib/db/account";
import { apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";

/**
 * POST /api/v1/account/sessions/revoke-others
 *
 * "Sign out of every session except this one." Useful as a big red
 * button on the sessions page.
 *
 * Without access to the current session's raw token (NextAuth hides it)
 * this revokes ALL sessions, including the current one, which will log
 * the user out on their next request. The UI should show the button
 * with copy like "Sign out everywhere" rather than "Sign out
 * everywhere else" to match.
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  const count = await revokeOtherSessions(userId, null);
  return NextResponse.json({ status: "ok", revoked: count }, { headers });
}
