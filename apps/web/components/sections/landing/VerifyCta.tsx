import { SectionHeader } from "@/components/ui/SectionHeader";
import { VerifyTool } from "@/components/sections/verify/VerifyTool";

/**
 * Landing verify front-door — sits high in the composition so visitors
 * meet the real tool before the problem pitch. Embeds VerifyTool so the
 * result shape (digest, signer, issuer, Rekor index) is live, not mocked.
 */
export function VerifyCta() {
  return (
    <div>
      <section className="border-b border-hairline px-8 pb-8 pt-14">
        <SectionHeader
          num="01"
          label="VERIFY"
          title="Paste an image. Read the receipts."
        >
          Image ref in. Resolved digest, signer identity, issuer, and Rekor
          log index out — checked against public Sigstore infrastructure, not
          a Flareo proxy. Try any public OCI reference below.
        </SectionHeader>
      </section>
      <VerifyTool />
    </div>
  );
}
