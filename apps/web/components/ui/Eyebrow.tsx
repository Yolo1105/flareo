import { cn } from "@/lib/utils/cn";

interface EyebrowProps {
  children: React.ReactNode;
  variant?: "default" | "warn" | "ghost";
  className?: string;
}

/**
 * The orange-bordered mono pill used at the top of every page hero.
 * `warn` variant is amber (used on limits / out-of-scope sections).
 * `ghost` drops the border (used for in-section labels).
 */
export function Eyebrow({
  children,
  variant = "default",
  className,
}: EyebrowProps) {
  const styles = {
    default:
      "border border-accent text-accent [&_.dot]:bg-accent",
    warn: "border border-warn text-warn [&_.dot]:bg-warn",
    ghost: "text-accent [&_.dot]:bg-accent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-[11px] py-[5px] font-mono text-[11px] font-medium tracking-[0.12em]",
        styles[variant],
        className
      )}
    >
      <span className="dot block h-1 w-1" />
      {children}
    </div>
  );
}
