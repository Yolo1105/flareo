import type { Module } from "@/lib/types";
import type {
  VexAnnotationShape,
  VexStatement,
} from "@/lib/data/pipeline-artifacts";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StageShell } from "./StageShell";

interface Props {
  module: Module;
  vex: VexAnnotationShape;
}

export function Stage04Vex({ module, vex }: Props) {
  return (
    <StageShell
      number="04"
      anchorId="stage-vex"
      title="VEX · which CVEs actually matter"
      subtitle="Trivy says 'CVE-2024-XXXX is in your image.' VEX answers 'and is it actually exploitable here?' For every relevant CVE, the reviewer team marks not_affected / under_investigation / fixed / affected with a justification — so a downstream consumer sees the real risk, not the noise."
      status="built"
      durationLabel="≈ 1-2s emit time"
    >
      <div className="border border-good/40 bg-good/[0.04] p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.14em] text-good">
            ✓ NOW IN PRODUCTION
          </span>
        </div>
        <p className="font-body text-[13px] leading-[1.6] text-ink-softer">
          Reviewers annotate findings via the admin surface. Annotations
          roll up into the OpenVEX 0.2.0 document available at{" "}
          <code className="font-mono text-[12px] text-accent">
            /api/v1/modules/{module.slug}/vex
          </code>
          . Consumers chain it into their own scanner pipelines as a
          suppression source. The example below shows how a typical
          annotation set looks for a module like this one.
        </p>
      </div>

      <TerminalBlock
        title={`vex-${module.slug}-${module.version}.json`}
        status={{ tone: "ok", label: "EXAMPLE · live at /api/v1/modules/<slug>/vex" }}
      >
        <pre className="overflow-x-auto p-5 font-mono text-[10.5px] leading-[1.65] text-ink-mute">
{`{
  "@context": "https://openvex.dev/ns/v0.2.0",
  "@id": "https://flareo.app/vex/${module.slug}/${module.version}",
  "author": "Flareo Reviewer Team",
  "timestamp": "${new Date().toISOString().slice(0, 19)}Z",
  "version": 1,
  "statements": ${JSON.stringify(vex.statements, null, 2).split("\n").map(
    (l, i) => (i === 0 ? l : "  " + l),
  ).join("\n")}
}`}
        </pre>
      </TerminalBlock>

      <div className="space-y-2">
        {vex.statements.map((s) => (
          <VexStatementCard key={s.cve} statement={s} />
        ))}
      </div>
    </StageShell>
  );
}

function VexStatementCard({ statement }: { statement: VexStatement }) {
  const tone =
    statement.status === "not_affected"
      ? "good"
      : statement.status === "fixed"
        ? "good"
        : statement.status === "affected"
          ? "bad"
          : "warn";
  const toneClass =
    tone === "good"
      ? "border-good/40 text-good"
      : tone === "bad"
        ? "border-bad/40 text-bad"
        : "border-warn/40 text-warn";
  return (
    <div className="grid grid-cols-[100px_120px_1fr] items-start gap-4 border border-hairline bg-canvas-deep p-4">
      <div className="font-mono text-[11px] text-accent">{statement.cve}</div>
      <div>
        <div className={`inline-block border px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.1em] ${toneClass}`}>
          {statement.status.toUpperCase().replace(/_/g, " ")}
        </div>
      </div>
      <div className="font-body text-[12px] leading-[1.55] text-ink-softer">
        {statement.justification && (
          <div className="mb-1 font-mono text-[10.5px] text-ink-faint">
            justification: {statement.justification}
          </div>
        )}
        {statement.impactStatement}
      </div>
    </div>
  );
}
