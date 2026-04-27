import type { Metadata } from "next";
import Link from "next/link";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { requireAdminPage } from "@/lib/auth/require-admin";
import {
  listReportsForAdmin,
  REPORT_CATEGORY_LABELS,
} from "@/lib/db/reports";
import { ReportTriageActions } from "@/components/sections/app-admin/ReportTriageActions";

export const metadata: Metadata = {
  title: "Module reports · admin",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ history?: string }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  await requireAdminPage();

  const { history } = await searchParams;
  const showHistory = history === "1";

  const all = await listReportsForAdmin({
    includeClosed: showHistory,
    limit: 200,
  });

  const open = all.filter((r) => r.state === "open");
  const investigating = all.filter((r) => r.state === "investigating");
  const resolved = all.filter((r) => r.state === "resolved");
  const dismissed = all.filter((r) => r.state === "dismissed");

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN · MODULE REPORTS"
        title="User-filed issues on published modules"
        subtitle={
          showHistory
            ? `${open.length} open · ${investigating.length} investigating · ${resolved.length} resolved · ${dismissed.length} dismissed.`
            : `${open.length} open · ${investigating.length} investigating. Closed reports hidden — add ?history=1 to include them.`
        }
        actions={
          <div className="flex gap-2">
            <Link
              href={showHistory ? "/app/admin/reports" : "/app/admin/reports?history=1"}
              className="border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink-softer hover:text-ink"
            >
              {showHistory ? "hide history" : "show history"}
            </Link>
            <Link
              href="/app/admin"
              className="border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink-softer hover:text-ink"
            >
              ← back to queue
            </Link>
          </div>
        }
      />

      <div className="space-y-8 px-7 py-7">
        {open.length > 0 && (
          <Section
            label="OPEN"
            tone="warn"
            reports={open}
            count={open.length}
          />
        )}
        {investigating.length > 0 && (
          <Section
            label="INVESTIGATING"
            tone="accent"
            reports={investigating}
            count={investigating.length}
          />
        )}
        {showHistory && resolved.length > 0 && (
          <Section
            label="RESOLVED"
            tone="good"
            reports={resolved}
            count={resolved.length}
          />
        )}
        {showHistory && dismissed.length > 0 && (
          <Section
            label="DISMISSED"
            tone="ink"
            reports={dismissed}
            count={dismissed.length}
          />
        )}

        {all.length === 0 && (
          <div className="border border-dashed border-hairline bg-canvas-deep px-6 py-10 text-center font-body text-[13px] text-ink-ghost">
            No reports. Queue is clear.
          </div>
        )}
      </div>
    </>
  );
}

type SectionTone = "warn" | "accent" | "good" | "ink";

function Section({
  label,
  tone,
  reports,
  count,
}: {
  label: string;
  tone: SectionTone;
  reports: Array<{
    id: string;
    moduleSlug: string;
    reporterName: string | null;
    reporterUsername: string | null;
    category: string;
    body: string;
    state: string;
    resolutionNote: string | null;
    triagedByName: string | null;
    triagedAt: string | null;
    createdAt: string;
  }>;
  count: number;
}) {
  const toneCls =
    tone === "warn"
      ? "text-warn"
      : tone === "accent"
        ? "text-accent"
        : tone === "good"
          ? "text-good"
          : "text-ink-faint";
  return (
    <section>
      <h2 className={`mb-3 font-mono text-[10px] font-semibold tracking-[0.14em] ${toneCls}`}>
        {label} · {count}
      </h2>
      <div className="space-y-3">
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
    </section>
  );
}

function ReportCard({
  report,
}: {
  report: {
    id: string;
    moduleSlug: string;
    reporterName: string | null;
    reporterUsername: string | null;
    category: string;
    body: string;
    state: string;
    resolutionNote: string | null;
    triagedByName: string | null;
    triagedAt: string | null;
    createdAt: string;
  };
}) {
  const isTerminal = report.state === "resolved" || report.state === "dismissed";
  return (
    <article
      className={`border bg-canvas-deep p-5 ${
        isTerminal ? "border-dashed border-hairline opacity-70" : "border-hairline"
      }`}
    >
      <header className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="mb-1 font-mono text-[11px] text-ink-faint">
            <Link
              href={`/modules/${report.moduleSlug}`}
              className="text-accent hover:text-accent-hot"
            >
              {report.moduleSlug}
            </Link>
            {" · "}
            reported by{" "}
            {report.reporterUsername ? (
              <Link
                href={`/@${report.reporterUsername}`}
                className="text-ink-softer hover:text-ink"
              >
                @{report.reporterUsername}
              </Link>
            ) : (
              <span>{report.reporterName ?? "anonymous"}</span>
            )}
          </div>
          <h3 className="font-display text-[16px] font-black text-ink">
            {REPORT_CATEGORY_LABELS[
              report.category as keyof typeof REPORT_CATEGORY_LABELS
            ] ?? report.category}
          </h3>
        </div>
        <time className="font-mono text-[10.5px] text-ink-ghost">
          {report.createdAt.slice(0, 10)}
        </time>
      </header>

      <p className="mb-3 whitespace-pre-wrap border-l-2 border-hairline pl-3 font-body text-[13px] leading-[1.55] text-ink-softer">
        {report.body}
      </p>

      {report.resolutionNote && (
        <div className="mb-3 border border-hairline bg-canvas px-3 py-2">
          <div className="mb-1 font-mono text-[10px] tracking-[0.12em] text-ink-faint">
            RESOLUTION NOTE
            {report.triagedByName && (
              <span className="ml-2 normal-case tracking-normal text-ink-ghost">
                · {report.triagedByName}
                {report.triagedAt && ` · ${report.triagedAt.slice(0, 10)}`}
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap font-body text-[12.5px] leading-[1.55] text-ink">
            {report.resolutionNote}
          </p>
        </div>
      )}

      {!isTerminal && (
        <ReportTriageActions
          reportId={report.id}
          currentState={report.state as "open" | "investigating"}
        />
      )}
    </article>
  );
}
