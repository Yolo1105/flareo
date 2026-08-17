"use client";

import Link from "next/link";
import { useState } from "react";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  DEMO_RUN,
  shortDigest,
  type DemoStepId,
} from "@/lib/data/demo-pipeline";

interface StepProps {
  playing: boolean;
}

export function DemoStepBody({
  stepId,
  playing,
}: {
  stepId: DemoStepId;
  playing: boolean;
}) {
  switch (stepId) {
    case "pin":
      return <StepPin playing={playing} />;
    case "republish":
      return <StepRepublish playing={playing} />;
    case "sbom":
      return <StepSbom playing={playing} />;
    case "scan":
      return <StepScan playing={playing} />;
    case "sign":
      return <StepSign playing={playing} />;
    case "catalog":
      return <StepCatalog playing={playing} />;
    case "verify":
      return <StepVerify playing={playing} />;
  }
}

function StepHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="mb-2 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
        {kicker}
      </div>
      <h2 className="mb-3 font-display text-[32px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
        {title}
      </h2>
      <p className="max-w-[640px] font-body text-[14.5px] leading-[1.6] text-ink-softer">
        {children}
      </p>
    </header>
  );
}

function RunningNote({ text }: { text: string }) {
  return (
    <TerminalBlock title="pipeline · this stage" status={{ tone: "running", label: "RUNNING" }}>
      <span className="text-ink-faint">{text}</span>
    </TerminalBlock>
  );
}

function StepPin({ playing }: StepProps) {
  const { upstream, module } = DEMO_RUN;
  if (playing) {
    return <RunningNote text="resolving docker.io/vaultwarden/server:1.32.7 → digest…" />;
  }
  return (
    <>
      <StepHeader kicker="01 · PIN THE UPSTREAM IMAGE" title="Lock the bytes. Do not build them.">
        Flareo does not compile Vaultwarden and does not run a Dockerfile.
        This stage records the upstream tag and the digest it currently
        points at. Everything later is checked against this digest.
      </StepHeader>
      <div className="mb-4 grid grid-cols-1 gap-px border border-hairline bg-hairline md:grid-cols-3">
        <Metric label="IMAGE" value={module.name} sub={upstream.ref} />
        <Metric label="VERSION" value={module.version} sub={module.author} />
        <Metric label="SIZE" value={module.size} sub="as published upstream" />
      </div>
      <TerminalBlock
        title="crane digest · pin the tag"
        status={{ tone: "ok", label: "PINNED" }}
      >
        <span className="text-accent">$</span> crane digest{" "}
        <span className="text-blue">{upstream.ref}</span>
        {"\n\n"}
        <span className="text-ink">{upstream.digest}</span>
        {"\n\n"}
        <span className="text-ink-faint">
          tag is mutable. digest is not. this is the only input the rest of
          the pipeline is allowed to see.
        </span>
      </TerminalBlock>
    </>
  );
}

