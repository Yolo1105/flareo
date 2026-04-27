"use client";

import { useAppShell } from "./AppShellProvider";

const SHORTCUTS: { section: string; items: { keys: string; label: string }[] }[] = [
  {
    section: "NAVIGATION",
    items: [
      { keys: "Cmd K", label: "Open command palette" },
      { keys: "G then H", label: "Go to dashboard" },
      { keys: "G then M", label: "Go to my modules" },
      { keys: "G then P", label: "Go to publish" },
      { keys: "G then J", label: "Go to jobs" },
      { keys: "G then A", label: "Go to admin queue" },
      { keys: "G then S", label: "Go to settings" },
      { keys: "G then K", label: "Go to API keys" },
    ],
  },
  {
    section: "ACTIONS",
    items: [
      { keys: "N", label: "New publish" },
      { keys: "R", label: "Reload current view" },
    ],
  },
  {
    section: "OVERLAYS",
    items: [
      { keys: "?", label: "Show this panel" },
      { keys: "Esc", label: "Close any open overlay" },
    ],
  },
];

export function ShortcutOverlay() {
  const { shortcutsOpen, setShortcutsOpen } = useAppShell();
  if (!shortcutsOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close shortcuts"
        onClick={() => setShortcutsOpen(false)}
        className="fixed inset-0 z-[70] bg-canvas/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="fixed left-1/2 top-1/2 z-[75] w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 border border-hairline bg-canvas-deep shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-5 py-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              § KEYBOARD SHORTCUTS
            </div>
            <div className="mt-0.5 font-display text-[18px] font-black tracking-[-0.02em] text-ink">
              Get around faster.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShortcutsOpen(false)}
            aria-label="Close"
            className="text-ink-faint transition-colors hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          {SHORTCUTS.map((group, gi) => (
            <div key={group.section} className={gi > 0 ? "mt-5" : ""}>
              <div className="mb-2 font-mono text-[9.5px] font-medium tracking-[0.14em] text-accent">
                {group.section}
              </div>
              <ul>
                {group.items.map((item) => (
                  <li
                    key={item.label}
                    className="grid grid-cols-[100px_1fr] items-center gap-3 border-b border-hairline py-2 last:border-b-0"
                  >
                    <kbd className="border border-hairline bg-canvas px-2 py-0.5 text-center font-mono text-[11px] font-medium text-ink">
                      {item.keys}
                    </kbd>
                    <span className="font-body text-[13px] text-ink-softer">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
