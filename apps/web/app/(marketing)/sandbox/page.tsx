import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sandbox",
  description:
    "Hosted shared preview sandboxes have been discontinued. Run verified modules locally from the catalog.",
};

export default function SandboxPage() {
  return (
    <>
      <PageHero
        eyebrow="SANDBOX / DISCONTINUED"
        prompt="flareo run <module>"
        promptComment="# local only — hosted demos are gone"
        title={
          <>
            HOSTED PREVIEWS
            <br />
            ARE GONE.
          </>
        }
      >
        Shared demo instances and the live sandbox UI are{" "}
        <span className="text-ink">discontinued</span>. There is no click-to-try
        VM at a Flareo subdomain anymore. To evaluate a module, open it in the{" "}
        <Link href="/catalog" className="text-accent hover:underline">
          catalog
        </Link>
        , copy the pinned digest and compose snippet from the module page, and
        run it on your own machine.
      </PageHero>

      <section className="border-b border-hairline px-8 py-14">
        <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          <span className="text-ink-ghost">§</span> WHAT TO DO INSTEAD
        </div>
        <h2 className="mb-3 font-display text-[28px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
          Run the verified image locally.
        </h2>
        <p className="mb-6 max-w-[640px] font-body text-[14px] leading-[1.65] text-ink-softer">
          Each module page ships a compose snippet pinned to the digest Flareo
          verified. That is the replacement for the old shared preview box —
          same image, on your substrate, with your data staying local.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="btn-chamfer bg-accent px-4 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
          >
            Browse the catalog
          </Link>
          <Link
            href="/docs/install"
            className="border border-hairline bg-transparent px-4 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
          >
            Install the CLI
          </Link>
          <Link
            href="/docs/previews"
            className="border border-hairline bg-transparent px-4 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
          >
            Preview docs note
          </Link>
        </div>
      </section>
    </>
  );
}
