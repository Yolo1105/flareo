import { PageHero } from "@/components/ui/PageHero";
import { VerifyTool } from "@/components/sections/verify/VerifyTool";
import { RunLocallySection } from "@/components/sections/verify/RunLocallySection";
import { VerifyFaqSection } from "@/components/sections/verify/VerifyFaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify any container",
  description:
    "Paste any public OCI image — Flareo's, Docker Hub's, GHCR, Quay, anywhere — and see whether it's signed, what's in it, and what the receipts say. Pre-auth, no Flareo trust required.",
};

export default function VerifyPage() {
  return (
    <>
      <PageHero
        eyebrow="VERIFY / AUDIT ANY IMAGE"
        prompt="flareo verify <image|digest>"
        promptComment="# any registry. any image. cryptographic checks only."
        title={
          <>
            DON&apos;T TRUST US.
            <br />
            VERIFY YOURSELF.
          </>
        }
      >
        Paste any public image reference — from Flareo, Docker Hub, GHCR,
        Quay, anywhere. We run cosign signature checks against{" "}
        <span className="text-accent">public Sigstore infrastructure</span>{" "}
        and surface what we find. If the image is in our catalog, you get
        the full receipt chain. If it isn&apos;t, you still learn whether
        it&apos;s signed, by whom, and what Rekor says about it. No Flareo
        server sits in the verification path.
      </PageHero>
      <VerifyTool />
      <RunLocallySection />
      <VerifyFaqSection />
    </>
  );
}
