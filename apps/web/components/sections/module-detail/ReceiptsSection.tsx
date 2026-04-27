import { SectionHeader } from "@/components/ui/SectionHeader";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { buildFor } from "@/lib/data/builds";
import type { Module } from "@/lib/types";

interface Props {
  module: Module;
}

export function ReceiptsSection({ module }: Props) {
  // Derive the displayed Build from the module itself so every
  // module's Provenance Trail table has module-specific hashes, IDs,
  // and timing rather than all sharing vaultwarden's values.
  const build = buildFor(module);
  // Extract HH:MM from the build start so the per-stage timestamps
  // in the terminal block and trail align with the row rendered
  // lower down.
  const startDate = new Date(build.startedAt);
  const startHH = String(startDate.getUTCHours()).padStart(2, "0");
  const startMM = String(startDate.getUTCMinutes()).padStart(2, "0");
  const startIso = `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, "0")}-${String(startDate.getUTCDate()).padStart(2, "0")}T${startHH}:${startMM}:22Z`;
  const startHuman = `${startDate.toISOString().slice(0, 10)} ${startHH}:${startMM} UTC`;
  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="02"
        label="RECEIPTS"
        title="Three independent proofs. Hash-linked. Public."
      >
        Every module ships with three cryptographic receipts you can run
        against public Sigstore infrastructure. Below is exactly what{" "}
        <span className="text-ink">flareo verify {module.slug}</span> outputs.
      </SectionHeader>

      <div className="space-y-4">
        {/* Cosign */}
        <TerminalBlock
          title="cosign verify · signature + identity"
          status={{ tone: "ok", label: "PASS" }}
        >
          <span className="text-accent">$</span> cosign verify{" "}
          <span className="text-accent">--certificate-oidc-issuer</span>{" "}
          https://token.actions.githubusercontent.com \{"\n"}
          {"    "}
          <span className="text-accent">--certificate-identity-regexp</span>{" "}
          &apos;.*flareo/build.*&apos; \{"\n"}
          {"    "}ghcr.io/flareo/{module.slug}
          <span className="text-ink-ghost">@</span>
          <span className="text-blue">{module.digest}</span>
          {"\n\n"}
          <span className="text-ink-ghost">
            Verification for ghcr.io/flareo/{module.slug}@{module.digest}
            {"\n"}
          </span>
          <span className="text-good">✓</span>{" "}
          <span className="text-ink-ghost">
            The cosign claims were validated
          </span>
          {"\n"}
          <span className="text-good">✓</span>{" "}
          <span className="text-ink-ghost">
            The code signatures are valid for existing certificates
          </span>
          {"\n"}
          <span className="text-good">✓</span>{" "}
          <span className="text-ink-ghost">
            Existence of the claims in the transparency log was verified offline
          </span>
          {"\n"}
          <span className="text-good">✓</span>{" "}
          <span className="text-ink-ghost">
            The certificate issuer URL matches Flareo&apos;s build pipeline
          </span>
          {"\n\n"}
          <span className="text-ink-faint">
            [rekor entry: {build.sourceCommit.slice(0, 16)}...{build.sourceCommit.slice(-7)}]
            {"\n"}
            [signer: flareo-bot@github/flareo/build.yml@refs/heads/main]
          </span>
        </TerminalBlock>

        {/* Trivy */}
        <TerminalBlock
          title="trivy image · cve + sbom scan"
          status={{
            tone: module.cves.critical > 0 ? "bad" : "ok",
            label: module.cves.critical > 0 ? `${module.cves.critical} CRIT` : "0 FINDINGS",
          }}
        >
          <span className="text-accent">$</span> trivy image{" "}
          <span className="text-accent">--severity</span>{" "}
          CRITICAL,HIGH,MEDIUM,LOW ghcr.io/flareo/{module.slug}
          <span className="text-ink-ghost">@</span>
          <span className="text-blue">{module.digest}</span>
          {"\n\n"}
          <span className="text-ink-ghost">
            {startIso} INFO Trivy Version: 0.54.1
            {"\n"}
            {startIso} INFO Vulnerability scanning is enabled
            {"\n"}
            {startIso} INFO Detected OS: debian 12.5
          </span>
          {"\n\n"}
          <span className="text-ink-ghost">
            ghcr.io/flareo/{module.slug} (debian 12.5){"\n"}
            ========================================{"\n"}
            Total: {module.cves.critical + module.cves.high + module.cves.medium + module.cves.low}{" "}
            (CRITICAL: {module.cves.critical}, HIGH: {module.cves.high}, MEDIUM:{" "}
            {module.cves.medium}, LOW: {module.cves.low})
          </span>
          {"\n\n"}
          {module.cves.critical === 0 && module.cves.high === 0 && module.cves.medium === 0 && module.cves.low === 0 ? (
            <span className="text-good">✓ No vulnerabilities found. Scan completed in 3.1s.</span>
          ) : (
            <span className={module.cves.critical > 0 ? "text-bad" : "text-good"}>
              {module.cves.critical > 0 ? "✗ Scan FAILED — critical CVE(s) block publishing" : "✓ Scan completed — no critical or high severity"}
            </span>
          )}
        </TerminalBlock>

        {/* SLSA */}
        <TerminalBlock
          title="slsa-verifier · provenance attestation"
          status={{ tone: module.slsa === "L3" ? "ok" : "warn", label: `${module.slsa} VERIFIED` }}
        >
          <span className="text-accent">$</span> slsa-verifier verify-image{" "}
          ghcr.io/flareo/{module.slug}
          <span className="text-ink-ghost">@</span>
          <span className="text-blue">{module.digest}</span> \{"\n"}
          {"    "}
          <span className="text-accent">--source-uri</span>{" "}
          github.com/{module.author}/{module.slug}{" "}
          <span className="text-accent">--source-tag</span> {module.version}
          {"\n\n"}
          <span className="text-good">Verified SLSA provenance</span>{" "}
          <span className="text-ink-ghost">with level {module.slsa.toLowerCase()}</span>
          {"\n"}
          <span className="text-ink-ghost">
            {"  "}predicateType: https://slsa.dev/provenance/v1{"\n"}
            {"  "}builder.id:{"    "}github.com/flareo/build/.github/workflows/build.yml{"\n"}
            {"  "}invocation:{"    "}flareo/build {build.id} ({startHuman})
          </span>
          {"\n"}
          <span className="text-good">✓</span>{" "}
          <span className="text-ink-ghost">Hermetic build · no network access during compilation</span>
          {"\n"}
          <span className="text-good">✓</span>{" "}
          <span className="text-ink-ghost">Isolated BuildKit sandbox</span>
          {"\n"}
          <span className="text-good">✓</span>{" "}
          <span className="text-ink-ghost">Parameterless build · no injection surface</span>
        </TerminalBlock>
      </div>

      {/* OpenVEX document download.
          The reviewer team annotates Trivy findings as not_affected /
          affected / fixed / under_investigation; this link surfaces
          the resulting OpenVEX 0.2.0 document for consumers who want
          to suppress not-applicable findings in their own pipelines. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-dashed border-hairline bg-canvas-deep px-5 py-4">
        <div className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
          <strong className="text-ink">VEX document.</strong> Reviewer
          annotations of which Trivy findings are actually exploitable in
          this module. Download the OpenVEX 0.2.0 JSON for your scanner.
        </div>
        <a
          href={`/api/v1/modules/${module.slug}/vex`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 border border-hairline bg-canvas-panel px-3 py-1.5 font-mono text-[10.5px] tracking-[0.04em] text-accent transition-colors hover:border-accent"
        >
          ↓ vex.json
        </a>
      </div>

      {/* Admission-policy verdict link.
          The active policy at /app/admin/policy is evaluated against
          this module's signals and produces a pass/warn/fail verdict
          with per-rule breakdown. Consumers can chain this into their
          own admission pipelines. */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-dashed border-hairline bg-canvas-deep px-5 py-4">
        <div className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
          <strong className="text-ink">Policy verdict.</strong> Per-rule
          evaluation of the active admission policy against this module.
          OPA-shaped JSON; Rego runtime is a future swap.
        </div>
        <a
          href={`/api/v1/modules/${module.slug}/policy`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 border border-hairline bg-canvas-panel px-3 py-1.5 font-mono text-[10.5px] tracking-[0.04em] text-accent transition-colors hover:border-accent"
        >
          ↓ policy.json
        </a>
      </div>

      {/* Provenance trail table */}
      <div className="mt-10">
        <div className="mb-4 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          § PROVENANCE TRAIL · BUILD {build.id}
        </div>
        <div className="border border-hairline bg-canvas-deep">
          <div className="grid grid-cols-[50px_1fr_130px_170px_110px] gap-4 border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint">
            <div>STAGE</div>
            <div>ACTION</div>
            <div>OUTPUT HASH</div>
            <div>STARTED</div>
            <div className="text-right">DURATION</div>
          </div>
          {build.stages.map((s, i) => (
            <div
              key={s.order}
              className={`grid grid-cols-[50px_1fr_130px_170px_110px] items-center gap-4 px-5 py-2.5 font-mono text-[11.5px] text-ink-mute ${
                i < build.stages.length - 1 ? "border-b border-hairline" : ""
              }`}
            >
              <div className="text-accent">{s.order}</div>
              <div className="text-ink">{s.name}</div>
              <div className="text-blue">{s.hashFragment}...</div>
              <div className="text-ink-faint">
                {startHH}:{startMM}:{String(i * 2 + 12).padStart(2, "0")} UTC
              </div>
              <div className="text-right text-ink-mute">
                {s.durationMs < 1000
                  ? `${s.durationMs}ms`
                  : `${(s.durationMs / 1000).toFixed(2)}s`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
