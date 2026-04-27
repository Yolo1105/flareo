"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialPolicyJson: string;
  initialRevision: number;
  initialNotes: string;
}

/**
 * JSON editor for the admission policy. Two actions:
 *
 *   - Save as new revision: PUTs the edited JSON to the policy
 *     write endpoint with author-supplied notes describing what
 *     changed.
 *   - Regenerate verdicts: triggers a sweep that re-evaluates the
 *     active policy against every module and updates the cached
 *     verdict rows.
 *
 * The textarea takes the JSON unchanged — the validation happens
 * server-side via the Zod schema. Surfacing errors inline lets the
 * admin fix the JSON without losing their edits.
 */
export function PolicyEditor({
  initialPolicyJson,
  initialRevision,
  initialNotes: _initialNotes,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [policyJson, setPolicyJson] = useState(initialPolicyJson);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dirty = policyJson !== initialPolicyJson;

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const resp = await fetch("/api/v1/admin/policy", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ policyJson, notes }),
        });
        const body = (await resp.json()) as {
          revision?: number;
          error?: { message?: string };
        };
        if (!resp.ok) {
          setError(body.error?.message ?? `request failed (${resp.status})`);
          return;
        }
        setSuccess(`Saved as revision ${body.revision}.`);
        setNotes("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "network error");
      }
    });
  }

  function handleRegenerate() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const resp = await fetch("/api/v1/admin/policy/regenerate", {
          method: "POST",
        });
        const body = (await resp.json()) as {
          evaluated?: number;
          error?: { message?: string };
        };
        if (!resp.ok) {
          setError(body.error?.message ?? `request failed (${resp.status})`);
          return;
        }
        setSuccess(
          `Regenerated ${body.evaluated ?? 0} module verdict${
            body.evaluated === 1 ? "" : "s"
          }.`,
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "network error");
      }
    });
  }

  return (
    <div className="border border-hairline bg-canvas-deep">
      <header className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-4 py-2.5">
        <span className="font-mono text-[10.5px] tracking-[0.04em] text-ink-faint">
          policy.json · current revision: r{initialRevision}
          {dirty && <span className="ml-2 text-warn">· unsaved changes</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isPending || dirty}
            title={
              dirty
                ? "Save your edits as a new revision before regenerating verdicts."
                : "Re-evaluate the active policy against every module and update cached verdicts."
            }
            className="border border-hairline bg-canvas px-3 py-1 font-mono text-[10.5px] text-ink-mute transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {isPending ? "…" : "regenerate verdicts"}
          </button>
        </div>
      </header>

      <textarea
        value={policyJson}
        onChange={(e) => setPolicyJson(e.target.value)}
        spellCheck={false}
        rows={28}
        className="w-full resize-y bg-canvas-deep p-5 font-mono text-[12px] leading-[1.65] text-ink focus:outline-none"
      />

      <div className="border-t border-hairline px-5 py-4">
        <label className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-ghost">
          REVISION NOTES (REQUIRED — appears in audit trail)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="What changed in this revision and why? e.g. 'Loosened high-CVE threshold from 3 to 5 to admit upstream-pinned modules waiting on patch'"
          className="w-full border border-hairline bg-canvas-panel px-3 py-2 font-body text-[12.5px] leading-[1.55] text-ink"
        />

        {error && (
          <div className="mt-3 border border-bad/40 bg-bad/[0.05] px-3 py-2 font-mono text-[11px] text-bad">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 border border-good/40 bg-good/[0.05] px-3 py-2 font-mono text-[11px] text-good">
            {success}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !dirty || notes.trim().length < 5}
            className="border border-accent bg-accent px-4 py-1.5 font-body text-[12.5px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:opacity-50"
          >
            {isPending
              ? "saving…"
              : dirty
                ? "save as new revision"
                : "no changes to save"}
          </button>
          <span className="font-mono text-[10.5px] text-ink-ghost">
            Saving creates a new revision; older revisions are kept for
            audit.
          </span>
        </div>
      </div>
    </div>
  );
}
