"use client";

import { useAppShell } from "@/components/overlays/AppShellProvider";

/**
 * Bottom status bar, persistent across the authenticated app.
 * Shows pipeline state, current job, region, and a keyboard-shortcut hint.
 *
 * Positioning: `sticky bottom-0` rather than `fixed bottom-0`. Two
 * reasons to prefer sticky here:
 *   1. The bordered max-w-[1440px] shell in app/app/layout.tsx centers
 *      its content on wide monitors. A `fixed` strip pinned to the
 *      viewport bottom doesn't track that — it would extend past the
 *      shell's right edge into the gutter. Sticky scopes the bar to
 *      its parent column.
 *   2. We no longer need the hardcoded `left-[220px]` offset to clear
 *      the sidebar — being a sibling of the main column inside the
 *      flex shell means the sidebar takes its own width and we just
 *      sit in the remaining space.
 *
 * Render contract: this component is rendered inside the main
 * content column (the flex-1 div in app/app/layout.tsx), AFTER
 * `<main>`, so it sits at the bottom of the column and sticks there
 * as the user scrolls.
 */
export function StatusBar() {
  const { setShortcutsOpen } = useAppShell();

  return (
    <footer className="sticky bottom-0 z-30 flex h-[28px] items-center justify-between border-t border-hairline bg-canvas-deep px-4 font-mono text-[10.5px] tracking-[0.06em] text-ink-faint">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-good">
          <span className="block h-1.5 w-1.5 rounded-full bg-good meta-pulse" />
          pipeline healthy
        </span>
        <span className="text-ink-ghost">·</span>
        <span>
          <span className="text-ink-ghost">running:</span>{" "}
          <span className="text-ink-mute">1 job · forgejo #0853</span>
        </span>
        <span className="text-ink-ghost">·</span>
        <span>
          <span className="text-ink-ghost">queued:</span>{" "}
          <span className="text-ink-mute">0</span>
        </span>
        <span className="text-ink-ghost">·</span>
        <span>
          <span className="text-ink-ghost">region:</span>{" "}
          <span className="text-ink-mute">us-east-1</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span>v0.4.2</span>
        <span className="text-ink-ghost">·</span>
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="transition-colors hover:text-ink"
        >
          press ? for shortcuts
        </button>
      </div>
    </footer>
  );
}
