import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { apiError } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import {
  createPortalSession,
  isStripeConfigured,
} from "@/lib/billing/stripe";
import { appBaseUrlOr } from "@/lib/config/env";

/**
 * POST /api/v1/billing/portal
 *
 * Pro-user-only. Creates a Stripe Customer Portal session and returns
 * the hosted portal URL. Client redirects to it.
 *
 * Why this exists separately from checkout: Stripe's portal lets the
 * user update payment method, download invoices, and cancel — all
 * without UI we'd have to build. The only code we own is this tiny
 * endpoint that mints a short-lived portal URL for an authenticated
 * pro user.
 *
 * Idempotency: Stripe portal sessions are short-lived (~3 minutes)
 * but multiple concurrent sessions are fine.
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in first"),
      { status: 401 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      apiError("misconfigured", "Billing portal isn't configured."),
      { status: 503 },
    );
  }

  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true } as never,
  })) as { stripeCustomerId: string | null } | null;

  if (!user?.stripeCustomerId) {
    // User never subscribed, or the webhook hasn't landed yet.
    // Sending them to the portal would fail; bounce them back with
    // a reason so the UI can decide what to show.
    return NextResponse.json(
      apiError(
        "no_customer",
        "No billing record found. Subscribe to Pro first.",
      ),
      { status: 404 },
    );
  }

  const baseUrl = appBaseUrlOr(new URL(req.url).origin);

  try {
    const { url } = await createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${baseUrl}/app/settings/billing`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[billing/portal]", message);
    return NextResponse.json(
      apiError(
        "upstream_error",
        "Couldn't open the billing portal. Please try again.",
      ),
      { status: 502 },
    );
  }
}

export async function GET() {
  return NextResponse.json(apiError("method_not_allowed", "POST only"), {
    status: 405,
    headers: { Allow: "POST" },
  });
}
