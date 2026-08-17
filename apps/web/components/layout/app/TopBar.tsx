"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/overlays/AppShellProvider";
import { getRouteBreadcrumbs } from "@/lib/data/route-titles";
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
  const crumbs = getRouteBreadcrumbs(pathname);

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

  return (
    <header className="z-40 flex h-[48px] shrink-0 items-center justify-between border-b border-hairline bg-canvas-deep pl-5 pr-4">
      <nav className="flex items-center gap-1.5 font-mono text-[11.5px] tracking-[0.04em] text-ink-faint">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink-ghost">/</span>}
              {isLast ? (
                <span className="text-ink">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="text-ink-mute transition-colors hover:text-accent"
                >
                  {c.label}
                </Link>
              )}
            </span>
          );
        })}
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
          className="group relative border border-hairline bg-canvas p-1.5 text-ink-mute transition-colors hover:border-ink-ghost hover:text-accent"
          aria-label={`${unread} unread notifications`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            className="transition-transform duration-150 group-hover:scale-110"
          >
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
