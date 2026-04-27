import { z } from "zod";

/**
 * Admission policy document — the JSON shape evaluated against every
 * module's signals (CVE counts, signature, SLSA level, SBOM, VEX).
 *
 * Why JSON instead of Rego:
 *
 * The proposal calls this stage "OPA-based policy gate." OPA's value
 * proposition is twofold: (1) Rego as a declarative policy language,
 * and (2) deterministic, sandboxed evaluation. For a policy this
 * narrow — six numeric thresholds and three boolean flags — Rego
 * would add a runtime, a binary dependency, and a learning curve
 * with no offsetting expressiveness gain.
 *
 * What we ship instead: a JSON document that mirrors what an OPA
 * bundle would carry internally, evaluated by a TypeScript function.
 * If we ever do need full Rego (custom rules submitted by orgs,
 * conditional logic across many signals), the data shape doesn't
 * change — only the evaluator does. The schema below is the
 * contract; the implementation behind it is a swap.
 *
 * Honest framing on the public site: "Policy-as-code admission gate
 * — deterministic JSON policy, OPA-shaped, Rego runtime is a future
 * substitution." We don't claim Rego today.
 */

// ─── single-rule definitions ──────────────────────────────────────

const ThresholdRuleSchema = z.object({
  kind: z.literal("threshold"),
  /// What signal this rule reads. Each maps to a field on the
  /// PolicyInput passed to evaluate().
  signal: z.enum([
    "cve_critical",
    "cve_high",
    "cve_medium",
    "cve_low",
    "cve_critical_after_vex",
    "cve_high_after_vex",
    "slsa_level",
    "trust_score",
  ]),
  /// Comparison operator. "<= 0" means signal must be ≤ 0; "> 50" means must exceed 50.
  op: z.enum(["<=", "<", "==", ">=", ">"]),
  /// Threshold value.
  value: z.number().int(),
  /// What happens if this rule fails. "fail" blocks admission;
  /// "warn" surfaces but doesn't block; "info" is purely informational.
  severity: z.enum(["fail", "warn", "info"]),
  /// Human-readable explanation of why this rule exists. Surfaced
  /// in the verdict UI so humans understand what failed and why.
  rationale: z.string().min(1).max(500),
});

const PresenceRuleSchema = z.object({
  kind: z.literal("presence"),
  /// Field that must be present (truthy, non-empty).
  signal: z.enum(["signature", "sbom", "rekor_entry", "slsa_attestation"]),
  /// As above — fail blocks, warn surfaces, info is FYI.
  severity: z.enum(["fail", "warn", "info"]),
  rationale: z.string().min(1).max(500),
});

const RuleSchema = z.discriminatedUnion("kind", [
  ThresholdRuleSchema,
  PresenceRuleSchema,
]);

// ─── full policy document ─────────────────────────────────────────

export const PolicySchema = z.object({
  /// Schema version of the policy document itself, not the
  /// AdmissionPolicy.revision (which is monotonic across edits).
  /// Lets us evolve the rule shape — adding a new rule kind would
  /// bump this from "1.0" to "1.1" and the evaluator would reject
  /// older policies that lacked migrations.
  version: z.literal("1.0"),
  /// Brief description shown at the top of the admin UI.
  description: z.string().min(1).max(500),
  /// Rules evaluated in order. Order doesn't affect correctness
  /// (every rule runs) but affects display order in the UI and
  /// verdict JSON.
  rules: z.array(RuleSchema).min(1).max(50),
});

export type Policy = z.infer<typeof PolicySchema>;
export type PolicyRule = z.infer<typeof RuleSchema>;
export type ThresholdRule = z.infer<typeof ThresholdRuleSchema>;
export type PresenceRule = z.infer<typeof PresenceRuleSchema>;

// ─── default policy ───────────────────────────────────────────────

