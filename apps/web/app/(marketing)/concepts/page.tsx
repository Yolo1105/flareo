import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FaqRow } from "@/components/ui/FaqRow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Concepts",
  description:
    "Supply chain in plain English. SBOM, SLSA, cosign, Sigstore, in-toto — every term explained once.",
};

const STAGES = [
  { num: "01", tag: "SUBMIT", line1: "SOURCE", line2: "IN", terms: ["OCI image", "Dockerfile"] },
  { num: "02", tag: "BUILD", line1: "COMPILE", line2: "LAYERS", terms: ["BuildKit", "hermetic build"] },
  { num: "03", tag: "SCAN", line1: "CHECK", line2: "CONTENTS", terms: ["Trivy", "CVE", "CycloneDX SBOM"] },
  { num: "04", tag: "ATTEST", line1: "RECORD", line2: "ORIGIN", terms: ["SLSA", "in-toto", "provenance"] },
  { num: "05", tag: "SIGN", line1: "CRYPTO", line2: "PROOF", terms: ["cosign", "Sigstore · Fulcio", "Rekor · OIDC"] },
  { num: "06", tag: "PUBLISH", line1: "PIN", line2: "& SHIP", terms: ["digest", "OCI registry"] },
];

interface Concept {
  term: string;
  pron: string;
  cat: string;
  oneLine: React.ReactNode;
  body: React.ReactNode;
  spec: string;
  solo?: boolean;
}

function ConceptCard({ c, idx, total }: { c: Concept; idx: number; total: number }) {
  const isLast = idx === total - 1;
  const isEven = idx % 2 === 0;
  return (
    <div
      className={`relative px-0 py-6 ${
        c.solo
          ? "col-span-2 border-b-0 border-r-0 pr-0"
          : isEven
            ? "border-r border-hairline pr-6"
            : "pl-6"
      } ${!isLast && !c.solo ? "border-b border-hairline" : ""}`}
    >
      <h3 className="mb-1 font-display text-[22px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
        {c.term}
      </h3>
      <div className="mb-3.5 border-b border-hairline pb-2.5 font-mono text-[10px] tracking-[0.1em]">
        <span className="mr-2 text-ink-ghost">{c.pron}</span>
        <span className="text-accent">{c.cat}</span>
      </div>
      <p className="mb-3.5 font-body text-[14px] font-medium leading-[1.55] text-ink-cream">
        {c.oneLine}
      </p>
      <div className="mb-3.5 font-body text-[13px] leading-[1.7] text-ink-softer">
        {c.body}
      </div>
      <div className="border-t border-dashed border-hairline pt-3 font-mono text-[11px] tracking-[0.04em] text-ink-faint transition-colors hover:text-accent cursor-pointer">
        {c.spec} ↗
      </div>
    </div>
  );
}

const SUBMIT_CONCEPTS: Concept[] = [
  {
    term: "OCI image",
    pron: "/oh-see-eye/",
    cat: "open standard",
    oneLine:
      "A container image, but described by a standards body instead of by Docker Inc.",
    body: (
      <>
        &quot;Docker image&quot; is what people say.{" "}
        <span className="text-ink">OCI image</span> is what it technically is
        — a stack of compressed layers described by a JSON manifest, stored
        in a content-addressed blob store. When Flareo signs an image,{" "}
        <span className="text-ink">
          it&apos;s really signing the manifest&apos;s SHA256 hash
        </span>
        . That hash is the whole game.
      </>
    ),
    spec: "opencontainers.org/image-spec",
  },
  {
    term: "Dockerfile",
    pron: "/dock-er-file/",
    cat: "build recipe",
    oneLine:
      "The text file that tells the build system what to put inside the image.",
    body: (
      <>
        A Dockerfile is a series of FROM, RUN, COPY, CMD instructions. Flareo
        reads your Dockerfile, then executes it inside a{" "}
        <span className="text-ink">hermetic BuildKit sandbox</span> so the
        output is reproducible. The Dockerfile is part of what gets recorded
        in the provenance attestation.
      </>
    ),
    spec: "docs.docker.com/engine/reference/builder",
  },
];

