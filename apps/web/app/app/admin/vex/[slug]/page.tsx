import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import { listForModule, type VexStatementRow } from "@/lib/db/vex";
import { buildTrivyReport, type TrivyVuln } from "@/lib/data/pipeline-artifacts";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { VexAnnotationForm } from "@/components/sections/app-admin/VexAnnotationForm";

export const metadata: Metadata = {
  title: "VEX annotations · admin",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * /app/admin/vex/[slug] — per-module VEX annotation surface.
 *
 * For each Trivy finding, shows the existing annotation (if any) and
 * a form to upsert a new one. The form is a client component so the
 * reviewer can save without a full page reload.
 *
 * Findings come from buildTrivyReport(module) — same data the
 * pipeline page uses, so the reviewer sees the exact CVE list a
 * consumer would see. When real Trivy scan output is available
 * (post-launch, when the build worker stores its output), this
 * swaps in for the synthesized data.
 */
export default async function AdminVexModulePage({ params }: Props) {
  await requireAdminPage();
  const { slug } = await params;

  const row = (await prisma.module.findUnique({
    where: { slug } as never,
  })) as ModuleShape | null;
  if (!row) notFound();

  const module = shapeToModule(row!);
  const trivyReport = buildTrivyReport(module);
  const statements = await listForModule(slug);

  // Index statements by CVE for fast lookup as we render each finding.
  const byCve = new Map<string, VexStatementRow>();
  for (const s of statements) {
    byCve.set(s.cve, s);
  }

  // Sort findings: unannotated criticals/highs first (they need the
  // attention), then unannotated medium/low, then annotated.
  const sortedFindings = [...trivyReport.vulnerabilities].sort((a, b) => {
    const aAnnotated = byCve.has(a.cve);
    const bAnnotated = byCve.has(b.cve);
    if (aAnnotated !== bAnnotated) return aAnnotated ? 1 : -1;
    return severityRank(a.severity) - severityRank(b.severity);
  });

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN · VEX"
        title={`Annotate · ${module.name}`}
        subtitle={`${trivyReport.vulnerabilities.length} Trivy findings · ${statements.length} VEX statements on file. Click any finding to annotate.`}
      />

      <div className="border-b border-hairline bg-canvas-deep px-8 py-3">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[11px] text-ink-faint">
          <Link
            href="/app/admin/vex"
            className="text-accent hover:text-accent-hot"
          >
            ← all modules
          </Link>
          <span>
            <span className="text-ink-ghost">MODULE:</span>{" "}
            <span className="text-ink">{module.slug}</span>
          </span>
          <span>
            <span className="text-ink-ghost">VERSION:</span>{" "}
            <span className="text-ink">{module.version}</span>
          </span>
          <span>
            <span className="text-ink-ghost">DIGEST:</span>{" "}
            <span className="text-ink-mute">
              {module.digest.replace("sha256:", "").slice(0, 16)}…
            </span>
          </span>
          <a
            href={`/api/v1/modules/${module.slug}/vex`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-accent hover:text-accent-hot"
          >
            view OpenVEX document →
          </a>
        </div>
      </div>

      <div className="px-8 py-8">
        {trivyReport.vulnerabilities.length === 0 ? (
          <div className="border border-dashed border-good/40 bg-good/[0.04] p-8 text-center font-body text-[13px] text-ink-softer">
            <strong className="text-good">Clean scan.</strong> No Trivy
            findings on this module&apos;s most recent scan. Nothing to
            annotate. Future findings will appear here automatically when
            they&apos;re detected.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFindings.map((vuln) => (
              <FindingRow
                key={vuln.cve}
                module={module}
                vuln={vuln}
                existing={byCve.get(vuln.cve) ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function severityRank(s: TrivyVuln["severity"]): number {
  switch (s) {
    case "CRITICAL":
      return 0;
    case "HIGH":
      return 1;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 3;
  }
}

/**
 * One Trivy finding with its (possibly absent) VEX annotation.
 * Server-renders the static finding metadata; the form below is a
 * client component handling the actual writes.
 */
function FindingRow({
  module,
  vuln,
  existing,
}: {
  module: { slug: string };
  vuln: TrivyVuln;
  existing: VexStatementRow | null;
}) {
  const severityClass =
    vuln.severity === "CRITICAL"
      ? "border-bad text-bad"
      : vuln.severity === "HIGH"
        ? "border-warn text-warn"
        : vuln.severity === "MEDIUM"
          ? "border-hairline text-ink-mute"
          : "border-hairline text-ink-faint";

  const existingStatusClass =
    existing?.status === "not_affected" || existing?.status === "fixed"
      ? "border-good text-good"
      : existing?.status === "affected"
        ? "border-bad text-bad"
        : existing?.status === "under_investigation"
          ? "border-warn text-warn"
          : "border-hairline text-ink-faint";

  return (
    <article className="border border-hairline bg-canvas-deep">
      <header className="grid grid-cols-[auto_auto_1fr_auto] items-baseline gap-3 border-b border-hairline px-5 py-3">
        <a
          href={vuln.primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[12.5px] text-accent hover:text-accent-hot"
        >
          {vuln.cve}
        </a>
        <span
          className={`inline-block border px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.1em] ${severityClass}`}
        >
          {vuln.severity}
        </span>
        <span className="truncate font-mono text-[11px] text-ink-mute">
          {vuln.pkgName} {vuln.installedVersion}{" "}
          {vuln.fixedVersion && (
            <span className="text-ink-ghost">→ {vuln.fixedVersion}</span>
          )}
        </span>
        {existing ? (
          <span
            className={`inline-block border px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] ${existingStatusClass}`}
          >
            {existing.status.toUpperCase().replace(/_/g, " ")}
          </span>
        ) : (
          <span className="font-mono text-[10px] tracking-[0.1em] text-ink-ghost">
            UNANNOTATED
          </span>
        )}
      </header>

      <div className="px-5 py-3 font-body text-[12px] leading-[1.55] text-ink-softer">
        {vuln.title}
      </div>

      <VexAnnotationForm
        moduleSlug={module.slug}
        cve={vuln.cve}
        // Pass the Trivy-reported severity through to the form so the
        // upsert payload includes it. Normalized to lowercase to match
        // the typed CveSeverity union in lib/db/vex.ts. The form lets
        // a reviewer override (rare — usually you only override if
        // Trivy got the bucket wrong) but the default is what Trivy
        // emitted.
        cveSeverity={vuln.severity.toLowerCase() as
          | "critical"
          | "high"
          | "medium"
          | "low"
          | "unknown"}
        existing={
          existing
            ? {
                status: existing.status,
                justification: existing.justification,
                impactStatement: existing.impactStatement,
                cveSeverity: existing.cveSeverity,
                authorName: existing.authorName,
                updatedAt: existing.updatedAt.toISOString(),
              }
            : null
        }
      />
    </article>
  );
}