/**
 * The policy Flareo ships with. Deliberately conservative for v1 —
 * if a module fails admission, the answer is to fix the underlying
 * issue, not weaken the policy. Loosening happens through editorial
 * review of the policy itself, captured in the AdmissionPolicy
 * revision audit trail.
 *
 * Reasoning per rule:
 *
 * - cve_critical_after_vex == 0: Even one critical CVE that VEX
 *   couldn't suppress is a hard block. There's no acceptable
 *   number-greater-than-zero for criticals.
 *
 * - cve_high_after_vex <= 3: Highs are common in mature codebases
 *   where some classes of CVE are essentially permanent (transitive
 *   deps with slow upstream). Three is enough headroom for normal
 *   cases without becoming permissive.
 *
 * - slsa_level >= 2: Below L2 we can't trust the build provenance
 *   chain. Flareo's own builds emit L2 in-toto; we hold submissions
 *   to the same bar.
 *
 * - signature presence: There is no reason to admit an unsigned
 *   image. The cosign + Rekor flow is the entire point.
 *
 * - sbom presence: Without an SBOM the consumer can't audit what's
 *   inside. Emitted automatically; absence is always a build bug.
 *
 * - trust_score >= 70: Composite score that already reflects the
 *   above, included to catch novel signal combinations.
 */
export const DEFAULT_POLICY: Policy = {
  version: "1.0",
  description:
    "Default Flareo admission policy — conservative thresholds aligned with the proposal-tier supply-chain bar. Edits captured in revision audit trail.",
  rules: [
    {
      kind: "threshold",
      signal: "cve_critical_after_vex",
      op: "<=",
      value: 0,
      severity: "fail",
      rationale:
        "No critical CVEs that VEX can't justify. Critical means RCE or privilege escalation; even one is a hard block.",
    },
    {
      kind: "threshold",
      signal: "cve_high_after_vex",
      op: "<=",
      value: 3,
      severity: "fail",
      rationale:
        "At most 3 high-severity CVEs after VEX suppression. Headroom for legitimate transitive-dep cases without being permissive.",
    },
    {
      kind: "threshold",
      signal: "cve_medium",
      op: "<=",
      value: 25,
      severity: "warn",
      rationale:
        "Medium count is informational — bumps the warn flag but doesn't block. Reviewers can use this to ask publishers for upstream-bump effort.",
    },
    {
      kind: "presence",
      signal: "signature",
      severity: "fail",
      rationale:
        "Cosign signature must be present. The whole verification pitch falls apart without it.",
    },
    {
      kind: "presence",
      signal: "sbom",
      severity: "fail",
      rationale:
        "CycloneDX SBOM must be present. Required for downstream audit and for VEX integration.",
    },
    {
      kind: "presence",
      signal: "rekor_entry",
      severity: "fail",
      rationale:
        "Rekor transparency-log entry must be present. Lets consumers verify the signature exists in the public log without trusting Flareo.",
    },
    {
      kind: "threshold",
      signal: "slsa_level",
      op: ">=",
      value: 2,
      severity: "fail",
      rationale:
        "SLSA level ≥ 2. Below L2 we can't trust the build provenance chain. Flareo's own builds emit L2; submissions must clear the same bar.",
    },
    {
      kind: "presence",
      signal: "slsa_attestation",
      severity: "fail",
      rationale:
        "in-toto SLSA attestation must be present. Implied by SLSA level but checked separately so a missing attestation is a clean error.",
    },
    {
      kind: "threshold",
      signal: "trust_score",
      op: ">=",
      value: 70,
      severity: "warn",
      rationale:
        "Composite trust score ≥ 70. Catches novel signal combinations the per-rule thresholds might miss. Warn rather than fail because the components already failed individually.",
    },
  ],
};

/**
 * Stringify the default policy for seed/migration use. Always pretty-
 * printed with two-space indent so diffs in the AdmissionPolicy table
 * stay readable for humans reviewing policy revisions.
 */
export function stringifyPolicy(p: Policy): string {
  return JSON.stringify(p, null, 2);
}

/**
 * Parse + validate a policy JSON string. Returns a discriminated
 * result object so callers can render validation errors without a
 * try/catch dance.
 */
export type PolicyParseResult =
  | { ok: true; policy: Policy }
  | { ok: false; error: string };

export function parsePolicy(json: string): PolicyParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    return {
      ok: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : "parse failed"}`,
    };
  }
  const result = PolicySchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.length > 0 ? issue.path.join(".") + ": " : "";
    return { ok: false, error: `${path}${issue.message}` };
  }
  return { ok: true, policy: result.data };
}
