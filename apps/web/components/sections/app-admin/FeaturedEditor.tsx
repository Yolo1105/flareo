"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FeaturedItem } from "@/lib/db/curation";

interface CreateProps {
  mode: "create";
  pool: Array<{
    slug: string;
    name: string;
    version: string;
    trust: number;
  }>;
  defaultPosition: number;
}

interface EditProps {
  mode: "edit";
  item: FeaturedItem;
  expired?: boolean;
}

type Props = CreateProps | EditProps;

/**
 * Dual-mode editor: create a new feature (picks a module from the
 * available pool) or edit/remove an existing one.
 *
 * Kept as one component because the create and edit flows share the
 * same three inputs (position, blurb, expiresAt). The only variable
 * is whether the module slug comes from a dropdown or is fixed.
 */
export function FeaturedEditor(props: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [moduleSlug, setModuleSlug] = useState<string>(
    props.mode === "edit" ? props.item.module.slug : "",
  );
  const [position, setPosition] = useState<number>(
    props.mode === "edit" ? props.item.position : props.defaultPosition,
  );
  const [blurb, setBlurb] = useState<string>(
    props.mode === "edit" ? (props.item.blurb ?? "") : "",
  );
  const [expiresAt, setExpiresAt] = useState<string>(
    props.mode === "edit" && props.item.expiresAt
      ? props.item.expiresAt.slice(0, 10)
      : "",
  );

  async function save() {
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        moduleSlug,
        position,
        blurb: blurb.trim() ? blurb.trim() : null,
        expiresAt: expiresAt
          ? new Date(`${expiresAt}T00:00:00Z`).toISOString()
          : null,
      };
      const resp = await fetch("/api/v1/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(err.error?.message ?? "Could not save");
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error, try again");
      setSubmitting(false);
    }
  }

  async function remove() {
    if (props.mode !== "edit") return;
    if (!confirm(`Remove @${props.item.module.slug} from Featured?`)) return;
    setSubmitting(true);
    try {
      const resp = await fetch(
        `/api/v1/admin/featured?slug=${encodeURIComponent(props.item.module.slug)}`,
        { method: "DELETE" },
      );
      if (resp.ok) {
        router.refresh();
      } else {
        setError("Could not remove");
        setSubmitting(false);
      }
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  const canSave =
    moduleSlug.length > 0 && position >= 1 && position <= 6 && !submitting;

  return (
    <article
      className={`border bg-canvas-deep p-5 ${
        props.mode === "edit" && props.expired
          ? "border-dashed border-hairline opacity-70"
          : "border-hairline"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {props.mode === "edit" ? (
            <div>
              <Link
                href={`/modules/${props.item.module.slug}`}
                className="font-display text-[18px] font-black text-ink hover:text-accent"
              >
                {props.item.module.name}
              </Link>
              <span className="ml-2 font-mono text-[11px] text-ink-ghost">
                v{props.item.module.version} · trust {props.item.module.trust}
              </span>
              {props.expired && (
                <span className="ml-3 border border-warn bg-warn/[0.08] px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-warn">
                  EXPIRED
                </span>
              )}
            </div>
          ) : (
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
                MODULE
              </span>
              <select
                value={moduleSlug}
                onChange={(e) => setModuleSlug(e.target.value)}
                className="w-full border border-hairline bg-canvas px-3 py-2 font-mono text-[13px] text-ink focus:border-accent focus:outline-none"
              >
                <option value="">-- pick a module --</option>
                {props.pool.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name} v{m.version} · trust {m.trust}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {props.mode === "edit" && props.item.curatorName && (
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-[0.08em] text-ink-faint">
              CURATED BY
            </div>
            <div className="font-mono text-[11px] text-ink-softer">
              {props.item.curatorName}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[100px_1fr_160px] gap-4">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
            POSITION
          </span>
          <input
            type="number"
            min={1}
            max={6}
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value, 10) || 1)}
            className="w-full border border-hairline bg-canvas px-3 py-2 font-mono text-[13px] text-ink focus:border-accent focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
            EDITORIAL BLURB (optional)
          </span>
          <input
            type="text"
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            maxLength={200}
            placeholder="One sentence on why this is worth featuring."
            className="w-full border border-hairline bg-canvas px-3 py-2 font-body text-[13px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
            EXPIRES (optional)
          </span>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-hairline bg-canvas px-3 py-2 font-mono text-[13px] text-ink focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      {error && (
        <div className="mt-3 border border-bad bg-bad/[0.08] px-3 py-2 font-body text-[12px] text-bad">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={save}
          className="bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
        >
          {submitting
            ? "Saving…"
            : props.mode === "create"
              ? "Add feature"
              : "Save changes"}
        </button>
        {props.mode === "edit" && (
          <button
            type="button"
            onClick={remove}
            disabled={submitting}
            className="border border-bad px-4 py-2 font-mono text-[11.5px] text-bad hover:bg-bad hover:text-canvas disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </article>
  );
}
