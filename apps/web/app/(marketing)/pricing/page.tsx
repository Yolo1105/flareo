import { PageHero } from "@/components/ui/PageHero";
import { FaqRow } from "@/components/ui/FaqRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PreviewConversionDetector } from "@/components/analytics/PreviewConversionDetector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free during public beta. Fair afterward. No seat tax. Two tiers, one philosophy.",
};

interface MatrixRow {
  feature: string;
  sub?: string;
  free: React.ReactNode;
  pro: React.ReactNode;
}

const MATRIX_GROUPS: { label: string; rows: MatrixRow[] }[] = [
  {
    label: "CATALOG & PULLS",
    rows: [
      { feature: "Public catalog access", sub: "browse, search, inspect", free: "✓", pro: "✓" },
      { feature: "Verified module pulls", sub: "cosign-gated", free: "unlimited", pro: "unlimited" },
      { feature: "SBOM, SLSA, attestation downloads", sub: "every receipt, every module", free: "✓", pro: "✓" },
      { feature: "CLI access (flareo)", sub: "all public commands", free: "✓", pro: "✓" },
    ],
  },
  {
    label: "PUBLISHING",
    rows: [
      { feature: "Public modules", sub: "listed in the shared catalog", free: "3", pro: "unlimited" },
      { feature: "Private modules", sub: "visible only to you or your org", free: "—", pro: "up to 20" },
      { feature: "Build minutes / month", sub: "pipeline CPU time", free: "200", pro: "1,000" },
      { feature: "Review queue SLA", sub: "time to first admin review", free: "24h", pro: "2h" },
      { feature: "Custom policy gates", sub: "block on CVE severity, SLSA level", free: "—", pro: "—" },
    ],
  },
  {
    label: "SANDBOX PREVIEW",
    rows: [
      { feature: "Sandbox minutes / month", sub: "live preview VMs", free: "60", pro: "600" },
      { feature: "Max session duration", free: "30 min", pro: "60 min" },
      { feature: "Concurrent sessions", free: "1", pro: "5" },
    ],
  },
  {
    label: "ORG & IDENTITY",
    rows: [
      { feature: "Team seats", sub: "no per-seat charge", free: "1", pro: "up to 10" },
      { feature: "Audit log export", sub: "JSON, 90-day retention", free: "—", pro: "roadmap" },
      { feature: "SSO via SAML + OIDC", sub: "on the roadmap for Q3", free: "—", pro: "roadmap" },
    ],
  },
  {
    label: "SUPPORT",
    rows: [
      { feature: "Community support", sub: "GitHub Discussions", free: "✓", pro: "✓" },
      { feature: "Email support", sub: "first response time", free: "—", pro: "24h" },
    ],
  },
];

