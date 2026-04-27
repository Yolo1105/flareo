import Link from "next/link";
import type { Metadata } from "next";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { listJobs } from "@/lib/db/queries";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Job, JobStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Jobs",
};

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<JobStatus, "ok" | "warn" | "bad" | "running" | "neutral"> = {
  queued: "neutral",
  running: "running",
  success: "ok",
  failed: "bad",
  cancelled: "neutral",
};

function formatTotal(job: Job): string {
  const total = job.stages.reduce((acc, s) => acc + (s.durationMs ?? 0), 0);
  if (total < 1000) return `${total}ms`;
  if (total < 60000) return `${(total / 1000).toFixed(1)}s`;
  return `${Math.floor(total / 60000)}m ${Math.round((total % 60000) / 1000)}s`;
}

import { auth } from "@/lib/auth/config";

export default async function JobsIndexPage() {
  const session = await auth();
  const jobs = await listJobs(session?.user?.id ?? null);
  return (
    <>
      <ViewHeader
        eyebrow="JOBS"
        title="Build history."
        subtitle="Every pipeline run for your modules in reverse chronological order. Click any build for the full log and stage breakdown."
      />

      <section className="px-7 py-7">
        <div className="border border-hairline bg-canvas-deep">
          <div className="grid grid-cols-[90px_2fr_100px_120px_110px_100px] gap-4 border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint">
            <div>BUILD</div>
            <div>MODULE</div>
            <div className="text-center">STATUS</div>
            <div className="text-right">PROGRESS</div>
            <div className="text-right">DURATION</div>
            <div className="text-right">STARTED</div>
          </div>
          {jobs.map((j, i) => (
            <Link
              key={j.id}
              href={`/app/jobs/${j.id}`}
              className={`grid grid-cols-[90px_2fr_100px_120px_110px_100px] items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas-panel ${
                i < jobs.length - 1 ? "border-b border-hairline" : ""
              }`}
            >
              <div className="font-mono text-[12px] text-accent">#{j.id}</div>
              <div>
                <div className="font-display text-[15px] font-black leading-[1.1] tracking-[-0.02em] text-ink">
                  {j.moduleName}
                </div>
                <div className="font-mono text-[10.5px] text-ink-mute">
                  v{j.version}
                </div>
              </div>
              <div className="flex justify-center">
                <StatusBadge tone={STATUS_TONE[j.status]} pulse={j.status === "running"}>
                  {j.status.toUpperCase()}
                </StatusBadge>
              </div>
              <div className="text-right font-mono text-[11.5px] text-ink-mute">
                {j.percent}% · {j.currentStage + 1}/6
              </div>
              <div className="text-right font-mono text-[11.5px] text-ink-mute">
                {formatTotal(j)}
              </div>
              <div className="text-right font-mono text-[10.5px] text-ink-softer">
                {new Date(j.startedAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