const BUILD_CONCEPTS: Concept[] = [
  {
    term: "BuildKit",
    pron: "/build-kit/",
    cat: "docker / linux",
    oneLine:
      "Docker's second-generation build engine. Faster, safer, and scriptable.",
    body: (
      <>
        BuildKit resolves a{" "}
        <span className="text-ink">directed acyclic graph</span> of build
        steps and runs each step inside its own isolated sandbox. Flareo uses
        BuildKit in rootless mode, without --privileged, inside a
        Docker-in-Docker worker. This is what makes Flareo&apos;s builds
        qualify for SLSA L3.
      </>
    ),
    spec: "github.com/moby/buildkit",
  },
  {
    term: "Hermetic build",
    pron: "/her-met-ic/",
    cat: "security property",
    oneLine:
      "A build that has no access to the outside world except what you explicitly declared.",
    body: (
      <>
        A hermetic build has{" "}
        <span className="text-ink">
          zero network access during compilation
        </span>
        . All inputs are declared upfront and pinned to exact hashes. The
        outcome: same inputs, same output, every time. This closes an entire
        class of supply-chain attacks where a RUN curl... line pulls a trojan
        at build time.
      </>
    ),
    spec: "bazel.build/basics/hermeticity",
  },
];

const SCAN_CONCEPTS: Concept[] = [
  {
    term: "SBOM",
    pron: "/S-bomb/",
    cat: "inventory doc",
    oneLine:
      "Software Bill of Materials. The \"ingredient list\" of a compiled artifact.",
    body: (
      <>
        An SBOM lists every package inside your image with their{" "}
        <span className="text-ink">versions and licenses</span>. Think of it
        like the nutrition label on food. When a new CVE drops tomorrow, you
        search everyone&apos;s SBOMs for the affected package and{" "}
        <span className="text-ink">
          immediately know which images are vulnerable
        </span>
        . Flareo emits one for every build.
      </>
    ),
    spec: "cisa.gov/sbom",
  },
  {
    term: "CycloneDX",
    pron: "/cy-clone-D-X/",
    cat: "SBOM format",
    oneLine:
      "The OWASP-stewarded SBOM format. One of two common standards; the other is SPDX.",
    body: (
      <>
        CycloneDX is a JSON (or XML) schema for SBOMs. Flareo emits{" "}
        <span className="text-ink">CycloneDX 1.4 by default</span> because
        it&apos;s supported by every major scanner (Trivy, Grype, Snyk,
        Dependency-Track).
      </>
    ),
    spec: "cyclonedx.org",
  },
  {
    term: "CVE",
    pron: "/C-V-E/",
    cat: "vulnerability ID",
    oneLine:
      "A globally unique ID for a known software vulnerability. The basic unit of \"something is broken.\"",
    body: (
      <>
        <span className="text-ink">Common Vulnerabilities and Exposures</span>
        . When a researcher discovers a bug, they file for a CVE ID (like
        CVE-2024-0553). CVEs are rated{" "}
        <span className="text-ink">CRITICAL, HIGH, MEDIUM, LOW</span>. Flareo
        blocks publishing on any CRITICAL finding.
      </>
    ),
    spec: "cve.org",
  },
  {
    term: "Trivy",
    pron: "/triv-ee/",
    cat: "scanner · open source",
    oneLine: "The scanner Flareo runs. Built by Aqua Security, open-sourced, maintained.",
    body: (
      <>
        Trivy walks every layer, identifies each package, queries a CVE
        database. Flareo runs Trivy with --severity
        CRITICAL,HIGH,MEDIUM,LOW so the full finding list is recorded. Trivy
        databases update every 6 hours; the version at scan time is stamped
        in provenance.
      </>
    ),
    spec: "trivy.dev",
  },
];

