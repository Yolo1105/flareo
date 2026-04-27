"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/overlays/AppShellProvider";

interface Props {
  submissionId: string;
  status: string;
  canRetry: boolean;
  /**
   * True when the row is in `worker_failures` — it has exhausted the
   * system-failure retry budget and is parked awaiting human action.
   * A superset of canRetry=true plus a "give up and reject" option.
   */
  isDeadLettered: boolean;
  isTerminal: boolean;
}

type Mode = null | "approve" | "reject" | "request_changes" | "dlq_give_up";

const CHECKLIST = [
  "Dockerfile parses and uses approved base image",
  "No RUN commands reach the network",
  "Dependencies are vendored in context",
  "Final image drops to non-root USER",
  "ENTRYPOINT/CMD is present and sensible",
  "Upstream URL resolves to a public repo",
  "Slug doesn't collide with existing module",
  "Submitter isn't on the abuse list",
];

export function SubmissionDecisionPanel({
  submissionId,
  status,
  canRetry,
  isDeadLettered,
  isTerminal,
}: Props) {
  const router = useRouter();
  const { pushToast } = useAppShell();

  const [mode, setMode] = useState<Mode>(null);
  const [notes, setNotes] = useState("");
  const [grantNetwork, setGrantNetwork] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() =>
    CHECKLIST.map(() => false)
  );
  const [submitting, setSubmitting] = useState(false);

  const canReviewNow =
    status === "pending" || status === "changes_requested";
  const showRetry = canRetry;

  async function submit(path: string, body: unknown, successMsg: string) {
    setSubmitting(true);
    try {
      const resp = await fetch(
        `/api/v1/admin/submissions/${submissionId}/${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        pushToast("error", err.error?.message ?? "Action failed");
        setSubmitting(false);
        return;
      }
      pushToast("success", successMsg);
      setMode(null);
      setNotes("");
      router.refresh();
    } catch {
      pushToast("error", "Network error, please retry");
    } finally {
      setSubmitting(false);
    }
  }

  if (isTerminal) {
    return (
      <div>
        <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
          DECISION
        </div>
        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="mb-1 font-mono text-[11px] tracking-[0.08em] text-ink-faint">
            {status === "built" ? "BUILT AND LIVE" : "REJECTED"}
          </div>
          <div className="font-body text-[12.5px] text-ink-softer">
            This submission has reached a terminal state. No further action
            is possible.
          </div>
        </div>
      </div>
    );
  }

  if (!canReviewNow && !showRetry) {
    return (
      <div>
        <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
          DECISION
        </div>
        <div className="border border-hairline bg-canvas-deep p-4 font-body text-[12.5px] text-ink-softer">
          Waiting on the build worker. Status:{" "}
          <span className="font-mono text-ink">{status}</span>. This page
          auto-refreshes.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
        DECISION
      </div>

      {canReviewNow && mode === null && (
        <>
          {/* Checklist */}
          <div className="mb-4 border border-hairline bg-canvas-deep p-4">
            <div className="mb-2 font-mono text-[10px] tracking-[0.12em] text-ink-faint">
              CHECKLIST
            </div>
            <ul className="space-y-1.5">
              {CHECKLIST.map((item, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-2 font-body text-[12px] text-ink-softer hover:text-ink">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked[i]}
                      onChange={(e) => {
                        const next = [...checked];
                        next[i] = e.target.checked;
                        setChecked(next);
                      }}
                    />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMode("approve")}
              className="w-full bg-accent px-3 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
            >
              Approve and queue build
            </button>
            <button
              type="button"
              onClick={() => setMode("request_changes")}
              className="w-full border border-hairline bg-canvas-deep px-3 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-warn hover:text-warn"
            >
              Request changes
            </button>
            <button
              type="button"
              onClick={() => setMode("reject")}
              className="w-full border border-hairline bg-canvas-deep px-3 py-2.5 font-body text-[13px] font-medium text-ink-softer transition-colors hover:border-bad hover:text-bad"
            >
              Reject
            </button>
          </div>
        </>
      )}

      {mode === "approve" && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-faint">
              INTERNAL NOTES (optional, not emailed)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-hairline bg-canvas-deep px-3 py-2 font-body text-[12.5px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
              placeholder="Approved despite warning on line 14 because…"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-2 font-body text-[12px] text-ink-softer hover:text-ink">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={grantNetwork}
              onChange={(e) => setGrantNetwork(e.target.checked)}
            />
            <span>
              Grant network access during build (HTTPS whitelist only).{" "}
              <span className="text-warn">Use sparingly.</span>
            </span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                submit(
                  "approve",
                  { notes, grantNetwork },
                  "Approved — build will start shortly"
                )
              }
              className="flex-1 bg-accent px-3 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:opacity-50"
            >
              {submitting ? "Approving…" : "Confirm approve"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode(null)}
              className="border border-hairline px-3 py-2 font-body text-[13px] text-ink-softer hover:border-ink-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "request_changes" && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-faint">
              MESSAGE TO SUBMITTER (emailed as-is)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full border border-hairline bg-canvas-deep px-3 py-2 font-body text-[12.5px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
              placeholder="Please pin your FROM line to a specific alpine version (e.g. alpine:3.19) so builds are reproducible."
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting || notes.trim().length < 10}
              onClick={() =>
                submit(
                  "request-changes",
                  { message: notes },
                  "Message sent to submitter"
                )
              }
              className="flex-1 bg-warn px-3 py-2 font-body text-[13px] font-medium text-canvas transition-colors disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send request"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode(null)}
              className="border border-hairline px-3 py-2 font-body text-[13px] text-ink-softer hover:border-ink-ghost"
            >
              Cancel
            </button>
          </div>
          <p className="font-body text-[11.5px] text-ink-faint">
            The submission stays in the queue. When they resubmit you&apos;ll
            see the updated Dockerfile here again.
          </p>
        </div>
      )}

      {mode === "reject" && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-faint">
              REASON (emailed as-is)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full border border-hairline bg-canvas-deep px-3 py-2 font-body text-[12.5px] text-ink placeholder:text-ink-ghost focus:border-bad focus:outline-none"
              placeholder="The upstream URL points to a private repository, so we can't verify the source code. Please resubmit with a public git URL."
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting || notes.trim().length < 10}
              onClick={() =>
                submit("reject", { reason: notes }, "Submission rejected")
              }
              className="flex-1 border border-bad bg-bad/10 px-3 py-2 font-body text-[13px] font-medium text-bad transition-colors hover:bg-bad hover:text-canvas disabled:opacity-50"
            >
              {submitting ? "Rejecting…" : "Confirm reject"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode(null)}
              className="border border-hairline px-3 py-2 font-body text-[13px] text-ink-softer hover:border-ink-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "dlq_give_up" && (
        <div className="space-y-3">
          <div className="border border-bad bg-bad/[0.06] p-3">
            <div className="mb-1 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-bad">
              GIVING UP
            </div>
            <p className="font-body text-[11.5px] leading-[1.55] text-ink-softer">
              This marks the submission as permanently rejected. The submitter
              is emailed the reason below. The DLQ row is cleared. This is
              the right move when the build has failed three times for the
              same root cause and retrying won&apos;t change anything.
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-faint">
              REASON (emailed to submitter)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full border border-hairline bg-canvas-deep px-3 py-2 font-body text-[12.5px] text-ink placeholder:text-ink-ghost focus:border-bad focus:outline-none"
              placeholder="After three build attempts the registry push keeps failing with the same auth error. We can't reproduce this on our side; something about your upstream setup blocks it. Recommend opening a support ticket with additional context."
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting || notes.trim().length < 10}
              onClick={() =>
                submit(
                  "reject",
                  { reason: notes, fromDlq: true },
                  "Submission rejected and DLQ row cleared"
                )
              }
              className="flex-1 border border-bad bg-bad/10 px-3 py-2 font-body text-[13px] font-medium text-bad transition-colors hover:bg-bad hover:text-canvas disabled:opacity-50"
            >
              {submitting ? "Rejecting…" : "Confirm give up"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode(null)}
              className="border border-hairline px-3 py-2 font-body text-[13px] text-ink-softer hover:border-ink-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showRetry && mode === null && (
        isDeadLettered ? (
          /* DLQ-specific UI: red banner, both retry and give-up. This
             row has exhausted the automatic retry budget so the decision
             is now ours: believe it was transient and retry, or decide
             the root cause is persistent and reject. */
          <div className="mt-3 border border-bad bg-bad/[0.06] p-4">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-bad">
              <span className="block h-2 w-2 rounded-full bg-bad meta-pulse" />
              DEAD-LETTERED
            </div>
            <p className="mb-3 font-body text-[12px] leading-[1.55] text-ink-softer">
              This build failed three times with a system-kind error, so it
              was parked. Either retry (if you think the original cause is
              gone) or give up (reject with a reason the submitter sees).
            </p>
            <div className="space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  submit(
                    "retry-build",
                    {},
                    "Build re-queued — attempt counter reset"
                  )
                }
                className="w-full border border-accent px-3 py-2 font-body text-[12.5px] font-medium text-accent hover:bg-accent hover:text-canvas disabled:opacity-50"
              >
                {submitting ? "Retrying…" : "Retry — fresh attempt budget"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setMode("dlq_give_up")}
                className="w-full border border-bad/50 px-3 py-2 font-body text-[12.5px] font-medium text-bad hover:bg-bad/10 disabled:opacity-50"
              >
                Give up — reject permanently
              </button>
            </div>
          </div>
        ) : (
          /* The "soft" retry path: status=failed with buildErrorKind=system
             but not yet DLQ'd. A single retry is usually the right call. */
          <div className="mt-3 border border-hairline bg-canvas-deep p-3">
            <div className="mb-2 font-mono text-[10.5px] tracking-[0.08em] text-ink-faint">
              SYSTEM FAILURE
            </div>
            <p className="mb-3 font-body text-[12px] text-ink-softer">
              This build failed due to infrastructure (not the Dockerfile).
              Retrying re-queues it for the worker.
            </p>
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                submit("retry-build", {}, "Build re-queued")
              }
              className="w-full border border-accent px-3 py-2 font-body text-[12.5px] font-medium text-accent hover:bg-accent hover:text-canvas disabled:opacity-50"
            >
              {submitting ? "Retrying…" : "Retry build"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
