"use client";

import { useEffect, useState } from "react";
import { useAppShell } from "@/components/overlays/AppShellProvider";
import type { ApiKey } from "@/lib/types";

const SCOPE_LABELS: Record<string, string> = {
  "modules:read": "read modules",
  "modules:publish": "publish modules",
  "builds:read": "read build history",
  "sandbox:create": "create sandboxes",
  "status:read": "read status metrics",
};

const AVAILABLE_SCOPES = [
  "modules:read",
  "modules:publish",
  "builds:read",
  "sandbox:create",
  "status:read",
];

function formatAge(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Client component that owns the api keys list. On mount it fetches the
 * live keys from /api/keys. Creating a new key reveals the full token
 * once, in a dismissible panel; after that only the masked form is ever
 * returned by the API.
 */
export function ApiKeysManager() {
  const { pushToast } = useAppShell();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["modules:read"]);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/keys", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { keys: ApiKey[] }) => {
        if (!cancelled) setKeys(data.keys);
      })
      .catch(() => {
        if (!cancelled) pushToast("error", "Could not load API keys");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyLabel.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/keys/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newKeyLabel.trim(), scopes: newKeyScopes }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        pushToast("error", err.error ?? "Could not create key");
        return;
      }
      const data = (await res.json()) as { key: ApiKey; fullToken: string };
      setKeys((prev) => [data.key, ...prev]);
      setRevealedToken(data.fullToken);
      setNewKeyLabel("");
      setNewKeyScopes(["modules:read"]);
      pushToast("success", "Key created, copy it now");
    } catch {
      pushToast("error", "Network error, key not created");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    const prev = keys;
    setKeys((current) => current.filter((k) => k.id !== id));
    try {
      const res = await fetch(`/api/keys/${id}/revoke`, { method: "POST" });
      if (!res.ok) throw new Error("revoke failed");
      pushToast("info", "Key revoked, cached sessions invalidated");
    } catch {
      setKeys(prev);
      pushToast("error", "Could not revoke, please retry");
    }
  }

  function toggleScope(scope: string) {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  return (
    <>
      {/* One time reveal panel */}
      {revealedToken && (
        <div className="mb-6 border border-accent bg-accent/[0.06] p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
              COPY THIS TOKEN NOW
            </div>
            <button
              type="button"
              onClick={() => setRevealedToken(null)}
              className="font-mono text-[10.5px] text-ink-mute transition-colors hover:text-ink"
            >
              dismiss
            </button>
          </div>
          <p className="mb-3 font-body text-[12.5px] leading-[1.55] text-ink-softer">
            This is the only time you will see the full token. Flareo stores a
            salted hash. If you lose it, revoke the key and generate a new one.
          </p>
          <div className="flex items-center gap-2 border border-hairline bg-canvas p-3">
            <code className="flex-1 overflow-x-auto font-mono text-[13px] text-ink">
              {revealedToken}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(revealedToken);
                pushToast("success", "Token copied to clipboard");
              }}
              className="border border-hairline bg-canvas-panel px-3 py-1 font-mono text-[11px] text-ink-mute transition-colors hover:border-accent hover:text-accent"
            >
              copy
            </button>
          </div>
        </div>
      )}

      {/* New key form */}
      <form
        onSubmit={createKey}
        className="mb-6 border border-hairline bg-canvas-deep p-5"
      >
        <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
          GENERATE NEW KEY
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <input
            type="text"
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
            placeholder="Label, for example: CI · GitHub Actions"
            className="border border-hairline bg-canvas px-4 py-2.5 font-mono text-[13px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating || !newKeyLabel.trim()}
            className="bg-accent px-5 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
          >
            {creating ? "generating" : "generate key"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            SCOPES:
          </span>
          {AVAILABLE_SCOPES.map((scope) => {
            const active = newKeyScopes.includes(scope);
            return (
              <button
                key={scope}
                type="button"
                onClick={() => toggleScope(scope)}
                className={`border px-2 py-0.5 font-mono text-[10.5px] tracking-[0.02em] transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-hairline text-ink-mute hover:border-ink-ghost hover:text-ink"
                }`}
                title={SCOPE_LABELS[scope] ?? scope}
              >
                {scope}
              </button>
            );
          })}
        </div>
      </form>

      {/* Notice */}
      <div className="mb-6 flex items-start gap-3 border border-warn/40 bg-warn/[0.04] p-4">
        <span className="mt-0.5 block h-2 w-2 shrink-0 rounded-full bg-warn" />
        <div>
          <div className="mb-1 font-mono text-[10.5px] font-medium tracking-[0.14em] text-warn">
            KEYS ARE SHOWN ONCE
          </div>
          <p className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
            Flareo stores a salted hash. We cannot recover a lost key. If you
            lose access, revoke the key and generate a new one.
          </p>
        </div>
      </div>

      {/* Keys table */}
      <div className="border border-hairline bg-canvas-deep">
        <div className="grid grid-cols-[2fr_200px_110px_110px_80px] gap-4 border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint">
          <div>LABEL &middot; TOKEN</div>
          <div>SCOPES</div>
          <div className="text-right">CREATED</div>
          <div className="text-right">LAST USED</div>
          <div className="text-right">ACTIONS</div>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center font-mono text-[11px] text-ink-faint">
            Loading keys
          </div>
        ) : keys.length === 0 ? (
          <div className="px-5 py-8 text-center font-mono text-[11px] text-ink-ghost">
            No keys yet. Generate one above.
          </div>
        ) : (
          keys.map((k, i) => (
            <div
              key={k.id}
              className={`grid grid-cols-[2fr_200px_110px_110px_80px] items-center gap-4 px-5 py-4 ${
                i < keys.length - 1 ? "border-b border-hairline" : ""
              }`}
            >
              <div>
                <div className="mb-1.5 font-body text-[13px] text-ink">
                  {k.label}
                </div>
                <div className="font-mono text-[11px] text-accent">
                  {k.maskedToken}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {k.scopes.map((s) => (
                  <span
                    key={s}
                    className="border border-hairline bg-canvas px-1.5 py-0 font-mono text-[9.5px] tracking-[0.02em] text-ink-mute"
                    title={SCOPE_LABELS[s] ?? s}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="text-right font-mono text-[11px] text-ink-softer">
                {formatAge(k.createdAt)}
              </div>
              <div
                className={`text-right font-mono text-[11px] ${
                  k.lastUsedAt ? "text-ink-mute" : "text-ink-ghost"
                }`}
              >
                {formatAge(k.lastUsedAt)}
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => revokeKey(k.id)}
                  className="font-mono text-[10.5px] tracking-[0.08em] text-warn transition-colors hover:text-bad"
                >
                  revoke
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
