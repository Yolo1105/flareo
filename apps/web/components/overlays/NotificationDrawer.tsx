"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppShell } from "./AppShellProvider";
import type { NotificationKind, NotificationItem } from "@/lib/types";

const KIND_COLORS: Record<NotificationKind, { label: string; class: string }> = {
  build_done: { label: "BUILD OK", class: "text-good border-good" },
  build_failed: { label: "BUILD FAIL", class: "text-bad border-bad" },
  security: { label: "SECURITY", class: "text-warn border-warn" },
  mention: { label: "MENTION", class: "text-accent border-accent" },
};

/**
 * Right side slide out drawer listing notifications.
 *
 * Fetches from /api/notifications on open. Mark-all-read calls the API,
 * then locally updates each item. State persists across reloads via the
 * SQLite layer under lib/db/sqlite.ts.
 */
export function NotificationDrawer() {
  const { notifOpen, setNotifOpen, pushToast } = useAppShell();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!notifOpen) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { notifications: NotificationItem[] }) => {
        if (cancelled) return;
        setItems(data.notifications);
      })
      .catch(() => {
        if (cancelled) return;
        pushToast("error", "Could not load notifications");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notifOpen, pushToast]);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      if (!res.ok) throw new Error("mark all read failed");
      pushToast("success", "All notifications marked read");
    } catch {
      pushToast("error", "Could not mark all read, please retry");
    }
  }

  async function handleClick(n: NotificationItem) {
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      fetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {
        /* keep optimistic update */
      });
    }
    setNotifOpen(false);
  }

  if (!notifOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        onClick={() => setNotifOpen(false)}
        className="fixed inset-0 z-50 bg-canvas/60 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="slidein fixed right-0 top-0 z-[55] flex h-screen w-[400px] flex-col border-l border-hairline bg-canvas-deep shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-5 py-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              NOTIFICATIONS
            </div>
            <div className="mt-0.5 font-display text-[18px] font-black tracking-[-0.02em] text-ink">
              Recent activity
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotifOpen(false)}
            aria-label="Close"
            className="text-ink-faint transition-colors hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="px-5 py-6 font-mono text-[11px] text-ink-faint">
              Loading notifications
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-8 text-center font-mono text-[11px] text-ink-ghost">
              No notifications yet
            </div>
          ) : (
            items.map((n, i) => {
              const kind = KIND_COLORS[n.kind];
              const inner = (
                <div
                  className={`border-b border-hairline px-5 py-4 transition-colors hover:bg-canvas-panel ${
                    !n.read ? "bg-accent/[0.02]" : ""
                  } ${i === items.length - 1 ? "border-b-0" : ""}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`border px-1.5 py-0 font-mono text-[9px] font-medium tracking-[0.12em] ${kind.class}`}
                    >
                      {kind.label}
                    </span>
                    {!n.read && (
                      <span className="block h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                    <span className="ml-auto font-mono text-[10px] tracking-[0.04em] text-ink-faint">
                      {n.at}
                    </span>
                  </div>
                  <h4 className="mb-1 font-body text-[13.5px] font-medium text-ink">
                    {n.title}
                  </h4>
                  <p className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
                    {n.body}
                  </p>
                </div>
              );
              return n.href ? (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => handleClick(n)}
                  className="block"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className="block w-full text-left"
                >
                  {inner}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-hairline bg-canvas-panel px-5 py-3">
          <button
            type="button"
            onClick={markAllRead}
            className="font-mono text-[10.5px] tracking-[0.08em] text-ink-mute transition-colors hover:text-ink"
          >
            Mark all read
          </button>
          <Link
            href="/app"
            onClick={() => setNotifOpen(false)}
            className="font-mono text-[10.5px] tracking-[0.08em] text-accent transition-colors hover:text-accent-hot"
          >
            VIEW ALL
          </Link>
        </div>
      </aside>
    </>
  );
}
