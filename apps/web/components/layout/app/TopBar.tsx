"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/overlays/AppShellProvider";
import type { NotificationItem } from "@/lib/types";

/**
 * Top bar for the authenticated app. Breadcrumbs on the left, Cmd-K hint
 * and notification bell on the right.
 *
 * The unread badge polls /api/notifications on mount and again every 30s
 * so the count stays in sync after the drawer marks things read.
 */
export function TopBar() {
  const pathname = usePathname();
  const { setCmdOpen, setNotifOpen, notifOpen } = useAppShell();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    function refresh() {
      fetch("/api/notifications", { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { notifications: NotificationItem[] }) => {
          if (cancelled) return;
          setUnread(data.notifications.filter((n) => !n.read).length);
        })
        .catch(() => {
          /* quiet, the badge just stays stale */
        });
    }
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [notifOpen]);

  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let acc = "";
  for (const part of parts) {
    acc += "/" + part;
    crumbs.push({ label: part, href: acc });
  }

  return (
    <header className="sticky top-0 z-40 flex h-[48px] items-center justify-between border-b border-hairline bg-canvas-deep/95 pl-5 pr-4 backdrop-blur-md">
      <nav className="flex items-center gap-1.5 font-mono text-[11.5px] tracking-[0.04em] text-ink-faint">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-ink-ghost">/</span>}
            <span className={i === crumbs.length - 1 ? "text-ink" : "text-ink-mute"}>
              {c.label}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="flex items-center gap-2 border border-hairline bg-canvas px-3 py-1.5 font-mono text-[11px] text-ink-mute transition-colors hover:border-ink-ghost hover:text-ink"
        >
          <span>Search</span>
          <kbd className="border border-hairline bg-canvas-deep px-1 py-0 text-[9.5px] text-ink-faint">
            &#8984;K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          className="relative border border-hairline bg-canvas p-1.5 text-ink-mute transition-colors hover:border-ink-ghost hover:text-ink"
          aria-label={`${unread} unread notifications`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M4 6a4 4 0 018 0v3l1.5 2h-11L4 9V6z" strokeLinejoin="round" />
            <path d="M6.5 13a1.5 1.5 0 003 0" strokeLinecap="round" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 block h-3 min-w-[12px] rounded-full bg-accent px-0.5 text-center font-mono text-[8px] font-bold leading-[12px] text-canvas">
              {unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
