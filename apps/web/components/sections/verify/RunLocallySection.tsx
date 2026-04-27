import { SectionHeader } from "@/components/ui/SectionHeader";

const COMMANDS = [
  {
    tool: "COSIGN",
    line: (
      <>
        cosign verify{" "}
        <span className="text-warn">--certificate-oidc-issuer</span>{" "}
        <span className="text-ink-mute">
          https://token.actions.githubusercontent.com
        </span>{" "}
        <span className="text-warn">--certificate-identity-regexp</span>{" "}
        <span className="text-ink-mute">
          &apos;.*flareo/build.*&apos;
        </span>{" "}
        ghcr.io/flareo/&lt;name&gt;
        <span className="text-ink-ghost">@sha256:&lt;digest&gt;</span>
      </>
    ),
  },
  {
    tool: "TRIVY",
    line: (
      <>
        trivy image <span className="text-warn">--severity</span>{" "}
        <span className="text-ink-mute">CRITICAL,HIGH,MEDIUM,LOW</span>{" "}
        <span className="text-warn">--format</span>{" "}
        <span className="text-ink-mute">table</span> ghcr.io/flareo/&lt;name&gt;
        <span className="text-ink-ghost">@sha256:&lt;digest&gt;</span>
      </>
    ),
  },
  {
    tool: "SLSA-VERIFIER",
    line: (
      <>
        slsa-verifier verify-image ghcr.io/flareo/&lt;name&gt;
        <span className="text-ink-ghost">@sha256:&lt;digest&gt;</span>{" "}
        <span className="text-warn">--source-uri</span>{" "}
        <span className="text-ink-mute">github.com/&lt;upstream&gt;</span>{" "}
        <span className="text-warn">--source-tag</span>{" "}
        <span className="text-ink-mute">&lt;version&gt;</span>
      </>
    ),
  },
];

export function RunLocallySection() {
  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="03"
        label="RUN LOCALLY / SKIP FLAREO ENTIRELY"
        title="Or paste these into your own terminal."
      >
        The whole point of cryptographic verification is that you
        shouldn&apos;t need to trust the person showing you the receipts.
        Install <span className="text-ink">cosign</span>,{" "}
        <span className="text-ink">trivy</span>, and{" "}
        <span className="text-ink">slsa-verifier</span> locally, then run the
        three commands below. You&apos;ll get the exact same output.
      </SectionHeader>

      <div className="space-y-3">
        {COMMANDS.map((c) => (
          <div
            key={c.tool}
            className="grid grid-cols-[130px_1fr_80px] items-center gap-4 border border-hairline bg-canvas-deep px-4 py-3.5"
          >
            <div className="font-mono text-[11px] font-medium tracking-[0.1em] text-accent">
              {c.tool}
            </div>
            <div className="overflow-x-auto whitespace-nowrap font-mono text-[12.5px] tracking-[0.01em] text-ink">
              {c.line}
            </div>
            <button className="border border-hairline px-2.5 py-1.5 font-body text-[11px] text-ink-faint transition-colors hover:border-accent hover:bg-accent hover:text-canvas">
              Copy
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
