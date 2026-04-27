import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { authenticateApiKey } from "@/lib/auth/apikey";
import { prisma } from "@/lib/db/prisma";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { apiError } from "@/lib/validation/schemas";

/**
 * GET /api/v1/whoami
 *
 * Returns the authenticated caller's identity. Accepts two auth modes:
 *   (a) NextAuth session cookie (web UI)
 *   (b) Authorization: Bearer fla_<token> (CLI, scripts)
 *
 * Returns 200 with the user info or 401 if unauthenticated.
 */
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Anon rate limiting so unauth requests don't drain resources.
  const anonLimit = await checkLimit("whoami", keyForRequest(null, req.headers));
  const headers = rateLimitHeaders(anonLimit);
  if (!anonLimit.success) {
    return NextResponse.json(apiError("rate_limited", "too many requests"), {
      status: 429,
      headers,
    });
  }

  // Try session first.
  const session = await auth();
  if (session?.user?.id) {
    const userId = session.user.id;
    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: string;
    } | null;
    if (!user) {
      return NextResponse.json(apiError("unauthenticated", "session user not found"), {
        status: 401,
        headers,
      });
    }
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        authSource: "session",
      },
      { status: 200, headers }
    );
  }

  // Fall back to API key.
  const keyAuth = await authenticateApiKey(req.headers.get("authorization"));
  if (keyAuth) {
    const user = (await prisma.user.findUnique({
      where: { id: keyAuth.userId },
    })) as {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: string;
    } | null;
    if (!user) {
      return NextResponse.json(apiError("unauthenticated", "key user not found"), {
        status: 401,
        headers,
      });
    }
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        authSource: "apikey",
        apiKeyLabel: keyAuth.label,
      },
      { status: 200, headers }
    );
  }

  return NextResponse.json(apiError("unauthenticated", "no valid credentials"), {
    status: 401,
    headers,
  });
}
