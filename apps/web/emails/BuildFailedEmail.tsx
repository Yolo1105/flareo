import { Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export interface BuildFailedEmailProps {
  submitterName: string;
  slug: string;
  submissionId: string;
  errorKind: "user" | "system" | "scan";
  errorMessage: string;
  buildLogUrl: string | null;
  cveList?: string[];
  docsUrl: string;
}

/**
 * Sent when the build worker reports failure. Tone: helpful, not
 * accusatory. Most failures are first-time-user mistakes that resolve
 * on resubmission.
 */
export default function BuildFailedEmail({
  submitterName,
  slug,
  submissionId,
  errorKind,
  errorMessage,
  buildLogUrl,
  cveList,
  docsUrl,
}: BuildFailedEmailProps) {
  return (
    <EmailLayout preview={`Your Flareo build failed: ${slug}`}>
      <Heading style={headingStyle}>Your build didn&apos;t succeed</Heading>
      <Text style={paragraphStyle}>Hi {submitterName || "there"},</Text>
      <Text style={paragraphStyle}>
        Your submission for <code style={codeInlineStyle}>{slug}</code> built
        unsuccessfully. Here&apos;s what went wrong:
      </Text>

      <Section style={errorBoxStyle}>
        <Text style={errorMessageStyle}>{errorMessage}</Text>
      </Section>

      {errorKind === "scan" && cveList && cveList.length > 0 && (
        <>
          <Text style={paragraphStyle}>
            The build completed but our security scan rejected the image due
            to vulnerabilities in its dependencies:
          </Text>
          <Section style={cveBoxStyle}>
            {cveList.map((cve) => (
              <Text key={cve} style={cveLineStyle}>
                · {cve}
              </Text>
            ))}
          </Section>
        </>
      )}

      {buildLogUrl && (
        <Text style={paragraphStyle}>
          Full build log:{" "}
          <Link href={buildLogUrl} style={linkStyle}>
            {buildLogUrl}
          </Link>
        </Text>
      )}

      <Text style={paragraphStyle}>
        <strong>Common next steps:</strong>
      </Text>
      <Section>
        {errorKind === "user" && (
          <>
            <Text style={tipLineStyle}>
              · Check the Dockerfile for network calls during RUN (apt-get,
              npm install, pip install). These fail because we build in a
              network-isolated sandbox.
            </Text>
            <Text style={tipLineStyle}>
              · Vendor dependencies into the submission context instead of
              fetching during build.
            </Text>
            <Text style={tipLineStyle}>
              · Use an approved base image (node-slim, python-slim, golang,
              alpine, debian-slim).
            </Text>
          </>
        )}
        {errorKind === "scan" && (
          <>
            <Text style={tipLineStyle}>
              · Update your base image to the latest patched version.
            </Text>
            <Text style={tipLineStyle}>
              · Update vendored dependencies to a version without the listed
              CVEs.
            </Text>
            <Text style={tipLineStyle}>
              · If you believe a CVE is a false positive, reply to this email
              with details.
            </Text>
          </>
        )}
        {errorKind === "system" && (
          <>
            <Text style={tipLineStyle}>
              · This looks like a Flareo infrastructure issue, not something
              wrong with your submission. Your submission is staying in the
              queue and we&apos;ll retry automatically.
            </Text>
            <Text style={tipLineStyle}>
              · If you don&apos;t hear back within 24 hours, reply to this
              email with submission ID {submissionId}.
            </Text>
          </>
        )}
      </Section>

      <Text style={paragraphStyle}>
        Read{" "}
        <Link href={docsUrl} style={linkStyle}>
          the submission guide
        </Link>{" "}
        for the full requirements. Fix and submit again — there&apos;s no
        penalty. Your previous submission stays in the queue as{" "}
        <code style={codeInlineStyle}>{errorKind === "scan" ? "scan_rejected" : "failed"}</code>{" "}
        for reference.
      </Text>

      <Text style={metaFootStyle}>Submission ID: {submissionId}</Text>
      <Text style={signatureStyle}>— The Flareo team</Text>
    </EmailLayout>
  );
}

BuildFailedEmail.PreviewProps = {
  submitterName: "Sam",
  slug: "my-cool-app",
  submissionId: "sub_abc123",
  errorKind: "user",
  errorMessage:
    "Build failed: network disabled — connection refused to registry.npmjs.org during `RUN npm install`. See docs/submitting-dockerfiles for the no-network rule.",
  buildLogUrl: "https://r2.flareo.dev/logs/sub_abc123.txt",
  cveList: [],
  docsUrl: "https://flareo.dev/docs/submitting-dockerfiles",
} satisfies BuildFailedEmailProps;

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

const errorBoxStyle = {
  backgroundColor: "#fef3ed",
  borderLeft: "3px solid #c24d24",
  padding: "12px 14px",
  margin: "8px 0 20px 0",
} as const;

const errorMessageStyle = {
  color: "#3a3834",
  fontSize: "13.5px",
  fontFamily: "'Courier New', monospace",
  lineHeight: "1.55",
  margin: 0,
  wordBreak: "break-word" as const,
} as const;

const cveBoxStyle = {
  backgroundColor: "#faf9f5",
  border: "1px solid #e5e4e0",
  padding: "10px 14px",
  margin: "8px 0 20px 0",
} as const;

const cveLineStyle = {
  color: "#3a3834",
  fontSize: "12.5px",
  fontFamily: "'Courier New', monospace",
  lineHeight: "1.65",
  margin: 0,
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
