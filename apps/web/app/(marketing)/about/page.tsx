import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Flareo is, why it exists, and what we owe the people who use it.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="ABOUT / WHY WE BUILT THIS"
        prompt="flareo about --verbose"
        promptComment="# the long version"
        title={
          <>
            A CONTAINER
            <br />
            SHOULDN&apos;T BE
            <br />
            A LEAP OF FAITH.
          </>
        }
      >
        Every self-hosted service you run was built by someone you&apos;ve
        never met, packaged by someone else, distributed by a registry
        that accepts anything. Flareo fixes the middle of that chain —
        build, scan, sign, attest, publish — so the leap of faith shrinks
        to just the code review you were already going to do.
      </PageHero>

      {/* Long-form prose section */}
      <section className="border-b border-hairline px-8 py-16">
        <div className="mx-auto max-w-[680px] space-y-7 font-body text-[15.5px] leading-[1.75] text-ink-cream">
          <p>
            The first container I pulled and actually thought about was{" "}
            <span className="text-ink">jc21/nginx-proxy-manager</span>. I was
            setting up a home lab. The README said one{" "}
            <code className="border border-hairline bg-canvas-deep px-1.5 py-0.5 font-mono text-[13px] text-accent">
              docker run
            </code>{" "}
            command, the container started, the admin panel loaded, and I
            pointed it at my domain. It worked. And then I sat there for a
            minute wondering:{" "}
            <span className="text-ink">
              who actually built this, and what&apos;s inside it?
            </span>
          </p>

          <p>
            The maintainer could answer the first question. The second was
            harder. The image on Docker Hub was tagged{" "}
            <code className="border border-hairline bg-canvas-deep px-1.5 py-0.5 font-mono text-[13px] text-accent">
              :latest
            </code>{" "}
            and would silently change under me. There was no SBOM. The CVE
            situation was anyone&apos;s guess. The image claimed to be signed,
            but the signing used Docker Content Trust, which nobody verifies
            and nobody checks. I was trusting a community reputation score.
            For a production service in my house, that felt wrong.
          </p>

          <p>
            Flareo exists because the gap between &quot;the source code is
            open&quot; and &quot;the container you&apos;re about to run has
            been verified&quot; is bigger than it should be. Chainguard solves
            this for enterprises with six-figure budgets. Linuxserver.io has
            an enormous self-hosted catalog but no cryptographic guarantees.
            Homegrown pipelines work if you have a platform team. There was
            no option for individual operators who wanted both supply-chain
            rigor and{" "}
            <span className="text-ink">bring-your-own-box freedom</span>.
          </p>

          <div className="my-10 border-l-2 border-accent bg-canvas-deep px-6 py-5 font-mono text-[13.5px] leading-[1.7] text-ink-cream">
            We don&apos;t host your deployment. We don&apos;t run your
            containers. We build them, verify them, attest them, sign them,
            and hand you a <span className="text-accent">docker-compose.yaml</span>{" "}
            pinned to a sha256. What you do with it is up to you.
          </div>

          <p>
            That constraint — <span className="text-ink">we never sit in the runtime path</span> —
            is what lets us say things other platforms can&apos;t. If we shut
            down tomorrow, your deployment keeps running. Nothing phones
            home. The signatures we produce are verified against public
            Sigstore infrastructure we don&apos;t operate, so you can bypass
            our tools entirely and reach the same conclusion.
          </p>

          <p>
            We&apos;re in public beta. The platform runs on two Hetzner VPSes
            in Falkenstein, about €28 a month. We&apos;ve shipped 12 verified
            modules so far. The pipeline handles 41 builds per 7-day window.
            Median stage latency is 340ms. We had one 37-minute degraded-scan
            incident in the last 30 days, documented in full on the{" "}
            <Link href="/status" className="text-accent underline hover:text-accent-hot">
              status page
            </Link>
            . That&apos;s the whole company, basically.
          </p>

          <p>
            When billing starts in September 2026, individual operators stay
            free forever. Pro is $19 per month with no seat tax. Enterprise
            is $99 per month with SSO and audit log export. We&apos;ll give
            30 days of notice before the first invoice, and you can
            self-host the entire platform under AGPLv3 if you&apos;d rather
            skip us entirely.
          </p>

          <p>
            There&apos;s no venture capital. There&apos;s no exit strategy.
            There&apos;s a platform, a changelog, a status page, and the
            belief that verification infrastructure for small operators is a
            category that ought to exist and doesn&apos;t yet. If that maps
            to a problem you have,{" "}
            <Link
              href="/catalog"
              className="text-accent underline hover:text-accent-hot"
            >
              browse the catalog
            </Link>{" "}
            or{" "}
            <Link
              href="/verify"
              className="text-accent underline hover:text-accent-hot"
            >
              verify a module yourself
            </Link>
            . If it doesn&apos;t,{" "}
            <Link
              href="/compare"
              className="text-accent underline hover:text-accent-hot"
            >
              the Compare page
            </Link>{" "}
            will point you at whichever of our competitors fits you better.
          </p>

          {/* Founder signature card.
              The proposal called this out specifically: "Short, personal,
              specific. If Flareo is a solo or small-team project, owning
              that openly reads as senior; hiding it behind corporate
              framing reads as wrong. A named founder note is content
              that differentiates."

              REPLACE THE PLACEHOLDER NAME with the actual founder name
              before launch. The accompanying collaborator credit reflects
              the team size of 2 in Quick Facts. */}
          <div className="mt-10 border border-hairline bg-canvas-deep p-6">
            <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-accent">
              § THE PERSON BEHIND IT
            </div>
            <p className="mb-4 font-body text-[14px] leading-[1.65] text-ink-cream">
              I&apos;m{" "}
              <strong className="text-ink">[FOUNDER NAME]</strong> — the
              one who pulled jc21/nginx-proxy-manager that night and
              couldn&apos;t stop thinking about who built what was running
              in my house. I built the first version of Flareo over the
              winter of 2025, working from a small flat in the EU with
              one collaborator, on Hetzner hardware, in TypeScript,
              because that&apos;s the seam I knew well.
            </p>
            <p className="mb-4 font-body text-[14px] leading-[1.65] text-ink-cream">
              I&apos;m the only person who reads every reviewer
              decision, every takedown request, every report filed
              against a module. If you write to{" "}
              <a
                href="mailto:hello@flareo.dev"
                className="text-accent hover:text-accent-hot"
              >
                hello@flareo.dev
              </a>
              , I read it. If you find a bug at{" "}
              <Link
                href="/security"
                className="text-accent hover:text-accent-hot"
              >
                /security
              </Link>
              , I&apos;m the one who acknowledges it within 24 hours.
              That changes when the team grows past two people; until
              then, this is what &quot;independent&quot; means in
              practice.
            </p>
            <p className="font-body text-[14px] leading-[1.65] text-ink-cream">
              No board. No investors. No exit. Just a platform that
              I&apos;d want to use myself, and a small group of early
              operators who&apos;ve been generous with feedback. Thank
              you, especially, to the publishers who trusted us with
              the first 12 modules.
            </p>
            <div className="mt-5 flex items-baseline justify-between border-t border-hairline pt-4 font-mono text-[11px] text-ink-faint">
              <span>— [FOUNDER NAME], founder · Flareo</span>
              <span className="tracking-[0.04em] text-ink-ghost">
                v0.4.2 · April 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What Flareo is not — explicit scope-negative statement */}
      <section className="border-b border-hairline px-8 py-14">
        <div className="mx-auto max-w-[840px]">
          <div className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-3">
            <span className="font-display text-[18px] font-black tracking-[-0.02em] text-accent">
              §
            </span>
            <h2 className="font-display text-[28px] font-black tracking-[-0.025em] text-ink">
              What Flareo is not.
            </h2>
          </div>
          <p className="mb-6 max-w-[640px] font-body text-[14px] leading-[1.6] text-ink-softer">
            Defining scope by what we do is half the picture. The other half
            is being clear about what we don't do, so visitors don't arrive
            with the wrong expectations and leave disappointed. Five things
            Flareo is not, in plain language.
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <NotCard
              negation="Not a hosting platform"
              detail="We don't run your deployments. After you take away the compose file, your container runs on your infrastructure — your VPS, your Kubernetes cluster, your homelab. If you want managed hosting, look at Railway / Fly / Vercel."
            />
            <NotCard
              negation="Not a CI/CD tool"
              detail="We don't run your tests, gate your PRs, or deploy your application code. The pipeline you see runs once at submission and again daily as a canary. If you want CI/CD, that's GitHub Actions / GitLab CI / Buildkite territory."
            />
            <NotCard
              negation="Not a Kubernetes distribution"
              detail="We're upstream of Kubernetes. The image we publish is what you might use as the basis of a Kubernetes Deployment. The cluster orchestration is your problem (or your distribution's) — k3s, Talos, EKS, whatever."
            />
            <NotCard
              negation="Not a Docker Hub replacement"
              detail="Docker Hub stores millions of images of which we package roughly a dozen. If you need raw image storage with massive catalog, Docker Hub is the right tool. We're the verification + preview + takeaway layer that sits beside it, not the storage layer that competes with it."
            />
            <NotCard
              negation="Not an enterprise compliance product"
              detail="Our pipeline produces auditable artifacts that compliance teams find useful (SBOM, SLSA provenance, signature chain). But we're not selling SOC 2 attestations, FedRAMP authorization, or a managed compliance posture. Those are the businesses of Sysdig, Snyk, Palo Alto. We do the verification; consuming the verification for a compliance program is your call."
            />
            <NotCard
              negation="Not a moat against malicious code"
              detail="Verification establishes provenance and known vulnerability posture. It does not establish that the code is benign. A determined attacker who controls upstream can produce a 'verified' Flareo module. What we give you is the ability to react fast — see the FAQ for detail on this."
              link={{ href: "/faq", label: "see FAQ →" }}
            />
          </div>

          <p className="mt-6 max-w-[640px] font-body text-[13px] leading-[1.6] text-ink-faint">
            Defining scope negatively clarifies positioning and reduces the
            mismatched-expectation conversations that drain support time.
            Counterintuitively, saying clearly "we don't do X" is one of the
            stronger signals you can give a sophisticated audience.
          </p>
        </div>
      </section>

      {/* Quick facts grid */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-12">
        <div className="mb-8 mx-auto max-w-[680px]">
          <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            § QUICK FACTS
          </div>
          <h2 className="font-display text-[28px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            The version without prose.
          </h2>
        </div>
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 border border-hairline md:grid-cols-4">
          {[
            { k: "founded", v: "2025 Q4" },
            { k: "location", v: "Remote · EU" },
            { k: "funding", v: "Bootstrapped" },
            { k: "license", v: "AGPL-3.0" },
            { k: "hosted at", v: "Hetzner · Falkenstein" },
            { k: "beta since", v: "Dec 15, 2025" },
            { k: "modules", v: "12 verified" },
            { k: "team size", v: "2 people" },
          ].map((f, i, arr) => (
            <div
              key={f.k}
              className={`bg-canvas-deep px-5 py-5 ${
                (i + 1) % 4 !== 0 ? "border-r border-hairline" : ""
              } ${i < arr.length - 4 ? "border-b border-hairline md:border-b" : ""}`}
            >
              <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                {f.k.toUpperCase()}
              </div>
              <div className="font-display text-[18px] font-black leading-[1.1] tracking-[-0.02em] text-ink">
                {f.v}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NotCard({
  negation,
  detail,
  link,
}: {
  negation: string;
  detail: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="border border-hairline bg-canvas-deep p-5">
      <h3 className="mb-2 font-display text-[16px] font-black leading-[1.2] tracking-[-0.02em] text-bad">
        × {negation}
      </h3>
      <p className="font-body text-[12.5px] leading-[1.6] text-ink-softer">
        {detail}
      </p>
      {link && (
        <Link
          href={link.href}
          className="mt-2 inline-block font-mono text-[10.5px] text-accent hover:text-accent-hot"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
