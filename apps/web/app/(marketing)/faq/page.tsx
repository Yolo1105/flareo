import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Honest answers to the questions a security-literate visitor actually asks. No marketing softening.",
};

interface QA {
  q: string;
  a: React.ReactNode;
}

interface Section {
  title: string;
  num: string;
  items: QA[];
}

const SECTIONS: Section[] = [
  {
    num: "01",
    title: "Why does this exist",
    items: [
      {
        q: "Why not just use Docker Hub?",
        a: (
          <>
            <p>
              Docker Hub stores images. It does not verify them, doesn't tell
              you what's in them, and doesn't tell you who built them. The
              consequence: every <code>docker pull nginx</code> is a leap of
              faith — into a bytestring written by someone you've never met,
              with no cryptographic record of how it got there.
            </p>
            <p>
              Flareo rebuilds every module from source in a hermetic
              environment, generates a CycloneDX SBOM, scans for CVEs, signs
              with cosign keyless, attests with SLSA provenance, and logs the
              signature to Rekor. Every claim has a receipt. The two services
              do different things; we don't compete on catalog size.
            </p>
            <p>
              Detail at <Link href="/compare" className="text-accent hover:text-accent-hot">how Flareo compares</Link>.
            </p>
          </>
        ),
      },
      {
        q: "Why not just use Artifact Hub?",
        a: (
          <>
            <p>
              Artifact Hub indexes existing Helm charts, operators, and OCI
              artifacts and shows their metadata. It doesn't build them,
              doesn't sign what it indexes, and doesn't let you try them.
              Flareo's pipeline is the difference: every Flareo module was
              built by us, in our environment, with our receipts.
            </p>
          </>
        ),
      },
      {
        q: "Why not just use Railway / Fly / Vercel?",
        a: (
          <>
            <p>
              Those platforms deploy software for you, on their infrastructure.
              That's a different shape from what Flareo does — Flareo gets you
              to a verified image and a portable docker-compose.yaml that runs
              on YOUR infrastructure. We don't host your deployment; we
              prepare it.
            </p>
            <p>
              If you want managed hosting and don't mind the lock-in, those
              platforms are good. If you want the verification chain plus the
              freedom to run wherever, Flareo is the seam.
            </p>
          </>
        ),
      },
      {
        q: "How is this different from Coolify or Dokku?",
        a: (
          <>
            <p>
              Coolify and Dokku are deployment runners — they help you run
              software on your own VPS. They don't help you choose what to run.
              Flareo helps you discover and verify; you point your existing
              Coolify (or Compose, or Kubernetes) setup at the resulting
              image. The two are complementary, not competitive.
            </p>
          </>
        ),
      },
    ],
  },
  {
    num: "02",
    title: "How verification actually works",
    items: [
      {
        q: "What does \"verified\" actually mean?",
        a: (
          <>
            <p>A Flareo module marked Verified means all of these are true:</p>
            <ul>
              <li>Built in our hermetic BuildKit environment from declared source</li>
              <li>Scanned by Trivy with zero <strong>critical</strong> CVEs at scan time</li>
              <li>CycloneDX SBOM generated and bound to the image digest</li>
              <li>SLSA L1 provenance attestation produced and signed</li>
              <li>Image signed with cosign keyless, signature logged to Rekor</li>
              <li>Passed the policy gate (today: human reviewer using the gate's signals; tomorrow: automated OPA evaluation)</li>
            </ul>
            <p>
              "Verified" is precise here, not marketing-precise. The
              definition appears in the Trust Score docs and on the threat
              model page. If a module loses any of these signals on a
              subsequent rebuild — e.g., a new CVE drops — the status flips
              and the catalog shows it.
            </p>
          </>
        ),
      },
      {
        q: "How do I know a verified module isn't still malicious?",
        a: (
          <>
            <p>
              You don't, fully. Verification establishes provenance and known
              vulnerability posture. It does not establish that the upstream
              code is benign in intent — a malicious upstream can produce a
              "verified" module by Flareo's standards.
            </p>
            <p>
              What verification gives you is the ability to <em>react fast
              when something is found</em>. Because every module has an SBOM,
              the moment a CVE drops we know which modules are affected and
              can rebuild them. Because every signature is logged to Rekor,
              you can prove what version you ran. Because the canary chain
              rebuilds daily, your image is never more than 24h stale on
              upstream patches.
            </p>
            <p>
              The honest framing: Flareo replaces "trust the publisher" with
              "verify the chain and respond fast." Both are weaker than "this
              code is provably safe" — which doesn't exist in software.
            </p>
          </>
        ),
      },
      {
        q: "Who reviews the admin review?",
        a: (
          <>
            <p>
              Currently, admin review is performed by the Flareo team — a
              small group, not a single person, with two-eye review for any
              new publisher and any module that touches authentication
              primitives. Decisions are logged to an internal audit table
              and surfaced on the module's detail page (date, decision,
              reviewer initials) so submitters can see exactly what
              happened to their submission.
            </p>
            <p>
              The proposal-stage policy-as-code admission gate is intended to
              automate the parts of review that are mechanical (CVE counts,
              SBOM presence, signature). Human review will remain for the
              ambiguous calls (is the upstream legitimate? is this a
              repackaging of someone else's project?). See the{" "}
              <Link href="/roadmap" className="text-accent hover:text-accent-hot">
                roadmap
              </Link>{" "}
              for delivery date.
            </p>
          </>
        ),
      },
      {
        q: "Can I verify any of this independently, without trusting Flareo?",
        a: (
          <>
            <p>
              Yes — that's the entire design point. Every module's signature
              is in Rekor (a public, append-only transparency log we don't
              control). Every SBOM and provenance attestation is downloadable.
              Every claim Flareo makes about a module has a one-line
              command you can run on your own machine to check independently.
              See <code>/verify</code> for an in-browser version, or run{" "}
              <code>cosign verify</code> + <code>trivy image</code> +{" "}
              <code>slsa-verifier</code> locally with the snippets shown on
              every module page.
            </p>
            <p>
              "Don't take our word for it" is the strongest trust signal we
              can offer.
            </p>
          </>
        ),
      },
    ],
  },
  {
    num: "03",
    title: "Operations and limits",
    items: [
      {
        q: "What data does Flareo see during preview?",
        a: (
          <>
            <p>
              When you click Preview, Flareo provisions a fresh Docker
              container in our execution plane, on a randomly-generated
              subdomain behind Caddy. We see what any operator of a hosting
              service sees:
            </p>
            <ul>
              <li>
                The container's stdout/stderr (visible in your dashboard for
                the session)
              </li>
              <li>
                The HTTP requests made to the container (because they pass
                through our reverse proxy)
              </li>
              <li>
                Resource consumption (CPU, memory, network) for billing and
                abuse detection
              </li>
            </ul>
            <p>
              We do not introspect your traffic content beyond the URL path.
              We do not retain preview logs after the session ends. We do
              not retain any state from the preview container after the
              30-minute timeout.
            </p>
            <p>
              If you need to test something with sensitive data, run it
              locally with the takeaway artifacts — preview is for "does
              this thing work and look right," not for production trials.
            </p>
          </>
        ),
      },
      {
        q: "What happens when my preview session expires mid-use?",
        a: (
          <>
            <p>
              At 30 minutes, the container is terminated and the subdomain
              is reclaimed. Any state in the container is destroyed. You'll
              get a 5-minute warning in the preview UI, with an "Extend 15
              minutes" button — Pro users get one extension, Enterprise
              users get unlimited extensions in the same session.
            </p>
            <p>
              Free-tier preview is intentionally ephemeral so we can offer
              it without authentication. Real evaluation happens after you
              take away the compose file.
            </p>
          </>
        ),
      },
      {
        q: "What if Flareo shuts down — do my deployments still work?",
        a: (
          <>
            <p>
              Yes, by design. Flareo's value is verification at the time of
              publishing — once you've pulled an image and have its
              compose file, your deployment runs against the public
              registry (ghcr.io) and uses signatures logged to public Rekor.
              Both are independent of Flareo's continued operation.
            </p>
            <p>
              If Flareo were to shut down:
            </p>
            <ul>
              <li>Existing pulled images keep working — they're in ghcr.io</li>
              <li>Existing signatures keep verifying — Rekor is public infrastructure</li>
              <li>Existing SBOMs and attestations remain downloadable from ghcr.io artifacts</li>
              <li>New rebuilds would stop — your deployed version becomes the frozen-at-shutdown version</li>
            </ul>
            <p>
              We'd commit to publishing 6 months of advance notice and
              opening the canary rebuild infrastructure for community fork.
              Both commitments are concrete; if Flareo continues, they
              never fire, and they don't cost us anything to make.
            </p>
          </>
        ),
      },
      {
        q: "Can I self-host Flareo?",
        a: (
          <>
            <p>
              The answer is "not yet, but it's a near-term roadmap item."
              The architecture (Control Plane + Execution Plane separation,
              standard open-source tooling, no proprietary services) is
              compatible with self-hosting. What's missing is the packaging
              work and the support story — we want it to be a real
              experience, not a "good luck" tarball.
            </p>
            <p>
              Target: an Enterprise tier self-host bundle in 2026 Q4. See{" "}
              <Link href="/roadmap" className="text-accent hover:text-accent-hot">
                /roadmap
              </Link>
              .
            </p>
          </>
        ),
      },
    ],
  },
  {
    num: "04",
    title: "Submitting modules",
    items: [
      {
        q: "Do submitters get paid?",
        a: (
          <>
            <p>
              Today: no. Flareo is exposure-only for submitters — your module
              is listed publicly, you're credited as the maintainer, and your
              publisher profile shows traction signals (deploys, reviews,
              rebuilds).
            </p>
            <p>
              We've considered (and not yet committed to) revenue-share for
              the most-deployed modules on the Pro tier. The reasoning to
              hold off: it changes the supply-side incentives in ways we
              can't yet predict, and we'd rather see the catalog grow on
              voluntary contribution before introducing money. If we move,
              we'll publish the model in detail before activating it.
            </p>
            <p>
              Full economic terms — including IP handling, attribution, and
              what publisher analytics you can see — are documented on{" "}
              <Link
                href="/publish"
                className="text-accent hover:text-accent-hot"
              >
                /publish
              </Link>
              .
            </p>
          </>
        ),
      },
      {
        q: "What happens if a module's upstream is abandoned?",
        a: (
          <>
            <p>
              The canary chain catches it: when upstream stops cutting
              releases for {"> "}90 days AND no security advisories have been
              addressed, the module's status flips to "upstream dormant"
              and a banner appears on its detail page warning consumers.
              Trust Score is unaffected — dormancy is not the same as
              insecurity — but the banner ensures consumers see it.
            </p>
            <p>
              If upstream stops responding to a CRITICAL CVE for {"> "}30
              days, we fork-and-patch internally if the module is widely
              deployed; otherwise we delist with notice to consumers.
              Delisted modules are documented on{" "}
              <Link href="/incidents" className="text-accent hover:text-accent-hot">
                /incidents
              </Link>
              .
            </p>
          </>
        ),
      },
      {
        q: "What are the takedown criteria?",
        a: (
          <>
            <p>
              We delist a module when any of these is true:
            </p>
            <ul>
              <li>
                The submitter requests removal (their module, their call —
                we honor this within 7 business days)
              </li>
              <li>
                A valid DMCA notice or trademark complaint is filed against
                the upstream code or our packaging of it
              </li>
              <li>
                A critical CVE remains unpatched in upstream for {"> "}30
                days (see above)
              </li>
              <li>
                The module is found to be malicious, repackaging
                non-attributed code, or otherwise violating our publisher
                guidelines
              </li>
            </ul>
            <p>
              Takedowns are public — they appear on /incidents with the
              reason category. Submitters get 7 days to respond before
              public takedown except in the malicious-code case, where
              we delist immediately and notify after. Full process and
              appeals path on{" "}
              <Link
                href="/publish"
                className="text-accent hover:text-accent-hot"
              >
                /publish
              </Link>
              .
            </p>
          </>
        ),
      },
      {
        q: "What happens to my code if my module is taken down?",
        a: (
          <>
            <p>
              Flareo doesn't retain submitter source code beyond what's
              needed to reproduce the build. Source archives are deleted
              30 days after takedown except for what's required for legal
              audit (the SBOM, the attestation, the signature — these
              are receipts of what we did, and we keep them).
            </p>
            <p>
              Built images we've published remain in ghcr.io until the
              public registry's retention period elapses. We don't
              proactively delete them; consumers can pin to a digest if
              they want continuity.
            </p>
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        prompt="cat /docs/faq.md | less"
        promptComment="# the questions a security-literate visitor actually asks"
        title={
          <>
            Honest answers,
            <br />
            no softening.
          </>
        }
      >
        <p className="max-w-[680px] font-body text-[15px] leading-[1.55] text-ink-softer">
          Every objection here came from a real question, either from
          security engineers reviewing the project or from the proposal that
          shaped this product. The answers don't dodge — when something is a
          weakness, we say so. When something is a roadmap item, we link to
          when it ships.
        </p>
      </PageHero>

      <div className="px-8 py-12">
        {SECTIONS.map((section) => (
          <section
            key={section.num}
            className="mb-14 max-w-[840px]"
          >
            <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-3">
              <span className="font-display text-[18px] font-black tracking-[-0.02em] text-accent">
                {section.num}
              </span>
              <h2 className="font-display text-[22px] font-black tracking-[-0.025em] text-ink">
                {section.title}
              </h2>
            </header>
            <div className="space-y-8">
              {section.items.map((it, i) => (
                <article key={i}>
                  <h3 className="mb-3 font-display text-[16px] font-black leading-[1.3] tracking-[-0.015em] text-ink">
                    {it.q}
                  </h3>
                  <div className="prose-faq space-y-3 font-body text-[13.5px] leading-[1.65] text-ink-softer">
                    {it.a}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-12 max-w-[840px] border border-hairline bg-canvas-deep p-6">
          <h2 className="mb-2 font-display text-[18px] font-black tracking-[-0.02em] text-ink">
            Got an objection that isn't here?
          </h2>
          <p className="font-body text-[13px] leading-[1.6] text-ink-softer">
            Send it. Every legitimate question makes this page better, and
            we'd rather answer it once on a public page than over and over
            in private email. Reach{" "}
            <a
              href="mailto:hello@flareo.dev"
              className="text-accent hover:text-accent-hot"
            >
              hello@flareo.dev
            </a>
            .
          </p>
        </section>
      </div>

      <style>{`
        .prose-faq p { margin-bottom: 0.6em; }
        .prose-faq ul { margin: 0.6em 0; padding-left: 1.2em; list-style: disc; }
        .prose-faq ul li { margin-bottom: 0.3em; }
        .prose-faq code { font-family: var(--font-mono, monospace); font-size: 0.92em; padding: 1px 5px; background: rgba(255,255,255,0.04); border-radius: 2px; color: var(--accent, #f87060); }
      `}</style>
    </>
  );
}
