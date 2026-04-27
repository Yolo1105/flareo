"use client";

import { useState } from "react";
import { useAppShell } from "@/components/overlays/AppShellProvider";
import { SOFT_DELETE_GRACE_MS } from "@/lib/auth/constants";

interface Props {
  email: string;
  /** If the account is already scheduled for deletion, we render a
   * different UI — just showing the status and the escape hatch. */
  scheduledAt: string | null;
}

/**
 * Delete-account confirmation form.
 *
 * Implements a "type-to-confirm" pattern: user must type their email
 * character-for-character before the delete button enables. Matches
 * the GitHub repo-delete flow that people know.
 */
export function DeleteAccountForm({ email, scheduledAt }: Props) {
  const { pushToast } = useAppShell();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const matches =
    confirm.trim().length > 0 &&
    confirm.trim().toLowerCase() === email.toLowerCase();
  const canDelete = matches && !deleting && !done;

  async function doDelete() {
    if (!canDelete) return;
    if (
      !confirm.trim() ||
      !window.confirm(
        `Really delete ${email}? You have 30 days to reverse this.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/v1/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmText: confirm.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        pushToast("error", body.error?.message ?? "Could not schedule deletion.");
        return;
      }
      setDone(true);
      pushToast("success", "Account scheduled for deletion. Signing you out…");
      // Every session got revoked by the server; redirect to /login.
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch {
      pushToast("error", "Network error.");
    } finally {
      setDeleting(false);
    }
  }

  if (scheduledAt) {
    const deleteDate = new Date(
      new Date(scheduledAt).getTime() + SOFT_DELETE_GRACE_MS
    );
    return (
      <div className="border border-warn bg-warn/[0.04] p-5">
        <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-warn">
          ALREADY SCHEDULED
        </div>
        <p className="mb-3 font-body text-[13px] leading-[1.6] text-ink">
          Your account is scheduled for permanent deletion on{" "}
          <strong>{deleteDate.toLocaleDateString()}</strong> (
          {Math.max(
            0,
            Math.round(
              (deleteDate.getTime() - Date.now()) / 86400000
            )
          )}{" "}
          days from now).
        </p>
        <p className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
          To cancel, email{" "}
          <a
            href="mailto:privacy@flareo.dev"
            className="text-accent underline"
          >
            privacy@flareo.dev
          </a>{" "}
          from <strong>{email}</strong> and we&apos;ll restore the
          account. Most restores are processed within one business day.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="border border-warn bg-warn/[0.04] p-5">
        <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-warn">
          DONE
        </div>
        <p className="font-body text-[13px] text-ink">
          Account scheduled. Signing you out in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-warn/40 bg-canvas-deep p-5">
      <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-warn">
        DELETE ACCOUNT
      </div>
      <p className="mb-4 font-body text-[13px] leading-[1.6] text-ink">
        This starts a 30-day countdown. During those 30 days you can
        email{" "}
        <a
          href="mailto:privacy@flareo.dev"
          className="text-accent underline"
        >
          privacy@flareo.dev
        </a>{" "}
        to reverse it. After 30 days the account is permanently
        deleted and cannot be recovered.
      </p>

      <ul className="mb-5 ml-5 list-disc space-y-1 font-body text-[12.5px] leading-[1.55] text-ink-softer">
        <li>All your API keys are revoked immediately</li>
        <li>All active sessions are signed out</li>
        <li>
          Public modules you&apos;ve published stay in the catalog.
          Email us if you want them removed.
        </li>
        <li>
          Waitlist signups, if any, are preserved (they key on email,
          not user id)
        </li>
      </ul>

      <div className="mb-3 font-mono text-[11px] text-ink-faint">
        Type{" "}
        <code className="bg-canvas-panel px-1.5 text-ink">{email}</code>{" "}
        to confirm:
      </div>
      <input
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={email}
        aria-label="Type your email to confirm deletion"
        className="mb-4 w-full border border-hairline bg-canvas px-3 py-2 font-mono text-[13px] text-ink focus:border-warn focus:outline-none"
      />

      <button
        type="button"
        onClick={doDelete}
        disabled={!canDelete}
        className="border border-warn bg-transparent px-4 py-2 font-body text-[12px] font-medium text-warn transition-colors hover:bg-warn/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {deleting ? "scheduling…" : "Delete my account"}
      </button>
    </div>
  );
}
