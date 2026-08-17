import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { PipelineWalkthrough } from "@/components/sections/demo-pipeline/PipelineWalkthrough";
import { DEMO_RUN } from "@/lib/data/demo-pipeline";

export const metadata: Metadata = {
  title: "Pipeline",
  description:
    "Walk one recorded republish — pin, copy, SBOM, scan, sign, catalog, verify. Same results every time.",
};

/**
 * Recorded-run walkthrough — requires sign-in (see middleware).
 */
export default function PipelinePage() {
  return (
    <>
      <PageHero
        eyebrow="PIPELINE / RECORDED RUN"
        prompt={`flareo pipeline replay --run=${DEMO_RUN.runId}`}
        promptComment="# same image. same receipts. every visitor."
        title={
          <>
            One image.
            <br />
            Every stage.
          </>
        }
        size="medium"
      >
        This is a replay of a single republish of Vaultwarden. Nothing
        here is a live pull or a live signature — every screen is
        preconfigured so a demo never drifts. Sign in required; use Next
        to walk the pipeline, then try live verify from step 7 if you want.
      </PageHero>
      <PipelineWalkthrough />
    </>
  );
}
