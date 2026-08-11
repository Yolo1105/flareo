import type { Module } from "@/lib/types";
import type { SbomShape } from "@/lib/data/pipeline-artifacts";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StageShell } from "./StageShell";

interface Props {
  module: Module;
  sbom: SbomShape;
}

export function Stage03Sbom({ module, sbom }: Props) {
  // Render a compact preview of the SBOM JSON — first ~25 lines worth
  // of components — so the visitor sees real CycloneDX structure
  // without the page becoming an SBOM dump.
  const previewSbom = {
    bomFormat: sbom.bomFormat,
    specVersion: sbom.specVersion,
    serialNumber: sbom.serialNumber,
    version: sbom.version,
    metadata: sbom.metadata,
    components: sbom.components.slice(0, 4),
  };
  const previewJson = JSON.stringify(previewSbom, null, 2);
  const totalComponents = sbom.components.length;

  return (
    <StageShell
      number="03"
      anchorId="stage-sbom"
      title="CycloneDX SBOM · every component, every license"
      subtitle="A complete software bill-of-materials in CycloneDX 1.5 format. Every operating-system package and every library that made it into the image is enumerated, with version, license, and SHA-256 hash. Stored permanently and re-emitted on every rebuild."
      status="built"
      durationLabel="≈ 1-2s emit time"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            FORMAT
          </div>
          <div className="mt-1 font-display text-[20px] font-black tracking-[-0.025em] text-ink">
            CycloneDX
          </div>
          <div className="font-mono text-[10.5px] text-ink-mute">
            spec v{sbom.specVersion}
          </div>
        </div>
        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            COMPONENTS
          </div>
          <div className="mt-1 font-display text-[20px] font-black tracking-[-0.025em] text-ink">
            {totalComponents}
          </div>
          <div className="font-mono text-[10.5px] text-ink-mute">
            indexed in this build
          </div>
        </div>
        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            EMITTED BY
          </div>
          <div className="mt-1 font-mono text-[12px] text-ink">
            syft 1.13.0
          </div>
          <div className="font-mono text-[10.5px] text-ink-mute">
            {sbom.metadata.tools[0].vendor}
          </div>
        </div>
      </div>

      <TerminalBlock
        title={`sbom.cdx.json · ${module.slug}@${module.version}`}
        status={{ tone: "ok", label: "VALID JSON · SIGNED" }}
      >
        <pre className="overflow-x-auto p-5 font-mono text-[10.5px] leading-[1.65] text-ink-mute">
          {previewJson}
          {totalComponents > 4 && (
            <span className="text-ink-ghost">{`\n  ...+ ${totalComponents - 4} more components\n  ]\n}`}</span>
          )}
        </pre>
      </TerminalBlock>

      <div className="border border-hairline bg-canvas-panel p-4 font-body text-[12.5px] leading-[1.6] text-ink-softer">
        <strong className="font-medium text-ink">What this means in plain English:</strong>{" "}
        if a CVE is discovered in any of these {totalComponents} components
        tomorrow, Flareo can identify every published module that includes it
        within minutes — and trigger a rebuild for each. That&apos;s the unlock
        SBOMs make possible.
      </div>
    </StageShell>
  );
}
