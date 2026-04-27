import { cn } from "@/lib/utils/cn";

interface PromptProps {
  /** The command string shown after the $ */
  command: string;
  /** Optional comment shown after the command in dim gray */
  comment?: string;
  className?: string;
}

/**
 * The `$ flareo foo --bar  # commentary` line that appears under
 * eyebrows on most hero sections. Args get tinted orange.
 */
export function Prompt({ command, comment, className }: PromptProps) {
  // Highlight flags and <args>
  const parts = command.split(/(\s--?[a-zA-Z0-9_=<>\-\.]+|\s<[^>]+>|\s[a-zA-Z_][a-zA-Z0-9_\-\/]*@?[a-zA-Z0-9_\-\.\:]*)/g);

  return (
    <div
      className={cn(
        "mb-3 font-mono text-[12px] tracking-[0.02em] text-ink-faint",
        className
      )}
    >
      <span className="mr-2 text-accent">$</span>
      {parts.map((part, i) => {
        // Commands (first word), then alternating
        if (i === 0) {
          return <span key={i}>{part}</span>;
        }
        const trimmed = part.trim();
        if (trimmed.startsWith("--") || trimmed.startsWith("-")) {
          return <span key={i} className="text-accent">{part}</span>;
        }
        if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
          return <span key={i} className="text-accent">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
      {comment && (
        <span className="ml-2 text-ink-ghost">{comment}</span>
      )}
    </div>
  );
}
