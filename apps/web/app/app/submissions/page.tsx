import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { listMySubmissions } from "@/lib/db/my-submissions";
import { hoursAgo } from "@/lib/utils/time";

export const metadata: Metadata = {
  title: "My submissions",
};

export const dynamic = "force-dynamic";

/**
 * My submissions — the authenticated user's own submissions in every
 * state (pending, approved, building, built, failed, rejected,
 * changes_requested, scan_rejected, worker_failures).
 *
 * Sister page to /app/modules, which shows already-published Module
 * rows. The two lists together give submitters a complete picture:
 *   /app/submissions  → "what am I waiting on?"
 *   /app/modules      → "what have I shipped?"
 */

const STATUS_TONE: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "PENDING REVIEW",
    className: "border-warn bg-warn/[0.08] text-warn",
  },
  approved: {
    label: "APPROVED · QUEUED",
    className: "border-accent bg-accent/[0.08] text-accent",
  },
  building: {
    label: "BUILDING",
    className: "border-accent bg-accent/[0.08] text-accent",
  },
  built: {
    label: "BUILT · LIVE",
    className: "border-good bg-good/[0.08] text-good",
  },
  failed: {
    label: "BUILD FAILED",
    className: "border-bad bg-bad/[0.08] text-bad",
  },
  scan_rejected: {
    label: "SCAN REJECTED",
    className: "border-bad bg-bad/[0.08] text-bad",
  },
  rejected: {
    label: "REJECTED",
    className: "border-bad bg-bad/[0.08] text-bad",
  },
  changes_requested: {
    label: "CHANGES REQUESTED",
    className: "border-warn bg-warn/[0.08] text-warn",
  },
  worker_failures: {
    label: "STALLED · AUTO-RETRY",
    className: "border-bad bg-bad/[0.08] text-bad",
  },
};

export default async function MySubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const sessionUser = session!.user!;

  const submissions = await listMySubmissions(sessionUser.id);

  const inFlight = submissions.filter((s) =>
    ["pending", "approved", "building", "changes_requested"].includes(
      s.status,
    ),
  );
  const terminal = submissions.filter(
    (s) => !["pending", "approved", "building", "changes_requested"].includes(
      s.status,
    ),
  );

  return (
    <>
      <ViewHeader
        eyebrow="MY SUBMISSIONS"
        title="Everything you've submitted."
        subtitle={
          submissions.length === 0
            ? "You haven't submitted a module yet. Once you do, it shows up here with live status — pending review, building, or the full receipt once it lands in the catalog."
            : `${inFlight.length} in flight, ${terminal.length} complete. Click any row for status, build log, and the decision email thread.`
        }
        actions={
          <Link
            href="/app/publish"
            className="bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
          >
            Submit new module
          </Link>
        }
      />

      {submissions.length === 0 ? (
        <section className="px-7 py-14">
          <div className="mx-auto max-w-[560px] border border-dashed border-hairline bg-canvas-deep p-8 text-center">
            <div className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-accent">
              NO SUBMISSIONS YET
            </div>
            <p className="mb-5 font-body text-[13.5px] leading-[1.55] text-ink-softer">
              A submission is one request to publish (or re-publish) a
              module. You paste an upstream repo URL, attach a Dockerfile,
              and a reviewer decides whether to build and sign it.
              Submissions sit here from the moment you send them through
              until they ship to the catalog.
            </p>
            <Link
              href="/app/publish"
              className="inline-block bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
            >
              Start a submission →
            </Link>
          </div>
        </section>
      ) : (
        <section className="px-7 py-6">
          {/* In-flight group first — this is what submitters came to check */}
          {inFlight.length > 0 && (
            <>
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
                  IN FLIGHT · {inFlight.length}
                </span>
                <span className="font-mono text-[10.5px] text-ink-ghost">
                  awaiting reviewer or worker
                </span>
              </div>
              <div className="mb-8 border border-hairline">
                <SubmissionHeaderRow />
                {inFlight.map((s) => (
                  <SubmissionRow key={s.id} s={s} />
                ))}
              </div>
            </>
          )}

          {terminal.length > 0 && (
            <>
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-faint">
                  HISTORY · {terminal.length}
                </span>
                <span className="font-mono text-[10.5px] text-ink-ghost">
                  decided — built, failed, or rejected
                </span>
              </div>
              <div className="border border-hairline">
                <SubmissionHeaderRow />
                {terminal.map((s) => (
                  <SubmissionRow key={s.id} s={s} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}

function SubmissionHeaderRow() {
  return (
    <div className="grid grid-cols-[1fr_90px_120px_180px_110px] gap-0 border-b border-hairline bg-canvas-panel px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
      <div>MODULE</div>
      <div className="text-center">VIS</div>
      <div>SUBMITTED</div>
      <div>STATUS</div>
      <div className="text-right">SUB_ID</div>
    </div>
  );
}

function SubmissionRow({
  s,
}: {
  s: {
    id: string;
    moduleName: string;
    version: string;
    status: string;
    visibility: string;
    submittedAt: string;
  };
}) {
  const tone = STATUS_TONE[s.status] ?? {
    label: s.status.toUpperCase(),
    className: "border-hairline text-ink-softer",
  };
  return (
    <Link
      href={`/app/submissions/${s.id}`}
      className="grid grid-cols-[1fr_90px_120px_180px_110px] gap-0 border-b border-hairline px-5 py-3 transition-colors hover:bg-accent/[0.025] last:border-0"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-display text-[14.5px] font-black leading-[1.1] tracking-[-0.015em] text-ink">
            {s.moduleName}
          </span>
          <span className="font-mono text-[10px] text-ink-mute">
            v{s.version}
          </span>
        </div>
      </div>
      <div className="text-center">
        <span
          className={`inline-block border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] ${
            s.visibility === "public"
              ? "border-hairline text-ink-softer"
              : "border-accent text-accent"
          }`}
        >
          {s.visibility.toUpperCase()}
        </span>
      </div>
      <div className="font-mono text-[11px] text-ink-softer">
        {hoursAgo(s.submittedAt)}
      </div>
      <div>
        <span
          className={`inline-flex items-center justify-center border px-1.5 py-0.5 font-mono text-[9.5px] font-medium tracking-[0.12em] ${tone.className}`}
        >
          {tone.label}
        </span>
      </div>
      <div className="truncate text-right font-mono text-[10.5px] text-ink-ghost">
        {s.id}
      </div>
    </Link>
  );
}
