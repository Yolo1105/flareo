import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * Landing front-door — explains the two interactive demos but sends
 * visitors through sign-in first instead of embedding live tools.
 */
export function GetStartedSection() {
  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="01"
        label="GET STARTED"
        title="Sign in, then pick what to explore."
      >
        Pipeline walkthrough and verify tool are signed-in experiences.
        Browse the public catalog without an account — everything
        interactive starts after GitHub sign-in (which creates your
        account automatically).
      </SectionHeader>

      <div className="grid grid-cols-1 gap-px border border-hairline bg-hairline md:grid-cols-3">
        <div className="flex flex-col bg-canvas-deep p-6">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-accent">
            01 · PIPELINE
          </div>
          <h3 className="mb-2 font-display text-[20px] font-black leading-[1.1] tracking-[-0.02em] text-ink">
            Walk a recorded republish
          </h3>
          <p className="mb-5 flex-1 font-body text-[13.5px] leading-[1.55] text-ink-softer">
            Seven steps — pin, copy, SBOM, scan, sign, catalog, verify.
            Same frozen Vaultwarden run every time.
          </p>
          <Link
            href="/login?callbackUrl=/pipeline"
            className="btn-chamfer inline-block w-fit border border-hairline bg-canvas-panel px-4 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Sign in to start →
          </Link>
        </div>

        <div className="flex flex-col bg-canvas-deep p-6">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-accent">
            02 · VERIFY
          </div>
          <h3 className="mb-2 font-display text-[20px] font-black leading-[1.1] tracking-[-0.02em] text-ink">
            Paste an image. Read the receipts.
          </h3>
          <p className="mb-5 flex-1 font-body text-[13.5px] leading-[1.55] text-ink-softer">
            Live cosign check against public Sigstore infrastructure.
            Catalog images get full scan enrichment.
          </p>
          <Link
            href="/login?callbackUrl=/verify"
            className="btn-chamfer inline-block w-fit border border-hairline bg-canvas-panel px-4 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Sign in to verify →
          </Link>
        </div>

        <div className="flex flex-col bg-canvas-deep p-6">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            03 · CATALOG
          </div>
          <h3 className="mb-2 font-display text-[20px] font-black leading-[1.1] tracking-[-0.02em] text-ink">
            Browse without signing in
          </h3>
          <p className="mb-5 flex-1 font-body text-[13.5px] leading-[1.55] text-ink-softer">
            Module listings, trust scores, and takeaway compose files are
            public. No account required.
          </p>
          <Link
            href="/catalog"
            className="btn-chamfer inline-block w-fit border border-hairline bg-canvas-panel px-4 py-2.5 font-body text-[13px] font-medium text-ink-mute transition-colors hover:border-ink-ghost hover:text-ink"
          >
            Browse catalog →
          </Link>
        </div>
      </div>
    </section>
  );
}
