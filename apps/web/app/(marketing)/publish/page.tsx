import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Publish a module",
  description:
    "Third-party Dockerfile submissions are closed. Verify an image you already have instead.",
};

export default function PublishPage() {
  return (
    <>
      <PageHero
        eyebrow="PUBLISH / CLOSED"
        prompt="flareo verify <image>"
        promptComment="# submissions are closed — verify an image you already have"
        title={
          <>
            SUBMISSIONS
            <br />
            ARE CLOSED.
          </>
        }
      >
        Flareo no longer accepts third-party Dockerfiles for build and
        signing. The route stays so anyone who bookmarked it gets an
        honest explanation instead of a dead end.
      </PageHero>

      <section className="border-b border-hairline px-8 py-14">
        <div className="mx-auto max-w-[640px]">
          <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-warn">
            WHY
          </div>
          <h2 className="mb-4 font-display text-[28px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
            Building arbitrary Dockerfiles was the wrong trust boundary.
          </h2>
          <p className="mb-6 font-body text-[14.5px] leading-[1.65] text-ink-softer">
            Accepting an untrusted Dockerfile and signing the result put the
            signing identity one sandbox escape away from minting a
            Flareo-verified malicious image. An open build service is also an
            abuse magnet — free compute for cryptomining and staging — and an
            arbitrary Dockerfile (which can{" "}
            <code className="border border-hairline bg-canvas-deep px-1 py-0 font-mono text-[12px] text-accent">
              curl … | sh
            </code>
            ) contradicts reproducible builds. The full case is in the{" "}
            <Link
              href="/docs/threat-model"
              className="text-accent hover:text-accent-hot"
            >
              threat model
            </Link>
            .
          </p>

          <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            WHAT TO DO INSTEAD
          </div>
          <h2 className="mb-4 font-display text-[28px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
            Verify an image you already have.
          </h2>
          <p className="mb-8 font-body text-[14.5px] leading-[1.65] text-ink-softer">
            Flareo re-publishes pinned upstream images with signatures and
            receipts. Point{" "}
            <code className="border border-hairline bg-canvas-deep px-1.5 py-0.5 font-mono text-[13px] text-accent">
              flareo verify
            </code>{" "}
            at any public image — catalog or not — and check the Sigstore
            trail yourself.
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/verify"
              className="btn-chamfer bg-accent px-5 py-3 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
            >
              Open the verify tool
            </Link>
            <Link
              href="/docs/threat-model"
              className="border border-hairline px-5 py-3 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
            >
              Read the threat model
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
