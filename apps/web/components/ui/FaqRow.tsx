import { cn } from "@/lib/utils/cn";

interface FaqRowProps {
  /** Row number: "Q1", "Q2" etc */
  num: string;
  question: React.ReactNode;
  answer: React.ReactNode;
  last?: boolean;
  className?: string;
}

/**
 * Standard Q/A row — mono index column on the left, Neue Machina
 * question + Space Grotesk answer on the right. Used verbatim on
 * verify, concepts, pricing, and status pages.
 */
export function FaqRow({
  num,
  question,
  answer,
  last = false,
  className,
}: FaqRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[60px_1fr] items-baseline gap-7 py-6",
        !last && "border-b border-hairline",
        className
      )}
    >
      <div className="pt-1 font-mono text-[10.5px] font-medium tracking-[0.12em] text-accent">
        {num}
      </div>
      <div>
        <h3 className="mb-2.5 font-display text-[18px] font-black leading-[1.25] tracking-[-0.02em] text-ink">
          {question}
        </h3>
        <div className="max-w-[720px] font-body text-[13.5px] leading-[1.7] text-ink-softer">
          {answer}
        </div>
      </div>
    </div>
  );
}