function StepRepublish({ playing }: StepProps) {
  const { upstream, published } = DEMO_RUN;
  const match = upstream.digest === published.digest;
  if (playing) {
    return (
      <RunningNote text="skopeo copy docker.io → public.ecr.aws/flareo · no rebuild…" />
    );
  }
  return (
    <>
      <StepHeader kicker="02 · REPUBLISH" title="Same bits. New name. That is the whole move.">
        The image is copied to Flareo&apos;s registry. Layers are not
        rebuilt. If the Flareo digest and the upstream digest ever
        disagree, the run stops.
      </StepHeader>
      <div className="mb-4 grid grid-cols-1 gap-px border border-hairline bg-hairline md:grid-cols-2">
        <div className="bg-canvas-deep p-5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            UPSTREAM
          </div>
          <div className="mb-3 break-all font-mono text-[12.5px] text-ink-mute">
            {upstream.ref}
          </div>
          <div className="break-all font-mono text-[11.5px] text-ink">
            {upstream.digest}
          </div>
        </div>
        <div className="bg-canvas-deep p-5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            FLAREO
          </div>
          <div className="mb-3 break-all font-mono text-[12.5px] text-ink-mute">
            {published.ref}
          </div>
          <div className="break-all font-mono text-[11.5px] text-ink">
            {published.digest}
          </div>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-3 border border-hairline bg-canvas-deep px-5 py-3">
        <StatusBadge tone={match ? "ok" : "bad"}>
          {match ? "DIGESTS MATCH" : "DIGEST MISMATCH"}
        </StatusBadge>
        <span className="font-body text-[13px] text-ink-softer">
          Byte-identical to upstream. A rebuild would have produced a new
          digest.
        </span>
      </div>
      <TerminalBlock
        title="skopeo copy · retag only"
        status={{ tone: "ok", label: "COPIED" }}
      >
        <span className="text-accent">$</span> skopeo copy{"\n"}
        {"    "}docker://{upstream.ref}
        {" \\"}
        {"\n"}
        {"    "}docker://{published.ref}
        {"\n\n"}
        <span className="text-good">✓</span>{" "}
        <span className="text-ink-ghost">copy complete · layers reused · digest unchanged</span>
        {"\n"}
        <span className="text-ink-faint">upstream: </span>
        <span className="text-ink-ghost">{shortDigest(upstream.digest)}</span>
        {"\n"}
        <span className="text-ink-faint">flareo:   </span>
        <span className="text-ink-ghost">{shortDigest(published.digest)}</span>
      </TerminalBlock>
    </>
  );
}

