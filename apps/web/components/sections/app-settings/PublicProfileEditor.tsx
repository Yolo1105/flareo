"use client";

import { useState } from "react";
import { useAppShell } from "@/components/overlays/AppShellProvider";
import { usernameError } from "@/lib/validation/username";

interface Props {
  initialUsername: string | null;
  initialBio: string;
  initialWebsiteUrl: string;
}

/**
 * Public-profile editor — username, bio, website URL. Separate from
 * `ProfileEditor` above because:
 *   - it hits a different endpoint (/api/v1/account/profile)
 *   - the username field has a 24-hour cooldown between changes
 *   - it shows a live preview of the /@username URL as the user types
 *
 * Username validation runs client-side for fast feedback (before any
 * network hop) and then again on the server; both use the same
 * `usernameError` function to keep the rules in sync.
 */
export function PublicProfileEditor({
  initialUsername,
  initialBio,
  initialWebsiteUrl,
}: Props) {
  const { pushToast } = useAppShell();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [bio, setBio] = useState(initialBio);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState({
    username: initialUsername ?? "",
    bio: initialBio,
    websiteUrl: initialWebsiteUrl,
  });

  const usernameErr = username ? usernameError(username) : null;
  const dirty =
    username !== saved.username ||
    bio !== saved.bio ||
    websiteUrl !== saved.websiteUrl;
  const canSave = dirty && !usernameErr && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (username !== saved.username) payload.username = username;
      if (bio !== saved.bio) payload.bio = bio;
      if (websiteUrl !== saved.websiteUrl) payload.websiteUrl = websiteUrl;

      const res = await fetch("/api/v1/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        pushToast(
          "error",
          body.error?.message ?? "Couldn't save public profile.",
        );
        return;
      }
      setSaved({ username, bio, websiteUrl });
      pushToast("success", "Public profile updated.");
    } catch {
      pushToast("error", "Network error — try again?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-8">
      <div className="mb-4 border-b border-hairline pb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
        § PUBLIC PROFILE
      </div>
      <div className="border border-hairline bg-canvas-deep p-5">
        <p className="mb-5 font-body text-[12.5px] leading-[1.55] text-ink-softer">
          Visible on{" "}
          <code className="bg-canvas px-1.5 text-ink">
            flareo.app/@{saved.username || "yourname"}
          </code>
          . Anyone can see this page, signed in or not.
        </p>

        {/* Username */}
        <label className="mb-5 block">
          <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
            USERNAME
          </span>
          <div className="flex items-stretch">
            <span className="border border-r-0 border-hairline bg-canvas px-3 py-2 font-mono text-[13px] text-ink-ghost">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={30}
              className={`flex-1 border px-3 py-2 font-mono text-[13px] text-ink focus:outline-none ${
                usernameErr
                  ? "border-bad focus:border-bad"
                  : "border-hairline focus:border-accent"
              }`}
              placeholder="yourhandle"
            />
          </div>
          {usernameErr ? (
            <span className="mt-1 block font-mono text-[11px] text-bad">
              {usernameErr}
            </span>
          ) : (
            <span className="mt-1 block font-mono text-[11px] text-ink-ghost">
              Changing your username is limited to once every 24 hours.
            </span>
          )}
        </label>

        {/* Bio */}
        <label className="mb-5 block">
          <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
            BIO
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full border border-hairline bg-canvas px-3 py-2 font-body text-[13px] text-ink focus:border-accent focus:outline-none"
            placeholder="Self-hosting enthusiast. Ships modules for homelab workloads."
          />
          <span className="mt-1 block text-right font-mono text-[11px] text-ink-ghost">
            {bio.length} / 500
          </span>
        </label>

        {/* Website */}
        <label className="mb-5 block">
          <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
            WEBSITE (optional)
          </span>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            maxLength={200}
            placeholder="https://example.com"
            className="w-full border border-hairline bg-canvas px-3 py-2 font-mono text-[13px] text-ink focus:border-accent focus:outline-none"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canSave}
            onClick={save}
            className="bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
          >
            {saving ? "Saving…" : "Save public profile"}
          </button>
          {saved.username && (
            <a
              href={`/@${saved.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-accent hover:text-accent-hot"
            >
              view your public page →
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
