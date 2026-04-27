import { Eyebrow } from "./Eyebrow";
import { Prompt } from "./Prompt";
import { cn } from "@/lib/utils/cn";

interface PageHeroProps {
  eyebrow: string;
  prompt: string;
  promptComment?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Smaller variant for dense pages (docs, pricing). Default is 64px. */
  size?: "default" | "medium";
}

/**
 * Page-hero wrapper used on Catalog, Verify, Concepts, Compare,
 * Architecture, Sandbox, Pricing, and Status. Landing has its own
 * hero because it floods the section with orange.
 */
export function PageHero({
  eyebrow,
  prompt,
  promptComment,
  title,
  children,
  className,
  size = "default",
}: PageHeroProps) {
  const titleSize =
    size === "default"
      ? "text-[64px] leading-[0.98]"
      : "text-[56px] leading-[0.98]";

  return (
    <section
      className={cn(
        "border-b border-hairline px-8 pb-11 pt-14",
        className
      )}
    >
      <Eyebrow className="mb-[18px]">{eyebrow}</Eyebrow>
      <Prompt command={prompt} comment={promptComment} />
      <h1
        className={cn(
          "mb-5 max-w-[960px] font-display font-black tracking-[-0.035em] text-ink",
          titleSize
        )}
      >
        {title}
      </h1>
      {children && (
        <p className="max-w-[640px] font-body text-[15.5px] leading-[1.65] text-ink-softer">
          {children}
        </p>
      )}
    </section>
  );
}
