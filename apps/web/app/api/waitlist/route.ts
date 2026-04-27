import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { z } from "zod";

/**
 * POST /api/waitlist
 *
 * Collects email addresses for the closed-beta waitlist. Deliberately
 * minimal: no email-verification round-trip (we just take the address
 * and trust it), no double opt-in, no account creation.
 *
 * Behavior on duplicate: returns 200 with a message indicating the
 * email was already on the list. We don't surface a distinct status
 * because that would let attackers probe who's on the list.
 *
 * Rate limited at 10 requests per 10 minutes per IP to deter mass
 * signup abuse.
 *
 * Stored fields:
 *   email        (unique)
 *   referrer     free text "how did you hear about us", ≤ 280 chars
 *   source       UTM-style source tag from the query string
 *   ipSnapshot   first IP from X-Forwarded-For, for abuse triage
 *   userAgent    User-Agent string, truncated to 200 chars
 */

export const runtime = "nodejs";

const WaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email("that doesn't look like an email"),
  referrer: z.string().max(280).optional(),
  source: z.string().max(64).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP. Use the existing auth-signin bucket — same
  // "shouldn't be hit often per IP" profile.
  const key = keyForRequest(null, req.headers);
  const limit = await checkLimit("auth-signin", key);
  const headers = rateLimitHeaders(limit);

  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many signup requests, try again shortly"),
      { status: 429, headers }
    );
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

  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("bad_request", "invalid signup data", parsed.error.issues),
      { status: 400, headers }
    );
  }

  // Build the row with normalized fields.
  const ipHeader = req.headers.get("x-forwarded-for") ?? "";
  const ip = ipHeader.split(",")[0]?.trim().slice(0, 64) ?? null;
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200) || null;

  // Upsert-ish: we want to treat a repeat signup as a no-op success.
  // Prisma's `create` throws P2002 on unique collision; catch and
  // return the idempotent 200.
  try {
    await prisma.waitlistEntry.create({
      data: {
        email: parsed.data.email,
        referrer: parsed.data.referrer ?? null,
        source: parsed.data.source ?? null,
        ipSnapshot: ip,
        userAgent: ua,
      },
    });
  } catch (err: unknown) {
    // Prisma's P2002 is the unique-constraint violation. Any other
    // error we surface as a 500.
    const code = (err as { code?: string } | null)?.code;
    if (code !== "P2002") {
      return NextResponse.json(
        apiError("internal_error", "could not save signup"),
        { status: 500, headers }
      );
    }
    // Already on the list — return success silently.
  }

  return NextResponse.json(
    {
      ok: true,
      message:
        "You're on the list. We'll email you when it's your turn. No spam.",
    },
    { status: 200, headers }
  );
}
