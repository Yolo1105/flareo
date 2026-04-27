import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import {
  getActivePolicy,
  listRevisions,
  verdictCounts,
  getVerdict,
} from "@/lib/db/policy";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { PolicyEditor } from "@/components/sections/app-admin/PolicyEditor";

export const metadata: Metadata = {
  title: "Admission policy · admin",
};

export const dynamic = "force-dynamic";

/**
 * /app/admin/policy — admission policy management.
 *
 * Three sections:
 *
 *   1. Active policy — JSON editor with save-as-new-revision flow
 *   2. Verdict overview — pass/warn/fail counts across the catalog
 *      with a per-module table for drill-down
 *   3. Revision history — every saved policy revision with author,
 *      timestamp, and notes (audit trail)
 *
 * Policy edits never modify an existing row — every save creates a
 * new revision. The "active" policy is just `MAX(revision)`.
 */
export default async function AdminPolicyPage() {
  await requireAdminPage();

  const [active, revisions, counts, moduleRows] = await Promise.all([
    getActivePolicy(),
    listRevisions(20),
    verdictCounts(),
    prisma.module.findMany({
      where: { visibility: "public" } as never,
      orderBy: { trust: "desc" } as never,
    }) as Promise<ModuleShape[]>,
  ]);

  // Per-module verdicts. Single round-trip-per-module here is fine
  // because the catalog is small at launch — for scale, swap to a
  // single `findMany` over ModulePolicyVerdict and build a map.
  const modules = moduleRows.map(shapeToModule);
  const verdictByModule = new Map<
    string,
    { verdict: "pass" | "warn" | "fail"; revision: number } | null
  >();
  await Promise.all(
    modules.map(async (m) => {
      const v = await getVerdict(m.slug);
      verdictByModule.set(
        m.slug,
        v ? { verdict: v.verdict, revision: v.policyRevision } : null,
      );
    }),
  );

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN · POLICY"
        title="Admission policy"
        subtitle={`Revision ${active.revision} ${
          active.revision === 0 ? "(default; no admin save yet)" : ""
        } · ${active.policy.rules.length} rules · ${modules.length} modules evaluated`}
      />

      {/* Verdict overview strip */}
      <div className="border-b border-hairline bg-canvas-deep px-8 py-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-[11px] text-ink-faint">
          <span>
            <span className="text-ink-ghost">PASS:</span>{" "}
            <span className="text-good">{counts.pass}</span>
          </span>
          <span>
            <span className="text-ink-ghost">WARN:</span>{" "}
            <span className="text-warn">{counts.warn}</span>
          </span>
          <span>
            <span className="text-ink-ghost">FAIL:</span>{" "}
            <span className="text-bad">{counts.fail}</span>
          </span>
          <span>
            <span className="text-ink-ghost">UNEVALUATED:</span>{" "}
            <span className="text-ink-mute">
              {modules.length - (counts.pass + counts.warn + counts.fail)}
            </span>
          </span>
          <span className="ml-auto">
            <a
              href="/api/v1/modules/vaultwarden/policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hot"
            >
              public verdict API spec →
            </a>
          </span>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Editor section */}
        <section className="mb-12">
          <h2 className="mb-3 font-display text-[20px] font-black tracking-[-0.02em] text-ink">
            § ACTIVE POLICY
          </h2>
          <p className="mb-4 max-w-[760px] font-body text-[13px] leading-[1.6] text-ink-softer">
            Edit the JSON below and save as a new revision. The active
            policy is always the most recent revision; older ones stay
            in the audit trail. After saving, run a verdict regenerate
            to recompute results across every module.
          </p>
          <PolicyEditor
            initialPolicyJson={JSON.stringify(active.policy, null, 2)}
            initialRevision={active.revision}
            initialNotes={active.notes}
          />
        </section>

        {/* Per-module verdict table */}
        <section className="mb-12">
          <h2 className="mb-3 font-display text-[20px] font-black tracking-[-0.02em] text-ink">
            § PER-MODULE VERDICTS
          </h2>
          <div className="border border-hairline bg-canvas-deep">
            <div className="grid grid-cols-[1fr_120px_120px_120px] gap-4 border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[10px] tracking-[0.12em] text-ink-faint">
              <div>MODULE</div>
              <div>TRUST</div>
              <div>VERDICT</div>
              <div>REVISION</div>
            </div>
            {modules.map((m) => {
              const v = verdictByModule.get(m.slug);
              return (
                <Link
                  key={m.slug}
                  href={`/api/v1/modules/${m.slug}/policy`}
                  target="_blank"
                  className="grid grid-cols-[1fr_120px_120px_120px] gap-4 border-b border-hairline px-5 py-3 font-mono text-[12px] text-ink-mute transition-colors last:border-b-0 hover:bg-canvas-panel"
                >
                  <div>
                    <span className="text-ink">{m.slug}</span>{" "}
                    <span className="text-ink-ghost">v{m.version}</span>
                  </div>
                  <div className="text-ink-mute">{m.trust}/100</div>
                  <div>
                    {v ? (
                      <span
                        className={
                          v.verdict === "pass"
                            ? "text-good"
                            : v.verdict === "warn"
                              ? "text-warn"
                              : "text-bad"
                        }
                      >
                        {v.verdict.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-ink-ghost">UNEVALUATED</span>
                    )}
                  </div>
                  <div className="text-ink-ghost">
                    {v ? `r${v.revision}` : "—"}
                  </div>
                </Link>
              );
            })}
            {modules.length === 0 && (
              <div className="px-5 py-8 text-center font-body text-[12.5px] text-ink-softer">
                No public modules yet.
              </div>
            )}
          </div>
        </section>

        {/* Revision history */}
        <section>
          <h2 className="mb-3 font-display text-[20px] font-black tracking-[-0.02em] text-ink">
            § REVISION HISTORY
          </h2>
          <div className="border border-hairline bg-canvas-deep">
            {revisions.length === 0 ? (
              <div className="px-5 py-8 text-center font-body text-[12.5px] text-ink-softer">
                No saved revisions yet. The default policy (synthetic
                revision 0) is in effect until the first admin save.
              </div>
            ) : (
              revisions.map((r) => (
                <div
                  key={r.revision}
                  className="grid grid-cols-[80px_1fr_220px] gap-4 border-b border-hairline px-5 py-3 font-mono text-[11.5px] text-ink-mute last:border-b-0"
                >
                  <div className="text-ink">r{r.revision}</div>
                  <div className="text-ink-softer">{r.notes}</div>
                  <div className="text-right text-ink-ghost">
                    {r.authorName ?? r.authorEmail ?? "unknown"} ·{" "}
                    {r.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
