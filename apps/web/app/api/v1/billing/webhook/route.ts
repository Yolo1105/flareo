import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent, cancelSubscription } from "@/lib/billing/stripe";
import { upgradeUserPlan, downgradeUserPlan } from "@/lib/billing/quota";
import { prisma } from "@/lib/db/prisma";
import { sendPaymentFailedEmail } from "@/lib/email/billing-emails";
import { appBaseUrl } from "@/lib/config/env";

/**
 * POST /api/v1/billing/webhook
 *
 * Stripe signs every webhook delivery with an HMAC over the raw body
 * using STRIPE_WEBHOOK_SECRET. We verify the signature before doing
 * anything else — an unsigned request is rejected with 400, which
 * causes Stripe to retry (good: legitimate events aren't lost to a
 * transient bug in our verification code).
 *
 * Events we care about:
 *
 *   - checkout.session.completed — user finished paying for the first
 *     time. Extract flareo_user_id from client_reference_id +
 *     metadata, write plan="pro", stripeCustomerId, stripeSubscriptionId.
 *     This is the happy path.
 *
 *   - customer.subscription.deleted — subscription ended (user cancelled,
 *     or Stripe terminated after dunning exhausted). Flip plan back to
 *     "free". User keeps their modules; only gating changes.
 *
 *   - invoice.payment_failed — payment method declined. Send a dunning
 *     email and keep the user on Pro (Stripe handles retry internally
 *     and will eventually fire subscription.deleted if all retries fail).
 *     Log to Sentry so we see payment-failure trends.
 *
 * Events we ignore (but 200 OK so Stripe stops retrying):
 *
 *   - everything else. The common-case webhook payload Stripe sends
 *     for a subscription signup includes several side events
 *     (customer.created, customer.subscription.created,
 *     invoice.created, invoice.paid). Each is noise for us —
 *     checkout.session.completed is the event that means "the user is
 *     now subscribed" and it's the only one we act on.
 *
 * Idempotency: Stripe can deliver the same event multiple times, and
 * will retry a 5xx. Our writes are idempotent on the relevant fields:
 *   - upgradeUserPlan sets plan='pro' + Stripe IDs. Re-running with
 *     the same user+customer+sub is a no-op in practice.
 *   - downgradeUserPlan sets plan='free' and updates planUpdatedAt.
 *     Re-running is cheap.
 * So duplicate deliveries are benign.
 */

export const runtime = "nodejs";

