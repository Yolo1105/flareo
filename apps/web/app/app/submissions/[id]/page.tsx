import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { getMySubmission } from "@/lib/db/my-submissions";
import { LiveBuildLog } from "@/components/sections/app-admin/LiveBuildLog";
import { hoursAgo } from "@/lib/utils/time";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Submission ${id.slice(0, 8)}` };
}

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Submitter-facing submission detail. Shows status, timeline, build
 * result, and — most importantly — the live build log while the
 * worker is processing. Mirror of the admin detail page but scoped
 * to the submitter's own row, with no decision panel.
 *
 * Access control is enforced in getMySubmission: a row belonging to
 * another user returns null, which we render as 404. Intentionally
 * not 403 — don't leak whether a given submission id exists.
 */
export default async function MySubmissionDetail({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // After redirect() (return type `never`), TS may not narrow
  // `session.user`. Capture the non-null user as a const.
  const sessionUser = session!.user!;

  const submission = await getMySubmission(sessionUser.id, id);
  if (!submission) notFound();

  // After notFound()/redirect() (return type `never`), capture
  // the narrowed value as a const so TS keeps the narrowing.
  const submissionSafe = submission!;
  
  const isInFlight =
    submissionSafe.status === "pending" ||
    submissionSafe.status === "approved" ||
    submissionSafe.status === "building";
  const isBuilt = submissionSafe.status === "built";
  const isRejected =
    submissionSafe.status === "rejected" ||
    submissionSafe.status === "failed" ||
    submissionSafe.status === "scan_rejected";
  const needsChanges = submissionSafe.status === "changes_requested";
  const isDlq = submissionSafe.status === "worker_failures";

  const submittedAgo = hoursAgo(submissionSafe.submittedAt);
  const duration =
    submissionSafe.buildStartedAt && submissionSafe.buildCompletedAt
      ? Math.round(
          (new Date(submissionSafe.buildCompletedAt).getTime() -
            new Date(submissionSafe.buildStartedAt).getTime()) /
            1000,
        )
      : null;

  return (
    <>
      <ViewHeader
        eyebrow="MY SUBMISSIONS · DETAIL"
        title={submissionSafe.moduleName}
        subtitle={
          <>
            <span className="font-mono text-ink-faint">{submissionSafe.id}</span>
            {" · "}
            submitted <span className="text-ink">{submittedAgo}</span>
            {" · "}
            status:{" "}
            <span className="font-mono text-ink">{submissionSafe.status}</span>
            {submissionSafe.visibility === "private" && (
              <>
                {" · "}
                <span className="border border-accent bg-accent/[0.08] px-1.5 py-[1px] font-mono text-[10px] font-medium tracking-[0.12em] text-accent">
                  PRIVATE
                </span>
              </>
            )}
          </>
        }
        actions={
          <Link
            href="/app/submissions"
            className="border border-hairline px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-ink-softer hover:border-ink-ghost hover:text-ink"
          >
            ← all submissions
          </Link>
        }
      />

      <div className="space-y-6 px-7 py-7">
        {/* Status banner — different tone per state. The job of this
            section is to answer "what do I need to know / do?" in
            one glance, above everything else. */}
        {isInFlight && (
          <StatusBanner tone="info">
            {submissionSafe.status === "pending" && (
              <>
                <strong>Awaiting reviewer.</strong> A human reviewer
                checks the manifest and Dockerfile before we start the
                build. Typical turnaround: 5 business days on free, 2 on
                Pro. You&apos;ll get an email with the decision.
              </>
            )}
            {submissionSafe.status === "approved" && (
              <>
                <strong>Approved — queued.</strong> The build worker will
                pick this up within ~30 seconds. The log panel below will
                start streaming output as soon as it does.
              </>
            )}
            {submissionSafe.status === "building" && (
              <>
                <strong>Building now.</strong> Typical completion in 2-5
                minutes. Watch the live log below; this page auto-updates
                as new output arrives.
              </>
            )}
          </StatusBanner>
        )}

        {needsChanges && (
          <StatusBanner tone="warn">
            <strong>Changes requested.</strong> The reviewer&apos;s email
            explains what needs to change. Once you&apos;ve made the fix,
            submit again from{" "}
            <Link href="/app/publish" className="underline">
              /app/publish
            </Link>{" "}
            — it&apos;ll land as a fresh submissionSafe linked to the same
            module.
          </StatusBanner>
        )}

        {isDlq && (
          <StatusBanner tone="bad">
            <strong>Build stalled.</strong> The pipeline hit repeated
            system errors (not your Dockerfile&apos;s fault). An
            operator is looking; you&apos;ll get an email once it&apos;s
            retried or a decision is made.
          </StatusBanner>
        )}

        {isBuilt && submissionSafe.resultDigest && (
          <StatusBanner tone="good">
            <strong>Built and live.</strong> The module is published in
            the catalog with a fresh signature, SBOM, and Rekor entry.
            <div className="mt-2">
              <Link
                href={`/modules/${submissionSafe.moduleName}`}
                className="font-mono text-[12px] underline"
              >
                View public page →
              </Link>
            </div>
          </StatusBanner>
        )}

        {isRejected && (
          <StatusBanner tone="bad">
            <strong>
              {submissionSafe.status === "rejected"
                ? "Rejected by reviewer."
                : submissionSafe.status === "scan_rejected"
                  ? "Build succeeded but the CVE scan blocked publication."
                  : "Build failed."}
            </strong>
            {submissionSafe.buildErrorMessage && (
              <div className="mt-2 font-mono text-[11.5px] leading-[1.55] text-ink-softer">
                {submissionSafe.buildErrorMessage}
              </div>
            )}
          </StatusBanner>
        )}

        {/* Submission facts */}
        <section className="grid grid-cols-[1fr_1fr] gap-px border border-hairline bg-hairline">
          <div className="bg-canvas-deep p-5">
            <div className="mb-4 font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
              MANIFEST
            </div>
            <dl className="space-y-2.5 font-body text-[12.5px]">
              <Row label="Module" value={submissionSafe.moduleName} />
              <Row label="Version" value={`v${submissionSafe.version}`} />
              <Row label="Visibility" value={submissionSafe.visibility} />
              {submissionSafe.category && (
                <Row label="Category" value={submissionSafe.category} />
              )}
              {submissionSafe.upstreamUrl && (
                <Row
                  label="Upstream"
                  value={
                    <a
                      href={submissionSafe.upstreamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-accent hover:text-accent-hot"
                    >
                      {submissionSafe.upstreamUrl.replace(/^https:\/\//, "")}
                    </a>
                  }
                />
              )}
            </dl>
          </div>

          <div className="bg-canvas-deep p-5">
            <div className="mb-4 font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
              TIMELINE
            </div>
            <dl className="space-y-2.5 font-body text-[12.5px]">
              <Row label="Submitted" value={submittedAgo} />
              {submissionSafe.buildStartedAt && (
                <Row
                  label="Build started"
                  value={hoursAgo(submissionSafe.buildStartedAt)}
                />
              )}
              {submissionSafe.buildCompletedAt && (
                <Row
                  label="Build completed"
                  value={hoursAgo(submissionSafe.buildCompletedAt)}
                />
              )}
              {duration !== null && (
                <Row label="Duration" value={`${duration}s`} />
              )}
              {submissionSafe.decidedAt && (
                <Row
                  label="Decided"
                  value={hoursAgo(submissionSafe.decidedAt)}
                />
              )}
              {isBuilt && submissionSafe.resultDigest && (
                <Row
                  label="Digest"
                  value={
                    <span className="break-all font-mono text-[11px] text-ink">
                      {submissionSafe.resultDigest.slice(0, 28)}…
                    </span>
                  }
                />
              )}
            </dl>
          </div>
        </section>

        {/* Live build log — only when we have something to show. Skips
            pure-pending rows (worker hasn't even started yet) to avoid
            an empty polling panel before any chunks exist. */}
        {(submissionSafe.status === "building" ||
          submissionSafe.status === "built" ||
          submissionSafe.status === "failed" ||
          submissionSafe.status === "scan_rejected" ||
          submissionSafe.status === "worker_failures") && (
          <section>
            <LiveBuildLog
              submissionId={submissionSafe.id}
              initialStatus={submissionSafe.status}
            />
          </section>
        )}

        {/* R2 full-log link for terminal states */}
        {submissionSafe.buildLogUrl && !isInFlight && (
          <div className="border border-hairline bg-canvas-deep px-4 py-3 font-mono text-[11.5px]">
            <span className="mr-2 text-ink-faint">Archived full log:</span>
            <a
              href={submissionSafe.buildLogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hot"
            >
              download →
            </a>
            <span className="ml-3 text-ink-ghost">
              (complete text, safe to save for your own records)
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function StatusBanner({
  tone,
  children,
}: {
  tone: "info" | "warn" | "bad" | "good";
  children: React.ReactNode;
}) {
  const cls =
    tone === "info"
      ? "border-accent bg-accent/[0.06] text-ink"
      : tone === "warn"
        ? "border-warn bg-warn/[0.08] text-ink"
        : tone === "bad"
          ? "border-bad bg-bad/[0.08] text-ink"
          : "border-good bg-good/[0.08] text-ink";
  return (
    <div
      className={`border px-5 py-4 font-body text-[13px] leading-[1.55] ${cls}`}
    >
      {children}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-[120px] shrink-0 font-mono text-[10.5px] tracking-[0.08em] text-ink-faint">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-ink">{value}</dd>
    </div>
  );
}
