import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Publish a module",
  description:
    "Submit a verified container to the Flareo catalog. Step-by-step handbook for module publishers.",
};

const STEPS = [
  {
    num: "01",
    title: "Fork or upstream",
    headline: "Start from real source code.",
    body: "Flareo doesn't accept pre-built images. Every module is rebuilt from source inside our hermetic pipeline. Point us at a public Git repo with a Dockerfile — your fork, the upstream project, or a third-party repackaging. You retain authorship; Flareo handles the build plumbing.",
    code: "flareo init my-module --from=github.com/upstream/project",
  },
  {
    num: "02",
    title: "Declare the manifest",
    headline: "Tell us what's being built.",
    body: "The flareo.json manifest names the module, pins the source commit, and declares build arguments. It also flags whether your module is previewable (can run in a single-VM sandbox) and what category it belongs to. No CI YAML dance — one file, six fields.",
    code: `{
  "name": "my-module",
  "version": "1.0.0",
  "source": "github.com/me/my-module@9c2e1a4f",
  "category": "security",
  "previewable": true,
  "license": "MIT"
}`,
  },
  {
    num: "03",
    title: "Push to the pipeline",
    headline: "Six stages. One command.",
    body: "flareo publish uploads your manifest and source tarball, then triggers the full pipeline — BuildKit hermetic build, Trivy CVE scan, Syft SBOM generation, slsa-generator provenance, cosign keyless signing, and ECR publication. You'll get a build ID to tail.",
    code: `flareo publish --wait
# → build #0847 queued
# → tail https://flareo.sh/app/jobs/0847`,
  },
  {
    num: "04",
    title: "Pass the automated gate",
    headline: "0 criticals, or the pipeline halts.",
    body: "Automated checks run before any human sees your submission. Any CRITICAL CVE fails the scan stage. Any network access during build kicks you down to SLSA L2. Any unsigned upstream source fails the signature check. You'll see the exact blocker, fix it, and re-publish.",
    code: null,
  },
  {
    num: "05",
    title: "Human review",
    headline: "A human reads the manifest.",
    body: "Admin review is lightweight — we verify the upstream source is real, the author is who they claim to be, and the module isn't a duplicate of an existing one. Pro and Enterprise modules get priority queue (2h SLA). Free tier is 24h SLA. Clear reasons are always given for rejections.",
    code: null,
  },
  {
    num: "06",
    title: "You're in the catalog",
    headline: "Receipts published. Pulls begin.",
    body: "Your module appears at flareo.sh/modules/<your-name> with its full cryptographic trail — cosign signature, Rekor entry, SLSA attestation, CycloneDX SBOM. Pulls are unlimited and unmetered on every tier, so you don't pay for your own popularity.",
    code: null,
  },
];

const REQUIREMENTS = [
  {
    ok: true,
    title: "OSI-approved open source license",
    sub: "MIT, Apache-2.0, AGPL-3.0, BSD, ISC, MPL — or any other license OSI has reviewed",
  },
  {
    ok: true,
    title: "Public upstream source",
    sub: "GitHub, GitLab, Gitea — anything reachable without auth",
  },
  {
    ok: true,
    title: "Builds cleanly with BuildKit",
    sub: "Dockerfile must complete in under 30 minutes on our standard worker",
  },
  {
    ok: true,
    title: "Zero critical CVEs at build time",
    sub: "HIGH/MEDIUM/LOW findings are OK — they surface in the trust score",
  },
  {
    ok: false,
    title: "Closed source or source-available",
    sub: "Not yet — we may offer a private-module path for Enterprise in V1.2",
  },
  {
    ok: false,
    title: "Mining, scraping, or scraping adjacent",
    sub: "Crypto miners, scraper farms, and aggressive crawlers will be rejected",
  },
];

