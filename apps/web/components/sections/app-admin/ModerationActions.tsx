"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  reviewId: string;
  currentState: string;
}

export function ModerationActions({ reviewId, currentState }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function moderate(state: "visible" | "hidden") {
    setSubmitting(true);
    try {
      const resp = await fetch(
        `/api/v1/admin/reviews/${reviewId}/moderate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
        },
      );
      if (resp.ok) router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-2">
      {currentState !== "hidden" && (
        <button
          type="button"
          disabled={submitting}
          onClick={() => moderate("hidden")}
          className="border border-bad px-3 py-1.5 font-mono text-[11px] text-bad hover:bg-bad hover:text-canvas disabled:opacity-50"
        >
          {submitting ? "…" : "Hide review"}
        </button>
      )}
      {currentState === "hidden" && (
        <button
          type="button"
          disabled={submitting}
          onClick={() => moderate("visible")}
          className="border border-accent px-3 py-1.5 font-mono text-[11px] text-accent hover:bg-accent hover:text-canvas disabled:opacity-50"
        >
          {submitting ? "…" : "Restore"}
        </button>
      )}
      {currentState === "flagged" && (
        <button
          type="button"
          disabled={submitting}
          onClick={() => moderate("visible")}
          className="border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink-softer hover:border-accent hover:text-accent disabled:opacity-50"
        >
          Dismiss flag (keep visible)
        </button>
      )}
    </div>
  );
}
