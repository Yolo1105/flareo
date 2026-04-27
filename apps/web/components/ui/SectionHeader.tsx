import { cn } from "@/lib/utils/cn";

interface SectionHeaderProps {
  /** "01", "02", or "§" for meta sections */
  num: string;
  /** Label shown after the number, e.g. "SYSTEM MAP" */
  label: string;
  /** H2 headline */
  title: React.ReactNode;
  /** Optional intro paragraph underneath */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The two-column section header used consistently across docs pages:
 * left column 140px wide with the mono index, right column with Neue
 * Machina H2 and a Space Grotesk intro paragraph.
 */
export function SectionHeader({
  num,
  label,
  title,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-7 grid grid-cols-[140px_1fr] items-baseline gap-7",
        className
      )}
    >
      <div className="pt-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
        <span className="mr-1.5 font-normal text-ink-ghost">{num}</span>
        {label}
      </div>
      <div>
        <h2 className="mb-2.5 font-display text-[38px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
          {title}
        </h2>
        {children && (
          <div className="max-w-[660px] font-body text-[14.5px] leading-[1.65] text-ink-softer">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
