"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/overlays/AppShellProvider";
import { trackEvent } from "@/lib/analytics/plausible";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { DockerfileStep } from "./DockerfileStep";

/**
 * Multi-step publish flow for authenticated users. Submits to the
 * real /api/v1/submissions endpoint, which enqueues the module for
 * human review.
 *
 * Four steps:
 *   1. SOURCE       — repo URL
 *   2. MANIFEST     — name, version, category, previewable
 *   3. DOCKERFILE   — paste or upload; may be skipped
 *   4. REVIEW       — show the payload and publish
 *
 * Dockerfile upload is optional during closed beta. A submission
 * without one lands as `pending`; the reviewer can either add one on
 * behalf of the submitter or request changes.
 */

type Step = 1 | 2 | 3 | 4;

type Visibility = "public" | "private";

interface Props {
  /** The signed-in user's email; used as contactEmail on submission. */
  initialContactEmail: string;
  /**
   * The user's plan, from the server. Drives whether the visibility
   * toggle is interactive (pro) or locked to "public" with an upgrade
   * nudge (free). Defaults to "free" defensively.
   */
  userPlan?: "free" | "pro";
}

export function PublishWizard({
  initialContactEmail,
  userPlan = "free",
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [category, setCategory] = useState("security");
  const [previewable, setPreviewable] = useState(true);
  // Visibility for the module once published. Free users are locked
  // to public; pro users can opt in to private. Default remains
  // public so the flow doesn't change shape for anyone below the
  // upgrade bar.
  const [visibility, setVisibility] = useState<Visibility>("public");
  // Build mode: "dockerfile" (the original path — submitter uploads
  // a Dockerfile) or "cnb" (Cloud Native Buildpacks auto-detect, no
  // Dockerfile needed). Default "dockerfile" preserves the existing
  // wizard flow for anyone who lands here without changing anything.
  const [buildType, setBuildType] = useState<"dockerfile" | "cnb">(
    "dockerfile",
  );
  // For buildType="cnb": comma-separated list of root-level filenames
  // pasted from `ls` of the source repo. Sent to the API so detection
  // runs on the same file set the submitter saw. Optional but warmly
  // encouraged — without it detection falls back to a less-confident
  // guess.
  const [cnbRootFiles, setCnbRootFiles] = useState("");
  // Filled by DockerfileStep.onComplete. When null, no Dockerfile was
  // attached — either because the user skipped, or hasn't reached step 3.
  const [dockerfileUrl, setDockerfileUrl] = useState<string | null>(null);
  const [dockerfileSha256, setDockerfileSha256] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const { pushToast } = useAppShell();
  const router = useRouter();

  function canAdvance1() {
    return source.trim().length > 0;
  }
  function canAdvance2() {
    return name.trim().length > 0 && version.trim().length > 0;
  }

  function handleDockerfileComplete(args: {
    dockerfileUrl: string | null;
    dockerfileSha256: string | null;
    submissionId: string | null;
  }) {
    setDockerfileUrl(args.dockerfileUrl);
    setDockerfileSha256(args.dockerfileSha256);
    if (args.dockerfileUrl) {
      pushToast("success", "Dockerfile uploaded");
    }
    setStep(4);
  }

  async function handlePublish() {
    setPublishing(true);
    pushToast("info", `Submitting ${name}@${version} for review`);

    try {
      // Derive a slug from the name: lowercase, kebab-case.
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64);

      const body: Record<string, unknown> = {
        slug,
        name: name.trim(),
        version: version.trim(),
        // The wizard doesn't collect these; reviewers ask for
        // corrections via email. Long-term: extend the wizard UI
        // to collect them inline.
        author: name.trim(),
        description: `${name.trim()} — submitted via web publish wizard.`,
        category,
        license: "Unknown",
        upstreamUrl: source.trim(),
        contactEmail: initialContactEmail,
        visibility,
        buildType,
      };
      if (buildType === "cnb") {
        // Parse the comma/whitespace-separated file list. Empty
        // strings are filtered; everything else passes through to
        // the detector which does its own normalization.
        const files = cnbRootFiles
          .split(/[\s,]+/)
          .map((f) => f.trim())
          .filter(Boolean);
        if (files.length > 0) body.cnbRootFiles = files;
      } else if (dockerfileUrl && dockerfileSha256) {
        body.dockerfileUrl = dockerfileUrl;
        body.dockerfileSha256 = dockerfileSha256;
      }

      const res = await fetch("/api/v1/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = (await res.json()) as {
          error?: {
            code?: string;
            message?: string;
            details?: {
              plan?: "free" | "pro";
              usage?: { used?: number; limit?: number | null };
            };
          };
          message?: string;
        };

        // 402 quota_exceeded → fire an analytics event so we can
        // track "how often does the free-tier cap actually bite"
        // separately from "how many submissions land". Useful for
        // calibrating the cap.
        if (res.status === 402 && err.error?.code === "quota_exceeded") {
          const used = err.error.details?.usage?.used ?? 0;
          const limit = err.error.details?.usage?.limit ?? 0;
          const bucket: "at_limit" | "near_limit" | "above_limit" =
            used > limit ? "above_limit" : used === limit ? "at_limit" : "near_limit";
          trackEvent("SubmissionQuotaBlocked", {
            plan: err.error.details?.plan ?? "free",
            used: bucket,
          });
        }

        pushToast(
          "error",
          err.error?.message ?? err.message ?? "Submission failed"
        );
        setPublishing(false);
        return;
      }

      const data = (await res.json()) as {
        submissionId?: string;
        status?: string;
        reviewUrl?: string;
      };

      if (data.status === "already_pending") {
        pushToast(
          "info",
          `Already submitted. Waiting on a reviewer (${data.submissionId}).`
        );
      } else {
        // New submission accepted. Fire SubmissionCreated with
        // dimensions that let us see the mix: what % of submissions
        // come via the upload path vs inline vs skipped-dockerfile,
        // and what % from free vs pro users. Keep cardinality low
        // (no slugs, no user ids).
        trackEvent("SubmissionCreated", {
          source: "web",
          uploadMode:
            dockerfileUrl && dockerfileSha256
              ? "r2-upload"
              : body.dockerfile
                ? "inline"
                : "none",
          // Plan is a UI prop we don't have at submit time without
          // an extra fetch; default to "free" and accept the bias —
          // pro users are a minority at this stage so the signal
          // still tells us what we need. When we add it to session,
          // swap this for session.user.plan.
          plan: "free",
        });
        pushToast(
          "success",
          `Submission received — ${data.submissionId}. We'll email when a reviewer picks it up.`
        );
      }
      // Land on the submission's own page so the user can watch it
      // progress. Previously redirected to /app/modules, which doesn't
      // show in-flight submissions (they aren't Module rows yet).
      router.push(`/app/submissions/${data.submissionId}`);
    } catch {
      pushToast("error", `Network error, please retry`);
      setPublishing(false);
    }
  }

  const steps = [
    { n: 1, label: "SOURCE" },
    { n: 2, label: "MANIFEST" },
    { n: 3, label: "DOCKERFILE" },
    { n: 4, label: "REVIEW & PUBLISH" },
  ] as const;

  return (
    <section className="px-7 py-7">
      {/* Stepper */}
      <div className="mb-8 grid grid-cols-4 border border-hairline bg-canvas-deep">
        {steps.map((s, i) => {
          const active = step === s.n;
          const done = step > s.n;
          // Step 3 is skipped when buildType="cnb". Render dimmed,
          // with a "SKIPPED" pill in place of the step number, so
          // the visitor sees the alternate path explicitly.
          const skipped = s.n === 3 && buildType === "cnb";
          return (
            <div
              key={s.n}
              className={`relative px-5 py-4 ${
                i < steps.length - 1 ? "border-r border-hairline" : ""
              } ${active ? "bg-accent/[0.04]" : ""} ${
                skipped ? "opacity-50" : ""
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center border font-mono text-[11px] font-medium ${
                    skipped
                      ? "border-hairline text-ink-ghost"
                      : active
                        ? "border-accent bg-accent text-canvas"
                        : done
                          ? "border-good bg-good text-canvas"
                          : "border-hairline text-ink-ghost"
                  }`}
                >
                  {skipped ? "—" : done ? "✓" : s.n}
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
                  {skipped ? "SKIPPED" : `STEP ${s.n}`}
                </span>
              </div>
              <div
                className={`font-display text-[15px] font-black tracking-[-0.02em] ${
                  skipped
                    ? "text-ink-faint line-through decoration-1"
                    : active || done
                      ? "text-ink"
                      : "text-ink-mute"
                }`}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Source */}
      {step === 1 && (
        <div className="border border-hairline bg-canvas-deep p-7">
          <div className="mb-1 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
            01 · POINT AT SOURCE
          </div>
          <h2 className="mb-3 font-display text-[22px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
            What repo should we build from?
          </h2>
          <p className="mb-6 max-w-[600px] font-body text-[13.5px] leading-[1.6] text-ink-softer">
            We clone the repo, checkout the commit you specify, and build its
            Dockerfile in a hermetic sandbox. Flareo doesn&apos;t accept
            pre-built images — every module is rebuilt from source we can
            verify.
          </p>

          <div className="mb-4">
            <label className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              REPO URL OR GITHUB PATH
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="github.com/upstream/project  or  https://gitea.example.com/me/repo"
              className="w-full border border-hairline bg-canvas px-4 py-3 font-mono text-[13px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
              autoComplete="off"
            />
            <div className="mt-2 font-mono text-[10.5px] text-ink-ghost">
              Public repos only at this tier. GitLab, Gitea, and self-hosted
              forges supported.
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canAdvance1()}
              onClick={() => setStep(2)}
              className="bg-accent px-5 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Manifest */}
      {step === 2 && (
        <div className="border border-hairline bg-canvas-deep p-7">
          <div className="mb-1 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
            02 · DECLARE THE MANIFEST
          </div>
          <h2 className="mb-3 font-display text-[22px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
            Tell us what you&apos;re shipping.
          </h2>
          <p className="mb-6 max-w-[600px] font-body text-[13.5px] leading-[1.6] text-ink-softer">
            These fields become the public module metadata. Name and version
            are immutable once published — you can always publish a new
            version, but this version stays pinned to the digest we produce.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                MODULE NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="my-module"
                className="w-full border border-hairline bg-canvas px-4 py-3 font-mono text-[13px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                VERSION (SEMVER)
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full border border-hairline bg-canvas px-4 py-3 font-mono text-[13px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-hairline bg-canvas px-4 py-3 font-mono text-[13px] text-ink focus:border-accent focus:outline-none"
              >
                <option value="security">security</option>
                <option value="proxy">proxy</option>
                <option value="monitoring">monitoring</option>
                <option value="auth">auth</option>
                <option value="devops">devops</option>
                <option value="media">media</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                PREVIEWABLE (single-VM)
              </label>
              <div className="flex items-center gap-4 border border-hairline bg-canvas px-4 py-3">
                <label className="flex items-center gap-2 font-mono text-[12px] text-ink-mute">
                  <input
                    type="radio"
                    checked={previewable}
                    onChange={() => setPreviewable(true)}
                    className="accent-accent"
                  />
                  yes
                </label>
                <label className="flex items-center gap-2 font-mono text-[12px] text-ink-mute">
                  <input
                    type="radio"
                    checked={!previewable}
                    onChange={() => setPreviewable(false)}
                    className="accent-accent"
                  />
                  no (multi-service)
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                VISIBILITY
                {userPlan === "free" && (
                  <span className="ml-2 rounded-sm border border-hairline bg-canvas px-1.5 py-0.5 text-[9px] text-ink-ghost">
                    PRO UNLOCKS PRIVATE
                  </span>
                )}
              </label>
              <div
                className={`flex items-center gap-4 border border-hairline bg-canvas px-4 py-3 ${
                  userPlan === "free" ? "opacity-70" : ""
                }`}
              >
                <label className="flex items-center gap-2 font-mono text-[12px] text-ink-mute">
                  <input
                    type="radio"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="accent-accent"
                  />
                  public · listed in the shared catalog
                </label>
                <label
                  className={`flex items-center gap-2 font-mono text-[12px] ${
                    userPlan === "free"
                      ? "cursor-not-allowed text-ink-ghost"
                      : "text-ink-mute"
                  }`}
                  title={
                    userPlan === "free"
                      ? `Private modules require the Pro plan (${PLAN_LIMITS.pro.priceLabel}).`
                      : undefined
                  }
                >
                  <input
                    type="radio"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    disabled={userPlan === "free"}
                    className="accent-accent"
                  />
                  private · visible only to you and admins
                </label>
              </div>
              {userPlan === "free" && (
                <a
                  href="/app/settings/billing"
                  className="mt-1.5 inline-block font-mono text-[11px] text-accent hover:text-accent-hot"
                >
                  Upgrade to Pro →
                </a>
              )}
            </div>
          </div>

          {/* Build-mode picker. Two paths from here:
                "dockerfile" → step 3 collects a Dockerfile, then step 4
                "cnb"        → skip step 3, go straight to step 4
              The choice affects what the worker does, not just the UX. */}
          <div className="mt-6 border-t border-hairline pt-6">
            <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              HOW SHOULD WE BUILD IT?
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label
                className={`flex cursor-pointer flex-col gap-1.5 border p-4 transition-colors ${
                  buildType === "dockerfile"
                    ? "border-accent bg-accent/[0.05]"
                    : "border-hairline hover:border-ink-faint"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={buildType === "dockerfile"}
                    onChange={() => setBuildType("dockerfile")}
                    className="accent-accent"
                  />
                  <span className="font-body text-[13.5px] font-medium text-ink">
                    I have a Dockerfile
                  </span>
                </div>
                <p className="pl-6 font-body text-[12px] leading-[1.55] text-ink-softer">
                  The classic path. You provide a Dockerfile in step 3;
                  we build it inside a hermetic BuildKit sandbox.
                </p>
              </label>

              <label
                className={`flex cursor-pointer flex-col gap-1.5 border p-4 transition-colors ${
                  buildType === "cnb"
                    ? "border-accent bg-accent/[0.05]"
                    : "border-hairline hover:border-ink-faint"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={buildType === "cnb"}
                    onChange={() => setBuildType("cnb")}
                    className="accent-accent"
                  />
                  <span className="font-body text-[13.5px] font-medium text-ink">
                    Auto-detect with buildpacks
                  </span>
                  <span className="ml-auto border border-good/40 px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.1em] text-good">
                    NEW
                  </span>
                </div>
                <p className="pl-6 font-body text-[12px] leading-[1.55] text-ink-softer">
                  No Dockerfile required. We detect Node, Python, Go,
                  Rust, Ruby, Java, PHP, .NET — pick a Paketo builder,
                  produce a hardened image. Pipeline downstream is
                  identical (same Trivy, same SBOM, same signature).
                </p>
              </label>
            </div>

            {buildType === "cnb" && (
              <div className="mt-4 border border-dashed border-hairline bg-canvas p-4">
                <label className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                  ROOT-LEVEL FILES (optional but recommended)
                </label>
                <input
                  type="text"
                  value={cnbRootFiles}
                  onChange={(e) => setCnbRootFiles(e.target.value)}
                  placeholder="package.json, README.md, .gitignore, src, tests"
                  className="w-full border border-hairline bg-canvas-deep px-3 py-2 font-mono text-[12px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
                />
                <div className="mt-2 font-mono text-[10.5px] leading-[1.55] text-ink-ghost">
                  Comma- or space-separated. Run{" "}
                  <code className="text-accent">ls</code> at the source repo
                  root and paste the listing — we use it to detect language
                  with confidence. Without this we fall back to a less-
                  certain guess.
                </div>
              </div>
            )}
          </div>

          <div className="mt-7 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border border-hairline px-5 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={!canAdvance2()}
              onClick={() => setStep(buildType === "cnb" ? 4 : 3)}
              className="bg-accent px-5 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
            >
              {buildType === "cnb" ? "Skip Dockerfile · review →" : "Continue →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Dockerfile */}
      {step === 3 && (
        <DockerfileStep
          onBack={() => setStep(2)}
          onComplete={handleDockerfileComplete}
        />
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="border border-hairline bg-canvas-deep p-7">
          <div className="mb-1 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
            04 · REVIEW &amp; PUBLISH
          </div>
          <h2 className="mb-3 font-display text-[22px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
            This is what gets submitted.
          </h2>
          <p className="mb-6 max-w-[600px] font-body text-[13.5px] leading-[1.6] text-ink-softer">
            Clicking publish adds the submission to the reviewer queue.
            You&apos;ll get an email when a reviewer picks it up — usually
            within five business days.
          </p>

          <pre className="mb-6 overflow-x-auto border border-hairline bg-canvas p-5 font-mono text-[12.5px] leading-[1.75] text-ink-mute">
{`{
  "name": "${name}",
  "version": "${version}",
  "source": "${source}",
  "category": "${category}",
  "previewable": ${previewable},
  "visibility": "${visibility}",
  "dockerfile": ${
    dockerfileUrl
      ? '"attached (staged in R2)"'
      : '"not attached — reviewer may request changes"'
  },
  "license": "detected-from-repo"
}`}
          </pre>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(buildType === "cnb" ? 2 : 3)}
              className="border border-hairline px-5 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="flex items-center gap-2 bg-accent px-5 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
            >
              {publishing ? (
                <>
                  <span className="block h-2 w-2 rounded-full bg-canvas meta-pulse" />
                  Publishing...
                </>
              ) : (
                <>Publish →</>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
