"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type VexStatus =
  | "not_affected"
  | "affected"
  | "fixed"
  | "under_investigation";

type VexJustification =
  | "component_not_present"
  | "vulnerable_code_not_present"
  | "vulnerable_code_not_in_execute_path"
  | "vulnerable_code_cannot_be_controlled_by_adversary"
  | "inline_mitigations_already_exist";

const JUSTIFICATIONS: { value: VexJustification; label: string }[] = [
  {
    value: "component_not_present",
    label: "Component not present in the image",
  },
  {
    value: "vulnerable_code_not_present",
    label: "Vulnerable code not present (different version compiled in)",
  },
  {
    value: "vulnerable_code_not_in_execute_path",
    label: "Vulnerable code present but never executed",
  },
  {
    value: "vulnerable_code_cannot_be_controlled_by_adversary",
    label: "Vulnerable code present but unreachable from external input",
  },
  {
    value: "inline_mitigations_already_exist",
    label: "Inline mitigations applied (e.g. patch, sandbox, config)",
  },
];

type CveSeverity = "critical" | "high" | "medium" | "low" | "unknown";

const SEVERITIES: { value: CveSeverity; label: string }[] = [
  { value: "critical", label: "critical" },
  { value: "high", label: "high" },
  { value: "medium", label: "medium" },
  { value: "low", label: "low" },
  { value: "unknown", label: "unknown" },
];

interface ExistingStatement {
  status: VexStatus;
  justification: VexJustification | null;
  impactStatement: string | null;
  cveSeverity: CveSeverity | null;
  authorName: string | null;
  updatedAt: string;
}

interface Props {
  moduleSlug: string;
  cve: string;
  /**
   * Severity bucket Trivy assigned to this CVE. Drives the form's
   * default severity selection. Reviewers can override (rare) but
   * the default value matches what Trivy reported. Optional so callers
   * that lack the data fall back to "unknown" — preserves backward
   * compatibility with any test fixture that doesn't pass it.
   */
  cveSeverity?: CveSeverity;
  existing: ExistingStatement | null;
}

/**
 * VEX annotation form. Renders inline below each Trivy finding on the
 * admin annotation page.
 *
 * Has three modes:
 *
 *   1. Closed (existing annotation present, no editing) — shows a
 *      summary line + "Edit" / "Delete" buttons.
 *   2. Closed (no annotation) — shows a single "Annotate" button.
 *   3. Open — shows the actual form: status select, justification
 *      select (only when status=not_affected), impact textarea,
 *      Save + Cancel.
 *
 * On save, PUTs to /api/v1/modules/<slug>/vex/<cve>. On delete,
 * DELETEs the same URL. Both refresh the page after success so the
 * server-rendered finding rows reflect the new state.
 */
