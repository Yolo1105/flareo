import type { Module } from "@/lib/types";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StageShell } from "./StageShell";

interface Props {
  module: Module;
  buildLog: string;
}

export function Stage01BuildKit({ module, buildLog }: Props) {
  return (
    <StageShell
      number="01"
      anchorId="stage-buildkit"
      title="BuildKit · hermetic, rootless build"
      subtitle="The submission's source archive is unpacked into an isolated rootless BuildKit instance running inside Docker-in-Docker. Network access is restricted to a whitelist of package registries. The output is an OCI image with deterministic layers."
      status="built"
      durationLabel="≈ 2-4 min typical"
    >
      <TerminalBlock
        title={`buildkit · ${module.slug}@${module.version}`}
        status={{ tone: "ok", label: "EXIT 0 · 8 LAYERS" }}
      >
        <pre className="overflow-x-auto p-5 font-mono text-[11.5px] leading-[1.65] text-ink-mute">
          {buildLog}
        </pre>
      </TerminalBlock>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            CONFIGURATION
          </div>
          <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 font-mono text-[11px]">
            <dt className="text-ink-faint">backend</dt>
            <dd className="text-ink">buildkit 0.13.1</dd>
            <dt className="text-ink-faint">isolation</dt>
            <dd className="text-ink">DinD + rootless</dd>
            <dt className="text-ink-faint">network</dt>
            <dd className="text-ink">constrained allowlist</dd>
            <dt className="text-ink-faint">cache</dt>
            <dd className="text-ink">R2-backed</dd>
            <dt className="text-ink-faint">timeout</dt>
            <dd className="text-ink">600s</dd>
          </dl>
        </div>

        <div className="border border-good/40 bg-good/[0.04] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9.5px] tracking-[0.14em] text-good">
              ✓ CNB AUTO-DETECT — SHIPPED
            </span>
          </div>
          <p className="font-body text-[11.5px] leading-[1.6] text-ink-softer">
            For submissions without a Dockerfile, Cloud Native Buildpacks
            auto-detect the language (Node, Python, Go, Rust, Ruby, Java,
            PHP, .NET, static) and produce a hardened image. The pipeline
            shape from this point forward is identical to the Dockerfile
            path — same Trivy, same SBOM, same signature.
          </p>
          <div className="mt-2 font-mono text-[10px] text-ink-ghost">
            Pick &quot;Auto-detect with buildpacks&quot; in the publish
            wizard step 2.
          </div>
        </div>
      </div>
    </StageShell>
  );
}
