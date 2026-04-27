/**
 * Sticky in-page nav for the 8 pipeline stages. Helps the visitor
 * jump between stages without scrolling through the long page. Each
 * link is an anchor target rendered by the matching StageShell.
 */
const STAGES = [
  { num: "01", label: "BuildKit", anchor: "stage-buildkit", status: "built" },
  { num: "02", label: "Trivy", anchor: "stage-trivy", status: "built" },
  { num: "03", label: "SBOM", anchor: "stage-sbom", status: "built" },
  { num: "04", label: "VEX", anchor: "stage-vex", status: "built" },
  { num: "05", label: "SLSA", anchor: "stage-slsa", status: "built" },
  { num: "06", label: "Cosign", anchor: "stage-cosign", status: "built" },
  { num: "07", label: "Policy", anchor: "stage-policy", status: "built" },
  { num: "08", label: "Publish", anchor: "stage-publish", status: "built" },
] as const;

export function PipelineStageNav() {
  return (
    <nav className="sticky top-[28px] z-30 border-b border-hairline bg-canvas/95 px-8 py-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
          PIPELINE STAGES
        </span>
        {STAGES.map((s) => (
          <a
            key={s.num}
            href={`#${s.anchor}`}
            className="group flex items-center gap-1.5 font-mono text-[11px] text-ink-faint transition-colors hover:text-ink"
          >
            <span className="text-[9px] text-accent">{s.num}</span>
            <span>{s.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
