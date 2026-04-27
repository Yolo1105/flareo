import Link from "next/link";
import type { Module } from "@/lib/types";
import type { PublishReceiptShape } from "@/lib/data/pipeline-artifacts";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StageShell } from "./StageShell";

interface Props {
  module: Module;
  receipt: PublishReceiptShape;
}

export function Stage08Publish({ module, receipt }: Props) {
  return (
    <StageShell
      number="08"
      anchorId="stage-publish"
      title="Admin review → publish"
      subtitle="Once the cryptographic checks pass and the policy gate (or, today, the human reviewer using the policy gate's signals) clears the module, the image is pushed to the public registry, listed on the marketplace, and added to the daily canary rebuild chain. Submitter and any subscribers get the published-with-receipt email."
      status="built"
      durationLabel="≈ 4-7s push time"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            REGISTRY
          </div>
          <dl className="grid grid-cols-[100px_1fr] gap-y-1.5 font-mono text-[11px]">
            <dt className="text-ink-faint">registry</dt>
            <dd className="text-ink">{receipt.registry}</dd>
            <dt className="text-ink-faint">image</dt>
            <dd className="text-ink">{receipt.imageRef}</dd>
            <dt className="text-ink-faint">tag</dt>
            <dd className="text-accent">{receipt.tag}</dd>
            <dt className="text-ink-faint">digest</dt>
            <dd className="break-all text-ink-mute">
              {receipt.digest.slice(0, 24)}…
            </dd>
            <dt className="text-ink-faint">pushed</dt>
            <dd className="text-ink-mute">
              {receipt.pushedAt.replace("T", " ").slice(0, 19)}Z
            </dd>
          </dl>
        </div>

        <div className="border border-hairline bg-canvas-deep p-4">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            POST-PUBLISH SIDE EFFECTS
          </div>
          <ul className="space-y-2 font-body text-[12.5px] leading-[1.6] text-ink-softer">
            <li className="flex items-start gap-2">
              <span className="text-good">✓</span>
              Listed in the public catalog and marketplace
            </li>
            <li className="flex items-start gap-2">
              <span className="text-good">✓</span>
              Added to the daily canary rebuild chain
            </li>
            <li className="flex items-start gap-2">
              <span className="text-good">✓</span>
              Submitter notified by email with the receipt URL
            </li>
            <li className="flex items-start gap-2">
              <span className="text-good">✓</span>
              First trust score computed and published
            </li>
            <li className="flex items-start gap-2">
              <span className="text-good">✓</span>
              SBOM indexed for cross-module CVE rebuild triggers
            </li>
          </ul>
        </div>
      </div>

      <TerminalBlock
        title={`docker push · ghcr.io/flareo/${module.slug}:${module.version}`}
        status={{ tone: "ok", label: "PUSHED · CATALOG UPDATED" }}
      >
        <pre className="overflow-x-auto p-5 font-mono text-[11px] leading-[1.7] text-ink-mute">
{`The push refers to repository [${receipt.imageRef}]
${module.digest.slice(7, 19)}: Pushed
${module.digest.slice(19, 31)}: Layer already exists
${module.digest.slice(31, 43)}: Layer already exists
${module.digest.slice(43, 55)}: Pushed
${module.digest.slice(55, 64)}: Pushed
${module.version}: digest: ${module.digest} size: 1638

[catalog] flareo/${module.slug}@${module.version} → public
[canary]  added to rebuild chain · next run in 23h
[email]   sent to ${module.author} <…> · receipt at ${receipt.marketplaceUrl}`}
        </pre>
      </TerminalBlock>

      <div className="border border-hairline bg-canvas-panel p-5 text-center">
        <div className="mb-2 font-display text-[20px] font-black tracking-[-0.025em] text-ink">
          The module is now live.
        </div>
        <p className="mx-auto mb-4 max-w-[480px] font-body text-[12.5px] text-ink-softer">
          Pull it from the registry, browse it in the marketplace, or read the
          full receipt chain from this submission's perspective.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href={`/modules/${module.slug}`}
            className="border border-accent bg-accent px-4 py-2 font-body text-[12.5px] font-medium text-canvas hover:bg-accent-hot"
          >
            View module page →
          </Link>
          <Link
            href="/marketplace"
            className="border border-hairline bg-canvas-deep px-4 py-2 font-body text-[12.5px] font-medium text-ink hover:border-accent"
          >
            Back to marketplace
          </Link>
        </div>
      </div>
    </StageShell>
  );
}
