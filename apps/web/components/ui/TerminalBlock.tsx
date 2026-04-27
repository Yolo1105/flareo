import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "./StatusBadge";

interface TerminalBlockProps {
  /** Title shown in the mono header, e.g. "cosign verify · signature + identity" */
  title?: string;
  /** Status shown right-side in the header — pair with StatusBadge */
  status?: {
    tone: "ok" | "warn" | "bad" | "running";
    label: string;
  };
  /** Terminal body content — can include HTML via dangerouslySetInnerHTML when needed */
  children: React.ReactNode;
  className?: string;
}

/**
 * The dark-panel terminal frame used in several places: verify page
 * results, module detail receipts, CLI reference examples, sandbox
 * "preview panel" chrome.
 */
export function TerminalBlock({
  title,
  status,
  children,
  className,
}: TerminalBlockProps) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-hairline bg-canvas-deep",
        className
      )}
    >
      {(title || status) && (
        <div className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-4 py-[11px]">
          <div className="flex items-center gap-3 font-mono text-[10.5px] tracking-[0.04em] text-ink-faint">
            <div className="flex gap-[5px]">
              <span className="block h-2 w-2 rounded-full bg-accent" />
              <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
              <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
            </div>
            {title && <span>{title}</span>}
          </div>
          {status && (
            <StatusBadge tone={status.tone} pulse={status.tone === "running"}>
              {status.label}
            </StatusBadge>
          )}
        </div>
      )}
      <div className="overflow-x-auto whitespace-pre p-4 font-mono text-[12px] leading-[1.8] text-ink-mute">
        {children}
      </div>
    </div>
  );
}
