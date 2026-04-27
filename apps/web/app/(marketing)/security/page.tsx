import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How to report a vulnerability in Flareo or in any module we've published. Our response commitments.",
};

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="SECURITY / RESPONSIBLE DISCLOSURE"
        prompt="curl https://flareo.dev/.well-known/security.txt"
        promptComment="# also published as security.txt for automated discovery"
        title={
          <>
            Found something?
            <br />
            Tell us first.
          </>
        }
      >
        <p className="max-w-[680px] font-body text-[15px] leading-[1.55] text-ink-softer">
          If you've found a security issue in Flareo's platform — or in a
          module we've published — we want to hear from you before anyone
          else does. This page documents the channel, our response timeline,
          and what you should expect.
        </p>
      </PageHero>

      <div className="px-8 py-12">
        <div className="mx-auto max-w-[840px] space-y-12">
          {/* ─── primary contact ─── */}
          <section>
            <header className="mb-4 flex items-baseline gap-4 border-b border-hairline pb-3">
              <span className="font-display text-[18px] font-black tracking-[-0.02em] text-accent">
                01
              </span>
              <h2 className="font-display text-[22px] font-black tracking-[-0.025em] text-ink">
                How to report
              </h2>
            </header>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="border border-hairline bg-canvas-deep p-5">
                <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
                  EMAIL
                </div>
                <a
                  href="mailto:security@flareo.dev"
                  className="font-mono text-[16px] text-accent hover:text-accent-hot"
                >
                  security@flareo.dev
                </a>
                <p className="mt-3 font-body text-[12.5px] leading-[1.55] text-ink-softer">
                  Encrypt with our PGP key (below) if the report contains
                  sensitive details. Plain email is fine for a heads-up;
                  follow up with details over the encrypted channel.
                </p>
              </div>

              <div className="border border-hairline bg-canvas-deep p-5">
                <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
                  PGP KEY FINGERPRINT
                </div>
                <code className="block break-all font-mono text-[11.5px] text-ink">
                  4F3A 2C1B 9E7D 8C5A 6F2D 3B1A 7C9D 8E2F 4A6B 1C3D
                </code>
                <p className="mt-3 font-body text-[12.5px] leading-[1.55] text-ink-softer">
                  Full key at{" "}
                  <a
                    href="https://flareo.dev/.well-known/pgp-key.asc"
                    className="text-accent hover:text-accent-hot"
                  >
                    flareo.dev/.well-known/pgp-key.asc
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="mt-3 border border-dashed border-hairline bg-canvas-panel p-4">
              <p className="font-body text-[12.5px] leading-[1.6] text-ink-softer">
                <strong className="text-ink">For active exploitation:</strong>{" "}
                if you believe a vulnerability is being actively exploited
                against Flareo or against deployed modules, mark the email
                subject{" "}
                <code className="font-mono text-[12px] text-accent">
                  [URGENT-EXPLOIT]
                </code>{" "}
                — it pages on-call.
              </p>
            </div>
          </section>

          {/* ─── what we respond on ─── */}
          <section>
            <header className="mb-4 flex items-baseline gap-4 border-b border-hairline pb-3">
              <span className="font-display text-[18px] font-black tracking-[-0.02em] text-accent">
                02
              </span>
              <h2 className="font-display text-[22px] font-black tracking-[-0.025em] text-ink">
                In scope
              </h2>
            </header>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-display text-[14px] font-black tracking-[-0.015em] text-good">
                  Yes — we want these
                </h3>
                <ul className="space-y-2 font-body text-[12.5px] leading-[1.6] text-ink-softer">
                  <li>
                    Pipeline integrity bugs: anything letting a submitter
                    smuggle artifacts past Trivy / cosign / SLSA
                  </li>
                  <li>
                    Sandbox escapes from any preview environment
                  </li>
                  <li>
                    Authentication or session bugs in flareo.dev or the API
                  </li>
                  <li>
                    Privilege escalation between user / publisher / admin
                  </li>
                  <li>
                    Trust Score forgery: making a module's score appear
                    higher than the formula computes
                  </li>
                  <li>
                    SSRF, RCE, SQLi, XSS, CSRF in the platform code
                  </li>
                  <li>
                    Bugs in any module we've published: malicious upstream,
                    backdoored dependency, vulnerable build step
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-display text-[14px] font-black tracking-[-0.015em] text-bad">
                  Out of scope
                </h3>
                <ul className="space-y-2 font-body text-[12.5px] leading-[1.6] text-ink-softer">
                  <li>
                    Vulnerabilities in upstream projects we package — report
                    those to the upstream project; we'll coordinate the
                    rebuild after they patch
                  </li>
                  <li>
                    Missing security headers on marketing pages (we read
                    these reports but they go to the bottom of the queue)
                  </li>
                  <li>
                    SPF / DMARC / DKIM tuning on email infrastructure
                  </li>
                  <li>
                    Self-XSS where the only path is the user's own browser
                    extension or DevTools
                  </li>
                  <li>
                    DDoS / volumetric attacks (we have separate operational
                    channels for this)
                  </li>
                  <li>
                    Reports generated by automated scanners with no
                    proof-of-impact
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ─── timelines ─── */}
          <section>
            <header className="mb-4 flex items-baseline gap-4 border-b border-hairline pb-3">
              <span className="font-display text-[18px] font-black tracking-[-0.02em] text-accent">
                03
              </span>
              <h2 className="font-display text-[22px] font-black tracking-[-0.025em] text-ink">
                What you should expect
              </h2>
            </header>
            <div className="space-y-3">
              <Timeline
                step="Acknowledgement"
                window="within 24h"
                detail="A real human replies. Not an autoresponder. We confirm receipt and tell you who's looking at it."
              />
              <Timeline
                step="Triage"
                window="within 72h"
                detail="We confirm whether the issue reproduces and assign a severity (P0–P3). You get the assigned severity and our preliminary read."
              />
              <Timeline
                step="Mitigation"
                window="P0: 24h · P1: 7d · P2: 30d · P3: best-effort"
                detail="A mitigation lands in production. For module-level issues, this means a rebuild with the fix; for platform issues, a code deploy. We tell you when it's live."
              />
              <Timeline
                step="Coordinated disclosure"
                window="90 days from initial report (negotiable)"
                detail="If an issue affects external users, we publish details after the fix has had time to propagate. Reporters who want public attribution get it; those who want anonymity get that. The default is your call."
              />
              <Timeline
                step="Public incident log"
                window="after disclosure"
                detail={
                  <>
                    Vulnerabilities that affected published modules appear on{" "}
                    <Link
                      href="/incidents"
                      className="text-accent hover:text-accent-hot"
                    >
                      /incidents
                    </Link>{" "}
                    with the timeline, scope, mitigation, and reporter credit
                    (with consent).
                  </>
                }
              />
            </div>
          </section>

          {/* ─── safe harbor ─── */}
          <section>
            <header className="mb-4 flex items-baseline gap-4 border-b border-hairline pb-3">
              <span className="font-display text-[18px] font-black tracking-[-0.02em] text-accent">
                04
              </span>
              <h2 className="font-display text-[22px] font-black tracking-[-0.025em] text-ink">
                Safe harbor
              </h2>
            </header>
            <div className="font-body text-[13px] leading-[1.65] text-ink-softer">
              <p className="mb-3">
                We will not pursue legal action against good-faith security
                researchers who:
              </p>
              <ul className="mb-3 space-y-2 pl-5" style={{ listStyle: "disc" }}>
                <li>
                  Test only against accounts you own or have explicit
                  permission to test against
                </li>
                <li>
                  Avoid privacy violations, destruction of data, and
                  interruption of service
                </li>
                <li>
                  Give us reasonable time to respond before any public
                  disclosure
                </li>
                <li>
                  Make a good-faith effort to comply with all applicable
                  laws
                </li>
              </ul>
              <p>
                If your testing activities raise concerns about
                authorization, contact us first. We'd rather talk through it
                than discover the testing in our logs without context.
              </p>
            </div>
          </section>

          {/* ─── bounty ─── */}
          <section>
            <header className="mb-4 flex items-baseline gap-4 border-b border-hairline pb-3">
              <span className="font-display text-[18px] font-black tracking-[-0.02em] text-accent">
                05
              </span>
              <h2 className="font-display text-[22px] font-black tracking-[-0.025em] text-ink">
                Bounty program
              </h2>
            </header>
            <div className="border border-dashed border-warn/50 bg-warn/[0.04] p-5 font-body text-[13px] leading-[1.65] text-ink-softer">
              <p className="mb-2">
                <strong className="text-ink">Honest answer: we don't run a paid bounty program yet.</strong>
              </p>
              <p>
                For high-impact reports we offer a public credit on the
                /incidents page, swag, and a thank-you that we mean. When
                Flareo has revenue to support a structured bounty, we'll
                publish the program in detail rather than running an
                informal one. Until then, we ask researchers to report for
                the same reason we'd report bugs we find ourselves: because
                fixing them makes the platform safer for everyone running
                it.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Timeline({
  step,
  window,
  detail,
}: {
  step: string;
  window: string;
  detail: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border border-hairline bg-canvas-deep p-4 md:grid-cols-[180px_180px_1fr] md:gap-4">
      <div className="font-mono text-[11.5px] tracking-[0.04em] text-ink">
        {step}
      </div>
      <div className="font-mono text-[11px] text-accent">{window}</div>
      <div className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
        {detail}
      </div>
    </div>
  );
}
