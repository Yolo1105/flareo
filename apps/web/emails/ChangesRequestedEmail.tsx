import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export interface ChangesRequestedEmailProps {
  submitterName: string;
  slug: string;
  submissionId: string;
  message: string;
  dashboardUrl: string;
}

/**
 * "Not rejected, not approved — please make these tweaks."
 *
 * The difference from RejectionEmail: the submission stays in the
 * queue rather than going to a terminal state. Submitter can update
 * and the same row gets re-reviewed. Used when the Dockerfile is 90%
 * there but needs small tweaks.
 */
export default function ChangesRequestedEmail({
  submitterName,
  slug,
  submissionId,
  message,
  dashboardUrl,
}: ChangesRequestedEmailProps) {
  return (
    <EmailLayout preview={`Small changes needed on your submission: ${slug}`}>
      <Heading style={headingStyle}>A few things before we can approve</Heading>
      <Text style={paragraphStyle}>Hi {submitterName || "there"},</Text>
      <Text style={paragraphStyle}>
        Thanks for submitting <code style={codeInlineStyle}>{slug}</code>.
        It&apos;s almost there — just a couple of adjustments:
      </Text>

      <div style={messageBoxStyle}>
        <Text style={messageTextStyle}>{message}</Text>
      </div>

      <Text style={paragraphStyle}>
        Once you&apos;ve made the changes, resubmit through the dashboard.
        There&apos;s no need to create a new submission — we&apos;ve kept
        this one in the queue so a reviewer can pick it up again quickly.
      </Text>

      <Text style={paragraphStyle}>
        If any of the above is unclear, just reply to this email. I&apos;d
        rather spend five minutes now clarifying than have you guess.
      </Text>

      <Text style={metaFootStyle}>
        Submission ID: {submissionId} · Dashboard:{" "}
        <a href={dashboardUrl} style={linkStyle}>
          {dashboardUrl}
        </a>
      </Text>
      <Text style={signatureStyle}>— The Flareo team</Text>
    </EmailLayout>
  );
}

ChangesRequestedEmail.PreviewProps = {
  submitterName: "Sam",
  slug: "my-cool-app",
  submissionId: "sub_abc123",
  message:
    "The Dockerfile pins FROM alpine (no version). Please pin to a specific version like alpine:3.19 so builds are reproducible.",
  dashboardUrl: "https://flareo.app/app/modules",
} satisfies ChangesRequestedEmailProps;

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

const messageBoxStyle = {
  backgroundColor: "#faf9f5",
  borderLeft: "3px solid #c24d24",
  padding: "14px 16px",
  margin: "12px 0 20px 0",
  whiteSpace: "pre-wrap" as const,
} as const;

const messageTextStyle = {
  color: "#3a3834",
  fontSize: "14.5px",
  lineHeight: "1.6",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
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
