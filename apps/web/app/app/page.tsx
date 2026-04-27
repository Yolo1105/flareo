import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { listMyModules, listJobs } from "@/lib/db/queries";
import { getAccountProfile } from "@/lib/db/account";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

/**
 * Real dashboard. Server component that loads the signed-in user's
 * actual modules, jobs, and profile from Postgres. If the user has
 * published nothing yet, the page renders a zero state with a CTA
 * to /app/publish rather than a convincing-looking but empty metrics
 * strip.
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // After redirect() (return type `never`), TS may not narrow
  // `session.user`. Capture the non-null user as a const.
  const sessionUser = session!.user!;

  const [profile, myModules, jobs] = await Promise.all([
    getAccountProfile(sessionUser.id),
    listMyModules(sessionUser.id),
    listJobs(sessionUser.id),
  ]);

  if (!profile) redirect("/login");

  // After notFound()/redirect() (return type `never`), capture
  // the narrowed value as a const so TS keeps the narrowing.
  const profileSafe = profile!;
  
  const runningJob = jobs.find((j) => j.status === "running");
  const totalPulls30d = myModules.reduce((acc, m) => acc + m.pulls30d, 0);
  const publicModules = myModules.filter((m) => m.visibility === "public").length;
  const avgTrust =
    myModules.length > 0
      ? Math.round(
          myModules.reduce((a, m) => a + m.trust, 0) / myModules.length
        )
      : 0;

  // Recent jobs stand in for "recent activity" until we add an audit-log
  // table. Take the last 6, most recent first.
  const recentJobs = jobs.slice(0, 6);

  const displayName =
    profileSafe.name ?? profileSafe.email?.split("@")[0] ?? "there";

  return (
    <>
      <ViewHeader
        eyebrow="DASHBOARD"
        title={`Welcome back, ${displayName}.`}
        subtitle={
          myModules.length === 0
            ? "Your workspace is empty. Publish your first module to start tracking builds, pulls, and scans."
            : `Your workspace has shipped ${publicModules} public module${publicModules === 1 ? "" : "s"}. Total pulls last 30 days: ${totalPulls30d.toLocaleString()}.`
        }
      />

      <section className="grid grid-cols-4 border-b border-hairline bg-canvas-panel">
        <div className="border-r border-hairline px-6 py-5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-accent">
            MODULES · PUBLISHED
          </div>
          <div className="font-display text-[32px] font-black leading-[1] tracking-[-0.03em] text-ink">
            {myModules.length}
          </div>
          <div className="mt-1.5 font-mono text-[10px] tracking-[0.04em] text-ink-softer">
            {myModules.length === 0
              ? "none yet"
              : `${publicModules} public · ${myModules.length - publicModules} private`}
          </div>
        </div>
        <div className="border-r border-hairline px-6 py-5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-accent">
            PULLS · 30 DAY
          </div>
          <div className="font-display text-[32px] font-black leading-[1] tracking-[-0.03em] text-ink">
            {totalPulls30d.toLocaleString()}
          </div>
          <div className="mt-1.5 font-mono text-[10px] tracking-[0.04em] text-ink-softer">
            {myModules.length === 0
              ? "publish a module to start counting"
              : "live from the registry"}
          </div>
        </div>
        <div className="border-r border-hairline px-6 py-5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-accent">
            JOBS · LIFETIME
          </div>
          <div className="font-display text-[32px] font-black leading-[1] tracking-[-0.03em] text-ink">
            {jobs.length}
          </div>
          <div className="mt-1.5 font-mono text-[10px] tracking-[0.04em] text-ink-softer">
            {jobs.filter((j) => j.status === "success").length} successful
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-accent">
            AVG TRUST
          </div>
          <div
            className={`font-display text-[32px] font-black leading-[1] tracking-[-0.03em] ${
              avgTrust >= 80
                ? "text-good"
                : avgTrust >= 60
                ? "text-warn"
                : "text-ink-ghost"
            }`}
          >
            {myModules.length === 0 ? "—" : avgTrust}
          </div>
          <div className="mt-1.5 font-mono text-[10px] tracking-[0.04em] text-ink-softer">
            {myModules.length === 0
              ? "no modules to score"
              : `across your ${myModules.length} module${myModules.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[1fr_340px] gap-0">
        <section className="border-r border-hairline px-7 py-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="mb-1 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                § ACTIVITY · RECENT JOBS
              </div>
              <h2 className="font-display text-[22px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
                {recentJobs.length === 0
                  ? "No jobs yet."
                  : "Recent pipeline runs."}
              </h2>
            </div>
            {recentJobs.length > 0 && (
              <Link
                href="/app/jobs"
                className="font-mono text-[10.5px] tracking-[0.08em] text-accent transition-colors hover:text-accent-hot"
              >
                VIEW ALL JOBS →
              </Link>
            )}
          </div>

          {recentJobs.length === 0 ? (
            <div className="border border-dashed border-hairline p-8 text-center">
              <p className="mb-4 font-body text-[13px] text-ink-softer">
                You haven&apos;t run any builds yet. Publish a module and
                the pipeline will fill this in.
              </p>
              <Link
                href="/app/publish"
                className="inline-block bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
              >
                Publish a module →
              </Link>
            </div>
          ) : (
            <div className="border border-hairline bg-canvas-deep">
              {recentJobs.map((j, i) => {
                const tone =
                  j.status === "success"
                    ? { label: "BUILD ✓", class: "text-good border-good" }
                    : j.status === "failed"
                    ? { label: "BUILD ✗", class: "text-bad border-bad" }
                    : j.status === "running"
                    ? { label: "RUNNING", class: "text-accent border-accent" }
                    : { label: j.status.toUpperCase(), class: "text-ink-ghost border-hairline" };
                return (
                  <div
                    key={j.id}
                    className={`grid grid-cols-[110px_110px_1fr_80px] items-center gap-4 px-5 py-3 ${
                      i < recentJobs.length - 1 ? "border-b border-hairline" : ""
                    }`}
                  >
                    <span className="font-mono text-[10.5px] tracking-[0.04em] text-ink-ghost">
                      #{j.id}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center justify-center border px-1.5 py-0 font-mono text-[9.5px] font-medium tracking-[0.12em] ${tone.class}`}
                    >
                      {tone.label}
                    </span>
                    <span className="font-body text-[13px] text-ink-softer">
                      <span className="mr-2 font-mono text-ink">{j.moduleName}</span>
                      v{j.version}
                    </span>
                    <Link
                      href={`/app/jobs/${j.id}`}
                      className="text-right font-mono text-[10px] tracking-[0.04em] text-ink-faint transition-colors hover:text-accent"
                    >
                      details →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="px-6 py-7">
          <div className="mb-6">
            <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              § CURRENTLY BUILDING
            </div>
            {runningJob ? (
              <Link
                href={`/app/jobs/${runningJob.id}`}
                className="block border border-hairline bg-canvas-deep p-4 transition-colors hover:border-accent"
              >
                <div className="mb-2 flex items-center gap-2">
                  <StatusBadge tone="running" pulse>
                    RUNNING
                  </StatusBadge>
                  <span className="font-mono text-[10px] text-ink-faint">
                    #{runningJob.id}
                  </span>
                </div>
                <div className="mb-2 font-display text-[18px] font-black leading-[1.1] tracking-[-0.02em] text-ink">
                  {runningJob.moduleName}@{runningJob.version}
                </div>
                <div className="mb-3 font-mono text-[11px] text-ink-softer">
                  stage {runningJob.currentStage + 1}/6 ·{" "}
                  {runningJob.stages[runningJob.currentStage]?.name}
                </div>
                <div className="mb-1 h-1 w-full overflow-hidden bg-hairline">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${runningJob.percent}%` }}
                  />
                </div>
                <div className="text-right font-mono text-[10px] text-ink-ghost">
                  {runningJob.percent}%
                </div>
              </Link>
            ) : (
              <div className="border border-dashed border-hairline p-4 text-center font-mono text-[11px] text-ink-ghost">
                No active builds
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              § QUICK ACTIONS
            </div>
            <div className="space-y-2">
              <Link
                href="/app/publish"
                className="block border border-hairline bg-canvas-deep p-3 font-mono text-[11.5px] text-ink transition-colors hover:border-accent hover:text-accent"
              >
                <span className="text-accent">$</span> flareo publish
              </Link>
              <Link
                href="/app/modules"
                className="block border border-hairline bg-canvas-deep p-3 font-mono text-[11.5px] text-ink-mute transition-colors hover:border-ink-ghost hover:text-ink"
              >
                View my modules
              </Link>
              <Link
                href="/app/settings/api-keys"
                className="block border border-hairline bg-canvas-deep p-3 font-mono text-[11.5px] text-ink-mute transition-colors hover:border-ink-ghost hover:text-ink"
              >
                Rotate an API key
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              § SYSTEM HEALTH
            </div>
            <a
              href="https://status.flareo.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-hairline bg-canvas-deep p-4 transition-colors hover:border-accent"
            >
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-good">
                <span className="block h-1.5 w-1.5 rounded-full bg-good meta-pulse" />
                ALL SYSTEMS OPERATIONAL
              </div>
              <div className="font-body text-[12px] text-ink-softer">
                Live status at{" "}
                <span className="text-ink">status.flareo.dev</span>.
              </div>
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
