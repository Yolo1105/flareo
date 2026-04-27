"use client";

import { useState } from "react";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { trackEvent } from "@/lib/analytics/plausible";

type Result = "verified" | "failing" | "unknown" | null;

// The live API response shape. Matches lib/validation/schemas VerifyResult
// but kept as an inline type here so the component stays self-contained.
interface ApiVerifyResult {
  status: "verified" | "signed" | "unsigned" | "invalid" | "error";
  imageRef: string;
  resolvedDigest: string | null;
  signerIdentity: string | null;
  signerIssuer: string | null;
  rekorLogIndex: string | null;
  rekorUrl: string | null;
  integratedAt: string | null;
  flareoModule: {
    slug: string;
    name: string;
    version: string;
    trust: number;
    cves: { critical: number; high: number; medium: number; low: number };
    sbomUrl: string | null;
    scanUrl: string | null;
  } | null;
  errorMessage: string | null;
}

const EXAMPLES = [
  // Lead with non-Flareo signed examples to demonstrate the
  // audit-anything claim on the page hero.
  { label: "ghcr.io/sigstore/cosign:v2.4.1 (signed by Sigstore)", value: "ghcr.io/sigstore/cosign:v2.4.1" },
  { label: "ghcr.io/distroless/static-debian12 (signed)", value: "ghcr.io/distroless/static-debian12:latest" },
  { label: "nginx:1.27 (unsigned · Docker Hub)", value: "nginx:1.27" },
  { label: "alpine:3.20 (unsigned · Docker Hub)", value: "alpine:3.20" },
  // Flareo example last so it's visible but not the lede.
  {
    label: "public.ecr.aws/flareo/vaultwarden (in our catalog)",
    value: "public.ecr.aws/flareo/vaultwarden:latest",
  },
];

/**
 * Map the API's five-state response into the component's existing
 * three-state display. "verified" and "signed with clean scan" both
 * render as the green pass state; "invalid" (sig ok but CVEs over
 * threshold) and "unsigned" render as failing; "error" and nothing-
 * matched fall through to the "unknown / not in catalog" box.
 */
function apiStatusToDisplay(api: ApiVerifyResult): Result {
  if (api.status === "verified") return "verified";
  if (api.status === "signed") return "verified"; // signed by someone, just not us
  if (api.status === "unsigned" || api.status === "invalid") return "failing";
  return "unknown";
}

