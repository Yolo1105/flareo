import { NextRequest, NextResponse } from "next/server";
import { verifyImage } from "@/lib/sigstore/verify";
import { verifyRequestSchema, apiError } from "@/lib/validation/schemas";
import { auth } from "@/lib/auth/config";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { getUserPlan } from "@/lib/billing/quota";

/**
 * POST /api/v1/verify
 *
 * Body: { "imageRef": string }
 *
 * Returns a VerifyResult with signature status, signer identity if
 * available, Rekor URL, and Flareo catalog metadata if the digest is
 * known to us.
 *
 * Rate limits:
 *   - 60 requests/hour/IP for unauthenticated
 *   - 600 requests/hour/user for authenticated
 *
 * This endpoint is the heart of the "don't trust us, verify yourself"
 * pitch. It does not require auth, does not cache results server-side,
 * and does not log inputs beyond standard access logging. Every call
 * hits Sigstore and/or the upstream registry directly.
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Rate limit first, before parsing body, so abusive clients don't
  // consume parsing cycles.
  const session = await auth();
  const userId = session?.user?.id;
  const bucket = userId ? "verify-auth" : "verify-anon";
  const key = keyForRequest(userId, req.headers);
  // Authenticated callers get their plan's rateLimitMultiplier applied
  // to the verify-auth bucket. Anonymous callers are always "free".
  // The getUserPlan lookup is cheap (single row by PK) and matters
  // only for logged-in users on the hottest API path.
  const plan = userId ? await getUserPlan(userId) : "free";
  const limit = await checkLimit(bucket, key, plan);

  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many verify requests, try again shortly"),
      { status: 429, headers }
    );
  }

  // Parse and validate body.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError("bad_json", "request body must be valid JSON"),
      { status: 400, headers }
    );
  }

  const parsed = verifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("bad_request", "request body failed validation", parsed.error.issues),
      { status: 400, headers }
    );
  }

  // Run the verification.
  const result = await verifyImage(parsed.data.imageRef);

  // Map internal error statuses to appropriate HTTP codes so clients
  // can branch without parsing the body. 200 for anything that
  // represents a successful "we checked and here's what we found."
  const httpStatus = result.status === "error" ? 502 : 200;

  return NextResponse.json(result, { status: httpStatus, headers });
}

export async function GET() {
  return NextResponse.json(
    apiError("method_not_allowed", "POST only"),
    { status: 405, headers: { Allow: "POST" } }
  );
}
