/**
 * Billing-related email senders.
 *
 * Mirrors the shape of lib/email/submission-emails.ts:
 *   - Reads RESEND_API_KEY at call time, not at module init
 *   - Silently no-ops + logs a warning when env isn't set, so a dev
 *     deploy without Resend keys doesn't crash the webhook handler
 *   - Ships both HTML and plain-text versions via React Email's
 *     render output
 *
 * Today there's one sender: sendPaymentFailedEmail, used by the
 * Stripe invoice.payment_failed webhook handler. When we add more
 * billing emails (renewal-upcoming, subscription-cancelled
 * confirmation), they land here alongside this one.
 */

import { render } from "@react-email/render";
import type { ReactElement } from "react";
import PaymentFailedEmail from "@/emails/PaymentFailedEmail";

interface SendArgs {
  to: string;
  subject: string;
  react: ReactElement;
  text?: string;
}

async function send({ to, subject, react, text }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_RESEND_FROM ?? "noreply@flareo.app";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping send", {
      to,
      subject,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const html = await render(react);
  const fallbackText = text ?? (await render(react, { plainText: true }));

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: fallbackText,
    });
  } catch (err) {
    // Email failure is NEVER a reason to fail the enclosing request
    // (webhook handler) — Stripe would retry and we'd end up sending
    // the email multiple times on flaky SMTP. Log and move on.
    console.error("[email] send failed", {
      to,
      subject,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ─── public senders ────────────────────────────────────────────────

export interface PaymentFailedEmailInput {
  to: string;
  submitterName: string;
  /** Which attempt in Stripe's retry schedule this is — 1, 2, 3, or 4. */
  attemptNumber: number;
  /**
   * Absolute URL to the Flareo billing page (or directly to the
   * Stripe portal — at time of writing, sending them to the billing
   * page is better UX because they get a clear "update payment"
   * button).
   */
  portalUrl: string;
}

export async function sendPaymentFailedEmail(
  args: PaymentFailedEmailInput,
): Promise<void> {
  const subjectPrefix = args.attemptNumber === 1 ? "" : `(attempt ${args.attemptNumber}) `;
  await send({
    to: args.to,
    subject: `${subjectPrefix}Flareo: payment didn't go through`,
    react: PaymentFailedEmail({
      submitterName: args.submitterName,
      attemptNumber: args.attemptNumber,
      portalUrl: args.portalUrl,
    }),
  });
}
