"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** Same run id as lib/data/demo-pipeline.ts — landing terminal only. */
const RECORDED_RUN_ID = "FLA-DEMO-0001";

/**
 * Recorded pipeline terminal on the landing page.
 * Same run as /pipeline — pin, copy, SBOM, scan, sign, catalog.
 */

const LINES = [
  { ts: "14:02:00.124", ev: "PIN", evClass: "text-accent", text: "docker.io/vaultwarden/server:1.32.7" },
  { ts: "14:02:00.891", ev: "PIN ✓", evClass: "text-good", text: "digest sha256:c8f3e91a7b4d2e6f · 62 MB · no rebuild" },
  { ts: "14:02:01.040", ev: "COPY", evClass: "text-accent", text: "skopeo copy → public.ecr.aws/flareo/vaultwarden:1.32.7" },
  { ts: "14:02:08.210", ev: "COPY ✓", evClass: "text-good", text: "digests match · byte-identical to upstream" },
  { ts: "14:02:08.401", ev: "SBOM", evClass: "text-accent", text: "syft cyclonedx-1.5 · 210 packages indexed" },
  { ts: "14:02:11.002", ev: "SBOM ✓", evClass: "text-good", text: "CycloneDX written · stored with the module" },
  { ts: "14:02:11.188", ev: "SCAN", evClass: "text-accent", text: "trivy image · NVD + GHSA + debian" },
  { ts: "14:02:14.310", ev: "SCAN ✓", evClass: "text-good", text: "0 critical · 0 high · 1 medium not_affected" },
  { ts: "14:02:14.466", ev: "SIGN", evClass: "text-accent", text: "cosign keyless · OIDC identity → fulcio cert" },
  { ts: "14:02:15.391", ev: "SIGN ✓", evClass: "text-good", text: "rekor index 14829331 · logged" },
  { ts: "14:02:15.520", ev: "CATALOG", evClass: "text-accent", text: "upsert vaultwarden@1.32.7 · trust 99" },
  { ts: "14:02:15.780", ev: "CATALOG ✓", evClass: "text-good", text: "listed · anyone can verify" },
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
        title="Pin, copy, receipt, sign. You see every stage."
      >
        This is a recorded trace of one Vaultwarden republish — same
        digest in, same digest out. The walkthrough on /pipeline plays
        this run step by step, with the receipts frozen so a demo never
        drifts.
      </SectionHeader>

      <div className="overflow-hidden border border-hairline bg-canvas-deep">
        <div className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-4 py-3 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
          <div className="flex items-center gap-3">
            <div className="flex gap-[5px]">
              <span className="block h-2 w-2 rounded-full bg-accent" />
              <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
              <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
            </div>
            <span>flareo tail --pipeline · {RECORDED_RUN_ID} · vaultwarden@1.32.7</span>
          </div>
          <div className="flex items-center gap-2 text-good">
            <span className="block h-[6px] w-[6px] rounded-full bg-good meta-pulse" />
            <span className="font-medium tracking-[0.08em]">RECORDED</span>
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
          The terminal is an animation of a frozen run. Sign in to walk
          it step by step — every screen is the same for every visitor.
        </div>
        <Link
          href="/login?callbackUrl=/pipeline"
          className="font-mono text-[11px] text-accent hover:text-accent-hot"
        >
          Sign in to walk this run →
        </Link>
      </div>
    </section>
  );
}
