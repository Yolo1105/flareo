import { cn } from "@/lib/utils/cn";

type StatusTone = "ok" | "warn" | "bad" | "running" | "neutral";

interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  /** Whether the dot should pulse (live indicators) */
  pulse?: boolean;
  className?: string;
}

const TONES: Record<StatusTone, string> = {
  ok: "border-good text-good",
  warn: "border-warn text-warn",
  bad: "border-bad text-bad",
  running: "border-warn text-warn",
  neutral: "border-hairline text-ink-mute",
};

/**
 * The mono status pills — "VERIFIED", "PASS", "RUNNING", "ALL CHECKS PASSED".
 * Dot uses currentColor so it matches the tone automatically.
 */
export function StatusBadge({
  tone,
  children,
  pulse = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.08em]",
        TONES[tone],
        className
      )}
    >
      <span
        className={cn(
          "block h-[5px] w-[5px] rounded-full bg-current",
          pulse && "meta-pulse"
        )}
      />
      {children}
    </span>
  );
}
