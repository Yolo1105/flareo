import type { Module } from "@/lib/types";
import type {
  CosignSignatureShape,
  RekorEntryShape,
} from "@/lib/data/pipeline-artifacts";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StageShell } from "./StageShell";

interface Props {
  module: Module;
  signature: CosignSignatureShape;
  rekor: RekorEntryShape;
}

export function Stage06Cosign({ module, signature, rekor }: Props) {
  return (
    <StageShell
      number="06"
      anchorId="stage-cosign"
      title="cosign keyless · OIDC → Fulcio → Rekor"
      subtitle="The image digest is signed with a short-lived certificate issued by Sigstore's Fulcio CA, identity-bound to the GitHub Actions OIDC token of the canary build job. The signature is logged to Rekor — a public tamper-evident transparency log. There are no long-lived signing keys to leak."
      status="built"
      durationLabel="≈ 0.8-1.1s sign time"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            COSIGN SIGNATURE
          </div>
          <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 font-mono text-[11px]">
            <dt className="text-ink-faint">type</dt>
            <dd className="text-ink">keyless · OIDC</dd>
            <dt className="text-ink-faint">issuer</dt>
            <dd className="break-all text-ink-mute">
              {signature.identity.issuer
                .replace("https://", "")
                .slice(0, 40)}
            </dd>
            <dt className="text-ink-faint">subject</dt>
            <dd className="break-all text-ink-mute">
              {signature.identity.subject.split("/").slice(-3).join("/")}
            </dd>
          </dl>
          <pre className="mt-3 overflow-x-auto bg-canvas-panel p-3 font-mono text-[10px] text-ink-mute">
            {signature.signature.slice(0, 56)}…
          </pre>
        </div>

        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            REKOR TRANSPARENCY LOG
          </div>
          <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 font-mono text-[11px]">
            <dt className="text-ink-faint">log index</dt>
            <dd className="text-ink">
              {rekor.logIndex.toLocaleString()}
            </dd>
            <dt className="text-ink-faint">uuid</dt>
            <dd className="break-all text-accent">
              {rekor.uuid.slice(0, 32)}…
            </dd>
            <dt className="text-ink-faint">integrated</dt>
            <dd className="text-ink-mute">
              {rekor.integratedTime.replace("T", " ").slice(0, 19)}Z
            </dd>
            <dt className="text-ink-faint">type</dt>
            <dd className="text-ink">{rekor.body.kind}</dd>
          </dl>
          <a
            href={rekor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-mono text-[10.5px] text-accent hover:text-accent-hot"
          >
            view on rekor.sigstore.dev →
          </a>
        </div>
      </div>

      <TerminalBlock
        title="cosign verify · what your machine sees"
        status={{ tone: "ok", label: "VERIFIED" }}
      >
        <pre className="overflow-x-auto p-5 font-mono text-[11px] leading-[1.7] text-ink-mute">
{`$ cosign verify ghcr.io/flareo/${module.slug} \\
    --certificate-identity ${signature.identity.subject} \\
    --certificate-oidc-issuer ${signature.identity.issuer}

Verification for ghcr.io/flareo/${module.slug} --
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - Existence of the claims in the transparency log was verified offline
  - The code-signing certificate was verified using trusted certificate authority certificates

[
  {
    "critical": {
      "identity": {
        "docker-reference": "ghcr.io/flareo/${module.slug}"
      },
      "image": {
        "docker-manifest-digest": "${module.digest}"
      },
      "type": "cosign container image signature"
    },
    "optional": {
      "Bundle": { "SignedEntryTimestamp": "...", "Payload": { "logIndex": ${rekor.logIndex} } }
    }
  }
]`}
        </pre>
      </TerminalBlock>
    </StageShell>
  );
}
