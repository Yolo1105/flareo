"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * AppShellProvider — React context for the authenticated app chrome:
 * toast stack, notification drawer open state, command-palette open state,
 * and shortcut-overlay open state. Using a single provider keeps the shell
 * state shareable across TopBar, StatusBar, and Sidebar.
 */

interface Toast {
  id: string;
  kind: "info" | "success" | "error";
  message: string;
}

interface AppShellContext {
  toasts: Toast[];
  pushToast: (kind: Toast["kind"], message: string) => void;
  dismissToast: (id: string) => void;

  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;

  cmdOpen: boolean;
  setCmdOpen: (open: boolean) => void;

  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
}

const Ctx = createContext<AppShellContext | null>(null);

export function useAppShell(): AppShellContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppShell must be used within AppShellProvider");
  return v;
}

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const toastId = useRef(0);
  const router = useRouter();

  const pushToast = useCallback((kind: Toast["kind"], message: string) => {
    const id = `t-${++toastId.current}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Global keyboard shortcuts.
   *
   * The advertised set in ShortcutOverlay:
   *   Cmd+K : open command palette
   *   ?      : open this overlay
   *   Esc    : close any open overlay
   *   g h    : go to dashboard
   *   g m    : go to my modules
   *   g p    : go to publish
   *   g a    : go to admin
   *   n      : start a new publish
   *   r      : reload current view
   *
   * The `g` prefix uses a small state machine: pressing g arms a pending
   * flag for 1200 ms, during which the next key is consumed as the target.
   * While any text field is focused we let keys through so users can type.
   */
  useEffect(() => {
    let gPending = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    function clearPending() {
      gPending = false;
      if (gTimer) {
        clearTimeout(gTimer);
        gTimer = null;
      }
    }

    function isTyping(target: EventTarget | null): boolean {
      if (!target) return false;
      const el = target as HTMLElement;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        clearPending();
        return;
      }

      if (e.key === "Escape") {
        setCmdOpen(false);
        setShortcutsOpen(false);
        setNotifOpen(false);
        clearPending();
        return;
      }

      if (isTyping(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        clearPending();
        return;
      }

      if (gPending) {
        const consumed = true;
        switch (e.key.toLowerCase()) {
          case "h":
            router.push("/app");
            break;
          case "m":
            router.push("/app/modules");
            break;
          case "p":
            router.push("/app/publish");
            break;
          case "a":
            router.push("/app/admin");
            break;
          case "j":
            router.push("/app/jobs");
            break;
          case "s":
            router.push("/app/settings");
            break;
          case "k":
            router.push("/app/settings/api-keys");
            break;
          default:
            // not a recognized target, fall through
            break;
        }
        clearPending();
        if (consumed) e.preventDefault();
        return;
      }

      if (e.key.toLowerCase() === "g") {
        gPending = true;
        gTimer = setTimeout(clearPending, 1200);
        return;
      }

      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/app/publish");
        return;
      }

      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        router.refresh();
        return;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearPending();
    };
  }, [router]);

  const value = useMemo<AppShellContext>(
    () => ({
      toasts,
      pushToast,
      dismissToast,
      notifOpen,
      setNotifOpen,
      cmdOpen,
      setCmdOpen,
      shortcutsOpen,
      setShortcutsOpen,
    }),
    [toasts, pushToast, dismissToast, notifOpen, cmdOpen, shortcutsOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
