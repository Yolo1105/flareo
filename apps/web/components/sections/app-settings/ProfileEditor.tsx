"use client";

import { useState } from "react";
import { useAppShell } from "@/components/overlays/AppShellProvider";

interface Props {
  initialName: string;
  email: string | null;
  githubLogin: string | null;
  createdAt: string;
  emailVerified: boolean;
}

/**
 * Profile editor — the inline form at the top of /app/settings.
 *
 * The name is editable with a save button; email and GitHub binding
 * are read-only for now. Email changes need an email-verify round-trip
 * which is a separate flow (see /app/settings/email, TBD).
 */
export function ProfileEditor({
  initialName,
  email,
  githubLogin,
  createdAt,
  emailVerified,
}: Props) {
  const { pushToast } = useAppShell();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  // Keep the last-saved value so we can tell "is this dirty?" without
  // forcing the user to remember what they typed. On success we advance
  // the baseline; on failure we don't.
  const [savedName, setSavedName] = useState(initialName);

  const dirty = name !== savedName;
  const canSave = dirty && name.trim().length > 0 && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        pushToast("error", body.error?.message ?? "Could not save. Try again?");
        return;
      }
      const data = (await res.json()) as { name: string };
      setSavedName(data.name);
      setName(data.name);
      pushToast("success", "Profile updated.");
    } catch {
      pushToast("error", "Network error — try again?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-8">
      <div className="mb-4 border-b border-hairline pb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
        § PROFILE
      </div>
      <div className="border border-hairline bg-canvas-deep">
        {/* Name — editable */}
        <div className="grid grid-cols-[220px_1fr_80px] items-center gap-4 border-b border-hairline px-5 py-3.5">
          <div className="font-mono text-[11.5px] tracking-[0.04em] text-ink-faint">
            Display name
          </div>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              disabled={saving}
              aria-label="Display name"
              className="w-full border border-hairline bg-canvas px-3 py-1.5 font-body text-[13px] text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="font-mono text-[10.5px] tracking-[0.08em] text-accent transition-colors hover:text-accent-hot disabled:cursor-not-allowed disabled:text-ink-ghost"
            >
              {saving ? "saving…" : dirty ? "save →" : "saved"}
            </button>
          </div>
        </div>

        {/* Email — read-only */}
        <div className="grid grid-cols-[220px_1fr_80px] items-center gap-4 border-b border-hairline px-5 py-3.5">
          <div className="font-mono text-[11.5px] tracking-[0.04em] text-ink-faint">
            Email
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body text-[13px] text-ink">
              {email ?? "—"}
            </span>
            {emailVerified ? (
              <span className="font-mono text-[10px] tracking-[0.08em] text-good">
                verified
              </span>
            ) : (
              <span className="font-mono text-[10px] tracking-[0.08em] text-warn">
                unverified
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] tracking-[0.08em] text-ink-ghost">
              locked
            </span>
          </div>
        </div>

        {/* GitHub — read-only */}
        <div className="grid grid-cols-[220px_1fr_80px] items-center gap-4 border-b border-hairline px-5 py-3.5">
          <div className="font-mono text-[11.5px] tracking-[0.04em] text-ink-faint">
            GitHub
          </div>
          <div className="font-body text-[13px] text-ink">
            {githubLogin ? `@${githubLogin}` : "not linked"}
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] tracking-[0.08em] text-ink-ghost">
              locked
            </span>
          </div>
        </div>

        {/* Member since — read-only */}
        <div className="grid grid-cols-[220px_1fr_80px] items-center gap-4 px-5 py-3.5">
          <div className="font-mono text-[11.5px] tracking-[0.04em] text-ink-faint">
            Member since
          </div>
          <div className="font-body text-[13px] text-ink">
            {new Date(createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] tracking-[0.08em] text-ink-ghost">
              locked
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
