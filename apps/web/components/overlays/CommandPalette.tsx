"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "./AppShellProvider";
import { MODULES } from "@/lib/data/modules";
import { cn } from "@/lib/utils/cn";

/**
 * Cmd+K palette — fuzzy search over pages, modules, and quick actions.
 * Keyboard-first: ↑↓ to move, Enter to execute, Esc to close.
 */

type PaletteItem = {
  id: string;
  section: string;
  label: string;
  hint?: string;
  href: string;
};

const PAGES: PaletteItem[] = [
  { id: "pg-home", section: "Pages", label: "Dashboard", hint: "/app", href: "/app" },
  { id: "pg-modules", section: "Pages", label: "My modules", hint: "/app/modules", href: "/app/modules" },
  { id: "pg-publish", section: "Pages", label: "Publish a module", hint: "/app/publish", href: "/app/publish" },
  { id: "pg-admin", section: "Pages", label: "Admin queue", hint: "/app/admin", href: "/app/admin" },
  { id: "pg-settings", section: "Pages", label: "Settings", hint: "/app/settings", href: "/app/settings" },
  { id: "pg-keys", section: "Pages", label: "API keys", hint: "/app/settings/api-keys", href: "/app/settings/api-keys" },
  { id: "pg-catalog", section: "Public", label: "Browse catalog", hint: "/catalog", href: "/catalog" },
  { id: "pg-verify", section: "Public", label: "Verify an image", hint: "/verify", href: "/verify" },
  { id: "pg-status", section: "Public", label: "System status", hint: "/status", href: "/status" },
  { id: "pg-docs", section: "Public", label: "CLI reference", hint: "/docs/cli", href: "/docs/cli" },
];

export function CommandPalette() {
  const { cmdOpen, setCmdOpen } = useAppShell();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when opened, clear on close
  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
      setActive(0);
    }
  }, [cmdOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const all: PaletteItem[] = [
      ...PAGES,
      ...MODULES.map((m) => ({
        id: `mod-${m.slug}`,
        section: "Modules",
        label: m.name.toLowerCase() + " — " + m.description,
        hint: `/modules/${m.slug}`,
        href: `/modules/${m.slug}`,
      })),
    ];
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter((it) => it.label.toLowerCase().includes(q));
  }, [query]);

  // Clamp active index when results change
  useEffect(() => {
    if (active >= items.length) setActive(0);
  }, [items, active]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (items.length ? (a + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (items.length ? (a - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = items[active];
      if (chosen) {
        router.push(chosen.href);
        setCmdOpen(false);
      }
    }
  }

  if (!cmdOpen) return null;

  // Group items by section for display
  const grouped: { section: string; items: PaletteItem[] }[] = [];
  for (const it of items) {
    const existing = grouped.find((g) => g.section === it.section);
    if (existing) existing.items.push(it);
    else grouped.push({ section: it.section, items: [it] });
  }

  let idx = 0;

  return (
    <>
      <button
        type="button"
        aria-label="Close palette"
        onClick={() => setCmdOpen(false)}
        className="fixed inset-0 z-[70] bg-canvas/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="fixed left-1/2 top-[15vh] z-[75] w-full max-w-[560px] -translate-x-1/2 border border-hairline bg-canvas-deep shadow-2xl"
      >
        {/* Input */}
        <div className="border-b border-hairline">
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="font-mono text-[13px] text-accent">$</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search modules, pages, or type a command..."
              className="flex-1 bg-transparent font-mono text-[14px] text-ink placeholder:text-ink-ghost focus:outline-none"
            />
            <kbd className="border border-hairline bg-canvas px-1.5 py-0.5 font-mono text-[9.5px] text-ink-faint">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-5 py-8 text-center font-mono text-[12px] text-ink-faint">
              No results for <span className="text-ink">&quot;{query}&quot;</span>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.section}>
                <div className="border-b border-hairline bg-canvas-panel px-5 py-1.5 font-mono text-[9.5px] font-medium tracking-[0.14em] text-ink-faint">
                  {group.section.toUpperCase()}
                </div>
                {group.items.map((it) => {
                  const isActive = idx === active;
                  const thisIdx = idx++;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onMouseEnter={() => setActive(thisIdx)}
                      onClick={() => {
                        router.push(it.href);
                        setCmdOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-4 border-b border-hairline px-5 py-2.5 text-left transition-colors",
                        isActive ? "bg-accent/[0.06]" : "bg-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "truncate font-body text-[13px]",
                          isActive ? "text-ink" : "text-ink-mute"
                        )}
                      >
                        {it.label}
                      </span>
                      {it.hint && (
                        <span
                          className={cn(
                            "font-mono text-[10.5px] tracking-[0.02em]",
                            isActive ? "text-accent" : "text-ink-ghost"
                          )}
                        >
                          {it.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-hairline bg-canvas-panel px-5 py-2 font-mono text-[10px] tracking-[0.06em] text-ink-ghost">
          <div className="flex gap-3">
            <span>
              <kbd className="mr-1 border border-hairline bg-canvas px-1 text-ink-mute">↑↓</kbd>
              navigate
            </span>
            <span>
              <kbd className="mr-1 border border-hairline bg-canvas px-1 text-ink-mute">⏎</kbd>
              open
            </span>
          </div>
          <span>{items.length} result{items.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </>
  );
}
