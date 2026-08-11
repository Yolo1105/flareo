import { Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export interface BuildSuccessEmailProps {
  submitterName: string;
  slug: string;
  digest: string;
  signerIdentity: string;
  signerIssuer: string;
  rekorIndex: string;
  imageRef: string;
  sbomUrl: string;
  catalogUrl: string;
  /**
   * Whether the catalog actually published the module after the
   * build. Default: true (the historical behavior before the worker
   * grew an admission-policy gate). When false, the build succeeded
   * but the policy held the publish — copy below changes accordingly.
   */
  published?: boolean;
  /** Verdict from the admission-policy gate, when known. */
  policyVerdict?: "pass" | "warn" | "fail" | null;
  /** Active policy revision the verdict was computed against. */
  policyRevision?: number | null;
  /** Free-text reason from the worker explaining the hold. */
  policyHoldReason?: string | null;
}

/**
 * The most important email in the system. Sent when a build completes
 * successfully.
 *
 * Two variants based on `published`:
 *
 *   - `published === true` (default) — the module is live in the
 *     catalog; submitter sees the pull command, signature details,
 *     Rekor entry, SBOM, and the public catalog page.
 *
 *   - `published === false` — the build succeeded but the catalog's
 *     admission policy held the publish (verdict=fail, or the
 *     evaluator was unreachable when the worker called). The
 *     submitter sees what was built (digest, signer, Rekor) plus a
 *     "what happens next" paragraph: a Flareo reviewer will look at
 *     the held submission within 1 business day, and either resolve
 *     the cause (annotate VEX, edit policy) and republish, or
 *     contact the submitter with specific changes needed. We don't
 *     give the pull command here because the module isn't in the
 *     catalog and won't render on the public site until released.
 */
export default function BuildSuccessEmail({
  submitterName,
  slug,
  digest,
  signerIdentity,
  signerIssuer,
  rekorIndex,
  imageRef,
  sbomUrl,
  catalogUrl,
  published = true,
  policyVerdict = null,
  policyRevision = null,
  policyHoldReason = null,
}: BuildSuccessEmailProps) {
  const pullCommand = `docker pull ${imageRef}@${digest}`;
  const verifyCommand = `flareo verify ${slug}@${digest}`;
  const rekorUrl = `https://search.sigstore.dev/?logIndex=${rekorIndex}`;

  // The "held by policy" branch. Different copy, no pull command, no
  // public catalog link (the module isn't there yet).
  if (!published) {
    return (
      <EmailLayout preview={`${slug} was built but is held for review`}>
        <Heading style={headingStyle}>{slug} was built — held for review</Heading>
        <Text style={paragraphStyle}>Hi {submitterName || "there"},</Text>
        <Text style={paragraphStyle}>
          Your module built successfully and the receipts (signature,
          SBOM, Rekor entry) are all in place. The catalog&apos;s
          admission policy held the publish for reviewer attention
          before it goes live.
        </Text>
        <Text style={paragraphStyle}>
          This is a normal part of the publishing flow when a module
          has signal patterns the policy wants a human to look at.
          A Flareo reviewer will examine the submission within
          1 business day. If a CVE is annotated &quot;not exploitable&quot;
          via VEX or the policy is updated, the module re-evaluates
          automatically and goes live. If specific changes are needed
          on your end, we&apos;ll email you with the exact requests.
        </Text>

        <Text style={paragraphStyle}>
          <strong>Policy verdict:</strong>{" "}
          <span style={{ fontFamily: "'Courier New', monospace" }}>
            {(policyVerdict ?? "unknown").toUpperCase()}
          </span>
          {policyRevision !== null && policyRevision !== undefined ? (
            <>
              {" "}(revision {policyRevision})
            </>
          ) : null}
        </Text>
        {policyHoldReason ? (
          <Section style={metadataBoxStyle}>
            <Text style={metaLineStyle}>{policyHoldReason}</Text>
          </Section>
        ) : null}

        <Text style={paragraphStyle}>
          <strong>What was built:</strong>
        </Text>
        <Section style={metadataBoxStyle}>
          <Text style={metaLineStyle}>
            <strong>Digest:</strong> {digest}
          </Text>
          <Text style={metaLineStyle}>
            <strong>Signer:</strong> {signerIdentity}
          </Text>
          <Text style={metaLineStyle}>
            <strong>Issuer:</strong> {signerIssuer}
          </Text>
          <Text style={metaLineStyle}>
            <strong>Rekor log:</strong>{" "}
            <Link href={rekorUrl} style={linkStyle}>
              #{rekorIndex}
            </Link>
          </Text>
        </Section>

        <Text style={paragraphStyle}>
          We&apos;ll email you again when the module is either released
          to the catalog or when we have specific feedback for you.
        </Text>

        <Text style={signatureStyle}>— The Flareo team</Text>
      </EmailLayout>
    );
  }

  // Default branch: published cleanly, full live-in-catalog copy.

  return (
    <EmailLayout preview={`${slug} is live in the Flareo catalog`}>
      <Heading style={headingStyle}>
        {slug} is live
      </Heading>
      <Text style={paragraphStyle}>Hi {submitterName || "there"},</Text>
      <Text style={paragraphStyle}>
        Your module built successfully and is published to the catalog.
        Anyone can pull it now.
      </Text>

      <Section style={codeBoxStyle}>
        <Text style={codeLabelStyle}>PULL</Text>
        <Text style={codeBlockStyle}>{pullCommand}</Text>
      </Section>

      <Text style={paragraphStyle}>
        <strong>Signed with:</strong>
      </Text>
      <Section style={metadataBoxStyle}>
        <Text style={metaLineStyle}>
          <strong>Signer:</strong> {signerIdentity}
        </Text>
        <Text style={metaLineStyle}>
          <strong>Issuer:</strong> {signerIssuer}
        </Text>
        <Text style={metaLineStyle}>
          <strong>Rekor log:</strong>{" "}
          <Link href={rekorUrl} style={linkStyle}>
            #{rekorIndex}
          </Link>
        </Text>
      </Section>

      <Text style={paragraphStyle}>Verify it yourself:</Text>
      <Section style={codeBoxStyle}>
        <Text style={codeBlockStyle}>{verifyCommand}</Text>
      </Section>

      <Text style={paragraphStyle}>
        Public catalog page:{" "}
        <Link href={catalogUrl} style={linkStyle}>
          {catalogUrl}
        </Link>
      </Text>
      <Text style={paragraphStyle}>
        SBOM (CycloneDX):{" "}
        <Link href={sbomUrl} style={linkStyle}>
          {sbomUrl}
        </Link>
      </Text>

      <Text style={signatureStyle}>— The Flareo team</Text>
    </EmailLayout>
  );
}

BuildSuccessEmail.PreviewProps = {
  submitterName: "Sam",
  slug: "my-cool-app",
  digest: "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  signerIdentity: "sam@example.com",
  signerIssuer: "https://github.com/login/oauth",
  rekorIndex: "123456789",
  imageRef: "public.ecr.aws/flareo/my-cool-app",
  sbomUrl: "https://r2.flareo.app/sboms/my-cool-app-abc.json",
  catalogUrl: "https://flareo.app/catalog/my-cool-app",
} satisfies BuildSuccessEmailProps;

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

const codeBoxStyle = {
  backgroundColor: "#0f0f0e",
  padding: "14px 16px",
  margin: "8px 0 20px 0",
  borderRadius: "2px",
} as const;

const codeLabelStyle = {
  color: "#7a7870",
  fontSize: "10px",
  fontFamily: "'Courier New', monospace",
  letterSpacing: "0.14em",
  margin: "0 0 4px 0",
} as const;

const codeBlockStyle = {
  color: "#f5f4f0",
  fontSize: "12.5px",
  fontFamily: "'Courier New', monospace",
  lineHeight: "1.5",
  margin: 0,
  wordBreak: "break-all" as const,
} as const;

const metadataBoxStyle = {
  backgroundColor: "#faf9f5",
  border: "1px solid #e5e4e0",
  padding: "12px 14px",
  margin: "8px 0 20px 0",
} as const;

const metaLineStyle = {
  color: "#3a3834",
  fontSize: "12.5px",
  fontFamily: "'Courier New', monospace",
  lineHeight: "1.7",
  margin: 0,
  wordBreak: "break-all" as const,
} as const;

const linkStyle = {
  color: "#c24d24",
  textDecoration: "underline",
} as const;

const signatureStyle = {
  color: "#7a7870",
  fontSize: "14px",
  margin: "24px 0 0 0",
} as const;
