"use client";

import { useAppShell } from "@/components/overlays/AppShellProvider";

/**
 * Bottom status bar, persistent across the authenticated app.
 * Fixed footer in the app column flex layout (see app/app/layout.tsx).
 */
export function StatusBar() {
  const { setShortcutsOpen } = useAppShell();

  return (
    <footer className="z-30 flex h-[28px] shrink-0 items-center justify-between border-t border-hairline bg-canvas-deep px-4 font-mono text-[10.5px] tracking-[0.06em] text-ink-faint">
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
