interface Props {
  value: number;
  size?: "lg" | "md";
}

/**
 * Visual representation of a module's trust score (0-100).
 * Color-graded: ≥90 good (green), ≥70 warn (orange), <70 bad (red).
 *
 * The score itself is the proposal's "single number that appears on
 * marketplace cards so consumers don't need to parse six badges" —
 * consolidating provenance + SBOM + zero critical CVEs + VEX +
 * signature + policy pass + minimal base into one. Methodology
 * detailed at /docs/threat-model.
 */
export function TrustScore({ value, size = "lg" }: Props) {
  const tone =
    value >= 90 ? "good" : value >= 70 ? "warn" : "bad";
  const colorClass =
    tone === "good"
      ? "text-good border-good"
      : tone === "warn"
        ? "text-warn border-warn"
        : "text-bad border-bad";
  const sizeClass =
    size === "lg"
      ? "text-[56px] leading-[0.85] tracking-[-0.04em]"
      : "text-[28px] leading-[0.85] tracking-[-0.03em]";
  const padClass = size === "lg" ? "p-3" : "p-2";

  return (
    <div
      className={`${colorClass} ${padClass} flex shrink-0 flex-col items-center border-2 bg-canvas-deep`}
    >
      <span
        className={`font-display font-black ${sizeClass} ${colorClass.split(" ")[0]}`}
      >
        {value}
      </span>
      <span className="mt-1 font-mono text-[8.5px] tracking-[0.18em] text-ink-ghost">
        TRUST
      </span>
    </div>
  );
}
