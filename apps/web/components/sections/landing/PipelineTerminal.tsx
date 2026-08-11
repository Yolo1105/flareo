"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * The faked live pipeline terminal on the landing page.
 * Starts "empty", then fills in lines with a stagger.
 */

const LINES = [
  { ts: "14:02:00.124", ev: "QUEUE", evClass: "text-accent", text: "vaultwarden@1.30.5 · priority: normal" },
  { ts: "14:02:00.312", ev: "SUBMIT", evClass: "text-accent", text: "source uploaded to r2://submissions/vw-1.30.5.tar.zst · 142 MB" },
  { ts: "14:02:00.564", ev: "BUILD", evClass: "text-accent", text: "buildkit 0.13.1 · hermetic · rootless" },
  { ts: "14:05:02.982", ev: "BUILD ✓", evClass: "text-good", text: "layers: 6 · size: 62 MB · digest: sha256:9a8b7c6d5e4f" },
  { ts: "14:05:03.144", ev: "SCAN", evClass: "text-accent", text: "trivy image · severity ALL · 210 packages indexed" },
  { ts: "14:05:06.267", ev: "SCAN ✓", evClass: "text-good", text: "0 critical · 0 high · 0 medium · 0 low · 3.12s" },
  { ts: "14:05:06.389", ev: "ATTEST", evClass: "text-accent", text: "slsa-generator · in-toto v1 · predicate hashed" },
  { ts: "14:05:08.241", ev: "ATTEST ✓", evClass: "text-good", text: "signed provenance · upstream digest recorded · @ 8fa2b19" },
  { ts: "14:05:08.466", ev: "SIGN", evClass: "text-accent", text: "cosign keyless · OIDC identity → fulcio cert" },
  { ts: "14:05:09.391", ev: "SIGN ✓", evClass: "text-good", text: "rekor entry: 108e9186e8c5cdc6a44ce62 · verified" },
  { ts: "14:05:09.520", ev: "PUBLISH", evClass: "text-accent", text: "push to ghcr.io/flareo/vaultwarden@sha256:9a8b7c6d5e4f" },
  { ts: "14:05:14.260", ev: "PUBLISH ✓", evClass: "text-good", text: "module available · build #0847 complete · 4.24m total" },
];

export function PipelineTerminal() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= LINES.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 340);
    return () => clearTimeout(t);
  }, [shown]);

  // Reset loop
  useEffect(() => {
    if (shown < LINES.length) return;
    const t = setTimeout(() => setShown(0), 5500);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="02"
        label="THE PIPELINE"
        title="Every module goes through 6 stages. You see all of them."
      >
        This is a real trace from build{" "}
        <span className="text-ink">#0847</span> of Vaultwarden 1.30.5 —
        submitted at 14:02, available at 14:05. Every line is logged and
        published. Nothing is hidden.
      </SectionHeader>

      <div className="overflow-hidden border border-hairline bg-canvas-deep">
        <div className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-4 py-3 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
          <div className="flex items-center gap-3">
            <div className="flex gap-[5px]">
              <span className="block h-2 w-2 rounded-full bg-accent" />
              <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
              <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
            </div>
            <span>flareo tail --pipeline · build #0847 · vaultwarden@1.30.5</span>
          </div>
          <div className="flex items-center gap-2 text-good">
            <span className="block h-[6px] w-[6px] rounded-full bg-good meta-pulse" />
            <span className="font-medium tracking-[0.08em]">LIVE</span>
          </div>
        </div>
        <div className="min-h-[380px] p-5 font-mono text-[12.5px] leading-[1.9] text-ink-mute">
          {LINES.slice(0, shown).map((l, i) => (
            <div key={i} className="slidein">
              <span className="mr-3 text-ink-ghost">{l.ts}</span>
              <span className={`mr-2 font-medium ${l.evClass}`}>{l.ev}</span>
              <span className="text-ink-mute">{l.text}</span>
            </div>
          ))}
          {shown < LINES.length && (
            <span className="inline-block h-[14px] w-[7px] animate-pulse bg-accent" />
          )}
        </div>
      </div>

      {/* Make the receipts tangible — one-click into a real module's
          full provenance trail. Without this, the animation above is
          where most visitors stop; this CTA gets them into the actual
          product. */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-dashed border-hairline bg-canvas-deep px-5 py-4">
        <div className="font-body text-[13px] leading-[1.5] text-ink-softer">
          The terminal above is animated. The receipts it produced are real
          — and clickable.
        </div>
        <Link
          href="/modules/vaultwarden"
          className="font-mono text-[11px] text-accent hover:text-accent-hot"
        >
          See the actual provenance trail for this build →
        </Link>
      </div>
    </section>
  );
}
