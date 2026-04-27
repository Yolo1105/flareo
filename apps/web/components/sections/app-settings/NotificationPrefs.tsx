"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppShell } from "@/components/overlays/AppShellProvider";

interface Prefs {
  security: boolean;
  submission: boolean;
  product: boolean;
  marketing: boolean;
}

interface Row {
  key: keyof Prefs;
  label: string;
  description: string;
  // If true, we nudge the user toward keeping it on (for security
  // advisories) — but they can still disable it.
  recommended: boolean;
}

const ROWS: Row[] = [
  {
    key: "security",
    label: "Security advisories",
    description:
      "New CVEs discovered in modules you've pulled or subscribed to. Usually fewer than 2 per month.",
    recommended: true,
  },
  {
    key: "submission",
    label: "Submission decisions",
    description:
      "When a reviewer accepts or rejects a module you've published via `flareo publish`.",
    recommended: true,
  },
  {
    key: "product",
    label: "Product updates",
    description:
      "A monthly digest of changelog entries and new modules. Turn off if you follow @flareodev elsewhere.",
    recommended: false,
  },
  {
    key: "marketing",
    label: "Marketing",
    description:
      "Launch announcements and occasional milestone emails. Rare by design. OFF by default.",
    recommended: false,
  },
];

export function NotificationPrefs() {
  const { pushToast } = useAppShell();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<keyof Prefs | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/account/notifications", {
        cache: "no-store",
      });
      if (!res.ok) {
        pushToast("error", "Could not load preferences.");
        return;
      }
      const data = (await res.json()) as Prefs;
      setPrefs(data);
    } catch {
      pushToast("error", "Network error.");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(key: keyof Prefs) {
    if (!prefs) return;
    const next = !prefs[key];
    // Optimistic update — roll back on server error.
    setPrefs({ ...prefs, [key]: next });
    setPendingKey(key);
    try {
      const res = await fetch("/api/v1/account/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [key]: next }),
      });
      if (!res.ok) {
        setPrefs((p) => (p ? { ...p, [key]: !next } : p));
        pushToast("error", "Could not save. Try again?");
        return;
      }
      const data = (await res.json()) as Prefs;
      setPrefs(data);
    } catch {
      setPrefs((p) => (p ? { ...p, [key]: !next } : p));
      pushToast("error", "Network error.");
    } finally {
      setPendingKey(null);
    }
  }

  if (loading || !prefs) {
    return (
      <div className="border border-hairline bg-canvas-deep p-5 font-mono text-[11px] text-ink-ghost">
        loading preferences…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-hairline bg-canvas-deep">
        {ROWS.map((row, i) => {
          const isLast = i === ROWS.length - 1;
          const value = prefs[row.key];
          const pending = pendingKey === row.key;
          return (
            <div
              key={row.key}
              className={`grid grid-cols-[1fr_auto] items-start gap-6 px-5 py-4 ${
                isLast ? "" : "border-b border-hairline"
              }`}
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <div className="font-body text-[13.5px] font-medium text-ink">
                    {row.label}
                  </div>
                  {row.recommended && (
                    <span className="font-mono text-[9.5px] tracking-[0.1em] text-accent">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-[460px] font-body text-[12px] leading-[1.5] text-ink-softer">
                  {row.description}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  aria-label={`Toggle ${row.label}`}
                  onClick={() => toggle(row.key)}
                  disabled={pending}
                  className={`relative inline-flex h-5 w-9 items-center transition-colors ${
                    value
                      ? "bg-accent"
                      : "border border-hairline bg-canvas-panel"
                  }`}
                >
                  <span
                    className={`absolute h-3 w-3 transform bg-canvas transition-transform ${
                      value ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="font-body text-[12px] leading-[1.5] text-ink-softer">
        Changes save automatically. To unsubscribe from a specific
        email after the fact, every message we send also has a
        one-click unsubscribe link in the footer.
      </p>
    </div>
  );
}
