import { Eyebrow } from "@/components/ui/Eyebrow";
import { FLAREO_VERSION } from "@/lib/version";

/**
 * Landing hero — only place on the site with an orange flood.
 * Everything else is warm-charcoal canvas.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-hairline bg-accent px-8 pb-20 pt-24 text-canvas">
      {/* Soft grain variant tinted for orange */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(#1A1614 0.6px, transparent 0.6px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-2 border border-canvas px-[11px] py-[5px] font-mono text-[11px] font-medium tracking-[0.12em]">
          <span className="block h-1 w-1 bg-canvas" />
          V{FLAREO_VERSION} / FROZEN
        </div>
        <h1 className="mb-7 max-w-[1100px] font-display text-[88px] font-black leading-[0.92] tracking-[-0.04em]">
          VERIFIED SIGNATURES.
          <br />
          REPUBLISHED WITH RECEIPTS.
          <br />
          CHECKABLE BY ANYONE.
        </h1>
        <p className="max-w-[640px] font-body text-[17px] leading-[1.55] text-canvas/90">
          Flareo builds, scans, signs, and attests third-party containers so
          you can run self-hosted software without trusting strangers on
          Docker Hub. A curated catalog, real receipts on every module, and a
          portable compose file you take home. Your infrastructure. Your
          security.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="/verify"
            className="btn-chamfer border border-canvas bg-canvas px-[22px] py-3 font-body text-[14px] font-medium tracking-[0.01em] text-ink transition-colors hover:bg-canvas-panel"
          >
            Verify any image →
          </a>
          <a
            href="/catalog"
            className="btn-chamfer border border-canvas/40 px-[22px] py-3 font-body text-[14px] font-medium tracking-[0.01em] text-canvas transition-all hover:border-canvas"
          >
            Browse the catalog
          </a>
          <a
            href="#install"
            className="font-body text-[13px] font-medium tracking-[0.01em] text-canvas/80 transition-colors hover:text-canvas"
          >
            or install the CLI →
          </a>
        </div>
      </div>
      {/* Eyebrow renders nothing here — just imported to avoid tree-shake surprises */}
      <Eyebrow className="hidden">placeholder</Eyebrow>
    </section>
  );
}