const ATTEST_CONCEPTS: Concept[] = [
  {
    term: "SLSA",
    pron: "/sal-sa/",
    cat: "framework",
    oneLine:
      "Supply-chain Levels for Software Artifacts. A 4-level maturity scale for build integrity.",
    body: (
      <>
        SLSA gives you a checklist.{" "}
        <span className="text-ink">L1</span>: provenance exists.{" "}
        <span className="text-ink">L2</span>: record is signed by the build
        platform. <span className="text-ink">L3</span>: build was isolated
        and hermetic. <span className="text-ink">L4</span>: two independent
        builders produced same output (rare). Flareo&apos;s default is L3.
      </>
    ),
    spec: "slsa.dev",
  },
  {
    term: "in-toto",
    pron: "/in-toe-toe/",
    cat: "attestation format",
    oneLine:
      "The wire format SLSA attestations are serialized in. A signed JSON document.",
    body: (
      <>
        in-toto wraps attestation data in three parts:{" "}
        <span className="text-ink">subject</span> (what we&apos;re talking
        about — usually a SHA256 digest),{" "}
        <span className="text-ink">predicate</span> (the claims, which is
        where SLSA data lives), and{" "}
        <span className="text-ink">signature</span> (who&apos;s making these
        claims).
      </>
    ),
    spec: "in-toto.io",
  },
  {
    term: "Provenance",
    pron: "/prov-en-ance/",
    cat: "attestation type",
    oneLine: (
      <>
        A specific kind of attestation that answers:{" "}
        <span className="text-ink">
          &quot;where did this artifact come from?&quot;
        </span>
      </>
    ),
    body: (
      <>
        A SLSA provenance attestation records the build inputs and process.
        For Flareo modules it lists: source Git commit, builder identity (our
        GitHub Actions workflow), BuildKit version, exact invocation command,
        timestamp. When you run slsa-verifier, it&apos;s the provenance
        attestation being verified.
      </>
    ),
    spec: "slsa.dev/spec/v1.0/provenance",
    solo: true,
  },
];

const SIGN_CONCEPTS: Concept[] = [
  {
    term: "Sigstore",
    pron: "/sig-store/",
    cat: "project · OpenSSF",
    oneLine:
      "A free, public trust service for signing software. Run by a foundation, not a company.",
    body: (
      <>
        Sigstore has three components: cosign (client), Fulcio (CA), Rekor
        (transparency log). Together they let anyone sign software using an
        OIDC identity — no pre-arranged keys, no HSM, no credentials in CI.
      </>
    ),
    spec: "sigstore.dev",
  },
  {
    term: "cosign",
    pron: "/co-sign/",
    cat: "client tool",
    oneLine:
      "The command-line tool that signs and verifies container images against Sigstore.",
    body: (
      <>
        cosign is what Flareo runs to sign, and what anyone runs to verify.
        When you call cosign verify, it fetches the signature from the
        registry, checks it was issued by Fulcio, confirms it appears in the
        Rekor log. Round-trip under a second;{" "}
        <span className="text-ink">
          all three services are public infrastructure
        </span>
        .
      </>
    ),
    spec: "docs.sigstore.dev/cosign",
  },
  {
    term: "Fulcio",
    pron: "/ful-see-oh/",
    cat: "certificate authority",
    oneLine:
      "Sigstore's certificate authority. Hands out short-lived signing certificates in exchange for OIDC tokens.",
    body: (
      <>
        cosign presents an{" "}
        <span className="text-ink">OIDC identity token</span> to Fulcio,
        which returns a cert valid for about 10 minutes. After those 10
        minutes the key pair expires and is destroyed —{" "}
        <span className="text-ink">there&apos;s no long-lived key to steal</span>
        .
      </>
    ),
    spec: "github.com/sigstore/fulcio",
  },
  {
    term: "Rekor",
    pron: "/ree-kor/",
    cat: "transparency log",
    oneLine:
      "An append-only public log of every Sigstore signature ever made.",
    body: (
      <>
        Rekor is a{" "}
        <span className="text-ink">Merkle-tree transparency log</span>,
        modeled after Certificate Transparency for TLS. Every cosign
        signature is recorded here as an immutable entry. If a bad actor
        compromises Fulcio tomorrow, fakes still have to appear in Rekor —
        and <span className="text-ink">everyone can see them</span>.
      </>
    ),
    spec: "rekor.sigstore.dev",
  },
];

