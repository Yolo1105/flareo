import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export interface ApprovalEmailProps {
  submitterName: string;
  slug: string;
  version: string;
  submissionId: string;
  dashboardUrl: string;
}

/**
 * Sent the moment a reviewer approves, BEFORE the build has run.
 * Confirms to the submitter their submission was read. A second
 * email (build-success or build-failed) follows when the build
 * actually completes.
 */
export default function ApprovalEmail({
  submitterName,
  slug,
  version,
  submissionId,
  dashboardUrl,
}: ApprovalEmailProps) {
  return (
    <EmailLayout preview={`Your Flareo submission "${slug}" was approved`}>
      <Heading style={headingStyle}>Your submission was approved</Heading>
      <Text style={paragraphStyle}>
        Hi {submitterName || "there"},
      </Text>
      <Text style={paragraphStyle}>
        Good news — your submission for <code style={codeStyle}>{slug}</code>{" "}
        has been approved for building.
      </Text>
      <Section style={metadataBoxStyle}>
        <Text style={metaLineStyle}>
          <strong>Submission:</strong> {submissionId}
        </Text>
        <Text style={metaLineStyle}>
          <strong>Slug:</strong> {slug}
        </Text>
        <Text style={metaLineStyle}>
          <strong>Version:</strong> {version}
        </Text>
      </Section>
      <Text style={paragraphStyle}>
        Our build worker will pick this up in the next 30 seconds or so. You
        should get a second email when the build finishes — usually within
        2-5 minutes, occasionally up to 10 for large images.
      </Text>
      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Button href={dashboardUrl} style={buttonStyle}>
          Track progress →
        </Button>
      </Section>
      <Text style={signatureStyle}>— The Flareo team</Text>
    </EmailLayout>
  );
}

ApprovalEmail.PreviewProps = {
  submitterName: "Sam",
  slug: "my-cool-app",
  version: "1.2.3",
  submissionId: "sub_abc123",
  dashboardUrl: "https://flareo.dev/app/modules",
} satisfies ApprovalEmailProps;

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
  fontFamily: "'Courier New', monospace",
  lineHeight: "1.7",
  margin: 0,
} as const;

const codeStyle = {
  backgroundColor: "#faf9f5",
  padding: "1px 6px",
  fontFamily: "'Courier New', monospace",
  fontSize: "13px",
  color: "#1a1a1a",
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