function Cell({ val }: { val: React.ReactNode }) {
  const text = String(val);
  if (text === "✓") return <div className="text-center font-mono text-[12px] text-good">✓</div>;
  if (text === "—") return <div className="text-center font-mono text-[12px] text-ink-ghost">—</div>;
  if (text === "roadmap") return <div className="text-center font-mono text-[10px] tracking-[0.12em] text-warn">roadmap</div>;
  return <div className="text-center font-mono text-[12px] font-medium text-ink">{val}</div>;
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="PRICING / HONEST"
        prompt="flareo billing --tier=all"
        promptComment="# two plans, priced to be fair"
        title={
          <>
            FREE IN BETA.
            <br />
            <span className="text-accent">FAIR AFTERWARD.</span>
            <br />
            NO SEAT TAX.
          </>
        }
      >
        Public beta is{" "}
        <span className="text-ink">genuinely free</span> — not trial-free,
        not 14-days-free, free. When billing launches in V1.1, individual
        operators stay free forever, paid tiers charge for real
        infrastructure usage, and we don&apos;t charge per seat.
      </PageHero>

      {/* Beta notice */}
      <div className="flex items-center gap-3.5 border-b border-hairline bg-accent/[0.06] px-8 py-3.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent meta-pulse" />
        <span className="font-mono text-[11.5px] tracking-[0.04em] leading-[1.55] text-ink-mute">
          <span className="font-medium text-accent">PUBLIC BETA ACTIVE</span> ·
          All features on all tiers are free through{" "}
          <span className="text-ink">2026-09-01</span>. You&apos;ll get 30
          days notice before the first invoice lands. Cancel anytime; your
          free tier remains.
        </span>
      </div>

      {/* Tier panels */}
      <section className="border-b border-hairline px-8 py-14">
        <div className="grid grid-cols-1 border border-hairline md:grid-cols-2">
          {/* Free */}
          <div className="border-b border-hairline bg-canvas-deep p-8 md:border-b-0 md:border-r">
            <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-ink-faint">
              <span className="text-ink-ghost">01</span>
              FOREVER FREE
            </div>
            <div className="mb-3.5 font-display text-[32px] font-black leading-[1] tracking-[-0.03em] text-ink">
              FREE
            </div>
            <p className="mb-6 min-h-[40px] font-body text-[13px] leading-[1.55] text-ink-softer">
              For <span className="text-ink">solo operators and self-hosters</span>{" "}
              running a handful of modules on their own hardware.
            </p>
            <div className="mb-5 flex items-baseline gap-2 border-y border-hairline py-5">
              <span className="font-display text-[64px] font-black leading-[0.9] tracking-[-0.04em] text-ink">
                <span className="text-[36px] text-ink-faint">$</span>0
              </span>
              <span className="ml-2 font-mono text-[11px] leading-[1.4] tracking-[0.06em] text-ink-faint">
                forever
                <br />
                no card required
              </span>
            </div>
            <div className="mb-5 inline-block border border-hairline bg-canvas px-2.5 py-2 font-mono text-[11.5px] text-accent">
              <span className="mr-1.5 text-ink-faint">$</span>
              flareo signup --tier=free
            </div>
            <div className="mb-6 flex flex-col gap-2.5">
              {[
                ["✓", "Unlimited pulls from the public catalog"],
                ["✓", "Full receipts on every module, no paywall"],
                ["✓", "Publish up to 3 public modules"],
                ["✓", "200 build minutes per month"],
                ["✓", "60 sandbox minutes per month"],
                ["✓", "Community support via GitHub"],
                ["—", "No private modules"],
                ["—", "No priority review queue"],
              ].map(([tick, text], i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[16px_1fr] items-baseline gap-2 font-body text-[13px] leading-[1.5] ${
                    tick === "—" ? "text-ink-faint" : "text-ink-cream"
                  }`}
                >
                  <span className={`font-mono text-[12px] ${tick === "—" ? "text-ink-ghost" : "text-good"}`}>
                    {tick}
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button className="w-full border border-hairline bg-transparent px-4.5 py-3 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost">
              Start free
            </button>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-b from-accent/[0.06] to-transparent p-8 before:absolute before:left-0 before:right-0 before:top-0 before:h-[2px] before:bg-accent">
            <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
              <span className="font-normal text-ink-ghost">02</span>
              MOST COMMON
              <span className="border border-accent px-1.5 py-0.5 text-[9px] tracking-[0.14em]">
                FREE IN BETA
              </span>
            </div>
            <div className="mb-3.5 font-display text-[32px] font-black leading-[1] tracking-[-0.03em] text-ink">
              PRO
            </div>
            <p className="mb-6 min-h-[40px] font-body text-[13px] leading-[1.55] text-ink-softer">
              For <span className="text-ink">small teams and publishers</span>{" "}
              running real production workloads with private modules.
            </p>
            <div className="mb-5 flex items-baseline gap-2 border-y border-hairline py-5">
              <span className="font-display text-[64px] font-black leading-[0.9] tracking-[-0.04em] text-ink">
                <span className="text-[36px] text-ink-faint">$</span>12
              </span>
              <span className="ml-2 font-mono text-[11px] leading-[1.4] tracking-[0.06em] text-ink-faint">
                per month
                <br />
                billed monthly
              </span>
            </div>
            <div className="mb-5 inline-block border border-hairline bg-canvas px-2.5 py-2 font-mono text-[11.5px] text-accent">
              <span className="mr-1.5 text-ink-faint">$</span>
              flareo signup --tier=pro
            </div>
            <div className="mb-6 flex flex-col gap-2.5">
              {[
                ["✓", "Everything in Free"],
                ["✓", "Up to 20 private modules"],
                ["✓", "1,000 build minutes per month"],
                ["✓", "Extended sandbox, 60 min sessions"],
                ["✓", "Priority review queue, 2h SLA"],
                ["✓", "Module analytics and pull stats"],
                ["✓", "Email support, 24h response"],
                ["—", "No SSO / SAML"],
              ].map(([tick, text], i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[16px_1fr] items-baseline gap-2 font-body text-[13px] leading-[1.5] ${
                    tick === "—" ? "text-ink-faint" : "text-ink-cream"
                  }`}
                >
                  <span className={`font-mono text-[12px] ${tick === "—" ? "text-ink-ghost" : "text-good"}`}>
                    {tick}
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button className="btn-chamfer w-full bg-accent px-4.5 py-3 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot">
              Claim beta access
            </button>
          </div>
        </div>
      </section>

      {/* Feature matrix */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
        <SectionHeader num="01" label="FULL COMPARISON" title="Every feature, every tier.">
          The tier cards above are the summary. This is the reference table
          — every capability we offer, grouped by category, with{" "}
          <span className="text-ink">exact numbers</span> instead of vague
          promises.
        </SectionHeader>
        <div className="border border-hairline bg-canvas-deep">
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-0 border-b border-hairline bg-canvas px-5 py-3.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-ink-faint">
            <div>CAPABILITY</div>
            <div className="text-center">FREE</div>
            <div className="text-center text-accent">PRO</div>
          </div>
          {MATRIX_GROUPS.map((group) => (
            <div key={group.label} className="border-b border-hairline last:border-b-0">
              <div className="border-b border-hairline bg-canvas px-5 py-3 font-mono text-[10px] font-medium tracking-[0.18em] text-accent">
                {group.label}
              </div>
              {group.rows.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[2fr_1fr_1fr] items-baseline gap-0 px-5 py-2.5 transition-colors hover:bg-accent/[0.025] ${
                    i < group.rows.length - 1 ? "border-b border-hairline" : ""
                  }`}
                >
                  <div className="font-body text-[13px] leading-[1.5] text-ink">
                    {row.feature}
                    {row.sub && (
                      <span className="mt-0.5 block font-mono text-[11.5px] tracking-[0.02em] text-ink-faint">
                        {row.sub}
                      </span>
                    )}
                  </div>
                  <Cell val={row.free} />
                  <Cell val={row.pro} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Usage in practice */}
      <section className="border-b border-hairline px-8 py-14">
        <SectionHeader num="02" label="USAGE IN PRACTICE" title="What 200 build minutes actually buys you.">
          Quotas are abstract until you map them to real work. Here&apos;s
          what each Free-tier limit translates to, based on{" "}
          <span className="text-ink">actual median build times from the past 90 days</span>.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-1 border border-hairline md:grid-cols-3">
            {[
              {
                label: "FREE TIER MATH",
                h: <>Build minutes <span className="text-accent">×</span> median build</>,
                body: <><span className="text-ink">200 min / month</span> divided by the current median Flareo build time of <span className="text-ink">~4.3 min</span>. More than enough for a small publisher shipping 1–2 modules with weekly releases.</>,
                calc: "200 ÷ 4.3 = ~46 full pipeline runs / month",
              },
              {
                label: "SANDBOX MATH",
                h: "60 sandbox min / month",
                body: <>Each sandbox session is capped at 30 min on Free. <span className="text-ink">Enough to preview two modules per month end-to-end</span>, or ten quick 5-minute evaluations.</>,
                calc: "60 min = 2 full sessions or 12 quick previews",
              },
              {
                label: "PULL MATH",
                h: "Unlimited pulls, always",
                body: <>Pulling verified modules from the public catalog is <span className="text-ink">unmetered on every tier</span>, including Free. Verification should feel free because it is.</>,
                calc: "no quota = unlimited forever",
              },
            ].map((c, i) => (
              <div
                key={i}
                className={`bg-canvas-deep p-5 ${
                  i < 2 ? "border-b border-hairline md:border-b-0 md:border-r" : ""
                }`}
              >
                <div className="mb-2.5 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                  {c.label}
                </div>
                <h3 className="mb-2 font-display text-[20px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
                  {c.h}
                </h3>
                <p className="mb-3 font-body text-[12.5px] leading-[1.6] text-ink-softer">
                  {c.body}
                </p>
                <div className="border-t border-dashed border-hairline pt-2.5 font-mono text-[10.5px] leading-[1.5] text-ink-faint">
                  {c.calc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
        <div className="mb-7">
          <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            <span className="text-ink-ghost">03</span> BILLING FAQ
          </div>
          <h2 className="font-display text-[32px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            The questions we actually get.
          </h2>
        </div>
        <div className="border-t border-hairline">
          <FaqRow
            num="Q1"
            question="When does the paid billing actually start?"
            answer={
              <>
                V1.1 launches{" "}
                <span className="text-ink">September 1, 2026</span>, and
                that&apos;s the earliest any tier above Free starts
                charging. Every account gets{" "}
                <span className="text-ink">
                  30 days of email notice before the first invoice
                </span>
                . If you don&apos;t upgrade, you stay on Free with
                Free&apos;s limits.
              </>
            }
          />
          <FaqRow
            num="Q2"
            question="Can I self-host the whole platform and skip Flareo hosted?"
            answer={
              <>
                Yes. The platform is{" "}
                <span className="text-ink">AGPLv3</span> — the code is at
                github.com/flareo/flareo. You can run the whole pipeline on
                your own infrastructure, publish to your own registry, and
                never pay us a dollar.
              </>
            }
          />
          <FaqRow
            num="Q3"
            question="What happens if I exceed my build minutes?"
            answer={
              <>
                Pipelines queue instead of failing. You&apos;ll get an email
                at 80% usage and a second at 100%. After the quota is hit,
                new builds wait until the next billing cycle or until you
                upgrade.{" "}
                <span className="text-ink">No surprise overage charges</span>
                .
              </>
            }
          />
          <FaqRow
            num="Q4"
            question="Do you charge per seat on teams?"
            answer={
              <>
                No. Pro includes up to 10 team members.{" "}
                <span className="text-ink">
                  Seat-based pricing is a tax on collaboration
                </span>{" "}
                — we&apos;d rather charge for the work the pipeline does
                than for how many people are allowed to look at a dashboard.
              </>
            }
          />
          <FaqRow
            num="Q5"
            question="Can I cancel anytime?"
            answer={
              <>
                Yes. Downgrading to Free is one click and takes effect at
                the end of the current billing period — no refunds on
                prepaid months, but your private modules stay accessible
                (read-only) for <span className="text-ink">90 days</span>.
              </>
            }
          />
          <FaqRow
            num="Q6"
            question="Is there a nonprofit or OSS maintainer discount?"
            answer={
              <>
                Yes, two programs. Verified OSS projects with an
                OSI-approved license get{" "}
                <span className="text-ink">Pro free forever</span>.
                Registered nonprofits get{" "}
                <span className="text-ink">50% off Pro</span>. Email
                hello@flareo.sh from an organization address to enroll.
              </>
            }
            last
          />
        </div>
      </section>

      {/* Escape hatch */}
      <section className="px-8 py-16 text-center">
        <div className="mb-[18px] inline-flex items-center gap-2 border border-accent px-[11px] py-[5px] font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          <span className="block h-1 w-1 bg-accent" />
          NONE OF THESE FIT?
        </div>
        <h2 className="mx-auto mb-3.5 max-w-[720px] font-display text-[36px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
          Two pricing tiers can&apos;t cover every case.
        </h2>
        <p className="mx-auto mb-6 max-w-[560px] font-body text-[14px] leading-[1.65] text-ink-softer">
          If your situation is outside these — a custom compliance
          requirement, a volume we haven&apos;t priced for, an internal
          registry deal, or something with unusual audit needs — talk to
          us, or self-host.
        </p>
        <div className="inline-flex gap-2.5">
          <button className="btn-chamfer bg-accent px-5 py-3 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot">
            Talk to us
          </button>
          <button className="border border-hairline bg-transparent px-5 py-3 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost">
            Read the self-host guide
          </button>
        </div>
      </section>
      <PreviewConversionDetector target="pricing" />
    </>
  );
}
