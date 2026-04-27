import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { listAccountSessions } from "@/lib/db/account";
import { apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";

/**
 * GET /api/v1/account/sessions
 *
 * Lists active (non-expired) NextAuth sessions for the signed-in user.
 * Each session exposes only its id, a short label, expiry, and whether
 * it's the current request's session.
 *
 * NextAuth does not persist user-agent or IP with sessions today, so
 * this list is less informative than GitHub's "active sessions" UI
 * would be. If we later want that, we extend the Session model with
 * ua/ip columns on first write, and surface them here.
 */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(apiError("unauthenticated", "sign in required"), {
      status: 401,
    });
  }

  const limit = await checkLimit(
    "modules-list",
    keyForRequest(userId, req.headers)
  );
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(apiError("rate_limited", "too many requests"), {
      status: 429,
      headers,
    });
  }

  // The session cookie is not directly available here (NextAuth doesn't
  // expose the session token on the returned session object). We pass
  // null, which causes listAccountSessions to mark *no* sessions as
  // "current". This is conservative; the UI can still show the list
  // and allow revoke on any row, accepting that revoking the current
  // session will log the user out (handled gracefully).
  const sessions = await listAccountSessions(userId, null);
  return NextResponse.json({ sessions }, { headers });
}
