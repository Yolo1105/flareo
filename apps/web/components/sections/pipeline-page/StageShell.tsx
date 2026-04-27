import { cn } from "@/lib/utils/cn";

type StageStatus = "built" | "spec-only";

interface Props {
  number: string;
  title: string;
  subtitle: string;
  status: StageStatus;
  durationLabel?: string;
  /** Anchor id for in-page navigation. */
  anchorId: string;
  children: React.ReactNode;
}

/**
 * Shared shell for each pipeline stage. Renders a numbered header
 * with the stage's name, subtitle, status pill, and approximate
 * duration; below it, the artifact panel(s) the caller passes as
 * children.
 *
 * Status pill is the honest signal:
 *   - built     →  green; this stage is in production today
 *   - spec-only →  amber; the artifact shape is committed but the
 *                  stage doesn't run in production yet
 *
 * The proposal is explicit that "five circles is a visual placebo."
 * This shell exists to make sure every stage forces the caller to
 * supply real-shaped content rather than an icon row.
 */
export function StageShell({
  number,
  title,
  subtitle,
  status,
  durationLabel,
  anchorId,
  children,
}: Props) {
  return (
    <section
      id={anchorId}
      className="scroll-mt-32 border-b border-hairline px-8 py-12"
    >
      <header className="mb-6 grid grid-cols-[auto_1fr_auto] items-start gap-5">
        <div className="font-display text-[64px] font-black leading-[0.85] tracking-[-0.04em] text-accent">
          {number}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[28px] font-black leading-[1] tracking-[-0.025em] text-ink">
            {title}
          </h2>
          <p className="mt-2 max-w-[680px] font-body text-[13.5px] leading-[1.55] text-ink-softer">
            {subtitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusPill status={status} />
          {durationLabel && (
            <span className="font-mono text-[10.5px] tracking-[0.04em] text-ink-ghost">
              {durationLabel}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-4">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: StageStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em]",
        status === "built"
          ? "border-good text-good"
          : "border-warn text-warn",
      )}
    >
      <span
        className={cn(
          "block h-1.5 w-1.5 rounded-full",
          status === "built" ? "bg-good" : "bg-warn",
        )}
      />
      {status === "built" ? "BUILT · IN PRODUCTION" : "SPEC ONLY · ROADMAP"}
    </span>
  );
}
