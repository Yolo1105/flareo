# Weeks 15-16 — Paid tier (complete)

This zip completes Q1 weeks-15-16 paid-tier work from `q1-plan.md`. Over two sessions:

**Session 1 — foundations:** plan column, quota library, enforcement in `/api/v1/submissions`, `/app/settings/billing` page.

**Session 2 (this session) — Stripe:** checkout session + customer portal + webhook handler + dunning email + pricing page rewrite (cut the fake Enterprise tier).

At the end of this build, every code path the plan called for is shipped. What's left is external: create the Stripe products in the dashboard, provision the webhook endpoint, and find a first paying customer.

## What this session added

### Stripe client wrapper

- `lib/billing/stripe.ts` (new) — Central Stripe client with lazy init. Exports:
  - `isStripeConfigured()` — returns true iff `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, and `STRIPE_WEBHOOK_SECRET` are all set. Used by the billing page to decide whether to render the real CTA or the "coming soon" disabled one.
  - `getStripeClient()` — lazy cached Stripe SDK instance. Throws with a clear message when env is missing; route handlers catch and return 503.
  - `createCheckoutSession({ userId, userEmail, existingCustomerId, successUrl, cancelUrl })` — creates a subscription-mode Checkout Session. Carries `flareo_user_id` in both `client_reference_id` and `subscription_data.metadata` so the webhook can find the user.
  - `createPortalSession({ customerId, returnUrl })` — creates a Stripe Customer Portal session for managing payment methods, downloading invoices, and cancelling.
  - `constructWebhookEvent(rawBody, signatureHeader)` — verifies HMAC signature and returns the typed Stripe event. Throws on mismatch.
- `stripe@^17.3.0` added to `package.json`. API version pinned to `2024-12-18.acacia`.

### API endpoints

All three live under `/api/v1/billing/` and all three are Node runtime (not Edge).

- `POST /api/v1/billing/create-checkout-session` — authenticated users only. Creates a checkout session and returns `{ url }`. Client does `window.location.href = url`. Returns 409 if the user is already on Pro (directs them to the portal instead). Returns 503 when Stripe isn't configured.
- `POST /api/v1/billing/portal` — Pro users only. Creates a customer portal session and returns `{ url }`. Returns 404 if the user has no `stripeCustomerId` (never subscribed).
- `POST /api/v1/billing/webhook` — unauthenticated but signed. Three event types handled:
  - `checkout.session.completed` → `upgradeUserPlan(userId, customerId, subscriptionId)`. Pulls the user id from `client_reference_id` or metadata (belt-and-suspenders). Throws if either is missing so Stripe retries — that's always a bug on our side.
  - `customer.subscription.deleted` → `downgradeUserPlan(userId)`. Looks up the user by the unique `stripeSubscriptionId` column.
  - `invoice.payment_failed` → `sendPaymentFailedEmail(...)`. Does NOT downgrade the user — Stripe retries internally and the eventual `subscription.deleted` event is the downgrade trigger. Attempt number comes from the invoice and shapes the email tone.
  - Any other event: 200 OK so Stripe stops retrying; no-op.
- Webhook idempotency: Stripe may deliver the same event twice; both `upgradeUserPlan` and `downgradeUserPlan` are idempotent on re-run with identical arguments, so duplicate deliveries are benign.
- Webhook security: signature verification runs before any DB write. An unsigned or malformed request gets 400 immediately. A handler error gets 500 so Stripe retries.

### Dunning email

- `emails/PaymentFailedEmail.tsx` (new) — React Email template. Tone calibrated for attempt 1 ("your bank declined the last charge, this is usually simple") vs. later attempts ("this is attempt N, if all retries fail your subscription will be cancelled"). CTA: "Open billing portal →".
- `lib/email/billing-emails.ts` (new) — `sendPaymentFailedEmail({ to, submitterName, attemptNumber, portalUrl })`. Same Resend-backed pattern as `lib/email/submission-emails.ts`: reads env at call time, silently no-ops without `RESEND_API_KEY`, never fails the enclosing request on email error.

### Billing page — real CTA

- `components/sections/app-settings/BillingCta.tsx` (new) — client component. Two modes (`kind="upgrade"` and `kind="portal"`). POSTs to the matching API endpoint, reads `url` from the response, redirects. Surfaces server-side errors inline. When `stripeConfigured={false}` falls back to the pre-Stripe disabled button.
- `app/app/settings/billing/page.tsx` — now:
  - Accepts `?upgraded=1` and `?cancelled=1` query params from the checkout redirect; renders a green "Welcome to Pro" banner or a grey "No charges were made" banner at the top
  - Imports `isStripeConfigured()` server-side to decide `stripeConfigured` prop for the CTA component
  - Swaps the disabled button for the `<BillingCta>` component

### Pricing page

- `app/(marketing)/pricing/page.tsx` — surgical rewrite:
  - Cut the Enterprise tier panel entirely (lines 229-281 of the old file)
  - Changed tier grid from 3 columns to 2
  - Updated Pro price from `$19 / month` to `€12 / month` to match `PLAN_LIMITS[pro].priceLabel`
  - Simplified the MatrixRow interface (removed `ent` field) and stripped `, ent: "..."` fragments from all 19 matrix rows
  - Removed rows where both Free and Pro showed `—` (custom subdomain, uptime SLA) — irrelevant noise
  - Kept SSO row and reclassified it as `roadmap` for both tiers
  - Matrix header went from 4-column grid to 3-column
  - Hero promptComment "three plans" → "two plans", metadata description "Three tiers" → "Two tiers"
  - FAQ Q4 (team seats) and Q6 (discount) copy updated
  - Escape-hatch section heading "Three pricing tiers" → "Two pricing tiers"

### `.env.example`

Three new variables, all optional (empty defaults):

```
STRIPE_SECRET_KEY=""
STRIPE_PRICE_ID_PRO=""
STRIPE_WEBHOOK_SECRET=""
```

When all three are empty, the billing page renders "coming soon" and the three API endpoints return 503. Quota enforcement still works.

## Deliberately NOT touched

- `prisma/schema.prisma` — unchanged this session. The billing columns (plan, stripeCustomerId, stripeSubscriptionId, planUpdatedAt) landed in the previous session's migration.
- `lib/billing/quota.ts` — unchanged. `upgradeUserPlan` and `downgradeUserPlan` are the seams the webhook uses; they didn't need modification.
- The landing page, `/docs/*`, `/catalog`, `/app/publish`, admin queue — none of the non-billing surfaces touched.
- No schema migration needed this session.

## How to verify locally (no Stripe account needed)

```sh
cd apps/web
npm install       # picks up stripe@17.3.0
npx prisma generate
npm run dev
```

**Walk the UI without Stripe env set:**

1. Open `/pricing` — should render 2 tiers (Free, Pro), price €12, matrix 3 columns, no Enterprise copy anywhere
2. Sign in, open `/app/settings/billing` — should show "Free" plan, usage meter, "Upgrade to Pro · coming soon" disabled button (because `isStripeConfigured()` returns false)
3. Hit `curl -X POST http://localhost:3000/api/v1/billing/create-checkout-session` with a valid session cookie — returns 503 `misconfigured`

All three confirm the "graceful no-Stripe" path works.

## How to verify with Stripe test-mode (full flow)

Prereqs:

1. Create a Stripe account (test mode is free). https://dashboard.stripe.com
2. In the dashboard: Products → Create product → "Flareo Pro", recurring €12/month. Copy the price id (`price_...`) into `.env` as `STRIPE_PRICE_ID_PRO`.
3. Get your test secret key (`sk_test_...`) and paste into `.env` as `STRIPE_SECRET_KEY`.
4. For webhook secret, run `stripe listen --forward-to localhost:3000/api/v1/billing/webhook` from the Stripe CLI. It prints a `whsec_...` — paste into `.env` as `STRIPE_WEBHOOK_SECRET`.

**Happy path:**

1. Open `/app/settings/billing` — button now reads "Upgrade to Pro →" and is clickable.
2. Click it. Browser jumps to the Stripe hosted checkout page.
3. Use test card `4242 4242 4242 4242`, any future expiry, any CVC.
4. Complete payment. Browser redirects back to `/app/settings/billing?upgraded=1`.
5. Green "Welcome to Pro" banner appears. Terminal running `stripe listen` shows `checkout.session.completed` delivered. The webhook handler runs `upgradeUserPlan`, and within seconds the page (on reload) shows plan: Pro, unlimited modules.
6. Click "Manage billing →" — jumps to Stripe Customer Portal. Cancel the subscription.
7. Stripe fires `customer.subscription.deleted` (may be immediate or at period end depending on cancel type). Terminal shows it. The webhook handler runs `downgradeUserPlan`. Plan flips back to Free on reload.

**Payment-failed path (dunning email):**

1. While on Pro, in Stripe dashboard: Subscriptions → find the active sub → Actions → "Update payment method" → pick `4000 0000 0000 0341` (test card that charges fail after initial auth).
2. Stripe Dashboard → Developers → Events → find your customer's last `invoice.payment_failed`.
3. Or trigger via CLI: `stripe trigger invoice.payment_failed --add invoice:customer=cus_...`
4. Webhook fires. Email arrives at the user's address (if `RESEND_API_KEY` is set). Subject: "Flareo: payment didn't go through".

## What's not in this build

- **Webhook event deduplication.** Stripe can deliver the same event twice. Our handlers are idempotent on the relevant writes so duplicates are benign, but if we ever do something non-idempotent (e.g. sending multiple dunning emails for the same attempt), we'd want a processed-events table. Deferred.
- **Upgrade confirmation email.** When `checkout.session.completed` fires we flip the plan but don't send the user a welcome email. Resend's free tier doesn't love bulk sends during testing, so I'd rather add this after production validates that the webhook path is solid.
- **Webhook retry budget / Sentry alerting.** The Sentry wrapper we built for the worker (`apps/worker/src/sentry.ts`) isn't reused here — Next's Sentry integration already captures unhandled errors from route handlers via `instrumentation.ts`, so webhook handler throws get captured automatically. Calling out explicitly so the seam is visible when we go deeper.
- **Annual billing / yearly discount.** Stripe supports this with a second price id; we don't offer it yet. Easy to add — another env var (`STRIPE_PRICE_ID_PRO_YEARLY`), a second line-item branch in `createCheckoutSession`, and a UI toggle on the billing page.
- **Pro-only features beyond the quota.** Today Pro unlocks: unlimited public modules, 20 private modules (once private-submission flow ships), 48h review SLA (informational only — reviewer decides priority manually). It does NOT unlock any API rate-limit bump yet; the `rateLimitMultiplier` field on `PLAN_LIMITS` is a seam without a consumer.

## Where the project stands

Weeks 15-16 done. What remains in Q1:

- **Weeks 17-18 — docs-that-convert.** `/docs/install` 90-second path, `/docs/first-verify` as primary demo surface, rewrite `/docs/publishing`, 3 use-case pages, remove all "coming soon" mentions. Copy-and-structure work, 1 session.
- **Week 19 — analytics.** Plausible or Simple Analytics snippet, one custom event for "module published". ~30 minutes.
- **Week 20 — review & replan.** Non-code — pull metrics from Plausible + DB + Stripe, write a 2-page retro, carve up Q2 plan.

And the Phase 2.5 real-world tasks that require your hardware / your time:

- Red-team day against the build worker on its dedicated host
- Non-maintainer smoke test (five real end-to-end submissions)
- One unattended weekend of the pipeline running live
