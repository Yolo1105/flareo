import { SectionHeader } from "@/components/ui/SectionHeader";
import { FaqRow } from "@/components/ui/FaqRow";

const FAQS = [
  {
    q: "Why would I trust a tool called \"verify\" that you control?",
    a: (
      <>
        You shouldn&apos;t. That&apos;s why every check here maps to a
        command you can run in your own terminal, against public
        infrastructure we don&apos;t operate —{" "}
        <span className="text-ink">Sigstore&apos;s Fulcio and Rekor</span>,
        the <span className="text-ink">NVD vulnerability database</span>.
        If our tool lied, you&apos;d see it immediately by running the
        plain commands.
      </>
    ),
  },
  {
    q: "What do these three checks actually prove together?",
    a: (
      <>
        That the image you&apos;re about to pull was built by Flareo&apos;s
        pipeline on a specific date, from a known source commit, in a
        hermetic environment, with zero (or a known count of) CVEs at
        build time. Missing any one check leaves a gap an attacker could
        exploit.
      </>
    ),
  },
  {
    q: "What don't these checks cover?",
    a: (
      <>
        Runtime behavior. A signed, scanned, attested image can still have
        a subtle logic bug or a backdoor planted in the source code
        before we built it. We verify the supply chain, not the code
        itself. You still need code review.
      </>
    ),
  },
  {
    q: "Can I automate this in my CI pipeline?",
    a: (
      <>
        Yes. All three tools (cosign, trivy, slsa-verifier) return
        standard exit codes. Wire them into your deploy step with{" "}
        <span className="text-ink">set -e</span> and the pipeline will
        halt if any check fails. A GitHub Actions workflow template is in
        our docs.
      </>
    ),
  },
];

export function VerifyFaqSection() {
  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="04"
        label="FREQUENTLY ASKED"
        title="What verification actually proves."
      />
      <div className="grid grid-cols-1 gap-0 border-t border-hairline md:grid-cols-2">
        {FAQS.map((f, i) => (
          <div
            key={i}
            className={`${
              i % 2 === 0 ? "md:border-r" : ""
            } ${i < 2 ? "md:border-b" : ""} border-b border-hairline px-6 py-6 last:border-b-0`}
          >
            <FaqRow
              num={`Q${i + 1}`}
              question={f.q}
              answer={f.a}
              last={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
