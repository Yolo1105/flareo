import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * The faceted orange square that sits next to the FLAREO wordmark.
 * Reusable in case we want to sprinkle it elsewhere (favicon, og image).
 */
export function BrandMark({ size = 20, className }: BrandMarkProps) {
  return (
    <span
      className={cn("block bg-accent", className)}
      style={{
        width: size,
        height: size,
        clipPath: "polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%)",
      }}
      aria-hidden
    />
  );
}
