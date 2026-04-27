import type { Module } from "@/lib/types";
import type { SlsaShape } from "@/lib/data/pipeline-artifacts";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StageShell } from "./StageShell";

interface Props {
  module: Module;
  provenance: SlsaShape;
}

export function Stage05Slsa({ module, provenance }: Props) {
  const json = JSON.stringify(provenance, null, 2);
  const meta = provenance.payload.predicate.runDetails.metadata;

  return (
    <StageShell
      number="05"
      anchorId="stage-slsa"
      title="SLSA L1 · in-toto provenance attestation"
      subtitle="A signed JSON document recording exactly what was built, from what source, by which builder, when, and with what dependencies. Bound to the image digest. SLSA L3 is achievable today; the canary chain promotes verified modules to L3 over their first 30 days."
      status="built"
      durationLabel="≈ 1.5-2s emit time"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            ATTESTATION SUBJECT
          </div>
          <dl className="grid grid-cols-[100px_1fr] gap-y-1.5 font-mono text-[11px]">
            <dt className="text-ink-faint">name</dt>
            <dd className="text-ink">flareo/{module.slug}</dd>
            <dt className="text-ink-faint">digest</dt>
            <dd className="break-all text-ink">
              sha256:{provenance.payload.subject[0].digest.sha256.slice(0, 24)}
              …
            </dd>
            <dt className="text-ink-faint">level</dt>
            <dd className="text-good">SLSA {module.slsa}</dd>
          </dl>
        </div>

        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            BUILDER + RUN
          </div>
          <dl className="grid grid-cols-[100px_1fr] gap-y-1.5 font-mono text-[11px]">
            <dt className="text-ink-faint">builder</dt>
            <dd className="break-all text-ink">
              {provenance.payload.predicate.runDetails.builder.id.replace(
                "https://github.com/",
                "",
              )}
            </dd>
            <dt className="text-ink-faint">invocation</dt>
            <dd className="break-all text-ink">{meta.invocationId}</dd>
            <dt className="text-ink-faint">started</dt>
            <dd className="text-ink-mute">
              {meta.startedOn.replace("T", " ").slice(0, 19)}Z
            </dd>
            <dt className="text-ink-faint">finished</dt>
            <dd className="text-ink-mute">
              {meta.finishedOn.replace("T", " ").slice(0, 19)}Z
            </dd>
          </dl>
        </div>
      </div>

      <TerminalBlock
        title={`provenance-${module.slug}-${module.version}.intoto.jsonl`}
        status={{ tone: "ok", label: "in-toto v1 · SIGNED" }}
      >
        <pre className="overflow-x-auto p-5 font-mono text-[10.5px] leading-[1.65] text-ink-mute">
          {json}
        </pre>
      </TerminalBlock>

      <div className="border border-hairline bg-canvas-panel p-4 font-body text-[12.5px] leading-[1.6] text-ink-softer">
        <strong className="font-medium text-ink">Verify yourself:</strong>{" "}
        <code className="font-mono text-[11px] text-accent">
          cosign verify-attestation --type slsaprovenance ghcr.io/flareo/
          {module.slug}@{module.digest.slice(0, 19)}…
        </code>
      </div>
    </StageShell>
  );
}
