import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { listAllFeaturedAdmin } from "@/lib/db/curation";
import { FeaturedEditor } from "@/components/sections/app-admin/FeaturedEditor";

export const metadata: Metadata = {
  title: "Featured curation · admin",
};

export const dynamic = "force-dynamic";

/**
 * Admin curator page for the catalog Featured strip.
 *
 * Shows every ModuleFeatured row (active + expired), grouped into
 * "active" (visible to public) and "expired" (past expiresAt). Each
 * row renders as an editable card via FeaturedEditor.
 *
 * A separate section at the bottom lets the admin add a new feature
 * by picking any public module slug from the available list.
 */
export default async function AdminFeaturedPage() {
  await requireAdminPage();

  const features = await listAllFeaturedAdmin();
  const now = Date.now();
  const active = features.filter(
    (f) => !f.expiresAt || new Date(f.expiresAt).getTime() > now,
  );
  const expired = features.filter(
    (f) => f.expiresAt && new Date(f.expiresAt).getTime() <= now,
  );

  // Pool of addable modules — public, verified, not currently featured.
  const featuredSlugs = new Set(features.map((f) => f.module.slug));
  const poolRows = (await prisma.module.findMany({
    where: {
      visibility: "public",
    } as never,
    orderBy: { name: "asc" } as never,
    select: {
      slug: true,
      name: true,
      version: true,
      trust: true,
    } as never,
  })) as Array<{
    slug: string;
    name: string;
    version: string;
    trust: number;
  }>;
  const pool = poolRows.filter((p) => !featuredSlugs.has(p.slug));

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN · FEATURED CURATION"
        title="Catalog Featured strip"
        subtitle={`${active.length} active · ${expired.length} expired. Up to 6 modules render publicly; additional rows beyond 6 are kept but hidden until a slot frees.`}
        actions={
          <Link
            href="/app/admin"
            className="border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink-softer hover:text-ink"
          >
            ← back to queue
          </Link>
        }
      />

      <div className="space-y-8 px-7 py-7">
        {/* Add-new pane */}
        <section className="border border-hairline bg-canvas-deep p-5">
          <h2 className="mb-4 font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
            ADD A FEATURE
          </h2>
          {pool.length === 0 ? (
            <p className="font-body text-[13px] text-ink-softer">
              Every public module is already featured. Remove one to
              free up a slot.
            </p>
          ) : (
            <FeaturedEditor
              mode="create"
              pool={pool}
              defaultPosition={active.length + 1}
            />
          )}
        </section>

        {/* Active features */}
        {active.length > 0 && (
          <section>
            <h2 className="mb-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
              ACTIVE · {active.length}
            </h2>
            <div className="space-y-3">
              {active.map((f) => (
                <FeaturedEditor
                  key={f.id}
                  mode="edit"
                  item={f}
                />
              ))}
            </div>
          </section>
        )}

        {/* Expired features */}
        {expired.length > 0 && (
          <section>
            <h2 className="mb-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-faint">
              EXPIRED · {expired.length}
            </h2>
            <div className="space-y-3">
              {expired.map((f) => (
                <FeaturedEditor
                  key={f.id}
                  mode="edit"
                  item={f}
                  expired
                />
              ))}
            </div>
          </section>
        )}

        {features.length === 0 && (
          <div className="border border-dashed border-hairline bg-canvas-deep px-6 py-10 text-center font-body text-[13px] text-ink-ghost">
            No modules are currently featured. Pick one above to start
            curating the Featured strip.
          </div>
        )}
      </div>
    </>
  );
}