export function VerifyTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [apiResult, setApiResult] = useState<ApiVerifyResult | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  async function run() {
    if (!input.trim()) return;
    setRunning(true);
    setResult(null);
    setApiResult(null);
    setNetworkError(null);
    try {
      const resp = await fetch("/api/v1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageRef: input.trim() }),
      });
      if (resp.status === 429) {
        setNetworkError("Rate limited. Please wait a minute and try again.");
        setResult("unknown");
        // Still count as a use attempt so we can see rate-limit pressure
        // in Plausible. "unknown_image" is the closest existing bucket
        // without widening the event's result enum.
        trackEvent("VerifyToolUsed", { result: "unknown_image" });
        return;
      }
      if (resp.status === 400) {
        const body = (await resp.json()) as { error?: { message?: string } };
        setNetworkError(body.error?.message ?? "Invalid image reference.");
        setResult("unknown");
        trackEvent("VerifyToolUsed", { result: "unknown_image" });
        return;
      }
      const body = (await resp.json()) as ApiVerifyResult;
      setApiResult(body);
      setResult(apiStatusToDisplay(body));

      // Map the API's 5-state response to the event's 4-value result.
      // - "verified" / "signed" → ok (image passed verification)
      // - "invalid"             → signature_mismatch (sig bad / CVE over
      //                            threshold — the trust signal failed)
      // - "unsigned"            → scan_failed (no signature is itself a
      //                            failure mode distinct from unknown)
      // - "error" / other       → unknown_image
      const eventResult: "ok" | "signature_mismatch" | "scan_failed" | "unknown_image" =
        body.status === "verified" || body.status === "signed"
          ? "ok"
          : body.status === "invalid"
            ? "signature_mismatch"
            : body.status === "unsigned"
              ? "scan_failed"
              : "unknown_image";
      trackEvent("VerifyToolUsed", { result: eventResult });
    } catch (err) {
      setNetworkError(err instanceof Error ? err.message : "Network error");
      setResult("unknown");
      trackEvent("VerifyToolUsed", { result: "unknown_image" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      {/* Tool */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-12">
        <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
          <span className="font-normal text-ink-ghost">01</span>
          PASTE AN IMAGE OR DIGEST
        </div>

        <div className="flex border border-hairline bg-canvas-deep focus-within:border-accent">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="ghcr.io/flareo/<name>:<version>   or   sha256:<hash>"
            className="flex-1 bg-transparent px-5 py-4 font-mono text-[14px] text-ink placeholder:text-ink-ghost focus:outline-none"
            spellCheck={false}
          />
          <button
            onClick={run}
            disabled={running || !input.trim()}
            className="flex items-center gap-2.5 bg-accent px-8 font-body text-[14px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8l3.5 3.5L13 4"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {running ? "Running..." : "Verify"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10.5px] tracking-[0.1em] text-ink-ghost">
            TRY:
          </span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.value}
              onClick={() => setInput(ex.value)}
              className="border border-hairline bg-canvas-deep px-2.5 py-1.5 font-mono text-[11px] tracking-[0.02em] text-ink-mute transition-colors hover:border-accent hover:text-accent"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </section>

      {/* Results */}
      <section className="border-b border-hairline px-8 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
              <span className="font-normal text-ink-ghost">02</span>
              VERIFICATION RESULTS
            </div>
            <div className="font-mono text-[13px] text-ink-mute">
              {input ? (
                <>
                  target: <span className="text-blue">{input}</span>
                </>
              ) : (
                "awaiting input"
              )}
            </div>
          </div>
          {result === "verified" && (
            <StatusBadge tone="ok">ALL CHECKS PASSED</StatusBadge>
          )}
          {result === "failing" && (
            <StatusBadge tone="bad">VERIFICATION FAILED</StatusBadge>
          )}
          {result === "unknown" && (
            <StatusBadge tone="warn">NOT IN CATALOG</StatusBadge>
          )}
        </div>

        {result === null && !running && (
          <div className="border border-dashed border-hairline bg-canvas-deep p-8">
            <p className="mb-6 font-mono text-[11.5px] leading-[1.7] text-ink-faint">
              Paste an image above and hit verify. You&apos;ll see{" "}
              <span className="text-ink">three independent checks</span> run
              against public infrastructure. Flareo does not proxy or cache
              these calls.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  n: "A",
                  label: "SIGNATURE",
                  title: "IS THE IMAGE REALLY FROM FLAREO?",
                  desc: "Validates the cosign signature against the Sigstore Fulcio certificate authority, confirming the image was signed by Flareo's GitHub Actions build identity.",
                  tool: "cosign → Rekor transparency log",
                },
                {
                  n: "B",
                  label: "VULNERABILITIES",
                  title: "ARE THERE KNOWN CVES?",
                  desc: "Scans every layer against the NVD, GitHub Advisory Database, and OS package advisories. Reports severity counts.",
                  tool: "trivy → NVD + GHSA + Debian",
                },
                {
                  n: "C",
                  label: "PROVENANCE",
                  title: "WHAT BUILT THIS IMAGE?",
                  desc: "Checks the SLSA provenance attestation. Confirms the builder identity and hermetic build status.",
                  tool: "slsa-verifier → in-toto attestation",
                },
              ].map((c) => (
                <div
                  key={c.n}
                  className="border border-hairline bg-canvas-panel p-5"
                >
                  <div className="mb-2 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.1em] text-ink-ghost">
                    <span className="text-ink-faint">{c.n}</span>
                    {c.label}
                  </div>
                  <div className="mb-2 font-display text-[16px] font-black leading-[1.15] tracking-[-0.02em] text-ink">
                    {c.title}
                  </div>
                  <div className="mb-3 font-body text-[12.5px] leading-[1.55] text-ink-softer">
                    {c.desc}
                  </div>
                  <div className="border-t border-hairline pt-2.5 font-mono text-[10.5px] text-ink-faint">
                    {c.tool}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(running || result !== null) && result !== "unknown" && (
          <div className="space-y-4">
            <TerminalBlock
              title="cosign verify · signature + identity"
              status={{
                tone: result === "verified" ? "ok" : result === "failing" ? "bad" : "running",
                label: result === "verified" ? "PASS" : result === "failing" ? "FAIL" : "RUNNING",
              }}
            >
              {running && <span className="text-ink-faint">connecting to Sigstore...</span>}
              {!running && apiResult && apiResult.status === "verified" && (
                <>
                  <span className="text-accent">$</span> cosign verify{" "}
                  <span className="text-blue">{apiResult.imageRef}</span>
                  {"\n\n"}
                  <span className="text-good">✓</span>{" "}
                  <span className="text-ink-ghost">signature verified via Sigstore</span>
                  {"\n"}
                  {apiResult.signerIdentity && (
                    <>
                      <span className="text-ink-faint">signer:</span>{" "}
                      <span className="text-ink-ghost">{apiResult.signerIdentity}</span>
                      {"\n"}
                    </>
                  )}
                  {apiResult.rekorLogIndex && (
                    <>
                      <span className="text-ink-faint">rekor log index:</span>{" "}
                      <span className="text-ink-ghost">{apiResult.rekorLogIndex}</span>
                      {"\n"}
                    </>
                  )}
                  {apiResult.resolvedDigest && (
                    <>
                      <span className="text-ink-faint">digest:</span>{" "}
                      <span className="text-ink-ghost">{apiResult.resolvedDigest.slice(0, 24)}…</span>
                    </>
                  )}
                </>
              )}
              {!running && apiResult && apiResult.status === "signed" && (
                <>
                  <span className="text-accent">$</span> cosign verify{" "}
                  <span className="text-blue">{apiResult.imageRef}</span>
                  {"\n\n"}
                  <span className="text-good">✓</span>{" "}
                  <span className="text-ink-ghost">
                    Sigstore signature found — image is signed but not in
                    Flareo&apos;s catalog
                  </span>
                  {"\n"}
                  {apiResult.signerIdentity && (
                    <>
                      <span className="text-ink-faint">signer:</span>{" "}
                      <span className="text-ink-ghost">{apiResult.signerIdentity}</span>
                      {"\n"}
                    </>
                  )}
                  {apiResult.signerIssuer && (
                    <>
                      <span className="text-ink-faint">issuer:</span>{" "}
                      <span className="text-ink-ghost">{apiResult.signerIssuer}</span>
                      {"\n"}
                    </>
                  )}
                  {apiResult.rekorLogIndex && (
                    <>
                      <span className="text-ink-faint">rekor index:</span>{" "}
                      <span className="text-ink-ghost">{apiResult.rekorLogIndex}</span>
                      {"\n"}
                    </>
                  )}
                  {apiResult.rekorUrl && (
                    <>
                      <span className="text-ink-faint">rekor entry:</span>{" "}
                      <a
                        href={apiResult.rekorUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent underline"
                      >
                        view in transparency log →
                      </a>
                      {"\n"}
                    </>
                  )}
                  {apiResult.resolvedDigest && (
                    <>
                      <span className="text-ink-faint">digest:</span>{" "}
                      <span className="text-ink-ghost">
                        {apiResult.resolvedDigest.slice(0, 24)}…
                      </span>
                      {"\n"}
                    </>
                  )}
                  {"\n"}
                  <span className="text-ink-faint">
                    we verified the signature exists. for full identity
                    chain validation, run{" "}
                    <span className="text-accent">cosign verify</span>{" "}
                    locally with the snippet below.
                  </span>
                </>
              )}
              {!running && apiResult && apiResult.status === "unsigned" && (
                <>
                  <span className="text-accent">$</span> cosign verify{" "}
                  <span className="text-blue">{apiResult.imageRef}</span>
                  {"\n\n"}
                  <span className="text-bad">✗</span>{" "}
                  <span className="text-ink-ghost">no Sigstore signature found for this image</span>
                  {"\n"}
                  <span className="text-ink-faint">
                    this image was pushed without cryptographic signing; trust is based on publisher reputation only
                  </span>
                </>
              )}
              {!running && apiResult && apiResult.status === "invalid" && (
                <>
                  <span className="text-accent">$</span> cosign verify{" "}
                  <span className="text-blue">{apiResult.imageRef}</span>
                  {"\n\n"}
                  <span className="text-bad">✗</span>{" "}
                  <span className="text-ink-ghost">signature present but rejected</span>
                  {apiResult.errorMessage && (
                    <>
                      {"\n"}
                      <span className="text-ink-faint">{apiResult.errorMessage}</span>
                    </>
                  )}
                </>
              )}
              {!running && apiResult && apiResult.status === "error" && (
                <>
                  <span className="text-accent">$</span> cosign verify{" "}
                  <span className="text-blue">{apiResult.imageRef}</span>
                  {"\n\n"}
                  <span className="text-bad">error:</span>{" "}
                  <span className="text-ink-ghost">{apiResult.errorMessage ?? "verification failed"}</span>
                </>
              )}
            </TerminalBlock>

            <TerminalBlock
              title="trivy image · cve + sbom scan"
              status={{
                tone: apiResult?.flareoModule
                  ? apiResult.flareoModule.cves.critical === 0 && apiResult.flareoModule.cves.high === 0
                    ? "ok"
                    : "bad"
                  : result === "verified"
                    ? "ok"
                    : result === "failing"
                      ? "bad"
                      : "running",
                label: apiResult?.flareoModule
                  ? `${apiResult.flareoModule.cves.critical + apiResult.flareoModule.cves.high + apiResult.flareoModule.cves.medium + apiResult.flareoModule.cves.low} FINDINGS`
                  : result === "verified"
                    ? "0 FINDINGS"
                    : result === "failing"
                      ? "NO SCAN"
                      : "RUNNING",
              }}
            >
              {running && <span className="text-ink-faint">scanning layers...</span>}
              {!running && apiResult?.flareoModule && (
                <>
                  <span className="text-ink-faint">critical:</span>{" "}
                  <span className={apiResult.flareoModule.cves.critical > 0 ? "text-bad" : "text-good"}>
                    {apiResult.flareoModule.cves.critical}
                  </span>
                  {"  "}
                  <span className="text-ink-faint">high:</span>{" "}
                  <span className={apiResult.flareoModule.cves.high > 0 ? "text-warn" : "text-good"}>
                    {apiResult.flareoModule.cves.high}
                  </span>
                  {"  "}
                  <span className="text-ink-faint">medium:</span>{" "}
                  <span className="text-ink-ghost">{apiResult.flareoModule.cves.medium}</span>
                  {"  "}
                  <span className="text-ink-faint">low:</span>{" "}
                  <span className="text-ink-ghost">{apiResult.flareoModule.cves.low}</span>
                  {"\n"}
                  {apiResult.flareoModule.scanUrl && (
                    <>
                      <span className="text-ink-faint">full report:</span>{" "}
                      <a href={apiResult.flareoModule.scanUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                        {apiResult.flareoModule.scanUrl.slice(0, 60)}…
                      </a>
                    </>
                  )}
                </>
              )}
              {!running && apiResult && !apiResult.flareoModule && apiResult.status === "signed" && (
                <span className="text-ink-faint">
                  scan data unavailable for images outside the Flareo catalog
                </span>
              )}
              {!running && apiResult && apiResult.status === "unsigned" && (
                <span className="text-ink-faint">
                  scan skipped; image is unsigned so we cannot attest to what we&apos;re scanning
                </span>
              )}
            </TerminalBlock>

            <TerminalBlock
              title="slsa-verifier · provenance attestation"
              status={{
                tone: apiResult?.flareoModule ? "ok" : result === "verified" ? "ok" : "running",
                label: apiResult?.flareoModule ? "L2 VERIFIED" : running ? "RUNNING" : "NO ATTEST",
              }}
            >
              {running && <span className="text-ink-faint">fetching attestation...</span>}
              {!running && apiResult?.flareoModule && (
                <>
                  <span className="text-good">✓</span>{" "}
                  <span className="text-ink-ghost">SLSA provenance attested</span>
                  {"\n"}
                  <span className="text-ink-faint">level:</span>{" "}
                  <span className="text-ink">L2</span>{" "}
                  <span className="text-ink-faint">(L3 pipeline coming Q3 2026)</span>
                  {"\n"}
                  {apiResult.flareoModule.sbomUrl && (
                    <>
                      <span className="text-ink-faint">sbom:</span>{" "}
                      <a href={apiResult.flareoModule.sbomUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                        {apiResult.flareoModule.sbomUrl.slice(0, 60)}…
                      </a>
                    </>
                  )}
                </>
              )}
              {!running && apiResult && !apiResult.flareoModule && (
                <span className="text-ink-faint">
                  no Flareo provenance to check; this is not a Flareo-published module
                </span>
              )}
            </TerminalBlock>
          </div>
        )}

        {result === "unknown" && (
          <div className="border border-hairline bg-canvas-deep p-8">
            <div className="mb-4 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.1em] text-warn">
              <span className="block h-1.5 w-1.5 rounded-full bg-warn" />
              {networkError ? "VERIFICATION ERROR" : "NOT IN CATALOG"}
            </div>
            <div className="mb-3 font-display text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-ink">
              {networkError ? "We couldn't complete this check." : "This digest isn't a Flareo module."}
            </div>
            <p className="max-w-[600px] font-body text-[13.5px] leading-[1.65] text-ink-softer">
              {networkError ? (
                <>
                  <span className="font-mono text-[12px] text-ink-mute">{networkError}</span>
                  <br />
                  <br />
                  You can always verify locally — the three commands in the &quot;Run Locally&quot; section below work
                  on any cosign-signed image.
                </>
              ) : (
                <>
                  We don&apos;t recognize this image. That&apos;s fine —{" "}
                  <span className="text-ink">you can still verify it yourself</span>
                  . The three commands in the &quot;Run Locally&quot; section below
                  work on any cosign-signed image, not just ours.
                </>
              )}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
