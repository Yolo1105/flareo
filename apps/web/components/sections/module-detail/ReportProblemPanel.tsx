"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Module } from "@/lib/types";
import {
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  type ReportCategory,
} from "@/lib/reports/constants";

interface Props {
  module: Module;
}

/**
 * "Report a problem" collapsed panel on the module detail page.
 *
 * Renders as a small link in the footer by default; expands into a
 * form when clicked. Three states after that:
 *   - editing: filling the form
 *   - submitting: waiting on API
 *   - submitted: success state (can't submit another on the same
 *     module for 7 days; panel shows confirmation)
 *
 * Anonymous viewers see the link but get a sign-in prompt on click.
 * Session is read on the client so the parent page can stay in ISR.
 */
export function ReportProblemPanel({ module }: Props) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>("broken");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bodyOk = body.trim().length >= 20 && body.trim().length <= 4000;

  async function submit() {
    if (!bodyOk || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(`/api/v1/modules/${module.slug}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, body: body.trim() }),
      });
      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(err.error?.message ?? "Couldn't submit report");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error; try again");
      setSubmitting(false);
    }
  }

  return (
    <section className="border-t border-hairline bg-canvas-panel px-8 py-6">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
            SEE SOMETHING WRONG WITH THIS MODULE?
          </div>
          {!open && !submitted && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="font-mono text-[11px] text-ink-softer hover:text-warn"
            >
              Report a problem →
            </button>
          )}
        </div>

        {submitted && (
          <div className="border border-good bg-good/[0.06] px-4 py-3 font-body text-[13px] text-ink">
            <strong>Report received.</strong> An admin will take a look.
            You&apos;ll get an email when the report is resolved or
            dismissed. (Not yet — emails aren&apos;t wired for this
            surface.)
          </div>
        )}

        {open && !submitted && (
          <>
            {!currentUserId ? (
              <div className="border border-hairline bg-canvas-deep px-4 py-3 font-body text-[13px] text-ink-softer">
                <a
                  href={`/login?callbackUrl=/modules/${module.slug}`}
                  className="text-accent hover:text-accent-hot"
                >
                  Sign in
                </a>{" "}
                to file a report. Reports are routed to a human admin for
                triage.
              </div>
            ) : (
              <div className="border border-hairline bg-canvas-deep p-5">
                <div className="mb-4 font-mono text-[10px] font-semibold tracking-[0.14em] text-warn">
                  FILE A REPORT
                </div>

                <label className="mb-4 block">
                  <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
                    CATEGORY
                  </span>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as ReportCategory)
                    }
                    className="w-full border border-hairline bg-canvas px-3 py-2 font-body text-[13px] text-ink focus:border-accent focus:outline-none"
                  >
                    {REPORT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {REPORT_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mb-4 block">
                  <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
                    DETAIL
                  </span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    maxLength={4000}
                    className="w-full border border-hairline bg-canvas px-3 py-2 font-body text-[13px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
                    placeholder={
                      category === "broken"
                        ? "What happens? What did you expect? Include the image ref if relevant (don't paste secrets)."
                        : category === "malicious"
                          ? "What behavior seemed malicious? Be specific — the more detail, the faster an admin can verify."
                          : category === "metadata"
                            ? "What's wrong about the description, category, or version info?"
                            : category === "legal"
                              ? "Describe the legal concern. Provide a rights holder contact if applicable."
                              : "Describe the issue."
                    }
                  />
                  <span className="mt-1 block text-right font-mono text-[10.5px] text-ink-ghost">
                    {body.length} / 4000
                    {body.length < 20 && body.length > 0 && (
                      <span className="ml-2 text-warn">
                        (min 20)
                      </span>
                    )}
                  </span>
                </label>

                {error && (
                  <div className="mb-3 border border-bad bg-bad/[0.08] px-3 py-2 font-body text-[12px] text-bad">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!bodyOk || submitting}
                    onClick={submit}
                    className="bg-warn px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-ink-ghost"
                  >
                    {submitting ? "Submitting…" : "Submit report"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setBody("");
                      setError(null);
                    }}
                    className="border border-hairline px-4 py-2 font-body text-[13px] text-ink-softer hover:border-ink-ghost"
                  >
                    Cancel
                  </button>
                </div>

                <p className="mt-4 border-t border-hairline pt-3 font-body text-[11.5px] leading-[1.5] text-ink-ghost">
                  Reports go to a human admin. They are NOT sent to the
                  publisher directly. False or malicious reports may
                  result in your ability to file reports being revoked.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
