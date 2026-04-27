import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export interface PaymentFailedEmailProps {
  submitterName: string;
  attemptNumber: number;
  portalUrl: string;
}

/**
 * Sent when Stripe reports invoice.payment_failed. The user's card
 * was declined; Stripe will retry automatically according to the
 * account's retry schedule (usually 4 attempts over 2-3 weeks),
 * and if all retries fail the subscription is cancelled and
 * subscription.deleted fires.
 *
 * Tone here is deliberately calm — most payment failures are
 * innocuous (expired card, temporary bank flag, roaming travel) and
 * we don't want to trigger a panic response. Just tell them what
 * happened, point them at the portal, and note that we'll keep
 * trying.
 */
export default function PaymentFailedEmail({
  submitterName,
  attemptNumber,
  portalUrl,
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout
      preview={
        attemptNumber === 1
          ? "A payment for your Flareo Pro subscription didn't go through"
          : `Your Flareo Pro payment failed again (attempt ${attemptNumber})`
      }
    >
      <Heading style={headingStyle}>
        {attemptNumber === 1
          ? "Your payment didn't go through"
          : "Still can't charge your card"}
      </Heading>

      <Text style={paragraphStyle}>
        Hi {submitterName || "there"},
      </Text>

      <Text style={paragraphStyle}>
        {attemptNumber === 1
          ? "Your bank declined the last charge for your Flareo Pro subscription. This is usually something simple — an expired card, a bank travel flag, or a temporary hold."
          : `This is attempt ${attemptNumber}. Stripe will keep retrying automatically for a few more days, but if none of the retries succeed your subscription will be cancelled and you'll revert to the free plan.`}
      </Text>

      <Text style={paragraphStyle}>
        Your modules, API keys, and submissions are safe — nothing has
        changed on that front. Pro features stay active during the retry
        window.
      </Text>

      <Section style={metadataBoxStyle}>
        <Text style={metaLineStyle}>
          <strong>What to do:</strong> open the billing portal and
          update your payment method. The next retry will use whatever
          you set there.
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Button href={portalUrl} style={buttonStyle}>
          Open billing portal →
        </Button>
      </Section>

      <Text style={signatureStyle}>
        — the Flareo team
      </Text>

      <Text style={footerStyle}>
        If the portal link doesn&apos;t work or you already fixed the
        payment method and this email seems stale, please ignore it —
        the most recent state always wins.
      </Text>
    </EmailLayout>
  );
}

// ─── styles (mirror the pattern used by ApprovalEmail and friends) ─

const headingStyle = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: 900,
  lineHeight: "1.25",
  margin: "0 0 16px 0",
  letterSpacing: "-0.01em",
} as const;

const paragraphStyle = {
  color: "#3a3834",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
} as const;

const metadataBoxStyle = {
  backgroundColor: "#faf9f5",
  border: "1px solid #e5e4e0",
  padding: "14px 16px",
  margin: "16px 0",
} as const;

const metaLineStyle = {
  color: "#3a3834",
  fontSize: "13px",
  lineHeight: "1.7",
  margin: 0,
} as const;

const buttonStyle = {
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 20px",
  textDecoration: "none",
  display: "inline-block",
} as const;

const signatureStyle = {
  color: "#7a7870",
  fontSize: "14px",
  margin: "24px 0 0 0",
} as const;

const footerStyle = {
  color: "#9a9890",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "24px 0 0 0",
} as const;
