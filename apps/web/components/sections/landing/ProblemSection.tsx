import { SectionHeader } from "@/components/ui/SectionHeader";

const PROBLEMS = [
  {
    label: "TRUST",
    title: "You can't verify Docker Hub.",
    body:
      "Anyone can push anything. :latest tags mutate under you. Publisher identity isn't cryptographically bound to images. One compromised maintainer account and your prod is running a trojan you can't detect.",
  },
  {
    label: "LINEAGE",
    title: "No SBOM, no provenance.",
    body:
      "What's actually inside that container? Which commit built it? What dependencies were pulled at build time? Standard registries give you none of this. You're trusting a community reputation score at best.",
  },
  {
    label: "TENANCY",
    title: "PaaS owns your infrastructure.",
    body:
      "Railway, Render, Fly.io are convenient until they raise prices, change limits, or go dark. Your deployment's SLA is theirs. Migration is painful. For homelab operators this is a non-starter.",
  },
  {
    label: "EFFORT",
    title: "Rolling your own is a full-time job.",
    body:
      "Cosign + Trivy + Syft + SLSA generator + Rekor integration takes a platform team at least a quarter to ship reliably. For everyone below that scale, supply-chain security stays aspirational.",
  },
];

export function ProblemSection() {
  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="01"
        label="THE PROBLEM"
        title="Four things broken about how you pull images today."
      >
        Flareo doesn&apos;t exist because containers are hard. It exists
        because the distribution layer between upstream source code and
        the box you run on is full of trust gaps.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-0 border border-hairline md:grid-cols-2 lg:grid-cols-4">
        {PROBLEMS.map((p, i) => (
          <div
            key={p.label}
            className={`bg-canvas-deep p-6 ${
              i < PROBLEMS.length - 1
                ? "border-b border-hairline lg:border-b-0 lg:border-r"
                : ""
            } ${
              i % 2 === 0 && i < PROBLEMS.length - 2
                ? "md:border-r md:border-hairline lg:border-r"
                : ""
            }`}
          >
            <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              {p.label}
            </div>
            <h3 className="mb-3 font-display text-[18px] font-black leading-[1.2] tracking-[-0.02em] text-ink">
              {p.title}
            </h3>
            <p className="font-body text-[13px] leading-[1.65] text-ink-softer">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
