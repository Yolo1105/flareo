import type { Policy, PolicyRule, ThresholdRule, PresenceRule } from "./schema";

/**
 * Pure policy evaluator.
 *
 * Takes a snapshot of a module's signals (PolicyInput) plus a Policy
 * document, returns a verdict containing per-rule results and a
 * top-level pass/warn/fail decision.
 *
 * Determinism: same inputs → same output, every time. No side effects,
 * no I/O, no random sources. Tests can pin verdicts trivially.
 *
 * The function is intentionally narrow: it doesn't reach into the
 * database, doesn't fetch VEX statements live, doesn't compute trust
 * scores. The caller assembles the inputs and calls evaluate(). This
 * is the same shape an OPA evaluator would have — bundle the input,
 * invoke evaluate, get a verdict.
 */

export interface PolicyInput {
  /** From Trivy report. */
  cve_critical: number;
  cve_high: number;
  cve_medium: number;
  cve_low: number;
  /**
   * Same as cve_critical / cve_high, but with VEX statements applied:
   * findings annotated as not_affected or fixed are subtracted before
   * the count lands here. Allows policy rules to differentiate
   * "raw scanner output" from "real risk after triage."
   */
  cve_critical_after_vex: number;
  cve_high_after_vex: number;
  /** SLSA level (0 = none, 1, 2, 3, 4 = highest). */
  slsa_level: number;
  /** 0-100, current trust-score formula. */
  trust_score: number;
  /** Truthy iff a cosign signature exists. */
  signature: boolean;
  /** Truthy iff a CycloneDX SBOM exists. */
  sbom: boolean;
  /** Truthy iff a Rekor transparency-log entry exists. */
  rekor_entry: boolean;
  /** Truthy iff an in-toto SLSA attestation exists. */
  slsa_attestation: boolean;
}

// ─── verdict shape ────────────────────────────────────────────────

export type RuleResult =
  | {
      rule: PolicyRule;
      status: "pass";
    }
  | {
      rule: PolicyRule;
      status: "fail" | "warn" | "info";
      message: string;
      observed: string | number | boolean;
    };

export interface PolicyVerdict {
  /**
   * Top-level decision:
   *   "pass" — every fail-severity rule passed; no warns triggered
   *   "warn" — every fail-severity rule passed, but ≥1 warn triggered
   *   "fail" — at least one fail-severity rule failed
   */
  verdict: "pass" | "warn" | "fail";
  /**
   * Compact human-readable summary, for log lines and the public
   * verdict endpoint. Per-rule detail in `results`.
   */
  summary: string;
  /** Per-rule outcomes, in the same order as the policy. */
  results: RuleResult[];
  /** The exact input the evaluator saw. Echoed for debuggability. */
  input: PolicyInput;
  /** ISO 8601 timestamp of the evaluation. */
  evaluatedAt: string;
}

// ─── evaluator ────────────────────────────────────────────────────

export function evaluate(policy: Policy, input: PolicyInput): PolicyVerdict {
  const results: RuleResult[] = policy.rules.map((rule) => evaluateRule(rule, input));

  // Top-level verdict aggregation:
  //   any fail-severity rule failed → "fail"
  //   no fails, but any warn-severity rule failed → "warn"
  //   otherwise → "pass"
  // info-severity rule failures don't affect the top-level verdict.
  let verdict: "pass" | "warn" | "fail" = "pass";
  for (const r of results) {
    if (r.status === "fail") {
      verdict = "fail";
      break;
    }
    if (r.status === "warn") {
      verdict = "warn";
    }
  }

  const failCount = results.filter((r) => r.status === "fail").length;
  const warnCount = results.filter((r) => r.status === "warn").length;
  const summary =
    verdict === "pass"
      ? `Pass. ${results.length} rules evaluated; all clear.`
      : verdict === "warn"
        ? `Warn. ${warnCount} warning${warnCount === 1 ? "" : "s"}; no blockers.`
        : `Fail. ${failCount} blocker${failCount === 1 ? "" : "s"} ${
            warnCount > 0 ? `+ ${warnCount} warning${warnCount === 1 ? "" : "s"}` : ""
          }.`.trim();

  return {
    verdict,
    summary,
    results,
    input,
    evaluatedAt: new Date().toISOString(),
  };
}

// ─── per-rule evaluation ──────────────────────────────────────────

function evaluateRule(rule: PolicyRule, input: PolicyInput): RuleResult {
  if (rule.kind === "threshold") {
    return evaluateThreshold(rule, input);
  }
  return evaluatePresence(rule, input);
}

function evaluateThreshold(rule: ThresholdRule, input: PolicyInput): RuleResult {
  const observed = input[rule.signal];
  const passed = compare(observed, rule.op, rule.value);
  if (passed) {
    return { rule, status: "pass" };
  }
  return {
    rule,
    status: rule.severity,
    observed,
    message: `${rule.signal} = ${observed}; rule requires ${rule.op} ${rule.value}`,
  };
}

function evaluatePresence(rule: PresenceRule, input: PolicyInput): RuleResult {
  const observed = Boolean(input[rule.signal]);
  if (observed) {
    return { rule, status: "pass" };
  }
  return {
    rule,
    status: rule.severity,
    observed,
    message: `${rule.signal} not present`,
  };
}

function compare(a: number, op: ThresholdRule["op"], b: number): boolean {
  switch (op) {
    case "<=":
      return a <= b;
    case "<":
      return a < b;
    case "==":
      return a === b;
    case ">=":
      return a >= b;
    case ">":
      return a > b;
  }
}

// ─── input builders ───────────────────────────────────────────────

/**
 * Helper: assemble PolicyInput from a Module + its VEX statements.
 *
 * VEX subtraction rule: a CVE annotated as `not_affected` or `fixed`
 * is removed from the post-VEX count. `under_investigation` and
 * `affected` leave the count unchanged. This matches the OpenVEX
 * 0.2.0 semantics — those four states are the canonical statuses.
 *
 * trust_score should already be the module's stored composite score
 * (lib/data/trust-score.ts), passed in by the caller. The evaluator
 * doesn't recompute it.
 */
export function buildPolicyInput(args: {
  cveCritical: number;
  cveHigh: number;
  cveMedium: number;
  cveLow: number;
  /** VEX-suppressed CVE counts. Pass cveCritical/cveHigh if no VEX yet. */
  cveCriticalAfterVex: number;
  cveHighAfterVex: number;
  slsaLevel: number;
  trustScore: number;
  signature: boolean;
  sbom: boolean;
  rekorEntry: boolean;
  slsaAttestation: boolean;
}): PolicyInput {
  return {
    cve_critical: args.cveCritical,
    cve_high: args.cveHigh,
    cve_medium: args.cveMedium,
    cve_low: args.cveLow,
    cve_critical_after_vex: args.cveCriticalAfterVex,
    cve_high_after_vex: args.cveHighAfterVex,
    slsa_level: args.slsaLevel,
    trust_score: args.trustScore,
    signature: args.signature,
    sbom: args.sbom,
    rekor_entry: args.rekorEntry,
    slsa_attestation: args.slsaAttestation,
  };
}
