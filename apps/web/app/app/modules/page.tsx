import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { listMyModules } from "@/lib/db/queries";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "My modules",
};

export const dynamic = "force-dynamic";

/**
 * My modules — the authenticated user's own published modules. Reads
 * `publisherId = userId` rows from Postgres. Shows a real zero-state
 * when the user hasn't published anything yet (most new users, at
 * least in early Horizon 1).
 */
export default async function MyModulesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // After redirect() (return type `never`), TS may not narrow
  // `session.user`. Capture the non-null user as a const.
  const sessionUser = session!.user!;

  const modules = await listMyModules(sessionUser.id);

  return (
    <>
      <ViewHeader
        eyebrow="MY MODULES"
        title="Modules you publish."
        subtitle={
          modules.length === 0
            ? "You haven't published anything yet. Once you do, every module you own shows up here with its rebuild history and scan receipts."
            : "All your submitted modules, public and private. Click any row for the full receipt or rebuild history."
        }
        actions={
          <Link
            href="/app/publish"
            className="bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
          >
            Publish new module
          </Link>
        }
      />

      {modules.length === 0 ? (
        <section className="px-7 py-14">
          <div className="mx-auto max-w-[560px] border border-dashed border-hairline bg-canvas-deep p-8 text-center">
            <div className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-accent">
              NO MODULES YET
            </div>
            <h2 className="mb-3 font-display text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-ink">
              Publish your first module.
            </h2>
            <p className="mb-6 font-body text-[13px] leading-[1.55] text-ink-softer">
              Point Flareo at a public git repo with a Dockerfile.
              We&apos;ll rebuild it from source, scan it for CVEs, sign
              it with Sigstore, and publish it to the catalog. You keep
              attribution; we handle the supply-chain plumbing.
            </p>
            <div className="flex justify-center gap-2">
              <Link
                href="/app/publish"
                className="bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
              >
                Start publishing →
              </Link>
              <Link
                href="/docs/publishing"
                className="border border-hairline px-4 py-2 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
              >
                Read the guide
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-7 py-7">
          <div className="border border-hairline bg-canvas-deep">
            <div className="grid grid-cols-[2fr_80px_80px_100px_120px_100px] gap-4 border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint">
              <div>MODULE</div>
              <div className="text-center">TRUST</div>
              <div className="text-center">VIS</div>
              <div className="text-right">PULLS · 30D</div>
              <div className="text-right">LAST BUILD</div>
              <div className="text-right">STATE</div>
            </div>

            {modules.map((m, i) => (
              <Link
                key={m.slug}
                href={`/modules/${m.slug}`}
                className={`grid grid-cols-[2fr_80px_80px_100px_120px_100px] items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas-panel ${
                  i < modules.length - 1 ? "border-b border-hairline" : ""
                }`}
              >
                <div>
                  <div className="mb-1 flex items-baseline gap-3">
                    <span className="font-display text-[17px] font-black leading-[1] tracking-[-0.02em] text-ink">
                      {m.name}
                    </span>
                    <span className="font-mono text-[10px] text-ink-mute">
                      v{m.version}
                    </span>
                  </div>
                  <div className="font-body text-[12px] text-ink-softer">
                    {m.description}
                  </div>
                </div>
                <div
                  className={`text-center font-display text-[22px] font-black leading-[1] tracking-[-0.03em] ${
                    m.trust >= 90
                      ? "text-good"
                      : m.trust >= 70
                      ? "text-warn"
                      : "text-bad"
                  }`}
                >
                  {m.trust}
                </div>
                <div className="text-center">
                  <span
                    className={`inline-block border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] ${
                      m.visibility === "public"
                        ? "border-good text-good"
                        : "border-warn text-warn"
                    }`}
                  >
                    {m.visibility.toUpperCase()}
                  </span>
                </div>
                <div className="text-right font-mono text-[12px] text-ink-mute">
                  {m.pulls30d.toLocaleString()}
                </div>
                <div className="text-right font-mono text-[11px] text-ink-softer">
                  {m.updatedHours}h ago
                </div>
                <div className="text-right">
                  {m.building ? (
                    <StatusBadge tone="running" pulse>
                      BUILDING
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="ok">READY</StatusBadge>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex justify-between font-mono text-[10.5px] tracking-[0.04em] text-ink-softer">
            <span>
              Total:{" "}
              <span className="text-ink">{modules.length}</span> module
              {modules.length === 1 ? "" : "s"}
            </span>
          </div>
        </section>
      )}
    </>
  );
}
