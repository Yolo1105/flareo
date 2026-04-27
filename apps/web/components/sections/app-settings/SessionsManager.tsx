"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppShell } from "@/components/overlays/AppShellProvider";

interface SessionRow {
  id: string;
  label: string;
  expires: string;
  isCurrent: boolean;
}

/**
 * Client component for /app/settings/sessions.
 *
 * Lists active sessions with per-row revoke buttons, plus a "sign out
 * everywhere" button that revokes them all (including the current one,
 * which triggers a logout).
 */
export function SessionsManager() {
  const { pushToast } = useAppShell();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/account/sessions", {
        cache: "no-store",
      });
      if (!res.ok) {
        pushToast("error", "Could not load sessions. Try again?");
        return;
      }
      const data = (await res.json()) as { sessions: SessionRow[] };
      setRows(data.sessions);
    } catch {
      pushToast("error", "Network error.");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/v1/account/sessions/${encodeURIComponent(id)}/revoke`,
        { method: "POST" }
      );
      if (!res.ok) {
        pushToast("error", "Could not revoke.");
        return;
      }
      setRows((r) => r.filter((row) => row.id !== id));
      pushToast("success", "Session revoked.");
    } catch {
      pushToast("error", "Network error.");
    } finally {
      setBusyId(null);
    }
  }

  async function revokeAll() {
    if (
      !confirm(
        "Sign out EVERY active session, including this one? You'll need to sign in again on every device."
      )
    ) {
      return;
    }
    setRevokingAll(true);
    try {
      const res = await fetch("/api/v1/account/sessions/revoke-others", {
        method: "POST",
      });
      if (!res.ok) {
        pushToast("error", "Could not revoke.");
        return;
      }
      // After this call, every session is gone. Navigate to /login;
      // Next.js will 401 the current request on the next paint anyway.
      window.location.href = "/login";
    } catch {
      pushToast("error", "Network error.");
      setRevokingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="border border-hairline bg-canvas-deep p-5 font-mono text-[11px] text-ink-ghost">
        loading sessions…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border border-hairline bg-canvas-deep p-5 font-body text-[13px] leading-[1.55] text-ink-softer">
        Per-device sessions aren&apos;t listed for this account (auth uses a
        signed browser session). To end access on this device, use{" "}
        <strong className="text-ink">Sign out</strong> from the app menu. To
        rotate credentials after a suspected compromise, change your GitHub or
        email provider password and sign out here.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="border border-hairline bg-canvas-deep">
        <div className="grid grid-cols-[1fr_180px_140px_90px] gap-4 border-b border-hairline px-5 py-2.5 font-mono text-[10px] tracking-[0.08em] text-ink-faint">
          <div>SESSION</div>
          <div>EXPIRES</div>
          <div>STATUS</div>
          <div className="text-right">ACTION</div>
        </div>
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          const daysLeft = Math.max(
            0,
            Math.round(
              (new Date(row.expires).getTime() - Date.now()) / 86400000
            )
          );
          return (
            <div
              key={row.id}
              className={`grid grid-cols-[1fr_180px_140px_90px] items-center gap-4 px-5 py-3.5 ${
                isLast ? "" : "border-b border-hairline"
              }`}
            >
              <div>
                <div className="font-mono text-[12px] text-ink">
                  {row.label}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-ink-ghost">
                  id: {row.id}
                </div>
              </div>
              <div className="font-mono text-[11.5px] text-ink-softer">
                in {daysLeft}d
              </div>
              <div>
                {row.isCurrent ? (
                  <span className="font-mono text-[10.5px] tracking-[0.08em] text-accent">
                    this session
                  </span>
                ) : (
                  <span className="font-mono text-[10.5px] tracking-[0.08em] text-good">
                    active
                  </span>
                )}
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => revoke(row.id)}
                  disabled={busyId === row.id}
                  className="font-mono text-[10.5px] tracking-[0.08em] text-warn transition-colors hover:text-warn/80 disabled:text-ink-ghost"
                >
                  {busyId === row.id ? "revoking…" : "revoke →"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-warn/40 bg-canvas-deep p-5">
        <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-warn">
          NUCLEAR OPTION
        </div>
        <p className="mb-4 font-body text-[12.5px] leading-[1.55] text-ink-softer">
          Sign out of every session, on every device. You&apos;ll need
          to sign in again here after clicking this button. Useful if
          you think a device has been lost or compromised.
        </p>
        <button
          type="button"
          onClick={revokeAll}
          disabled={revokingAll}
          className="border border-warn bg-transparent px-4 py-2 font-body text-[12px] font-medium text-warn transition-colors hover:bg-warn/[0.06] disabled:opacity-50"
        >
          {revokingAll ? "signing out…" : "Sign out everywhere"}
        </button>
      </div>
    </div>
  );
}
