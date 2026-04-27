import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export interface RejectionEmailProps {
  submitterName: string;
  slug: string;
  submissionId: string;
  reason: string;
  docsUrl: string;
}

/**
 * Sent when a reviewer rejects a submission outright. The tone
 * matters more than the content — rejection emails are the ones
 * submitters share publicly when they're upset.
 *
 * Deliberately:
 *   - No marketing
 *   - No "we'd love to see you improve and resubmit" (sounds patronizing)
 *   - A clear reason (copied from the reviewer's note)
 *   - The path forward (fix + resubmit, or reply to ask)
 */
export default function RejectionEmail({
  submitterName,
  slug,
  submissionId,
  reason,
  docsUrl,
}: RejectionEmailProps) {
  return (
    <EmailLayout preview={`Update on your Flareo submission: ${slug}`}>
      <Heading style={headingStyle}>
        We couldn&apos;t approve your submission
      </Heading>
      <Text style={paragraphStyle}>Hi {submitterName || "there"},</Text>
      <Text style={paragraphStyle}>
        Unfortunately we weren&apos;t able to approve your submission for{" "}
        <code style={codeInlineStyle}>{slug}</code>. Here&apos;s the
        reasoning:
      </Text>

      <div style={reasonBoxStyle}>
        <Text style={reasonTextStyle}>{reason}</Text>
      </div>

      <Text style={paragraphStyle}>
        <strong>What you can do:</strong>
      </Text>
      <Text style={tipLineStyle}>
        · Address the issue above and submit again — there&apos;s no cooldown
        or penalty.
      </Text>
      <Text style={tipLineStyle}>
        · Reply to this email if the reason isn&apos;t clear or you disagree.
        Include your submission ID below.
      </Text>
      <Text style={tipLineStyle}>
        · Read <a href={docsUrl} style={linkStyle}>the submission guide</a>{" "}
        for the full requirements.
      </Text>

      <Text style={metaFootStyle}>Submission ID: {submissionId}</Text>
      <Text style={signatureStyle}>— The Flareo team</Text>
    </EmailLayout>
  );
}

RejectionEmail.PreviewProps = {
  submitterName: "Sam",
  slug: "my-cool-app",
  submissionId: "sub_abc123",
  reason:
    "The upstream URL points to a private repository, so we can't verify the source. Please resubmit with a public git URL.",
  docsUrl: "https://flareo.dev/docs/submitting-dockerfiles",
} satisfies RejectionEmailProps;

const headingStyle = {
  color: "#1a1a1a",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "1.25",
  margin: "0 0 16px 0",
  letterSpacing: "-0.01em",
} as const;

const paragraphStyle = {
  color: "#3a3834",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px 0",
} as const;

const reasonBoxStyle = {
  backgroundColor: "#faf9f5",
  borderLeft: "3px solid #7a7870",
  padding: "14px 16px",
  margin: "12px 0 20px 0",
  whiteSpace: "pre-wrap" as const,
} as const;

const reasonTextStyle = {
  color: "#3a3834",
  fontSize: "14.5px",
  lineHeight: "1.6",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
} as const;

const tipLineStyle = {
  color: "#3a3834",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px 0",
} as const;

const codeInlineStyle = {
  backgroundColor: "#faf9f5",
  padding: "1px 6px",
  fontFamily: "'Courier New', monospace",
  fontSize: "13px",
  color: "#1a1a1a",
} as const;

const linkStyle = {
  color: "#c24d24",
  textDecoration: "underline",
} as const;

const metaFootStyle = {
  color: "#7a7870",
  fontSize: "12.5px",
  fontFamily: "'Courier New', monospace",
  margin: "20px 0 0 0",
} as const;

const signatureStyle = {
  color: "#7a7870",
  fontSize: "14px",
  margin: "12px 0 0 0",
} as const;
