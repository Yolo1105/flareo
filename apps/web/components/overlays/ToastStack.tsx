"use client";

import { useAppShell } from "./AppShellProvider";

const TONES = {
  info: { border: "border-hairline", text: "text-ink", dot: "bg-accent" },
  success: { border: "border-good", text: "text-good", dot: "bg-good" },
  error: { border: "border-bad", text: "text-bad", dot: "bg-bad" },
};

/**
 * Stack of transient notifications rendered bottom-right. Auto-dismiss
 * after 4.2s per toast (handled in the provider).
 */
export function ToastStack() {
  const { toasts, dismissToast } = useAppShell();

  return (
    <div className="pointer-events-none fixed bottom-10 right-5 z-[60] flex flex-col-reverse items-end gap-2">
      {toasts.map((t) => {
        const tone = TONES[t.kind];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto slidein flex items-center gap-3 border ${tone.border} bg-canvas-deep pl-4 pr-2 py-2.5 font-mono text-[11.5px]`}
          >
            <span className={`block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            <span className={tone.text}>{t.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
              className="text-ink-ghost transition-colors hover:text-ink"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
