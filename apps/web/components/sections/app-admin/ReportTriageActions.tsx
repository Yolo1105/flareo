"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  reportId: string;
  currentState: "open" | "investigating";
}

/**
 * Triage actions on an admin report card. Admin can:
 *   - mark as investigating (open → investigating)
 *   - resolve with a note
 *   - dismiss with a note
 *
 * Resolved/dismissed are terminal — the card then doesn't render
 * this component at all.
 */
export function ReportTriageActions({ reportId, currentState }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "resolve" | "dismiss">("idle");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function triage(
    newState: "investigating" | "resolved" | "dismissed",
    withNote: string | null = null,
  ) {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/v1/admin/reports/${reportId}/triage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: newState, resolutionNote: withNote }),
        },
      );
      if (resp.ok) {
        router.refresh();
        return;
      }
      const err = (await resp.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      setError(err.error?.message ?? "Couldn't triage");
      setSubmitting(false);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  if (mode === "resolve" || mode === "dismiss") {
    return (
      <div className="space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={
            mode === "resolve"
              ? "What action did you take? (e.g. notified publisher, metadata corrected, module hidden)"
              : "Why is this being dismissed? (e.g. not reproducible, wrong channel, bad faith)"
          }
          className="w-full border border-hairline bg-canvas px-3 py-2 font-body text-[12.5px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
        />
        {error && (
          <div className="border border-bad bg-bad/[0.08] px-3 py-2 font-body text-[12px] text-bad">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              triage(
                mode === "resolve" ? "resolved" : "dismissed",
                note.trim() || null,
              )
            }
            className={`px-3 py-1.5 font-mono text-[11px] text-canvas disabled:opacity-50 ${
              mode === "resolve" ? "bg-good" : "bg-ink-mute"
            }`}
          >
            {submitting
              ? "…"
              : mode === "resolve"
                ? "Confirm resolve"
                : "Confirm dismiss"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("idle");
              setNote("");
              setError(null);
            }}
            className="font-mono text-[11px] text-ink-ghost hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {currentState === "open" && (
        <button
          type="button"
          disabled={submitting}
          onClick={() => triage("investigating")}
          className="border border-accent px-3 py-1.5 font-mono text-[11px] text-accent hover:bg-accent hover:text-canvas disabled:opacity-50"
        >
          {submitting ? "…" : "Start investigating"}
        </button>
      )}
      <button
        type="button"
        onClick={() => setMode("resolve")}
        className="border border-good px-3 py-1.5 font-mono text-[11px] text-good hover:bg-good hover:text-canvas"
      >
        Resolve…
      </button>
      <button
        type="button"
        onClick={() => setMode("dismiss")}
        className="border border-ink-mute px-3 py-1.5 font-mono text-[11px] text-ink-softer hover:border-ink hover:text-ink"
      >
        Dismiss…
      </button>
      {error && (
        <span className="self-center font-mono text-[11px] text-bad">
          {error}
        </span>
      )}
    </div>
  );
}
