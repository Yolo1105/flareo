import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import { countsBySlug } from "@/lib/db/vex";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";

export const metadata: Metadata = {
  title: "VEX annotations · admin",
};

export const dynamic = "force-dynamic";

/**
 * /app/admin/vex — VEX annotation entry point.
 *
 * Lists every public module with its current annotation coverage —
 * how many of its Trivy findings have a VEX statement attached vs
 * how many remain unannotated. Click a module to drill into its
 * per-CVE annotation surface.
 *
 * Reviewer-only: the underlying writes go through requireAdmin in
 * the API endpoints. Page-level requireAdminPage applies the same
 * gate at the page render layer for redirect-on-non-admin behavior.
 */
export default async function AdminVexIndexPage() {
  await requireAdminPage();

  const moduleRows = (await prisma.module.findMany({
    where: { visibility: "public" } as never,
    orderBy: { trust: "desc" } as never,
  })) as ModuleShape[];

  // Single groupBy query for annotation counts across all modules.
  // Faster than the per-module fan-out we used to do, and scales to
  // a catalog of any size without changing this page's load time.
  const annotationMap = await countsBySlug();

  const modules = moduleRows.map(shapeToModule);

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN · VEX"
        title="VEX annotations"
        subtitle="Mark Trivy findings as not-affected, fixed, or under investigation. Statements roll up into a downloadable OpenVEX 0.2.0 document for each module."
      />

      <div className="border-b border-hairline bg-canvas-deep px-8 py-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-[11px] text-ink-faint">
          <span>
            <span className="text-ink-ghost">MODULES INDEXED:</span>{" "}
            <span className="text-ink">{modules.length}</span>
          </span>
          <span>
            <span className="text-ink-ghost">TOTAL ANNOTATIONS:</span>{" "}
            <span className="text-ink">
              {Array.from(annotationMap.values()).reduce((s, n) => s + n, 0)}
            </span>
          </span>
          <span>
            <span className="text-ink-ghost">SPEC:</span>{" "}
            <a
              href="https://openvex.dev/ns/v0.2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hot"
            >
              OpenVEX 0.2.0 →
            </a>
          </span>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {modules.map((m) => {
            const annotated = annotationMap.get(m.slug) ?? 0;
            const trivyTotal =
              m.cves.critical + m.cves.high + m.cves.medium + m.cves.low;
            const coveragePct =
              trivyTotal === 0
                ? 100
                : Math.round((annotated / trivyTotal) * 100);
            return (
              <Link
                key={m.slug}
                href={`/app/admin/vex/${m.slug}`}
                className="group flex items-start justify-between gap-4 border border-hairline bg-canvas-deep p-5 transition-colors hover:border-accent"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 font-mono text-[10.5px] tracking-[0.04em] text-ink-faint">
                    {m.author} / v{m.version}
                  </div>
                  <h3 className="mb-2 truncate font-display text-[18px] font-black tracking-[-0.02em] text-ink group-hover:text-accent">
                    {m.name}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-mute">
                    <span>
                      <span className="text-ink-ghost">trivy:</span>{" "}
                      {trivyTotal} findings
                    </span>
                    <span>
                      <span className="text-ink-ghost">vex:</span>{" "}
                      {annotated} annotated
                    </span>
                    <span>
                      <span className="text-ink-ghost">coverage:</span>{" "}
                      <span
                        className={
                          coveragePct >= 80
                            ? "text-good"
                            : coveragePct >= 40
                              ? "text-warn"
                              : "text-ink-mute"
                        }
                      >
                        {coveragePct}%
                      </span>
                    </span>
                  </div>
                </div>
                <span className="shrink-0 self-center font-mono text-[10.5px] text-accent group-hover:text-accent-hot">
                  annotate →
                </span>
              </Link>
            );
          })}
        </div>

        {modules.length === 0 && (
          <div className="border border-dashed border-hairline bg-canvas-deep p-8 text-center font-body text-[13px] text-ink-softer">
            No public modules to annotate yet. Modules appear here once
            they pass admin review and are listed in the catalog.
          </div>
        )}
      </div>
    </>
  );
}