// Tell Next.js to hand us the raw body. If we parse JSON here the
// signature check fails because Stripe signs the byte-exact payload.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(rawBody, signatureHeader);
  } catch (err) {
    // Never echo the error message — signature-verification errors
    // from the Stripe SDK vary by failure mode ("No signatures
    // matching the expected signature", "Timestamp outside tolerance",
    // etc.), and each variant reveals something about our
    // configuration to a probing attacker. Log server-side only.
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[billing/webhook] signature verification failed", message);
    // 400 so Stripe doesn't retry — the request is malformed, not a
    // transient failure. A real bad actor trying to forge events
    // always lands here. Body is intentionally contentless; every
    // unsigned request gets the same response.
    return NextResponse.json(
      { error: { code: "bad_signature" } },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      // Any other event type: accept but do nothing. Returning 200
      // tells Stripe the event was delivered successfully so it
      // doesn't retry.
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // Handler threw. Respond 500 so Stripe retries; the exception
    // goes to Sentry automatically via the instrumentation config.
    // Body is intentionally contentless — the full error (including
    // stack and event.type) lands in console.error for the operator,
    // but we don't echo it to Stripe's delivery log. Stripe only
    // needs to know "this wasn't 2xx, retry later".
    const message = err instanceof Error ? err.message : String(err);
    console.error("[billing/webhook] handler error", {
      type: event.type,
      message,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      { error: { code: "handler_error" } },
      { status: 500 },
    );
  }
}

// ─── event handlers ────────────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  // Pull flareo_user_id from either source; client_reference_id is
  // preferred (we set it deliberately) but metadata is the belt-and-
  // suspenders fallback.
  const userId =
    session.client_reference_id ??
    (session.metadata as Record<string, string> | null)?.flareo_user_id;

  if (!userId) {
    console.error(
      "[billing/webhook] checkout.session.completed had no flareo_user_id",
      { sessionId: session.id },
    );
    // Throw so Stripe retries. Our createCheckoutSession always sets
    // this; missing it means a bug we need to fix fast.
    throw new Error("checkout.session.completed missing flareo_user_id");
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!customerId || !subscriptionId) {
    console.error(
      "[billing/webhook] checkout.session.completed missing customer or subscription",
      { sessionId: session.id, customerId, subscriptionId },
    );
    throw new Error("session missing customer or subscription");
  }

  const result = await upgradeUserPlan({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });

  if (result.status === "already_current") {
    // Duplicate webhook delivery (Stripe retried). Benign.
    console.info("[billing/webhook] duplicate checkout; no-op", {
      userId,
      subscriptionId,
    });
    return;
  }

  if (result.status === "replaced") {
    // User had a different subscription on file — most likely started
    // a second checkout before the first webhook landed, or completed
    // two checkouts in the wrong order. Cancel the stale sub so Stripe
    // stops billing it. If the cancel call fails we still return 200
    // (the upgrade itself succeeded) but log loud enough for an
    // operator to notice; leaving an uncanceled subscription is a
    // real-money bug.
    console.error(
      "[billing/webhook] DUPLICATE SUBSCRIPTION — cancelling stale sub",
      {
        userId,
        keptSubscriptionId: subscriptionId,
        staleSubscriptionId: result.previousStripeSubscriptionId,
        staleCustomerId: result.previousStripeCustomerId,
      },
    );
    if (result.previousStripeSubscriptionId) {
      try {
        await cancelSubscription(result.previousStripeSubscriptionId);
        console.info("[billing/webhook] stale sub cancelled in Stripe", {
          staleSubscriptionId: result.previousStripeSubscriptionId,
        });
      } catch (err) {
        console.error(
          "[billing/webhook] FAILED to cancel stale sub — manual cleanup needed in Stripe dashboard",
          {
            staleSubscriptionId: result.previousStripeSubscriptionId,
            error: err instanceof Error ? err.message : String(err),
          },
        );
        // Don't re-throw: the upgrade itself landed, which is the
        // primary job. A stuck-cancel is worth a Sentry event
        // (fires automatically via Next's instrumentation) but
        // shouldn't cause Stripe to retry the whole event.
      }
    }
    return;
  }

  // status === "upgraded"
  console.info("[billing/webhook] upgraded user to pro", { userId });
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  // Find the user by subscription id; this is why we have a unique
  // index on User.stripeSubscriptionId.
  const user = (await prisma.user.findUnique({
    where: { stripeSubscriptionId: sub.id } as never,
    select: { id: true } as never,
  })) as { id: string } | null;

  if (!user) {
    // Stripe event for a subscription we never tracked. Log and move on.
    console.warn(
      "[billing/webhook] subscription.deleted for unknown subscription",
      { subscriptionId: sub.id },
    );
    return;
  }

  await downgradeUserPlan(user.id);
  console.info("[billing/webhook] downgraded user to free", {
    userId: user.id,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Find the user by customer id — invoices don't carry our metadata.
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;

  const user = (await prisma.user.findUnique({
    where: { stripeCustomerId: customerId } as never,
    select: { id: true, email: true, name: true } as never,
  })) as { id: string; email: string | null; name: string | null } | null;

  if (!user?.email) {
    console.warn(
      "[billing/webhook] payment_failed for user without email",
      { customerId },
    );
    return;
  }

  // Stripe retries payment internally according to the account's
  // retry rules; if all retries fail, subscription.deleted fires
  // and we downgrade. For now, email the user so they can update
  // their payment method proactively.
  //
  // Attempt count comes from the invoice. It's useful in the email
  // so the user knows whether to act immediately or just update on
  // their next convenient day.
  const attempt = (invoice as Stripe.Invoice & { attempt_count?: number })
    .attempt_count ?? 1;

  await sendPaymentFailedEmail({
    to: user.email,
    submitterName: user.name ?? "",
    attemptNumber: attempt,
    portalUrl: `${appBaseUrl()}/app/settings/billing`,
  });
  console.info("[billing/webhook] sent payment-failed email", {
    userId: user.id,
    attempt,
  });
}

export async function GET() {
  return NextResponse.json(
    { error: { code: "method_not_allowed", message: "POST only" } },
    { status: 405, headers: { Allow: "POST" } },
  );
}
