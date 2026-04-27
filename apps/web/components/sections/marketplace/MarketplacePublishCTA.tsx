import Link from "next/link";

/**
 * Bottom-of-marketplace CTA inviting the supply side to publish.
 *
 * The proposal calls Flareo a "C2C" platform — both sides of the
 * marketplace need a clear path. This bottom band is the publish
 * surface for visitors arriving via the demand-side discovery flow.
 *
 * Linked to /pipeline (the authenticated pipeline experience built in
 * Session 2) so a visitor can preview what publishing actually feels
 * like before signing up.
 */
export function MarketplacePublishCTA() {
  return (
    <section className="border-b border-hairline bg-accent px-8 py-14 text-canvas">
      <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-canvas/70">
            08 / SUPPLY SIDE
          </div>
          <h2 className="mb-4 font-display text-[36px] font-black leading-[0.98] tracking-[-0.03em]">
            Have a container worth publishing?
          </h2>
          <p className="max-w-[640px] font-body text-[14.5px] leading-[1.55] text-canvas/85">
            Submit a Dockerfile or an image reference. Flareo runs it
            through the full pipeline — BuildKit, Trivy, CycloneDX SBOM,
            VEX annotation, SLSA L1 provenance, cosign keyless signing,
            policy gate, admin review — and lists the result on this
            marketplace if it passes. You see every stage live.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/pipeline"
            className="border border-canvas bg-canvas px-5 py-3 text-center font-body text-[14px] font-medium tracking-[0.01em] text-ink transition-colors hover:bg-canvas-panel"
          >
            See the pipeline live →
          </Link>
          <Link
            href="/app/publish"
            className="border border-canvas/40 px-5 py-3 text-center font-body text-[14px] font-medium tracking-[0.01em] text-canvas transition-all hover:border-canvas"
          >
            Submit a module
          </Link>
          <span className="text-center font-mono text-[10px] text-canvas/60">
            Sign-in required for submission
          </span>
        </div>
      </div>
    </section>
  );
}
