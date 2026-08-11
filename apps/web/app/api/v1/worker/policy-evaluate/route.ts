import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActivePolicy } from "@/lib/db/policy";
import { evaluate, buildPolicyInput, type PolicyVerdict } from "@/lib/policy/evaluate";
import { listForModule as listVexForModule } from "@/lib/db/vex";
import { apiError } from "@/lib/validation/schemas";
import { verifyWorkerSecret } from "@/lib/auth/worker-auth";

/**
 * POST /api/v1/worker/policy-evaluate
 *
 * Worker-only endpoint. Called by the build worker between sign and
 * publish to evaluate the active admission policy against a freshly-
 * built submission's signals. Returns the verdict; worker decides
 * whether to publish based on the verdict.
 *
 * Why this endpoint exists separately from the public per-module
 * endpoint at /api/v1/modules/[slug]/policy:
 *   - The module doesn't exist in the catalog yet at the time the
 *     worker calls — there's no row to look up. We evaluate from a
 *     posted snapshot, not from a Module record.
 *   - The worker has the canonical signal data fresh from this
 *     build (CVE counts, digest, signature presence). The public
 *     endpoint pulls from the persisted Module + VEX rows.
 *   - The worker call needs the freshest active policy revision —
 *     this endpoint always reads it live; the public endpoint
 *     serves a cached verdict computed at publish time.
 *
 * Auth: shared worker secret (same pattern as build-completed and
 * heartbeat). Reviewer/admin auth would also work but the worker
 * isn't a user — keeping the worker-secret path keeps the worker's
 * env shape consistent with the other two worker endpoints.
 *
 * VEX integration: if the slug already exists in the catalog (a
 * rebuild of an existing module), pull its current VEX statements
 * to compute after-VEX counts. For a brand-new module, no VEX
 * statements exist yet, so after-VEX counts equal raw counts.
 */
export const runtime = "nodejs";

// ─── input schema ────────────────────────────────────────────────

const InputSchema = z.object({
  /// Submission ID — for log correlation, not for the evaluation.
  submissionId: z.string().min(1),
  /// Catalog slug. Used only for VEX-statement lookup; if the slug
  /// is new (no existing module), the lookup returns empty and that's
  /// fine.
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  /// Trivy results — at least the per-severity counts. The worker
  /// passes counts rather than the full CVE list because the
  /// evaluator only needs counts and we don't want the network
  /// payload to grow with module size.
  cveCritical: z.number().int().min(0),
  cveHigh: z.number().int().min(0),
  cveMedium: z.number().int().min(0),
  cveLow: z.number().int().min(0),
  /// SLSA level produced by the worker's attestation step. 2 today,
  /// future L3 if/when we move to hermetic builders.
  slsaLevel: z.number().int().min(0).max(4),
  /// Composite trust score the worker computed for the build.
  /// Worker should compute this with the same lib/data/trust-score.ts
  /// formula the website uses; we accept it as input rather than
  /// recomputing here so worker and verdict agree.
  trustScore: z.number().int().min(0).max(100),
  /// Receipts presence — all four of these are normally true at this
  /// stage in the worker pipeline (the steps above this in the worker
  /// emit them). They're parameters rather than constants because a
  /// future worker variant (e.g. CNB path with no SLSA attestation)
  /// might legitimately ship one as false.
  signature: z.boolean(),
  sbom: z.boolean(),
  rekorEntry: z.boolean(),
  slsaAttestation: z.boolean(),
});

type Input = z.infer<typeof InputSchema>;

// ─── response shape ──────────────────────────────────────────────

interface SuccessResponse {
  /** Top-level decision. Worker uses this to gate publish. */
  verdict: "pass" | "warn" | "fail";
  /** Active policy revision the verdict was computed against. */
  policyRevision: number;
  /** Compact reason, suitable for logs and decision emails. */
  summary: string;
  /** Per-rule outcomes for the admin UI / debug. */
  results: PolicyVerdict["results"];
  /** Echo of the input the evaluator saw, post-VEX-suppression. */
  effectiveInput: PolicyVerdict["input"];
  /** ISO timestamp of evaluation. */
  evaluatedAt: string;
}