export function VexAnnotationForm({
  moduleSlug,
  cve,
  cveSeverity: trivySeverity,
  existing,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state, initialized from the existing annotation if present.
  // Severity priority: existing annotation → Trivy report → "unknown".
  // The existing-annotation path matters for the rare override case
  // where a reviewer reclassified at annotation time.
  const [status, setStatus] = useState<VexStatus>(
    existing?.status ?? "under_investigation",
  );
  const [justification, setJustification] = useState<VexJustification | "">(
    existing?.justification ?? "",
  );
  const [impactStatement, setImpactStatement] = useState(
    existing?.impactStatement ?? "",
  );
  const [severity, setSeverity] = useState<CveSeverity>(
    existing?.cveSeverity ?? trivySeverity ?? "unknown",
  );

  // ─── closed state: annotation exists ─────────────────────────────
  if (!open && existing) {
    return (
      <div className="grid grid-cols-1 gap-3 border-t border-hairline px-5 py-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          {existing.justification && (
            <div className="font-mono text-[10.5px] text-ink-faint">
              <span className="text-ink-ghost">justification:</span>{" "}
              {existing.justification}
            </div>
          )}
          {existing.impactStatement && (
            <div className="font-body text-[12px] leading-[1.55] text-ink-softer">
              {existing.impactStatement}
            </div>
          )}
          <div className="font-mono text-[10px] text-ink-ghost">
            by {existing.authorName ?? "unknown"} ·{" "}
            {new Date(existing.updatedAt).toLocaleString()}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-hairline bg-canvas-panel px-3 py-1.5 font-mono text-[10.5px] text-ink-mute transition-colors hover:border-accent hover:text-accent"
          >
            edit
          </button>
          <DeleteButton
            moduleSlug={moduleSlug}
            cve={cve}
            onDeleted={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
          />
        </div>
      </div>
    );
  }

  // ─── closed state: no annotation ─────────────────────────────────
  if (!open) {
    return (
      <div className="border-t border-hairline px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-mono text-[11px] text-accent hover:text-accent-hot"
        >
          + annotate this finding
        </button>
      </div>
    );
  }

  // ─── open: editing form ──────────────────────────────────────────
  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        const resp = await fetch(
          `/api/v1/modules/${moduleSlug}/vex/${cve}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status,
              justification: justification || null,
              impactStatement: impactStatement || null,
              cveSeverity: severity,
            }),
          },
        );
        if (!resp.ok) {
          const body = (await resp.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          setError(body.error?.message ?? `request failed (${resp.status})`);
          return;
        }
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "network error");
      }
    });
  }

  return (
    <div className="border-t border-hairline px-5 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_140px_1fr]">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-ghost">
            STATUS
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as VexStatus)}
            disabled={isPending}
            className="w-full border border-hairline bg-canvas-panel px-3 py-2 font-mono text-[12px] text-ink"
          >
            <option value="under_investigation">under_investigation</option>
            <option value="not_affected">not_affected</option>
            <option value="affected">affected</option>
            <option value="fixed">fixed</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-ghost">
            SEVERITY
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as CveSeverity)}
            disabled={isPending}
            title="CVE severity bucket. Defaults to what Trivy reported. Override only if Trivy mis-classified."
            className="w-full border border-hairline bg-canvas-panel px-3 py-2 font-mono text-[12px] text-ink"
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {status === "not_affected" && (
          <div>
            <label className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-ghost">
              JUSTIFICATION (REQUIRED FOR not_affected)
            </label>
            <select
              value={justification}
              onChange={(e) =>
                setJustification(e.target.value as VexJustification | "")
              }
              disabled={isPending}
              className="w-full border border-hairline bg-canvas-panel px-3 py-2 font-mono text-[12px] text-ink"
            >
              <option value="">— pick one —</option>
              {JUSTIFICATIONS.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="md:col-span-3">
          <label className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-ghost">
            IMPACT STATEMENT (required for not_affected, optional otherwise)
          </label>
          <textarea
            value={impactStatement}
            onChange={(e) => setImpactStatement(e.target.value)}
            disabled={isPending}
            rows={3}
            placeholder="explain the reasoning, e.g. 'the vulnerable function is included in the dependency but is never reached at runtime in this module's request lifecycle'"
            className="w-full border border-hairline bg-canvas-panel px-3 py-2 font-body text-[12.5px] leading-[1.55] text-ink"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 border border-bad/40 bg-bad/[0.05] px-3 py-2 font-mono text-[11px] text-bad">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="border border-accent bg-accent px-4 py-1.5 font-body text-[12.5px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:opacity-50"
        >
          {isPending ? "saving…" : "save annotation"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={isPending}
          className="border border-hairline bg-canvas-panel px-4 py-1.5 font-body text-[12.5px] text-ink-mute transition-colors hover:border-ink-faint disabled:opacity-50"
        >
          cancel
        </button>
      </div>
    </div>
  );
}

function DeleteButton({
  moduleSlug,
  cve,
  onDeleted,
}: {
  moduleSlug: string;
  cve: string;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  function confirm() {
    if (
      !globalThis.confirm(
        `Delete the VEX annotation for ${cve}?\n\nThe CVE will return to "unannotated" state. The OpenVEX document will no longer include a statement for it.`,
      )
    )
      return;
    startTransition(async () => {
      try {
        await fetch(`/api/v1/modules/${moduleSlug}/vex/${cve}`, {
          method: "DELETE",
        });
        onDeleted();
      } catch {
        // Silent — caller refreshes either way.
      }
    });
  }
  return (
    <button
      type="button"
      onClick={confirm}
      disabled={isPending}
      className="border border-hairline bg-canvas-panel px-3 py-1.5 font-mono text-[10.5px] text-ink-mute transition-colors hover:border-bad hover:text-bad disabled:opacity-50"
    >
      {isPending ? "…" : "delete"}
    </button>
  );
}