const PUBLISH_CONCEPTS: Concept[] = [
  {
    term: "Digest",
    pron: "/die-jest/",
    cat: "cryptographic hash",
    oneLine:
      "A SHA-256 hash of the image manifest. Identifies the exact content, forever.",
    body: (
      <>
        A digest looks like sha256:9a8b7c6d5e4f... and names the image by its
        literal content.{" "}
        <span className="text-ink">
          Change one byte and the digest changes too.
        </span>{" "}
        When Flareo generates a compose file, the image reference is always
        pinned to the digest. Even if :latest repoints tomorrow,{" "}
        <span className="text-ink">
          your compose file still runs the exact image you signed off on
        </span>
        .
      </>
    ),
    spec: "github.com/opencontainers/image-spec/blob/main/descriptor.md",
  },
  {
    term: "OCI registry",
    pron: "/oh-see-eye-regis-tree/",
    cat: "storage",
    oneLine:
      "A server that stores OCI images. Docker Hub, GHCR, ECR — all the same protocol.",
    body: (
      <>
        Registries speak the{" "}
        <span className="text-ink">OCI Distribution spec</span>. Flareo
        publishes to GitHub Container Registry by default. The security
        model lives in the signature + attestations, not in the registry
        trust. <span className="text-ink">
          Even a hostile registry can&apos;t tamper with a signed image
        </span>
        .
      </>
    ),
    spec: "github.com/opencontainers/distribution-spec",
  },
];

