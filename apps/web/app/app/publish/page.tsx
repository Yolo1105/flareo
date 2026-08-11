import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";

export const metadata: Metadata = {
  title: "Publish",
};

export const dynamic = "force-dynamic";

export default async function AppPublishPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <ViewHeader
        eyebrow="PUBLISH"
        title="Submissions are closed."
        subtitle="Flareo no longer builds and signs arbitrary Dockerfiles from third parties. Use flareo verify on an image you already have."
      />
      <div className="px-7 py-8">
        <div className="max-w-[640px]">
          <div className="mb-6 border border-warn/50 bg-warn/[0.04] p-5">
            <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-warn">
              WHY THE PIPELINE WAS RETIRED
            </div>
            <p className="font-body text-[13px] leading-[1.65] text-ink-softer">
              Building untrusted Dockerfiles put the signing identity one
              sandbox escape from minting a Flareo-verified malicious image.
              An open build service is also an abuse magnet, and an arbitrary
              Dockerfile contradicts reproducible builds. Details in the{" "}
              <Link
                href="/docs/threat-model"
                className="text-accent hover:text-accent-hot"
              >
                threat model
              </Link>
              .
            </p>
          </div>

          <p className="mb-6 font-body text-[13.5px] leading-[1.65] text-ink-softer">
            Instead, run{" "}
            <code className="border border-hairline bg-canvas-deep px-1.5 py-0.5 font-mono text-[12px] text-accent">
              flareo verify &lt;image&gt;
            </code>{" "}
            against a public image reference — or use the web tool.
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/verify"
              className="bg-accent px-4 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
            >
              Open the verify tool
            </Link>
            <Link
              href="/docs/threat-model"
              className="border border-hairline px-4 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
            >
              Read the threat model
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