// ─── handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authFailure = verifyWorkerSecret(req, "worker/policy-evaluate");
  if (authFailure) return authFailure;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
    });
  }

  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return NextResponse.json(
      apiError("validation", `${path}${issue.message}`),
      { status: 400 },
    );
  }
  const input: Input = parsed.data;

  // VEX-aware adjustment. For a new module no VEX exists; for a
  // rebuild of an existing module, current statements apply.
  // listVexForModule() doesn't throw on unknown slug — returns empty.
  //
  // Same exact/heuristic split as lib/db/policy.ts:evaluateAndPersist.
  // Statements with cveSeverity → subtract by actual severity bucket.
  // Statements without → pessimistic fallback (criticals first).
  const exactSuppressions: { critical: number; high: number; medium: number; low: number } =
    { critical: 0, high: 0, medium: 0, low: 0 };
  let heuristicSuppressed = 0;
  try {
    const vex = await listVexForModule(input.slug);
    const suppressed = vex.filter(
      (s) => s.status === "not_affected" || s.status === "fixed",
    );
    for (const s of suppressed) {
      if (s.cveSeverity === null) {
        heuristicSuppressed += 1;
      } else {
        switch (s.cveSeverity) {
          case "critical":
            exactSuppressions.critical += 1;
            break;
          case "high":
            exactSuppressions.high += 1;
            break;
          case "medium":
            exactSuppressions.medium += 1;
            break;
          case "low":
          case "unknown":
            exactSuppressions.low += 1;
            break;
        }
      }
    }
  } catch (err) {
    console.warn("[worker/policy-evaluate] VEX lookup failed; using raw counts", {
      slug: input.slug,
      error: err instanceof Error ? err.message : "unknown",
    });
  }

  let cveCriticalAfterVex = Math.max(
    0,
    input.cveCritical - exactSuppressions.critical,
  );
  let cveHighAfterVex = Math.max(
    0,
    input.cveHigh - exactSuppressions.high,
  );

  // Heuristic path — for legacy statements without severity, pessimistic
  // distribution: criticals first, then highs.
  let remaining = heuristicSuppressed;
  if (cveCriticalAfterVex > 0 && remaining > 0) {
    const take = Math.min(cveCriticalAfterVex, remaining);
    cveCriticalAfterVex -= take;
    remaining -= take;
  }
  if (cveHighAfterVex > 0 && remaining > 0) {
    const take = Math.min(cveHighAfterVex, remaining);
    cveHighAfterVex -= take;
    remaining -= take;
  }

  const policyInput = buildPolicyInput({
    cveCritical: input.cveCritical,
    cveHigh: input.cveHigh,
    cveMedium: input.cveMedium,
    cveLow: input.cveLow,
    cveCriticalAfterVex,
    cveHighAfterVex,
    slsaLevel: input.slsaLevel,
    trustScore: input.trustScore,
    signature: input.signature,
    sbom: input.sbom,
    rekorEntry: input.rekorEntry,
    slsaAttestation: input.slsaAttestation,
  });

  // Always read the freshest policy. Don't cache here — a worker
  // building right after an admin lands a new revision should see
  // the new revision.
  const active = await getActivePolicy();
  const verdict = evaluate(active.policy, policyInput);

  const resp: SuccessResponse = {
    verdict: verdict.verdict,
    policyRevision: active.revision,
    summary: verdict.summary,
    results: verdict.results,
    effectiveInput: verdict.input,
    evaluatedAt: verdict.evaluatedAt,
  };

  console.info("[worker/policy-evaluate] evaluated", {
    submissionId: input.submissionId,
    slug: input.slug,
    verdict: verdict.verdict,
    policyRevision: active.revision,
    exactSuppressions,
    heuristicSuppressed,
  });

  return NextResponse.json(resp, { status: 200 });
}
