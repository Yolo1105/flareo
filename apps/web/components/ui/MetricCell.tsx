import { cn } from "@/lib/utils/cn";

interface MetricCellProps {
  /** Top label, e.g. "UPTIME" or "SCAN PASS" */
  label: string;
  /** Optional sub-label, e.g. "· 7 DAY" */
  period?: string;
  /** Big number (may include a unit) */
  value: string;
  /** Optional unit rendered smaller next to the number */
  unit?: string;
  /** Footer line: delta text or small caption */
  footer?: React.ReactNode;
  /** Whether the big number should be rendered in green */
  good?: boolean;
  last?: boolean;
  className?: string;
}

/**
 * Metric cell used on the landing page (modules / builds / scan pass /
 * stage p50) and the Status page top strip. Tall block, big Neue
 * Machina number, mono label, dim delta line.
 */
export function MetricCell({
  label,
  period,
  value,
  unit,
  footer,
  good = false,
  last = false,
  className,
}: MetricCellProps) {
  return (
    <div
      className={cn(
        "px-7 py-7",
        !last && "border-r border-hairline",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
        {label}
        {period && (
          <span className="font-normal tracking-[0.08em] text-ink-ghost">
            {period}
          </span>
        )}
      </div>
      <div
        className={cn(
          "mb-2 flex items-baseline gap-1.5 font-display text-[44px] font-black leading-[1] tracking-[-0.03em]",
          good ? "text-good" : "text-ink"
        )}
      >
        {value}
        {unit && (
          <span className="font-mono text-[14px] font-normal tracking-[0.02em] text-ink-faint">
            {unit}
          </span>
        )}
      </div>
      {footer && (
        <div className="font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
          {footer}
        </div>
      )}
    </div>
  );
}
