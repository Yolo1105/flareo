import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { z } from "zod";

/**
 * POST /api/v1/waitlist
 *
 * Accepts an email address for the Flareo closed-beta waitlist. Stores
 * it in the WaitlistEntry table. Idempotent: resubmitting the same
 * email returns the same success response without duplicating rows.
 *
 * No email verification step. This is deliberate for Horizon 1:
 *   - every real closed-beta invite flow sends an invite email that
 *     acts as the verification
 *   - requiring double opt-in at signup time doubles drop-off without
 *     measurably improving list quality at this scale
 *   - GDPR lawful basis is "legitimate interest" for processing a
 *     self-submitted email for invitation purposes
 *
 * Rate-limited to keep signup-spam down: 10 submissions per hour per
 * IP. Bots will quickly hit the wall; humans never will.
 */

export const runtime = "nodejs";

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  source: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-zA-Z0-9_-]*$/, "source must be alphanumeric / dashes / underscores")
    .optional(),
  referrer: z.string().trim().max(280).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP. Unauthenticated endpoint; no user key.
  const key = keyForRequest(null, req.headers);
  // Reuse the auth-signin bucket (10 / 10 min) — waitlist spam patterns
  // look similar enough to signin abuse that the same bucket works.
  const limit = await checkLimit("auth-signin", key);
  const headers = rateLimitHeaders(limit);

  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many signup attempts, try again later"),
      { status: 429, headers }
    );
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

  const parsed = WaitlistSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        "bad_request",
        "please enter a valid email address",
        parsed.error.issues.map((i) => ({ path: i.path, message: i.message }))
      ),
      { status: 400, headers }
    );
  }

  const { email, source, referrer } = parsed.data;

  // Truncate IP + UA aggressively for storage.
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim().slice(0, 64) ?? null;
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);

  // Upsert: resubmitting the same email is a no-op from the user's
  // perspective but updates the source/referrer if they were missing
  // the first time.
  try {
    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {
        source: source ?? undefined,
        referrer: referrer ?? undefined,
      },
      create: {
        email,
        source: source ?? null,
        referrer: referrer ?? null,
        ipSnapshot: ip,
        userAgent: ua || null,
      },
    });
  } catch (err) {
    // Non-fatal from the user's perspective; log and return a generic
    // message so we don't leak internal state.
    console.error("waitlist upsert failed", err);
    return NextResponse.json(
      apiError("internal", "could not save your signup; please try again"),
      { status: 500, headers }
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      message:
        "Thanks — you're on the list. We'll email when a slot opens up.",
    },
    { status: 200, headers }
  );
}

export async function GET() {
  return NextResponse.json(apiError("method_not_allowed", "POST only"), {
    status: 405,
    headers: { Allow: "POST" },
  });
}
