import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MODULES } from "@/lib/data/modules";
import { getModuleBySlug } from "@/lib/db/queries";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { SandboxCountdown } from "@/components/interactive/SandboxCountdown";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Build-time path discovery only — not live catalog state.
  return MODULES.filter((m) => m.previewable).map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const m = await getModuleBySlug(slug);
    return { title: m ? `${m.name.toLowerCase()} preview` : "Preview" };
  } catch (err) {
    console.error(`[preview/${slug}] metadata: database unreachable`, err);
    return { title: "Preview" };
  }
}

export default async function ModulePreviewPage({ params }: Props) {
  const { slug } = await params;
  let module = null;
  try {
    module = await getModuleBySlug(slug);
  } catch (err) {
    console.error(`[preview/${slug}] database unreachable`, err);
  }
  if (!module) notFound();
  // After notFound() (return type `never`), capture narrowed module.
  const moduleSafe = module!;
  if (!moduleSafe.previewable) {
    return (
      <>
        <ViewHeader
          eyebrow="PREVIEW"
          title="This module isn't previewable."
          subtitle="Multi-service modules and anything needing external state can't run in a single-VM sandbox. Use the module detail page for the compose file."
        />
        <div className="px-7 py-7">
          <div className="border border-warn/40 bg-canvas-deep p-6 text-center">
            <div className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-warn">
              NO PREVIEW AVAILABLE
            </div>
            <p className="mb-4 font-body text-[13px] text-ink-softer">
              {moduleSafe.name.toLowerCase()} requires paired services that
              don&apos;t fit in a disposable sandbox.
            </p>
            <Link
              href={`/modules/${moduleSafe.slug}`}
              className="inline-block border border-hairline px-4 py-2 font-body text-[12px] text-ink transition-colors hover:border-ink-ghost"
            >
              Go to module detail →
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ViewHeader
        eyebrow={`PREVIEW · ${moduleSafe.id}`}
        title={
          <>
            {moduleSafe.name.toLowerCase()}
            <span className="ml-2 font-mono text-[20px] font-normal tracking-[0.02em] text-ink-mute">
              @{moduleSafe.version}
            </span>
          </>
        }
        subtitle="Live sandbox session running on an isolated Firecracker microVM. Auto-destroys when the countdown hits zero."
        actions={
          <Link
            href={`/modules/${moduleSafe.slug}`}
            className="border border-hairline px-4 py-2 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
          >
            Module detail →
          </Link>
        }
      />

      {/* Session telemetry */}
      <section className="grid grid-cols-5 border-b border-hairline bg-canvas-panel font-mono text-[11px]">
        <div className="border-r border-hairline px-5 py-3">
          <div className="mb-1 text-[9.5px] tracking-[0.14em] text-ink-ghost">SESSION ID</div>
          <div className="text-ink">s-a4f2k1-b8c9</div>
        </div>
        <div className="border-r border-hairline px-5 py-3">
          <div className="mb-1 text-[9.5px] tracking-[0.14em] text-ink-ghost">DIGEST</div>
          <div className="text-blue">{moduleSafe.digest.slice(0, 18)}...</div>
        </div>
        <div className="border-r border-hairline px-5 py-3">
          <div className="mb-1 text-[9.5px] tracking-[0.14em] text-ink-ghost">REGION</div>
          <div className="text-ink">fra1 · eu-central</div>
        </div>
        <div className="border-r border-hairline px-5 py-3">
          <div className="mb-1 text-[9.5px] tracking-[0.14em] text-ink-ghost">STATE</div>
          <div className="flex items-center gap-1.5 text-good">
            <span className="block h-1.5 w-1.5 rounded-full bg-good meta-pulse" />
            HEALTHY
          </div>
        </div>
        <div className="bg-accent/[0.08] border-l border-accent px-5 py-3">
          <div className="mb-1 text-[9.5px] tracking-[0.14em] text-accent">DESTROYS IN</div>
          <div className="text-[15px] font-medium text-accent">
            <SandboxCountdown />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[1fr_320px] gap-0">
        {/* Left: preview iframe mock */}
        <section className="border-r border-hairline px-7 py-7">
          <div className="overflow-hidden border border-hairline bg-canvas-deep">
            <div className="flex items-center gap-3 border-b border-hairline bg-canvas-panel px-4 py-2.5">
              <div className="flex gap-[5px]">
                <span className="block h-2 w-2 rounded-full bg-accent" />
                <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
                <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
              </div>
              <div className="flex-1 border border-hairline bg-canvas px-3 py-1 font-mono text-[11px] text-ink-mute">
                <span className="text-ink-ghost">https://</span>
                <span className="text-accent">s-a4f2k1-b8c9.preview.flareo.sh</span>
                <span className="text-ink-mute">/</span>
              </div>
              <div className="flex items-center gap-1.5 border border-good px-2 py-0.5 font-mono text-[9.5px] tracking-[0.1em] text-good">
                <span className="block h-1 w-1 rounded-full bg-good meta-pulse" />
                LIVE
              </div>
            </div>

            {/* Mock preview body — keep it minimal & generic so it works for any previewable module */}
            <div
              className="min-h-[440px] p-16 text-center"
              style={{ background: "#111", fontFamily: "system-ui, sans-serif" }}
            >
              <div
                className="mx-auto mb-6 flex h-14 w-14 items-center justify-center text-xl font-bold text-white"
                style={{
                  background: "#3A5AFA",
                  clipPath:
                    "polygon(50% 0, 100% 20%, 100% 65%, 50% 100%, 0 65%, 0 20%)",
                }}
              >
                {moduleSafe.name[0]}
              </div>
              <div
                className="mb-2 text-[22px] font-bold"
                style={{ color: "#EAEAEA" }}
              >
                {moduleSafe.name.toLowerCase()}
              </div>
              <div className="mb-8 text-[14px]" style={{ color: "#B8B8B8" }}>
                Running inside a disposable sandbox
              </div>
              <button
                className="w-full max-w-[300px] bg-blue-600 py-2.5 text-[14px] font-medium text-white"
                style={{ background: "#3A5AFA" }}
              >
                Open interface
              </button>
              <div className="mt-6 text-[11px]" style={{ color: "#666" }}>
                This is a mock — the real sandbox iframes the running
                container.
              </div>
            </div>

            {/* Resource footer */}
            <div className="flex items-center justify-between border-t border-hairline bg-canvas-panel px-4 py-2.5 font-mono text-[10.5px] text-ink-faint">
              <div className="flex gap-4">
                <span>
                  <span className="text-ink-ghost">cpu:</span>{" "}
                  <span className="text-ink-mute">4.2%</span>
                </span>
                <span>
                  <span className="text-ink-ghost">mem:</span>{" "}
                  <span className="text-ink-mute">82 / 512 MB</span>
                </span>
                <span>
                  <span className="text-ink-ghost">egress:</span>{" "}
                  <span className="text-warn">isolated</span>
                </span>
              </div>
              <span className="text-good">image verified ✓</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="border border-hairline bg-transparent px-4 py-2 font-body text-[12px] font-medium text-warn transition-colors hover:border-warn hover:bg-warn/[0.06]"
            >
              End session
            </button>
            <button
              type="button"
              className="bg-accent px-4 py-2 font-body text-[12px] font-medium text-canvas transition-colors hover:bg-accent-hot"
            >
              Export compose &amp; leave
            </button>
          </div>
        </section>

        {/* Right: info rail */}
        <section className="px-6 py-7">
          <div className="mb-5">
            <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              § MODULE
            </div>
            <div className="border border-hairline bg-canvas-deep p-4">
              <div className="mb-1 font-display text-[17px] font-black leading-[1.1] tracking-[-0.02em] text-ink">
                {moduleSafe.name.toLowerCase()}
              </div>
              <div className="mb-3 font-mono text-[10.5px] text-ink-faint">
                v{moduleSafe.version} · {moduleSafe.slsa} · trust {moduleSafe.trust}
              </div>
              <p className="font-body text-[12px] leading-[1.55] text-ink-softer">
                {moduleSafe.description}
              </p>
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              § LIMITS
            </div>
            <ul className="space-y-2 font-body text-[12px] leading-[1.55] text-ink-softer">
              <li>
                <span className="text-warn">×</span> Not persistent — wipes at
                countdown zero
              </li>
              <li>
                <span className="text-warn">×</span> Not private — link-based
                access
              </li>
              <li>
                <span className="text-warn">×</span> Not a deploy target
              </li>
              <li>
                <span className="text-good">✓</span> Full container API
                available
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              § UNDER THE HOOD
            </div>
            <ul className="space-y-2 font-mono text-[10.5px] leading-[1.6] text-ink-softer">
              <li>
                <span className="text-ink-ghost">VM:</span>{" "}
                <span className="text-ink-mute">Firecracker · 512MB · 1 vCPU</span>
              </li>
              <li>
                <span className="text-ink-ghost">Routing:</span>{" "}
                <span className="text-ink-mute">Caddy reverse proxy</span>
              </li>
              <li>
                <span className="text-ink-ghost">TTL:</span>{" "}
                <span className="text-ink-mute">30 min hard cap</span>
              </li>
              <li>
                <span className="text-ink-ghost">Egress:</span>{" "}
                <span className="text-ink-mute">deny-all</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
