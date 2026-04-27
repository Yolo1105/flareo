import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getJob } from "@/lib/db/queries";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { JobLogStream } from "@/components/sections/app-job/JobLogStream";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { JobStatus } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job not found" };
  return { title: `Build #${id} ${job.moduleName}` };
}

const STATUS_TONE: Record<JobStatus, "ok" | "warn" | "bad" | "running" | "neutral"> = {
  queued: "neutral",
  running: "running",
  success: "ok",
  failed: "bad",
  cancelled: "neutral",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "n/a";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  // After notFound()/redirect() (return type `never`), capture
  // the narrowed value as a const so TS keeps the narrowing.
  const jobSafe = job!;
  
  return (
    <>
      <ViewHeader
        eyebrow={`JOB · #${jobSafe.id}`}
        title={
          <>
            {jobSafe.moduleName}
            <span className="ml-2 font-mono text-[20px] font-normal tracking-[0.02em] text-ink-mute">
              @{jobSafe.version}
            </span>
          </>
        }
        subtitle={
          <>
            Build triggered {new Date(jobSafe.startedAt).toLocaleString()}. Stage{" "}
            {jobSafe.currentStage + 1} of 6. Overall progress{" "}
            <span className="text-ink">{jobSafe.percent}%</span>.
          </>
        }
        actions={
          <StatusBadge tone={STATUS_TONE[jobSafe.status]} pulse={jobSafe.status === "running"}>
            {jobSafe.status.toUpperCase()}
          </StatusBadge>
        }
      />

      {/* Progress strip */}
      <section className="border-b border-hairline bg-canvas-panel px-7 py-4">
        <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] tracking-[0.08em] text-ink-faint">
          <span>PIPELINE PROGRESS</span>
          <span className="text-ink">
            {jobSafe.percent}% · {jobSafe.currentStage + 1}/6 stages
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden bg-hairline">
          <div
            className={`h-full transition-all ${
              jobSafe.status === "failed" ? "bg-bad" : "bg-accent"
            }`}
            style={{ width: `${jobSafe.percent}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-[1fr_380px] gap-0">
        {/* Left: live log */}
        <section className="border-r border-hairline px-7 py-7">
          <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
            § LIVE PIPELINE LOG
          </div>
          <JobLogStream job={jobSafe} />
        </section>

        {/* Right: stage breakdown */}
        <section className="px-6 py-7">
          <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
            § STAGE TIMINGS
          </div>
          <div className="border border-hairline bg-canvas-deep">
            {jobSafe.stages.map((s, i) => (
              <div
                key={s.name}
                className={`grid grid-cols-[40px_1fr_80px] items-center gap-3 px-4 py-3 ${
                  i < jobSafe.stages.length - 1 ? "border-b border-hairline" : ""
                }`}
              >
                <span className="font-mono text-[10px] tracking-[0.08em] text-ink-ghost">
                  0{i + 1}
                </span>
                <div>
                  <div className="font-mono text-[11.5px] text-ink">{s.name}</div>
                  <div
                    className={`font-mono text-[9.5px] tracking-[0.08em] ${
                      s.status === "success"
                        ? "text-good"
                        : s.status === "failed"
                          ? "text-bad"
                          : s.status === "running"
                            ? "text-warn"
                            : "text-ink-ghost"
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-ink-mute">
                  {formatDuration(s.durationMs)}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 flex justify-between border-t border-hairline pt-3 font-mono text-[11px] tracking-[0.04em]">
            <span className="text-ink-faint">Total</span>
            <span className="text-ink">
              {formatDuration(
                jobSafe.stages.reduce((acc, s) => acc + (s.durationMs ?? 0), 0)
              )}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
