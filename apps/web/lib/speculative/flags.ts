/**
 * Speculative-feature flags.
 *
 * Each gated feature in decisions.md ships behind a flag. When the
 * gate fires (or is killed), flip the flag — code paths that depend
 * on the feature compile away to no-ops, and removing the feature
 * later means deleting the flag and the matching code paths in one
 * pass instead of grepping the whole codebase.
 *
 * Flags default to OFF in production. The runbook says to flip them
 * on only after the trigger criteria in decisions.md fire.
 *
 * Why this matters: speculative work builds debt at the call sites,
 * not at the schema. A column you never read is harmless; a query
 * that fans out from 15 places is the painful part. Routing every
 * call site through these flags + the facade in `lib/speculative/`
 * keeps the blast radius bounded.
 */

export interface SpeculativeFlags {
  /** G-1: per-user previews. Off until F0 conversion data supports it. */
  previewsPerUser: boolean;
  /** G-2: per-org admission policy. Off until first paying org asks. */
  perOrgPolicy: boolean;
  /** G-3: SLSA L3 attestation + admin surfaces. Off until customer asks. */
  slsaL3: boolean;
  /** G-4: reproducible-build verification. Off until G-3 in motion. */
  reproducibleBuilds: boolean;
  /** G-5: self-host Enterprise bundle features. Off until enterprise asks. */
  selfHost: boolean;
  /**
   * Dockerfile / CNB submission POSTs. Off by default — the public
   * build path was retired (ADR-012). Flip only to temporarily re-open
   * the historical submission API for internal debugging.
   */
  dockerfileSubmissions: boolean;
}

/**
 * Read flags from env. Each maps to one decisions.md gate.
 *
 * Setting a flag to "true" means: I have verified that the gate's
 * trigger criteria fired, and I am authorizing the feature to be
 * exposed to users. Don't flip these casually.
 */
export function readSpeculativeFlags(): SpeculativeFlags {
  return {
    previewsPerUser:
      process.env.FLAREO_FEATURE_PREVIEWS_PER_USER === "true",
    perOrgPolicy:
      process.env.FLAREO_FEATURE_PER_ORG_POLICY === "true",
    slsaL3: process.env.FLAREO_FEATURE_SLSA_L3 === "true",
    reproducibleBuilds:
      process.env.FLAREO_FEATURE_REPRODUCIBLE_BUILDS === "true",
    selfHost: process.env.FLAREO_FEATURE_SELF_HOST === "true",
    dockerfileSubmissions:
      process.env.FLAREO_FEATURE_DOCKERFILE_SUBMISSIONS === "true",
  };
}

/**
 * Singleton — read once at module load. Flags don't change at runtime
 * within a process; restart to flip.
 */
export const speculativeFlags = readSpeculativeFlags();

/**
 * Type-level + runtime guard. Use at the top of any code path that
 * depends on a speculative feature:
 *
 *   import { requireFeature } from "@/lib/speculative/flags";
 *   ...
 *   if (!requireFeature("previewsPerUser")) {
 *     return NextResponse.json(apiError("not_available", "..."), { status: 404 });
 *   }
 *
 * Returns false (with no side effects) when the flag is off, true
 * when on. Centralizing the check means future "delete this
 * speculative feature" work is a single grep for the flag name.
 */
export function requireFeature(flag: keyof SpeculativeFlags): boolean {
  return speculativeFlags[flag];
}