function StepSbom({ playing }: StepProps) {
  const { sbom, published } = DEMO_RUN;
  if (playing) {
    return <RunningNote text="syft packages · writing CycloneDX 1.5…" />;
  }
  return (
    <>
      <StepHeader kicker="03 · SOFTWARE BILL OF MATERIALS" title="List everything that is actually in the image.">
        Syft inventories the copied image. The SBOM is a receipt for
        contents, not a claim about how those contents were compiled.
      </StepHeader>
      <div className="mb-4 grid grid-cols-2 gap-px border border-hairline bg-hairline md:grid-cols-4">
        <Metric label="FORMAT" value={sbom.format} sub={`v${sbom.specVersion}`} />
        <Metric label="TOOL" value="Syft" sub={sbom.tool} />
        <Metric label="PACKAGES" value={String(sbom.packagesIndexed)} sub="indexed" />
        <Metric label="TARGET" value="image" sub={shortDigest(published.digest, 12)} />
      </div>
      <div className="mb-4 overflow-x-auto border border-hairline bg-canvas-deep">
        <table className="w-full font-mono text-[11.5px]">
          <thead>
            <tr className="border-b border-hairline bg-canvas-panel text-left text-ink-faint">
              <th className="px-4 py-2.5 font-medium tracking-[0.04em]">NAME</th>
              <th className="px-4 py-2.5 font-medium tracking-[0.04em]">VERSION</th>
              <th className="px-4 py-2.5 font-medium tracking-[0.04em]">TYPE</th>
              <th className="px-4 py-2.5 font-medium tracking-[0.04em]">PURL</th>
            </tr>
          </thead>
          <tbody>
            {sbom.components.map((c) => (
              <tr key={c.purl} className="border-b border-hairline last:border-0">
                <td className="px-4 py-2.5 text-ink">{c.name}</td>
                <td className="px-4 py-2.5 text-ink-mute">{c.version}</td>
                <td className="px-4 py-2.5 text-ink-faint">{c.type}</td>
                <td className="px-4 py-2.5 text-ink-ghost">{c.purl}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-hairline px-4 py-2 font-mono text-[10.5px] text-ink-ghost">
          showing 4 of {sbom.packagesIndexed} components · full document stored with the module
        </div>
      </div>
    </>
  );
}

function StepScan({ playing }: StepProps) {
  const { scan } = DEMO_RUN;
  if (playing) {
    return <RunningNote text="trivy image · NVD + GHSA + debian advisories…" />;
  }
  return (
    <>
      <StepHeader kicker="04 · SCAN + VEX" title="Count the CVEs. Then say which ones matter.">
        Trivy scans the copied image. A CVE list alone cannot tell you
        if a finding is reachable — VEX can. This run has one medium
        finding, annotated not_affected.
      </StepHeader>
      <div className="mb-4 grid grid-cols-2 gap-px border border-hairline bg-hairline md:grid-cols-4">
        <Metric label="CRITICAL" value="0" valueClass="text-good" sub="auto-reject if over zero" />
        <Metric label="HIGH" value="0" valueClass="text-good" sub="needs justification" />
        <Metric label="MEDIUM" value="1" sub="see VEX below" />
        <Metric label="LOW" value="3" sub={`${scan.scanTimeMs}ms`} />
      </div>
      <div className="mb-4 overflow-x-auto border border-hairline bg-canvas-deep">
        <table className="w-full font-mono text-[11.5px]">
          <thead>
            <tr className="border-b border-hairline bg-canvas-panel text-left text-ink-faint">
              <th className="px-4 py-2.5 font-medium tracking-[0.04em]">CVE</th>
              <th className="px-4 py-2.5 font-medium tracking-[0.04em]">PACKAGE</th>
              <th className="px-4 py-2.5 font-medium tracking-[0.04em]">INSTALLED</th>
              <th className="px-4 py-2.5 font-medium tracking-[0.04em]">SEVERITY</th>
            </tr>
          </thead>
          <tbody>
            {scan.findings.map((f) => (
              <tr key={f.cve}>
                <td className="px-4 py-2.5 text-accent">{f.cve}</td>
                <td className="px-4 py-2.5 text-ink">{f.pkgName}</td>
                <td className="px-4 py-2.5 text-ink-mute">{f.installedVersion}</td>
                <td className="px-4 py-2.5 text-ink-mute">{f.severity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-4 border border-hairline bg-canvas-deep p-5">
        <div className="mb-2 flex items-center gap-2">
          <StatusBadge tone="ok">NOT AFFECTED</StatusBadge>
          <span className="font-mono text-[11px] text-ink-faint">
            OpenVEX 0.2 · {scan.vex.cve}
          </span>
        </div>
        <p className="max-w-[680px] font-body text-[13.5px] leading-[1.55] text-ink-softer">
          {scan.vex.statement}{" "}
          <span className="font-mono text-[12px] text-ink-mute">
            justification: {scan.vex.justification}
          </span>
        </p>
      </div>
      <TerminalBlock
        title="trivy image · recorded output"
        status={{ tone: "ok", label: "0 ACTIONABLE" }}
      >
        <span className="text-ink-faint">critical:</span>{" "}
        <span className="text-good">0</span>
        {"  "}
        <span className="text-ink-faint">high:</span>{" "}
        <span className="text-good">0</span>
        {"  "}
        <span className="text-ink-faint">medium:</span>{" "}
        <span className="text-ink">1</span>
        {"  "}
        <span className="text-ink-faint">low:</span>{" "}
        <span className="text-ink-ghost">3</span>
        {"\n"}
        <span className="text-ink-faint">vex:</span>{" "}
        <span className="text-good">{scan.vex.cve} → not_affected</span>
      </TerminalBlock>
    </>
  );
}

function StepSign({ playing }: StepProps) {
  const { signature, published } = DEMO_RUN;
  if (playing) {
    return <RunningNote text="cosign sign · fulcio certificate · posting to Rekor…" />;
  }
  return (
    <>
      <StepHeader kicker="05 · SIGN" title="Short-lived identity. Public log. No long-lived key.">
        Cosign signs the digest with a Fulcio certificate bound to the
        GitHub Actions OIDC identity of the republish workflow. The
        signature is appended to Rekor. There is no SLSA build
        attestation — this image was not built here.
      </StepHeader>
      <div className="mb-4 grid grid-cols-1 gap-px border border-hairline bg-hairline md:grid-cols-2">
        <div className="bg-canvas-deep p-5">
          <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            SIGNER
          </div>
          <dl className="grid grid-cols-[72px_1fr] gap-y-2 font-mono text-[11.5px]">
            <dt className="text-ink-faint">type</dt>
            <dd className="text-ink">keyless · OIDC</dd>
            <dt className="text-ink-faint">issuer</dt>
            <dd className="break-all text-ink-mute">{signature.issuer.replace("https://", "")}</dd>
            <dt className="text-ink-faint">subject</dt>
            <dd className="break-all text-ink-mute">
              {signature.identity.replace("https://github.com/", "")}
            </dd>
          </dl>
        </div>
        <div className="bg-canvas-deep p-5">
          <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            REKOR
          </div>
          <dl className="grid grid-cols-[72px_1fr] gap-y-2 font-mono text-[11.5px]">
            <dt className="text-ink-faint">index</dt>
            <dd className="text-ink">{Number(signature.rekorLogIndex).toLocaleString()}</dd>
            <dt className="text-ink-faint">when</dt>
            <dd className="text-ink-mute">
              {signature.integratedAt.replace("T", " ").replace("Z", " UTC")}
            </dd>
            <dt className="text-ink-faint">digest</dt>
            <dd className="break-all text-ink-mute">{shortDigest(published.digest)}</dd>
          </dl>
          <a
            href={signature.rekorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-mono text-[11px] text-accent hover:text-accent-hot"
          >
            view in transparency log →
          </a>
        </div>
      </div>
      <TerminalBlock
        title="cosign verify · what anyone can re-run"
        status={{ tone: "ok", label: "SIGNED" }}
      >
        <span className="text-accent">$</span> cosign verify{"\n"}
        {"    "}--certificate-identity {signature.identity}
        {" \\"}
        {"\n"}
        {"    "}--certificate-oidc-issuer {signature.issuer}
        {" \\"}
        {"\n"}
        {"    "}
        {published.ref}
        {"\n\n"}
        <span className="text-good">✓</span>{" "}
        <span className="text-ink-ghost">signature verified via Sigstore</span>
        {"\n"}
        <span className="text-ink-faint">rekor log index:</span>{" "}
        <span className="text-ink-ghost">{signature.rekorLogIndex}</span>
      </TerminalBlock>
    </>
  );
}

function StepCatalog({ playing }: StepProps) {
  const { trust, module, published } = DEMO_RUN;
  if (playing) {
    return <RunningNote text="upserting catalog row · computing trust score…" />;
  }
  return (
    <>
      <StepHeader kicker="06 · CATALOG" title="The receipts become a listing anyone can open.">
        Trust is four signals added up — not a safety rating. A high
        score means the receipts are present and valid. It does not
        mean the image is safe to run.
      </StepHeader>
      <div className="mb-4 flex flex-wrap items-end gap-6 border border-hairline bg-canvas-deep px-6 py-5">
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            TRUST SCORE
          </div>
          <div className="font-display text-[56px] font-black leading-none tracking-[-0.04em] text-good">
            {trust.total}
          </div>
        </div>
        <div className="pb-1 font-mono text-[12px] text-ink-mute">
          {module.name}@{module.version}
          <span className="mx-2 text-ink-ghost">·</span>
          {published.ref}
        </div>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-px border border-hairline bg-hairline md:grid-cols-4">
        {trust.parts.map((p) => {
          const pct = p.value / p.max;
          return (
            <div key={p.label} className="bg-canvas-deep p-5">
              <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
                {p.label.toUpperCase()}
              </div>
              <div className="mb-2 font-display text-[28px] font-black leading-none tracking-[-0.03em] text-ink">
                +{p.value}
                <span className="ml-1 font-mono text-[12px] font-medium text-ink-faint">
                  /{p.max}
                </span>
              </div>
              <div className="mb-2 h-1 w-full bg-hairline-soft">
                <div className="h-full bg-good" style={{ width: `${pct * 100}%` }} />
              </div>
              <div className="font-body text-[12px] leading-[1.45] text-ink-softer">
                {p.note}
              </div>
            </div>
          );
        })}
      </div>
      <Link
        href={module.catalogHref}
        className="inline-flex font-mono text-[12px] text-accent hover:text-accent-hot"
      >
        Open the live catalog listing →
      </Link>
    </>
  );
}

function StepVerify({ playing }: StepProps) {
  const { published, signature, scan, compose, module } = DEMO_RUN;
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);

  function run() {
    if (running) return;
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setRan(true);
    }, 1100);
  }

  if (playing) {
    return <RunningNote text="waiting for you to run verify…" />;
  }

  return (
    <>
      <StepHeader kicker="07 · VERIFY" title="Anyone can check this. You do not have to trust Flareo.">
        This is the same check as the public /verify tool, with the
        recorded result for this run. Click Verify — the output is
        canned so every demo shows the same signer, Rekor index, and
        digest.
      </StepHeader>

      <div className="mb-4 flex border border-hairline bg-canvas-deep focus-within:border-accent">
        <input
          readOnly
          value={published.ref}
          className="flex-1 bg-transparent px-5 py-4 font-mono text-[13.5px] text-ink focus:outline-none"
          aria-label="Image reference"
        />
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="cursor-pointer bg-accent px-8 font-body text-[14px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
        >
          {running ? "Running..." : ran ? "Run again" : "Verify"}
        </button>
      </div>

      {!ran && !running && (
        <div className="border border-dashed border-hairline bg-canvas-deep px-5 py-6 font-body text-[13.5px] text-ink-softer">
          The image is already filled in. Press Verify to see the recorded
          result for this republish.
        </div>
      )}

      {running && (
        <TerminalBlock title="flareo verify" status={{ tone: "running", label: "RUNNING" }}>
          <span className="text-ink-faint">checking Sigstore public-good trust root…</span>
        </TerminalBlock>
      )}

      {ran && !running && (
        <div className="space-y-4">
          <TerminalBlock
            title="cosign verify · signature + identity"
            status={{ tone: "ok", label: "PASS" }}
          >
            <span className="text-accent">$</span> flareo verify {published.ref}
            {"\n\n"}
            <span className="text-good">✓</span>{" "}
            <span className="text-ink-ghost">signature verified via Sigstore</span>
            {"\n"}
            <span className="text-ink-faint">signer:</span>{" "}
            <span className="text-ink-ghost">
              {signature.identity.replace("https://github.com/", "")}
            </span>
            {"\n"}
            <span className="text-ink-faint">issuer:</span>{" "}
            <span className="text-ink-ghost">{signature.issuer}</span>
            {"\n"}
            <span className="text-ink-faint">rekor log index:</span>{" "}
            <span className="text-ink-ghost">{signature.rekorLogIndex}</span>
            {"\n"}
            <span className="text-ink-faint">digest:</span>{" "}
            <span className="text-ink-ghost">{shortDigest(published.digest, 24)}</span>
          </TerminalBlock>
          <TerminalBlock
            title="catalog enrichment · scan + sbom"
            status={{ tone: "ok", label: "IN CATALOG" }}
          >
            <span className="text-ink-faint">critical:</span>{" "}
            <span className="text-good">{scan.summary.critical}</span>
            {"  "}
            <span className="text-ink-faint">high:</span>{" "}
            <span className="text-good">{scan.summary.high}</span>
            {"  "}
            <span className="text-ink-faint">medium:</span>{" "}
            <span className="text-ink">{scan.summary.medium}</span>
            {"  "}
            <span className="text-ink-faint">vex:</span>{" "}
            <span className="text-good">not_affected</span>
            {"\n"}
            <span className="text-ink-faint">
              scan data is catalog-only. images outside the catalog get
              signature status, not a Trivy report.
            </span>
          </TerminalBlock>
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
              TAKEAWAY · DIGEST-PINNED COMPOSE
            </div>
            <TerminalBlock title="docker-compose.yaml" status={{ tone: "ok", label: "PINNED" }}>
              {compose}
            </TerminalBlock>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href={module.catalogHref} variant="primary">
                Open catalog listing
              </Button>
              <Button href="/verify" variant="ghost">
                Try live verify
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Metric({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-canvas-deep px-5 py-4">
      <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
        {label}
      </div>
      <div
        className={`font-display text-[22px] font-black leading-[1.1] tracking-[-0.03em] text-ink ${valueClass ?? ""}`}
      >
        {value}
      </div>
      <div className="mt-1 truncate font-mono text-[10.5px] text-ink-faint">
        {sub}
      </div>
    </div>
  );
}
