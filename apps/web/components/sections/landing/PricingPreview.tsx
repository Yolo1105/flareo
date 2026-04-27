import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * Compact pricing preview on the landing. Full matrix lives at /pricing.
 */
export function PricingPreview() {
  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="07"
        label="PRICING"
        title="Free during beta. Fair afterward. No seat tax."
      >
        Individual operators stay free forever. Pro is $19/mo when billing
        starts in September 2026, 30 days of advance notice. Enterprise
        is $99/mo billed annually, no per-seat charges.
      </SectionHeader>

      <div className="grid grid-cols-1 border border-hairline md:grid-cols-3">
        {/* Free */}
        <div className="relative border-b border-hairline bg-canvas-deep p-8 md:border-b-0 md:border-r">
          <div className="mb-3.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-ink-faint">
            01 · FOREVER FREE
          </div>
          <div className="mb-3.5 font-display text-[32px] font-black leading-[1] tracking-[-0.03em] text-ink">
            FREE
          </div>
          <div className="mb-5 flex items-baseline gap-1.5 border-y border-hairline py-5">
            <span className="font-display text-[56px] font-black leading-[0.9] tracking-[-0.04em] text-ink">
              <span className="text-[30px] text-ink-faint">$</span>0
            </span>
            <span className="ml-2 font-mono text-[10.5px] leading-tight tracking-[0.06em] text-ink-faint">
              forever
              <br />
              no card
            </span>
          </div>
          <ul className="mb-6 space-y-2 font-body text-[13px] leading-[1.5] text-ink-cream">
            <li>Unlimited public catalog pulls</li>
            <li>3 public modules</li>
            <li>200 build minutes / month</li>
            <li>60 sandbox minutes / month</li>
          </ul>
        </div>

        {/* Pro (featured) */}
        <div className="relative bg-gradient-to-b from-accent/[0.06] to-transparent p-8 before:absolute before:left-0 before:right-0 before:top-0 before:h-[2px] before:bg-accent md:border-r md:border-hairline">
          <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            02 · MOST COMMON
            <span className="border border-accent px-1.5 py-0.5 text-[9px] tracking-[0.14em]">
              FREE IN BETA
            </span>
          </div>
          <div className="mb-3.5 font-display text-[32px] font-black leading-[1] tracking-[-0.03em] text-ink">
            PRO
          </div>
          <div className="mb-5 flex items-baseline gap-1.5 border-y border-hairline py-5">
            <span className="font-display text-[56px] font-black leading-[0.9] tracking-[-0.04em] text-ink">
              <span className="text-[30px] text-ink-faint">$</span>19
            </span>
            <span className="ml-2 font-mono text-[10.5px] leading-tight tracking-[0.06em] text-ink-faint">
              per month
              <br />
              billed monthly
            </span>
          </div>
          <ul className="mb-6 space-y-2 font-body text-[13px] leading-[1.5] text-ink-cream">
            <li>20 private modules</li>
            <li>1,000 build minutes / month</li>
            <li>Priority review · 2h SLA</li>
            <li>10 team seats included</li>
          </ul>
        </div>

        {/* Enterprise */}
        <div className="bg-canvas-deep p-8">
          <div className="mb-3.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-ink-faint">
            03 · COMPLIANCE-READY
          </div>
          <div className="mb-3.5 font-display text-[32px] font-black leading-[1] tracking-[-0.03em] text-ink">
            ENTERPRISE
          </div>
          <div className="mb-5 flex items-baseline gap-1.5 border-y border-hairline py-5">
            <span className="font-display text-[56px] font-black leading-[0.9] tracking-[-0.04em] text-ink">
              <span className="text-[30px] text-ink-faint">$</span>99
            </span>
            <span className="ml-2 font-mono text-[10.5px] leading-tight tracking-[0.06em] text-ink-faint">
              per month
              <br />
              billed annually
            </span>
          </div>
          <ul className="mb-6 space-y-2 font-body text-[13px] leading-[1.5] text-ink-cream">
            <li>Unlimited private modules</li>
            <li>Unlimited build minutes</li>
            <li>SSO · SAML + OIDC</li>
            <li>2h dedicated response SLA</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          href="/pricing"
          className="font-mono text-[11.5px] tracking-[0.08em] text-accent transition-colors hover:text-accent-hot"
        >
          FULL FEATURE MATRIX →
        </Link>
      </div>
    </section>
  );
}
