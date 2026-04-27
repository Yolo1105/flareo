/**
 * Worker-side policy evaluation client.
 *
 * Calls the main app's /api/v1/worker/policy-evaluate endpoint with
 * the freshly-built submission's signals. Returns the verdict; the
 * worker uses it to decide whether to promote the submission to the
 * public catalog or hold it for review.
 *
 * Why a network call instead of evaluating locally:
 *   - The active policy lives in the main app's DB. The worker can't
 *     read it without coupling to the main app's Prisma schema.
 *   - The policy can change between worker boots; the endpoint always
 *     reads the live revision.
 *   - The verdict computation is microseconds; the network round-trip
 *     is the dominant cost, but in the context of a 2-5 minute build
 *     it's rounding error.
 *
 * Failure mode: if the main app is unreachable or returns an unexpected
 * response, the helper returns null. Callers MUST handle null
 * explicitly. The worker's policy is to fail closed — null verdict ==
 * don't publish, but DO record the build as built; an admin can then
 * either retry the policy evaluation or publish manually after
 * inspection.
 */

import { log } from "./log.js";

export type PolicyVerdictResult =
  | {
      ok: true;
      verdict: "pass" | "warn" | "fail";
      policyRevision: number;
      summary: string;
    }
  | {
      ok: false;
      reason: "unreachable" | "auth" | "validation" | "server_error" | "bad_response";
      message: string;
    };

export interface PolicyEvalInput {
  submissionId: string;
  slug: string;
  cveCritical: number;
  cveHigh: number;
  cveMedium: number;
  cveLow: number;
  slsaLevel: number;
  trustScore: number;
  signature: boolean;
  sbom: boolean;
  rekorEntry: boolean;
  slsaAttestation: boolean;
}

interface SuccessResponse {
  verdict: "pass" | "warn" | "fail";
  policyRevision: number;
  summary: string;
  results: unknown;
  effectiveInput: unknown;
  evaluatedAt: string;
}

interface ErrorResponse {
  error?: { code?: string; message?: string };
}

/**
 * Call the main app's policy-evaluate endpoint. Returns a
 * discriminated result that the caller pattern-matches on.
 *
 * Network/DNS errors and 5xx responses both surface as `unreachable`
 * (worker treats them the same way — couldn't get a verdict, fail
 * closed). 401 surfaces as `auth` (operator misconfig — worth a
 * loud Sentry event). 400 surfaces as `validation` (worker bug —
 * also a Sentry event). 200 with malformed body surfaces as
 * `bad_response`.
 */
export async function evaluatePolicy(
  input: PolicyEvalInput,
): Promise<PolicyVerdictResult> {
  const url = process.env.MAIN_APP_URL;
  const secret = process.env.FLAREO_WORKER_SECRET;
  if (!url || !secret) {
    return {
      ok: false,
      reason: "auth",
      message: "MAIN_APP_URL or FLAREO_WORKER_SECRET not configured",
    };
  }

  let resp: Response;
  try {
    resp = await fetch(`${url}/api/v1/worker/policy-evaluate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-worker-secret": secret,
      },
      body: JSON.stringify(input),
      // Generous but bounded — a 30-second policy eval would be a
      // server bug we'd want to surface quickly.
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    return {
      ok: false,
      reason: "unreachable",
      message: err instanceof Error ? err.message : "network error",
    };
  }

  if (resp.status === 401) {
    return {
      ok: false,
      reason: "auth",
      message: "main app rejected worker secret",
    };
  }

  if (resp.status >= 500) {
    return {
      ok: false,
      reason: "server_error",
      message: `main app returned ${resp.status}`,
    };
  }

  if (resp.status === 400) {
    let detail = "";
    try {
      const body = (await resp.json()) as ErrorResponse;
      detail = body.error?.message ?? "";
    } catch {
      // Ignore parse failure on error body — the 400 itself is enough.
    }
    return {
      ok: false,
      reason: "validation",
      message: detail || "main app rejected the input shape",
    };
  }

  if (!resp.ok) {
    return {
      ok: false,
      reason: "server_error",
      message: `unexpected status ${resp.status}`,
    };
  }

  let body: SuccessResponse;
  try {
    body = (await resp.json()) as SuccessResponse;
  } catch (err) {
    return {
      ok: false,
      reason: "bad_response",
      message: `couldn't parse response JSON: ${
        err instanceof Error ? err.message : "unknown"
      }`,
    };
  }

  if (
    body.verdict !== "pass" &&
    body.verdict !== "warn" &&
    body.verdict !== "fail"
  ) {
    return {
      ok: false,
      reason: "bad_response",
      message: `unexpected verdict value: ${String(body.verdict)}`,
    };
  }
  if (typeof body.policyRevision !== "number") {
    return {
      ok: false,
      reason: "bad_response",
      message: "policyRevision missing or not a number",
    };
  }

  log.info("policy verdict received", {
    submissionId: input.submissionId,
    verdict: body.verdict,
    policyRevision: body.policyRevision,
  });

  return {
    ok: true,
    verdict: body.verdict,
    policyRevision: body.policyRevision,
    summary: body.summary ?? "",
  };
}
