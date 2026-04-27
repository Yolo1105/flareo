/**
 * Stripe client wrapper for the main app.
 *
 * Centralizes three things:
 *   1. Lazy client construction (so a dev .env without STRIPE_SECRET_KEY
 *      doesn't crash the app at boot — it only fails the routes that
 *      actually try to reach Stripe).
 *   2. A single place to pin the API version; bumping later is a
 *      one-line change.
 *   3. Typed accessor functions (createCheckoutSession,
 *      createPortalSession, constructWebhookEvent) so callers never
 *      touch the raw SDK directly. If we ever switch billing providers,
 *      we replace the bodies of these functions and the call sites
 *      stay as-is.
 *
 * Convention for env handling:
 *   - getStripeClient() throws with a clear message when env is missing.
 *     Callers (route handlers) catch and return 503 "misconfigured".
 *   - isStripeConfigured() lets UI code decide whether to render the
 *     Upgrade button as a real POST or as a "coming soon" disabled
 *     tooltip.
 */

import Stripe from "stripe";

// Pin a specific API version so future Stripe API changes don't
// silently alter response shapes. Bumping is a deliberate act.
const STRIPE_API_VERSION = "2024-12-18.acacia" as const;

let cachedClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return (
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_PRICE_ID_PRO &&
    !!process.env.STRIPE_WEBHOOK_SECRET
  );
}

export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (plus STRIPE_PRICE_ID_PRO and STRIPE_WEBHOOK_SECRET). See .env.example.",
    );
  }

  cachedClient = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    // Mark outbound requests with our app name so our Stripe support
    // tickets are easier to triage.
    appInfo: {
      name: "Flareo",
      url: "https://flareo.dev",
    },
    // Don't buffer telemetry; we call Stripe rarely enough that the
    // bundled-metrics overhead isn't worth it.
    telemetry: false,
  });
  return cachedClient;
}

// ─── checkout ──────────────────────────────────────────────────────

export interface CreateCheckoutInput {
  userId: string;
  userEmail: string;
  /**
   * If the user already has a Stripe customer record (from a previous
   * sub that was cancelled, or from a failed earlier checkout), pass
   * it here so Stripe doesn't create a duplicate customer. Otherwise
   * Stripe creates one automatically from the userEmail.
   */
  existingCustomerId: string | null;
  /**
   * Absolute URL the user is sent to on successful checkout. Stripe
   * appends `?session_id={CHECKOUT_SESSION_ID}` — the success handler
   * ignores that query param; the source of truth is the webhook.
   */
  successUrl: string;
  /**
   * Absolute URL the user is sent to on cancel (they click Back in
   * the hosted checkout).
   */
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout Session for the Pro subscription. Returns
 * the hosted checkout URL; the caller responds with a redirect.
 *
 * Idempotent only in the sense that Stripe won't reject duplicate
 * calls — each call creates a fresh session. Don't batch-call this.
 */
export async function createCheckoutSession(
  input: CreateCheckoutInput,
): Promise<{ url: string; sessionId: string }> {
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID_PRO is not set");
  }

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    // Attach the userId via client_reference_id + metadata. The
    // webhook uses this to know which Flareo user to upgrade —
    // Stripe's customer id is insufficient because a fresh customer
    // is created on first checkout, so at webhook receive time the
    // only reliable user link is this.
    client_reference_id: input.userId,
    metadata: {
      flareo_user_id: input.userId,
    },
    // If the user has an existing customer id, attach it. Otherwise
    // pass email so Stripe creates the customer on the fly.
    ...(input.existingCustomerId
      ? { customer: input.existingCustomerId }
      : { customer_email: input.userEmail }),
    // Keep the subscription metadata in sync with the customer — so
    // even if someone later queries just the subscription they can
    // trace it back to a Flareo user.
    subscription_data: {
      metadata: {
        flareo_user_id: input.userId,
      },
    },
    // Don't allow promo codes today — clean margins matter more than
    // acquisition tricks at this scale. Easy to flip on later.
    allow_promotion_codes: false,
  });

  if (!session.url) {
    throw new Error(
      "Stripe returned a checkout session with no url. Investigate.",
    );
  }

  return { url: session.url, sessionId: session.id };
}

// ─── customer portal ───────────────────────────────────────────────

/**
 * Create a Stripe Customer Portal session so Pro users can update
 * payment method, download invoices, or cancel their subscription
 * without a dedicated page on our side.
 *
 * Requires the user to have a Stripe customer id (set by the
 * checkout webhook). Callers should 404 if the user doesn't.
 */
export async function createPortalSession(args: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: args.customerId,
    return_url: args.returnUrl,
  });
  return { url: session.url };
}

// ─── webhook verification ──────────────────────────────────────────

export type StripeWebhookEvent = Stripe.Event;

/**
 * Cancel a Stripe subscription immediately. Used by the webhook
 * handler when a duplicate-checkout replacement is detected — the
 * stale subscription must be cancelled in Stripe or the customer
 * keeps getting charged for it.
 *
 * "Immediately" means `cancel_at_period_end: false` — we don't want
 * the stale subscription to keep billing for the remainder of its
 * period just because our records got overwritten.
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Verify and parse a Stripe webhook event. Returns the typed event on
 * success, throws on any mismatch — the caller converts that to a 400
 * response so Stripe retries.
 *
 * IMPORTANT: pass the raw request body (Buffer or exact string), not
 * the JSON-parsed object. Stripe signature verification is over the
 * byte-exact body; re-stringifying a parsed object will produce a
 * different byte sequence and the signature check will fail.
 */
export function constructWebhookEvent(
  rawBody: string,
  signatureHeader: string | null,
): StripeWebhookEvent {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  if (!signatureHeader) {
    throw new Error("missing stripe-signature header");
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
}
