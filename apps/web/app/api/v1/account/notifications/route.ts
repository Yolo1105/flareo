import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/db/account";
import { apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { z } from "zod";

/**
 * /api/v1/account/notifications
 *
 *   GET   → current preferences
 *   PATCH → update any subset. Body fields are optional; only present
 *           fields are written, so the client can send {security: false}
 *           without also sending the other three flags.
 */

export const runtime = "nodejs";

const PatchSchema = z
  .object({
    security: z.boolean().optional(),
    submission: z.boolean().optional(),
    product: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .strict(); // reject unknown fields — small attack surface but cheap

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

  const prefs = await getNotificationPreferences(userId);
  if (!prefs) {
    return NextResponse.json(apiError("not_found", "account not found"), {
      status: 404,
      headers,
    });
  }
  return NextResponse.json(prefs, { headers });
}

export async function PATCH(req: NextRequest) {
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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("bad_request", "unexpected fields or wrong types"),
      { status: 400, headers }
    );
  }

  const updated = await updateNotificationPreferences(userId, parsed.data);
  if (!updated) {
    return NextResponse.json(apiError("not_found", "account not found"), {
      status: 404,
      headers,
    });
  }
  return NextResponse.json(updated, { headers });
}