export default function PublishPage() {
  return (
    <>
      <PageHero
        eyebrow="PUBLISH / HANDBOOK"
        prompt="flareo publish my-module"
        promptComment="# submit a verified container to the catalog"
        title={
          <>
            SHIP YOUR
            <br />
            CONTAINER WITH
            <br />
            CRYPTOGRAPHIC RECEIPTS.
          </>
        }
      >
        Anyone can submit a module. If it builds cleanly from public source,
        passes our scan, and attests to a hermetic build, it joins the
        catalog alongside Vaultwarden and Caddy — with the same signed
        digest, the same SBOM, the same SLSA attestation.
      </PageHero>

      {/* Steps */}
      <section className="border-b border-hairline px-8 py-14">
        <SectionHeader
          num="01"
          label="SIX-STEP FLOW"
          title="From Dockerfile to signed catalog entry."
        >
          The whole publish flow takes under ten minutes of your time. The
          pipeline itself runs for about four to six minutes depending on
          image size. Here&apos;s each step in order.
        </SectionHeader>

        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="space-y-0 border-t border-hairline">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`grid grid-cols-[90px_1fr] gap-7 py-8 ${
                  i < STEPS.length - 1 ? "border-b border-hairline" : ""
                }`}
              >
                <div>
                  <div className="font-display text-[40px] font-black leading-[0.95] tracking-[-0.035em] text-accent">
                    {step.num}
                  </div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-ink-faint">
                    {step.title.toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 font-display text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-ink">
                    {step.headline}
                  </h3>
                  <p className="mb-4 max-w-[620px] font-body text-[13.5px] leading-[1.65] text-ink-softer">
                    {step.body}
                  </p>
                  {step.code && (
                    <pre className="overflow-x-auto border border-hairline bg-canvas-deep p-4 font-mono text-[12px] leading-[1.6] text-ink-mute">
                      {step.code}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
        <SectionHeader
          num="02"
          label="ELIGIBILITY"
          title="What we accept, and what we don't."
        >
          Most rejections happen at automated gate (step 04), not at human
          review. Check these requirements before you{" "}
          <code className="border border-hairline bg-canvas-deep px-1 py-0 font-mono text-[11px] text-accent">
            flareo publish
          </code>{" "}
          to avoid a wasted build cycle.
        </SectionHeader>

        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-1 gap-0 border border-hairline md:grid-cols-2">
            {REQUIREMENTS.map((r, i) => (
              <div
                key={i}
                className={`bg-canvas-deep p-5 ${
                  i % 2 === 0 ? "md:border-r md:border-hairline" : ""
                } ${i < REQUIREMENTS.length - 2 ? "border-b border-hairline" : ""}`}
              >
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.14em]">
                  <span
                    className={`flex h-4 w-4 items-center justify-center border ${
                      r.ok
                        ? "border-good text-good"
                        : "border-warn text-warn"
                    }`}
                  >
                    {r.ok ? "✓" : "×"}
                  </span>
                  <span className={r.ok ? "text-good" : "text-warn"}>
                    {r.ok ? "ACCEPTED" : "NOT YET"}
                  </span>
                </div>
                <h4 className="mb-1 font-display text-[15px] font-black leading-[1.2] tracking-[-0.02em] text-ink">
                  {r.title}
                </h4>
                <p className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
                  {r.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The contract — what publishing actually commits both sides to */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-16">
        <div className="mx-auto max-w-[920px]">
          <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            § THE CONTRACT
          </div>
          <h2 className="mb-3 font-display text-[40px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            What you owe us, what we owe you.
          </h2>
          <p className="mb-10 max-w-[680px] font-body text-[14.5px] leading-[1.65] text-ink-softer">
            Publishing a module to Flareo is a two-sided commitment. We owe
            you a fast, reliable pipeline and an honest set of rules. You owe
            us a real upstream, accurate metadata, and a willingness to
            respond when something needs fixing. The specifics, by topic.
          </p>

          {/* Economic relationship — the proposal called this out as a
              must-decide content question */}
          <div className="mb-10 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
            <div className="border-l-2 border-accent bg-canvas-deep p-5">
              <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
                ECONOMICS · TODAY
              </div>
              <h3 className="mb-3 font-display text-[20px] font-black leading-[1.15] tracking-[-0.02em] text-ink">
                Exposure-only. No money flows either direction.
              </h3>
              <div className="space-y-3 font-body text-[13px] leading-[1.65] text-ink-softer">
                <p>
                  Submitters do not pay to publish. Submitters are not paid
                  for downloads, deploys, or popularity. Your module is
                  listed on the marketplace, you&apos;re credited as the
                  maintainer, and your publisher profile shows traction
                  signals — that&apos;s the entire economic relationship.
                </p>
                <p>
                  We&apos;ve considered (and not committed to) a revenue-share
                  for the most-deployed Pro-tier modules. That&apos;s on the{" "}
                  <Link
                    href="/roadmap"
                    className="text-accent hover:text-accent-hot"
                  >
                    roadmap
                  </Link>{" "}
                  under <em>considered</em>. If we move on it, the model
                  gets published in detail before anyone earns a cent — no
                  surprises, no retroactive contract changes.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 border border-hairline bg-canvas-deep p-5 lg:max-w-[260px]">
              <div className="font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
                FAST FACTS
              </div>
              <FastFact label="Submission fee" value="None" />
              <FastFact label="Per-deploy payment" value="None" />
              <FastFact label="Revenue share" value="Not yet" />
              <FastFact label="Publisher attribution" value="Always" />
            </div>
          </div>

          {/* IP handling */}
          <ContractBlock
            num="01"
            title="What you keep, what we keep"
            subtitle="IP handling, in plain terms."
          >
            <p>
              <strong className="text-ink">Your code stays yours.</strong>{" "}
              The license you publish under (MIT, Apache-2.0, AGPL-3.0,
              whatever you&apos;ve declared in your repo) is the license that
              governs the source, the build outputs, and the published image.
              We don&apos;t require a CLA, a copyright assignment, or any
              transfer of rights to participate.
            </p>
            <p>
              <strong className="text-ink">What we keep is the receipts.</strong>{" "}
              The CycloneDX SBOM, the SLSA provenance attestation, the cosign
              signature, the Trivy scan output, the policy decision log — these
              describe what we did during our pipeline run. They&apos;re ours
              because we made them, and they&apos;re part of the audit trail
              you&apos;d want us to retain even after a takedown. Receipts are
              not your code; they&apos;re records about your code.
            </p>
            <p>
              <strong className="text-ink">No exclusivity.</strong> You can
              also publish to Docker Hub, GHCR, Quay, your own registry,
              wherever. Flareo doesn&apos;t require nor reward exclusive
              listings. If your module is already on three other registries,
              that&apos;s fine.
            </p>
          </ContractBlock>

          {/* Attribution */}
          <ContractBlock
            num="02"
            title="How we credit you"
            subtitle="Maintainer attribution and visibility."
          >
            <p>
              Every module page lists the upstream maintainer (the original
              project author, e.g. <em>vaultwarden/server</em> for the
              vaultwarden image) and the Flareo publisher (the account that
              submitted it to our pipeline). Both names are clickable. If
              you&apos;re both — packaging your own project — both names are
              you, and you can choose to display only one via your publisher
              settings.
            </p>
            <p>
              Publisher profile pages at{" "}
              <code className="font-mono text-[12px] text-accent">
                /@your-username
              </code>{" "}
              aggregate everything you&apos;ve published, total deploys, total
              reviews received, and a short bio you control. The proposal
              language was &ldquo;humans trust humans&rdquo; — your name,
              your link, your face if you want it.
            </p>
            <p>
              <strong className="text-ink">For repackagings:</strong> when
              you&apos;re submitting someone else&apos;s upstream (e.g. a
              hardened build of nginx), the upstream project gets the primary
              attribution and you get the &ldquo;packaged by&rdquo; subline.
              We don&apos;t pretend you authored what you packaged.
            </p>
          </ContractBlock>

          {/* Stats visibility */}
          <ContractBlock
            num="03"
            title="What you can see about your module"
            subtitle="Publisher analytics, no dark patterns."
          >
            <p>
              Free-tier publishers see, on their dashboard:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Total registry pulls (lifetime + last 30 days)</li>
              <li>Total reviews received, with the public review text and rating</li>
              <li>
                Rebuild history (success / unchanged / failed, with timing)
              </li>
              <li>Reports filed against the module (you see them as the publisher does)</li>
              <li>Trust Score history over time</li>
            </ul>
            <p>
              Pro-tier publishers additionally see geographic distribution of
              pulls, version-pinning patterns (which versions consumers stuck
              on), and inbound link analytics (how visitors are arriving at
              your module page).
            </p>
            <p>
              <strong className="text-ink">What we don&apos;t track:</strong>{" "}
              we do not track individual consumer identities, IP addresses
              tied to pulls, or pull-time correlations across modules. The
              analytics we publish are aggregate signals you&apos;d want as a
              maintainer, not surveillance of the people running your software.
            </p>
          </ContractBlock>

          {/* Takedown policy */}
          <ContractBlock
            num="04"
            title="How takedowns work"
            subtitle="Process, criteria, your rights."
          >
            <p>
              <strong className="text-ink">Submitter-initiated:</strong> if
              you want your own module removed, the dashboard has a
              &ldquo;Request takedown&rdquo; button on the module&apos;s
              publisher page. Within 7 business days the module is delisted
              from the catalog and marketplace. The image stays in the public
              registry until ghcr.io&apos;s retention policy elapses (so
              consumers running pinned digests aren&apos;t broken) but new
              pulls are no longer surfaced through Flareo. Receipts (SBOM,
              provenance, signatures) remain available — they describe what
              was true at publish time and that history doesn&apos;t change.
            </p>
            <p>
              <strong className="text-ink">Flareo-initiated:</strong> we delist
              a module when ANY of the following is true:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                A valid DMCA notice or trademark complaint applies to your
                upstream code or our packaging
              </li>
              <li>
                A critical CVE in upstream remains unpatched for &gt; 30 days
                AND we can&apos;t fork-and-patch ourselves
              </li>
              <li>
                The module is found to be malicious — backdoor, data
                exfiltration, undocumented network behavior, license-laundered
                proprietary code
              </li>
              <li>
                The publisher has gone silent on multiple takedown-relevant
                emails for &gt; 60 days when consumer-impacting issues need a
                response
              </li>
            </ul>
            <p>
              <strong className="text-ink">Notice and appeal:</strong> in
              every case except the malicious-code one, you get 7 days of
              notice before public delisting and a written explanation of the
              specific reason. Appeals go via{" "}
              <a
                href="https://github.com/Yolo1105/flareo/issues"
                className="text-accent hover:text-accent-hot"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
              </a>{" "}
              and reach a different reviewer than the one who made the original
              call. Malicious code skips the 7-day notice — we delist
              immediately and notify the publisher (and{" "}
              <Link
                href="/incidents"
                className="text-accent hover:text-accent-hot"
              >
                /incidents
              </Link>
              ) within 24 hours.
            </p>
          </ContractBlock>

          {/* SLA */}
          <ContractBlock
            num="05"
            title="What we commit to, with deadlines"
            subtitle="Submit-side SLA, by tier."
          >
            <p>
              The pipeline performance you can expect, by plan tier:
            </p>
            <div className="my-3 overflow-x-auto border border-hairline bg-canvas-deep">
              <table className="w-full font-mono text-[11.5px]">
                <thead>
                  <tr className="border-b border-hairline bg-canvas-panel text-left text-ink-faint">
                    <th className="px-4 py-2.5 font-medium tracking-[0.04em]">METRIC</th>
                    <th className="px-4 py-2.5 font-medium tracking-[0.04em]">FREE</th>
                    <th className="px-4 py-2.5 font-medium tracking-[0.04em]">PRO</th>
                    <th className="px-4 py-2.5 font-medium tracking-[0.04em]">ENTERPRISE</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Submission queued → build started", "< 5 min p50", "< 60 sec p50", "< 30 sec p50"],
                    ["Build complete → review queued", "Same hour", "Same hour", "Immediate"],
                    ["Reviewer SLA (queue → first response)", "24 h", "2 h", "30 min"],
                    ["Status change notification (email)", "Within 5 min", "Within 5 min", "Within 5 min"],
                    ["Takedown request acknowledgement", "1 business day", "1 business day", "Same day"],
                    ["Build artifact retention", "30 days", "180 days", "Indefinite"],
                    ["Policy-change notice (before applying)", "30 days", "30 days", "60 days"],
                  ].map(([metric, free, pro, ent], i) => (
                    <tr key={i} className="border-b border-hairline last:border-0">
                      <td className="px-4 py-2.5 text-ink">{metric}</td>
                      <td className="px-4 py-2.5 text-ink-mute">{free}</td>
                      <td className="px-4 py-2.5 text-ink-mute">{pro}</td>
                      <td className="px-4 py-2.5 text-ink-mute">{ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              These numbers reflect actual median performance over the past 90
              days, not aspirational targets. If we miss them on your
              submission, the dashboard tells you and we tell you. Pro and
              Enterprise customers who experience SLA misses get prorated
              credit per the{" "}
              <Link
                href="/legal/terms"
                className="text-accent hover:text-accent-hot"
              >
                terms
              </Link>
              .
            </p>
          </ContractBlock>

          {/* Discovery mechanics */}
          <ContractBlock
            num="06"
            title="How modules surface in the marketplace"
            subtitle="Discovery mechanics, no pay-to-promote."
          >
            <p>
              The marketplace ranks modules by a deterministic combination of
              recent reviews, rebuild freshness, trust score, and deploy
              count. Editorial featuring is added on top of that ordering,
              but cannot replace it — you can&apos;t buy your way into the
              spotlight, and the &ldquo;★ FEATURED&rdquo; cards are picked by
              the Flareo team based on the same criteria a senior operator
              would use.
            </p>
            <p>
              We also publish a per-category trending strip computed weekly
              from the same signals. New modules with strong early reviews
              appear there fastest — reviews from real operators are the
              single highest-weighted signal, more than deploy count or trust
              score on their own.
            </p>
            <p>
              <strong className="text-ink">Anti-game commitments:</strong>{" "}
              we don&apos;t sell promotion, we don&apos;t auction featured
              slots, we don&apos;t accept payment in exchange for catalog
              visibility, and we publish the ranking weights in our docs so
              you can audit them. If we ever take ad money, the implementation
              will be explicit ad slots clearly labeled and never mixed into
              organic rank.
            </p>
          </ContractBlock>

          {/* Policy change */}
          <ContractBlock
            num="07"
            title="When we change the rules"
            subtitle="Policy change notice."
          >
            <p>
              The criteria above (what gets approved, what gets delisted, the
              SLA, the analytics surface) form a contract we&apos;ve made with
              every existing publisher. Changing those criteria mid-stream
              isn&apos;t free — existing modules might no longer qualify
              under tightened rules.
            </p>
            <p>
              <strong className="text-ink">Our commitment:</strong> any policy
              change that could affect existing modules&apos; status (e.g.
              tightening CVE thresholds, adding new build constraints) gets
              30 days of advance notice for Free / Pro publishers and 60 days
              for Enterprise. The notice goes to the email on file, appears
              on the publisher&apos;s dashboard, and is published on{" "}
              <Link
                href="/changelog"
                className="text-accent hover:text-accent-hot"
              >
                /changelog
              </Link>
              .
            </p>
            <p>
              Loosening policies (allowing more modules) ships immediately and
              announces in the changelog. Tightening policies — never without
              notice.
            </p>
          </ContractBlock>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-b border-hairline px-8 py-16 text-center">
        <div className="mx-auto max-w-[560px]">
          <div className="mb-3 inline-flex items-center gap-2 border border-accent px-3 py-1 font-mono text-[11px] font-medium tracking-[0.12em] text-accent">
            <span className="block h-1 w-1 bg-accent" />
            READY TO SHIP
          </div>
          <h2 className="mb-5 font-display text-[40px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            Publish your first module.
          </h2>
          <p className="mb-8 font-body text-[14.5px] leading-[1.65] text-ink-softer">
            Install the CLI, run{" "}
            <code className="border border-hairline bg-canvas-deep px-1.5 py-0.5 font-mono text-[13px] text-accent">
              flareo init
            </code>
            , and you&apos;ll have a receipt in your terminal in minutes.
          </p>
          <div className="flex justify-center gap-2">
            <Link
              href="/login"
              className="btn-chamfer bg-accent px-5 py-3 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
            >
              Sign in &amp; publish
            </Link>
            <Link
              href="/docs/cli"
              className="border border-hairline px-5 py-3 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
            >
              Read CLI docs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * One numbered contract block on /publish.
 * Numbered hero (large accent digit) + title + subtitle + prose body.
 *
 * The prose body uses native <p> + <ul> tags styled inline rather than
 * a prose-* wrapper because the page's other sections already have a
 * tight visual rhythm and the proposal-driven content here needs to
 * sit comfortably alongside them.
 */
function ContractBlock({
  num,
  title,
  subtitle,
  children,
}: {
  num: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mb-10 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 border-t border-hairline pt-8">
      <div className="font-display text-[44px] font-black leading-[0.85] tracking-[-0.04em] text-accent">
        {num}
      </div>
      <div>
        <h3 className="font-display text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-ink">
          {title}
        </h3>
        <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
          {subtitle}
        </p>
      </div>
      <div />
      <div className="space-y-3 font-body text-[13px] leading-[1.7] text-ink-softer">
        {children}
      </div>
    </article>
  );
}

/**
 * Single key/value tile inside the Fast Facts panel on the
 * economics block.
 */
function FastFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2 first:border-t-0 first:pt-0">
      <span className="font-body text-[12px] text-ink-softer">{label}</span>
      <span className="font-mono text-[11.5px] text-ink">{value}</span>
    </div>
  );
}
