import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { apiError } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import {
  createCheckoutSession,
  isStripeConfigured,
} from "@/lib/billing/stripe";
import { appBaseUrlOr } from "@/lib/config/env";

/**
 * POST /api/v1/billing/create-checkout-session
 *
 * Authenticated-user-only. Creates a Stripe Checkout Session for the
 * Pro subscription and returns the hosted checkout URL. The client
 * reads `url` from the response and does `window.location.href = url`.
 *
 * We deliberately return the URL rather than issuing a 303 redirect:
 * a fetch() from the client can't easily follow a cross-origin
 * redirect to checkout.stripe.com, and returning JSON keeps the
 * control flow in the client where error toasts already live.
 *
 * Idempotency: intentionally none. Each call creates a fresh session,
 * which is what we want — a user clicking "Upgrade" twice gets two
 * checkout URLs, but only one will ever be completed (Stripe locks
 * the subscription row once started). Guarding against double-clicks
 * is a UI concern, handled by the button's disabled state.
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in to upgrade"),
      { status: 401 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      apiError(
        "misconfigured",
        "Stripe isn't wired up yet. Try again once we've finished billing setup.",
      ),
      { status: 503 },
    );
  }

  // Fetch any existing Stripe customer id so we reuse it rather than
  // create a duplicate. A user who cancelled and comes back should
  // land on the same Stripe customer record.
  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, plan: true } as never,
  })) as { stripeCustomerId: string | null; plan: string | null } | null;

  if (user?.plan === "pro") {
    // Already paying. Bounce them to the portal instead so they don't
    // accidentally create a second subscription.
    return NextResponse.json(
      apiError(
        "already_subscribed",
        "You're already on Pro. Use the billing portal to manage your subscription.",
      ),
      { status: 409 },
    );
  }

  const baseUrl = appBaseUrlOr(new URL(req.url).origin);

  try {
    const { url } = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      existingCustomerId: user?.stripeCustomerId ?? null,
      successUrl: `${baseUrl}/app/settings/billing?upgraded=1`,
      cancelUrl: `${baseUrl}/app/settings/billing?cancelled=1`,
    });

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[billing/create-checkout-session]", message);
    return NextResponse.json(
      apiError(
        "upstream_error",
        "Couldn't start checkout. Please try again in a moment.",
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