export default function ConceptsPage() {
  return (
    <>
      <PageHero
        eyebrow="DOCS / CONCEPTS"
        prompt="flareo explain --plain-english"
        promptComment="# what all these acronyms mean"
        title={
          <>
            SUPPLY CHAIN,
            <br />
            IN PLAIN ENGLISH.
          </>
        }
      >
        Every term on this site —{" "}
        <span className="text-accent">cosign</span>,{" "}
        <span className="text-accent">SLSA</span>,{" "}
        <span className="text-accent">SBOM</span>,{" "}
        <span className="text-accent">Rekor</span>,{" "}
        <span className="text-accent">in-toto</span>,{" "}
        <span className="text-accent">CycloneDX</span>,{" "}
        <span className="text-accent">Sigstore</span> — explained once,
        with the smallest possible amount of jargon. Read top to bottom;
        it doubles as a walkthrough of how Flareo&apos;s pipeline works.
      </PageHero>

      {/* Pipeline at a glance */}
      <section className="border-b border-hairline bg-canvas-panel px-8 pb-14 pt-12">
        <div className="mb-6 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
          <span className="font-normal text-ink-ghost">§</span>
          THE PIPELINE AT A GLANCE
          <div className="ml-2.5 h-px max-w-[260px] flex-1 bg-hairline" />
        </div>
        <div className="grid grid-cols-2 border border-hairline md:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((s, i) => (
            <div
              key={s.num}
              className={`relative min-h-[160px] cursor-pointer p-5 transition-colors hover:bg-accent/[0.04] ${
                i < STAGES.length - 1 ? "border-r border-hairline" : ""
              }`}
            >
              <div className="absolute right-4 top-4 font-mono text-[10px] tracking-[0.08em] text-ink-ghost">
                {s.num}
              </div>
              <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[0.12em] text-accent">
                {s.tag}
              </div>
              <div className="mb-2.5 font-display text-[18px] font-black leading-[1] tracking-[-0.025em] text-ink">
                {s.line1}
                <br />
                {s.line2}
              </div>
              <div className="flex flex-col gap-1">
                {s.terms.map((t, j) => (
                  <div
                    key={t}
                    className={`font-mono text-[10.5px] tracking-[0.02em] text-ink-faint ${
                      j > 0 ? "border-t border-hairline pt-1" : ""
                    }`}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submit section */}
      <section className="border-b border-hairline px-8 py-16">
        <SectionHeader
          num="01"
          label="SUBMIT"
          title="What you're actually sending."
        >
          Everything starts with source code and a Dockerfile. The thing
          that comes out the other end is called an{" "}
          <span className="text-ink">OCI image</span> — understanding what
          that actually is unlocks everything downstream.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-2 border-t border-hairline">
            {SUBMIT_CONCEPTS.map((c, i) => (
              <ConceptCard key={c.term} c={c} idx={i} total={SUBMIT_CONCEPTS.length} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline px-8 py-16">
        <SectionHeader
          num="02"
          label="BUILD"
          title="Compiling in a box with no doors."
        >
          Docker&apos;s default builder has side effects. A{" "}
          <span className="text-ink">hermetic build</span> eliminates all of
          that. What goes in deterministically produces what comes out.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-2 border-t border-hairline">
            {BUILD_CONCEPTS.map((c, i) => (
              <ConceptCard key={c.term} c={c} idx={i} total={BUILD_CONCEPTS.length} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline px-8 py-16">
        <SectionHeader
          num="03"
          label="SCAN"
          title="An inventory and an audit."
        >
          Two separate jobs happen at scan time. First, we take{" "}
          <span className="text-ink">inventory</span> of everything. Second,
          we cross-reference against known{" "}
          <span className="text-ink">CVEs</span>.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-2 border-t border-hairline">
            {SCAN_CONCEPTS.map((c, i) => (
              <ConceptCard key={c.term} c={c} idx={i} total={SCAN_CONCEPTS.length} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline px-8 py-16">
        <SectionHeader
          num="04"
          label="ATTEST"
          title="A build record you can't forge."
        >
          An attestation is a signed statement:{" "}
          <span className="text-ink">
            &quot;I, the builder, confirm this image was built from these
            inputs using these steps at this time.&quot;
          </span>
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-2 border-t border-hairline">
            {ATTEST_CONCEPTS.map((c, i) => (
              <ConceptCard key={c.term} c={c} idx={i} total={ATTEST_CONCEPTS.length} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline px-8 py-16">
        <SectionHeader
          num="05"
          label="SIGN"
          title="Cryptography, without the key management."
        >
          <span className="text-ink">Keyless signing</span> through Sigstore
          eliminates the key-management burden. Your identity is the key.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-2 border-t border-hairline">
            {SIGN_CONCEPTS.map((c, i) => (
              <ConceptCard key={c.term} c={c} idx={i} total={SIGN_CONCEPTS.length} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline px-8 py-16">
        <SectionHeader
          num="06"
          label="PUBLISH"
          title="Why pinning matters."
        >
          The difference between :latest and @sha256:... is the difference
          between <span className="text-ink">trusting nothing has changed</span>{" "}
          and <span className="text-ink">knowing nothing has changed</span>.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-2 border-t border-hairline">
            {PUBLISH_CONCEPTS.map((c, i) => (
              <ConceptCard key={c.term} c={c} idx={i} total={PUBLISH_CONCEPTS.length} />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Answers */}
      <section className="border-b border-hairline px-8 py-14">
        <div className="mb-7">
          <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            <span className="text-ink-ghost">§</span> QUICK ANSWERS
          </div>
          <h2 className="font-display text-[36px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            Wait, so what&apos;s actually different from Docker Hub?
          </h2>
        </div>
        <div className="border-t border-hairline">
          <FaqRow
            num="Q1"
            question="Docker Hub already signs images. Isn't that the same thing?"
            answer={
              <>
                Docker Hub has{" "}
                <span className="text-ink">Docker Content Trust</span>, which
                signs manifests using Notary. It proves the image came from
                the same publisher over time.{" "}
                <span className="text-ink">
                  It doesn&apos;t prove how the image was built, what&apos;s
                  inside it, or whether the build was hermetic.
                </span>{" "}
                SLSA provenance and CycloneDX SBOM cover those questions.
              </>
            }
          />
          <FaqRow
            num="Q2"
            question="If Flareo signs everything, do I have to trust Flareo?"
            answer={
              <>
                Only narrowly — our build pipeline must be honest. Beyond
                that,{" "}
                <span className="text-ink">
                  none of the verification depends on Flareo
                </span>
                . Signatures go to public Sigstore infrastructure. You can
                run cosign verify yourself and bypass our tooling entirely.
              </>
            }
          />
          <FaqRow
            num="Q3"
            question="What happens if a CVE appears after I've already deployed?"
            answer={
              <>
                You can search the SBOMs of every image you&apos;ve pulled
                for the affected package.{" "}
                <span className="text-ink">It&apos;s a grep, not a guess.</span>{" "}
                Flareo republishes images when upstream projects patch CVEs.
              </>
            }
          />
          <FaqRow
            num="Q4"
            question={"I've heard \"supply chain attack\" a lot. What are these tools actually preventing?"}
            answer={
              <>
                Three categories.{" "}
                <span className="text-ink">Source tampering</span>: provenance
                pins the exact commit.{" "}
                <span className="text-ink">Build tampering</span>: hermetic
                builds eliminate the attack surface.{" "}
                <span className="text-ink">Distribution tampering</span>:
                signatures and digest pinning make this detectable.
              </>
            }
            last
          />
        </div>
      </section>

      {/* Go Deeper */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
        <div className="mb-6">
          <div className="mb-2.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            <span className="text-ink-ghost">§</span> GO DEEPER
          </div>
          <h2 className="mb-2 font-display text-[30px] font-black leading-[1] tracking-[-0.03em] text-ink">
            Authoritative specs.
          </h2>
          <p className="max-w-[640px] font-body text-[14px] leading-[1.65] text-ink-softer">
            If you want the real material, skip the explainers and read the
            specs. These are the three you&apos;d start with.
          </p>
        </div>
        <div className="grid grid-cols-1 border border-hairline md:grid-cols-3">
          {[
            {
              h: "SLSA v1.0 specification",
              desc: "The canonical definition of the four levels, the threat model they address, and the exact producer/verifier requirements.",
              url: "slsa.dev/spec/v1.0",
            },
            {
              h: "Sigstore security model",
              desc: "How Fulcio, Rekor, and cosign compose to provide keyless signing with public transparency. The architecture paper.",
              url: "sigstore.dev/how-it-works",
            },
            {
              h: "CycloneDX 1.6 reference",
              desc: "The full SBOM schema. Every field, every constraint, worked examples.",
              url: "cyclonedx.org/docs/1.6",
            },
          ].map((d, i) => (
            <Link
              key={d.h}
              href={`https://${d.url}`}
              className={`flex cursor-pointer flex-col gap-2.5 bg-canvas-deep p-5 transition-colors hover:bg-canvas ${
                i < 2 ? "border-b border-hairline md:border-b-0 md:border-r" : ""
              }`}
            >
              <div className="font-display text-[16px] font-black leading-[1.1] tracking-[-0.02em] text-ink transition-colors [.group:hover_&]:text-accent">
                {d.h}
              </div>
              <div className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
                {d.desc}
              </div>
              <div className="flex items-center justify-between font-mono text-[10.5px] tracking-[0.02em] text-ink-faint">
                {d.url}
                <span className="text-ink-ghost">↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
