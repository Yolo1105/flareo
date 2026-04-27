"use client";

import { useState } from "react";
import type { Module } from "@/lib/types";
import { buildFor } from "@/lib/data/builds";

interface Props {
  module: Module;
  /** Visual size — compact for grid cards, full for marketplace spotlight. */
  size?: "compact" | "full";
}

/**
 * Receipts drawer — slides out on click to show the full attestation
 * chain summary for a module without leaving the page.
 *
 * The proposal called this "Idea 3 / receipts drawer on every module
 * card. A literal paper-metaphor drawer that slides out showing the
 * full attestation chain: source hash, builder version, build
 * timestamp, SBOM hash, signature entry, Rekor URL, policy decision."
 *
 * Design choices:
 *   - Stops link propagation when the drawer is opened so clicking
 *     the toggle inside a Link card doesn't navigate to the module
 *     page. The visitor expects the drawer to expand in place.
 *   - All values come from buildFor() which derives per-module
 *     deterministic artifacts from the module's actual digest. The
 *     drawer is honest: every value matches what shows on
 *     /modules/<slug>#receipts.
 *   - Compact mode renders inside a card; full mode is for spotlight
 *     placements where there's room for longer values.
 */
export function ReceiptsDrawer({ module, size = "compact" }: Props) {
  const [open, setOpen] = useState(false);
  const build = buildFor(module);

  // Stop link propagation — the drawer toggle sits inside a card-wide
  // <Link>, but tapping the toggle should never navigate.
  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  }

  const buttonClass =
    size === "compact"
      ? "flex items-center gap-1.5 border border-hairline bg-canvas-panel px-2 py-1 font-mono text-[9.5px] tracking-[0.08em] text-ink-mute transition-colors hover:border-accent hover:text-accent"
      : "flex items-center gap-1.5 border border-hairline bg-canvas-panel px-3 py-1.5 font-mono text-[10.5px] tracking-[0.04em] text-ink-mute transition-colors hover:border-accent hover:text-accent";

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
        className={buttonClass}
        aria-expanded={open}
        aria-label={open ? "Close receipts drawer" : "View receipts drawer"}
      >
        <svg
          width={11}
          height={11}
          viewBox="0 0 16 16"
          aria-hidden
          className={open ? "rotate-90 transition-transform" : "transition-transform"}
        >
          <path
            d="M4 3 L11 8 L4 13"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {open ? "HIDE" : "RECEIPTS"}
      </button>

      {open && (
        <div className="mt-2 border border-hairline bg-canvas-deep p-3 font-mono text-[10.5px] leading-[1.7]">
          <div className="mb-2 flex items-center justify-between border-b border-hairline pb-1.5">
            <span className="tracking-[0.14em] text-ink-ghost">
              ATTESTATION CHAIN
            </span>
            <span className="tracking-[0.04em] text-good">
              ✓ {module.slsa}
            </span>
          </div>

          <ReceiptRow label="DIGEST" value={module.digest.replace("sha256:", "").slice(0, 24) + "…"} />
          <ReceiptRow label="BUILD ID" value={build.id} />
          <ReceiptRow label="BUILT" value={formatBuildTime(build.startedAt)} />
          <ReceiptRow label="SOURCE" value={build.sourceCommit.slice(0, 12) + "…"} />
          <ReceiptRow label="SBOM" value={`CycloneDX 1.5 · ${module.size}`} />
          <ReceiptRow
            label="SIGNATURE"
            value="cosign · keyless · OIDC"
            tone="good"
          />
          <ReceiptRow
            label="REKOR"
            value={`logged · entry ${rekorIndexFor(module.slug).toLocaleString()}`}
          />
          <ReceiptRow
            label="POLICY"
            value={module.cves.critical === 0 ? "ALLOW · all rules pass" : "DENY · critical CVE present"}
            tone={module.cves.critical === 0 ? "good" : "bad"}
          />

          <div className="mt-2 border-t border-hairline pt-2 text-center">
            <a
              href={`/modules/${module.slug}#receipts`}
              className="text-accent hover:text-accent-hot"
              onClick={(e) => e.stopPropagation()}
            >
              full receipts on module page →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const valueClass =
    tone === "good"
      ? "text-good"
      : tone === "bad"
        ? "text-bad"
        : "text-ink-mute";
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="shrink-0 tracking-[0.08em] text-ink-faint">{label}</span>
      <span className={`text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

function formatBuildTime(iso: string): string {
  // Match the proposal example "2026-04-20 14:02 UTC".
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${date} ${hh}:${mm} UTC`;
}

function rekorIndexFor(slug: string): number {
  // Stable per slug, same approach as pipeline-artifacts.ts to keep
  // the drawer's value consistent with the pipeline page's value.
  return 30_000_000 + (slug.length * 1373) % 800_000;
}
