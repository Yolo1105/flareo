import Link from "next/link";

/**
 * Bottom-of-marketplace CTA — sign in before interactive demos.
 */
export function MarketplacePublishCTA() {
  return (
    <section className="border-b border-hairline bg-accent px-8 py-14 text-canvas">
      <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-canvas/70">
            08 / HOW IT WORKS
          </div>
          <h2 className="mb-4 font-display text-[36px] font-black leading-[0.98] tracking-[-0.03em]">
            See one image go through the pipeline.
          </h2>
          <p className="max-w-[640px] font-body text-[14.5px] leading-[1.55] text-canvas/85">
            Sign in first, then walk a recorded Vaultwarden republish or
            paste an image into the verify tool. Same preconfigured results
            every time.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/login?callbackUrl=/app/start"
            className="border border-canvas bg-canvas px-5 py-3 text-center font-body text-[14px] font-medium tracking-[0.01em] text-ink transition-colors hover:bg-canvas-panel"
          >
            Sign in to explore →
          </Link>
          <Link
            href="/catalog"
            className="border border-canvas/40 px-5 py-3 text-center font-body text-[14px] font-medium tracking-[0.01em] text-canvas transition-all hover:border-canvas"
          >
            Browse catalog (public)
          </Link>
        </div>
      </div>
    </section>
  );
}
