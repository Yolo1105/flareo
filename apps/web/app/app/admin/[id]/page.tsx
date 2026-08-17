import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import {
  getAdminSubmission,
  findSimilarSubmissions,
} from "@/lib/db/admin-submissions";
import { SubmissionDecisionPanel } from "@/components/sections/app-admin/SubmissionDecisionPanel";
import { DockerfileViewer } from "@/components/sections/app-admin/DockerfileViewer";
import { LiveBuildLog } from "@/components/sections/app-admin/LiveBuildLog";

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { id } = await params;
  return { title: `Submission review ${id.slice(0, 8)}` };
}

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

function humanAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / (86400 * 1000));
  const h = Math.floor(ms / (3600 * 1000));
  if (d >= 2) return `${d} days`;
  if (d >= 1) return `1 day`;
  if (h >= 1) return `${h}h`;
  return `<1h`;
}

export default async function AdminSubmissionDetailPage({ params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // After redirect() (return type `never`), TS may not narrow
  // `session.user`. Capture the non-null user as a const.
  const sessionUser = session!.user!;
  if (sessionUser.role !== "admin") redirect("/app");

  const { id } = await params;
  const submission = await getAdminSubmission(id);
  if (!submission) notFound();

  // After notFound()/redirect() (return type `never`), capture
  // the narrowed value as a const so TS keeps the narrowing.
  const submissionSafe = submission!;
  
  const similar = await findSimilarSubmissions(submissionSafe);

  const isTerminal =
    submissionSafe.status === "built" || submissionSafe.status === "rejected";
  const isInFlight =
    submissionSafe.status === "approved" || submissionSafe.status === "building";

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN &middot; REVIEW"
        title={submissionSafe.moduleName}
        subtitle={
          <>
            <span className="font-mono text-ink-faint">{submissionSafe.id}</span>
            {" · "}
            submitted{" "}
            <span className="text-ink">{humanAge(submissionSafe.submittedAt)} ago</span>
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
            href="/app/admin"
            className="border border-hairline px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-ink-softer transition-colors hover:border-ink-ghost hover:text-ink"
          >
            ← back to queue
          </Link>
        }
      />

      <div className="grid grid-cols-[280px_1fr_320px]">
        {/* Left: submitter context */}
        <aside className="border-r border-hairline bg-canvas-panel px-5 py-6">
          <div className="mb-4 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
            SUBMITTER
          </div>
          {submissionSafe.submitter ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                {submissionSafe.submitter.image ? (
                  <img
                    src={submissionSafe.submitter.image}
                    alt=""
                    className="h-10 w-10 border border-hairline object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center border border-hairline bg-canvas-deep font-mono text-[14px] text-ink-softer">
                    {submissionSafe.submitter.name?.charAt(0)?.toUpperCase() ??
                      submissionSafe.submitter.email?.charAt(0)?.toUpperCase() ??
                      "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-body text-[13px] text-ink">
                    {submissionSafe.submitter.name ?? "(no name)"}
                  </div>
                  <div className="truncate font-mono text-[11px] text-ink-softer">
                    {submissionSafe.submitter.email ?? "(no email)"}
                  </div>
                </div>
              </div>
              <dl className="mb-5 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Joined</dt>
                  <dd className="text-ink-softer">
                    {humanAge(submissionSafe.submitter.createdAt)} ago
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Contact</dt>
                  <dd className="truncate text-ink-softer">
                    <a
                      href={`mailto:${submissionSafe.submitter.email ?? submissionSafe.flags.contactEmail}`}
                      className="hover:text-accent"
                    >
                      email →
                    </a>
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="mb-4 font-mono text-[11px] text-ink-faint">
              No linked account (legacy submissionSafe).
              {submissionSafe.flags.contactEmail && (
                <>
                  {" "}
                  <a
                    href={`mailto:${submissionSafe.flags.contactEmail}`}
                    className="text-accent hover:text-accent-hot"
                  >
                    {submissionSafe.flags.contactEmail}
                  </a>
                </>
              )}
            </div>
          )}

          {similar.length > 0 && (
            <>
              <div className="mt-6 mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                SIMILAR SUBMISSIONS
              </div>
              <ul className="space-y-1.5 text-[11.5px] font-mono">
                {similar.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/app/admin/${s.id}`}
                      className="text-ink-softer hover:text-accent"
                    >
                      <span className="text-ink">{s.moduleName}</span>
                      {" · "}
                      <span className="text-ink-faint">{s.status}</span>
                      {" · "}
                      <span className="text-ink-faint">
                        {humanAge(s.submittedAt)} ago
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>

        {/* Middle: metadata + Dockerfile */}
        <main className="min-w-0 px-7 py-6">
          <section className="mb-6 border border-hairline bg-canvas-deep p-5">
            <div className="mb-4 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              METADATA
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[12px]">
              <div>
                <dt className="text-ink-faint">Slug</dt>
                <dd className="text-ink">{submissionSafe.moduleName}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Version</dt>
                <dd className="text-ink">{submissionSafe.version}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Category</dt>
                <dd className="text-ink">{submissionSafe.flags.category}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">License</dt>
                <dd className="text-ink">{submissionSafe.flags.license}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-ink-faint">Upstream</dt>
                <dd>
                  {submissionSafe.flags.upstreamUrl ? (
                    <a
                      href={submissionSafe.flags.upstreamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-accent hover:text-accent-hot"
                    >
                      {submissionSafe.flags.upstreamUrl}
                    </a>
                  ) : (
                    <span className="text-ink-faint">(none provided)</span>
                  )}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-ink-faint">Description</dt>
                <dd className="text-ink-softer">
                  {submissionSafe.flags.description || "(none)"}
                </dd>
              </div>
            </dl>
            {submissionSafe.requiresNetwork && (
              <div className="mt-4 border-l-2 border-warn bg-warn/10 px-3 py-2 font-mono text-[11px] text-warn">
                Network access granted during build (HTTPS whitelist only).
              </div>
            )}
          </section>

          <DockerfileViewer
            content={submissionSafe.flags.dockerfile ?? null}
            dockerfileUrl={submissionSafe.dockerfileUrl}
          />

          {/* Build result block — only for terminal / in-flight states */}
          {(isInFlight || submissionSafe.status === "built" ||
            submissionSafe.status === "failed" ||
            submissionSafe.status === "scan_rejected") && (
            <section className="mt-6 border border-hairline bg-canvas-deep p-5">
              <div className="mb-4 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                BUILD RESULT
              </div>
              {submissionSafe.status === "built" && submissionSafe.resultDigest && (
                <dl className="space-y-2 font-mono text-[11.5px]">
                  <div>
                    <dt className="text-ink-faint">Image</dt>
                    <dd className="break-all text-ink">
                      {submissionSafe.resultImageRef}@{submissionSafe.resultDigest}
                    </dd>
                  </div>
                  {submissionSafe.resultSbomUrl && (
                    <div>
                      <dt className="text-ink-faint">SBOM</dt>
                      <dd>
                        <a
                          href={submissionSafe.resultSbomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-accent"
                        >
                          {submissionSafe.resultSbomUrl}
                        </a>
                      </dd>
                    </div>
                  )}
                  {submissionSafe.resultRekorIndex && (
                    <div>
                      <dt className="text-ink-faint">Rekor log</dt>
                      <dd>
                        <a
                          href={`https://search.sigstore.dev/?logIndex=${submissionSafe.resultRekorIndex}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent"
                        >
                          #{submissionSafe.resultRekorIndex}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {(submissionSafe.status === "failed" ||
                submissionSafe.status === "scan_rejected") && (
                <>
                  <div className="mb-2 font-mono text-[10.5px] tracking-[0.08em] text-bad">
                    {submissionSafe.buildErrorKind === "system"
                      ? "SYSTEM ERROR"
                      : submissionSafe.buildErrorKind === "scan"
                      ? "CVE SCAN REJECTED"
                      : "USER ERROR"}
                  </div>
                  <pre className="whitespace-pre-wrap break-words border border-hairline bg-canvas p-3 font-mono text-[11.5px] leading-[1.55] text-ink-softer">
                    {submissionSafe.buildErrorMessage ?? "(no message)"}
                  </pre>
                  {submissionSafe.buildLogUrl && (
                    <a
                      href={submissionSafe.buildLogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block font-mono text-[11px] text-accent hover:text-accent-hot"
                    >
                      full build log →
                    </a>
                  )}
                </>
              )}
              {isInFlight && (
                <div className="font-mono text-[11.5px] text-ink-softer">
                  {submissionSafe.status === "approved"
                    ? "Waiting for build worker to pick up (usually within 30 seconds)."
                    : "Building now. Typical completion 2-5 minutes."}
                </div>
              )}
            </section>
          )}

          {/* Live build log — surfaces incremental output from the
              worker. Shown whenever the submissionSafe has reached the
              worker at all (building or terminal). The component
              polls while building and stops after one fetch once
              terminal; historical builds show their final log too. */}
          {(submissionSafe.status === "building" ||
            submissionSafe.status === "built" ||
            submissionSafe.status === "failed" ||
            submissionSafe.status === "scan_rejected" ||
            submissionSafe.status === "worker_failures") && (
            <section className="mt-6">
              <LiveBuildLog
                submissionId={submissionSafe.id}
                initialStatus={submissionSafe.status}
              />
            </section>
          )}
        </main>

        {/* Right: decision panel */}
        <aside className="border-l border-hairline px-5 py-6">
          <SubmissionDecisionPanel
            submissionId={submissionSafe.id}
            status={submissionSafe.status}
            canRetry={
              (submissionSafe.status === "failed" &&
                submissionSafe.buildErrorKind === "system") ||
              submissionSafe.status === "worker_failures"
            }
            isDeadLettered={submissionSafe.status === "worker_failures"}
            isTerminal={isTerminal}
          />
        </aside>
      </div>
    </>
  );
}
