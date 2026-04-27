/**
 * SPECULATIVE — see decisions.md G-2.
 *
 * Per-org admission policy data layer. Mirrors the catalog-wide
 * lib/db/policy.ts but scoped to a specific org.
 *
 * Resolution semantics: when the worker / public verdict endpoint
 * receives a request with org context, it queries this table first.
 * Falls through to the catalog-wide Policy if no org policy
 * exists.
 *
 * **Feature-gated.** All reads return the empty/null shape and writes
 * throw when `FLAREO_FEATURE_PER_ORG_POLICY` is unset. This means
 * even if the schema is migrated and code accidentally calls these
 * helpers, no per-org behavior leaks until the gate fires.
 */
import { prisma } from "./prisma";
import type { Policy } from "@/lib/policy/schema";
import { DEFAULT_POLICY } from "@/lib/policy/schema";
import { requireFeature } from "@/lib/speculative/flags";

export interface OrgActivePolicyResult {
  /** When NULL, no org policy exists; caller should fall through to catalog. */
  policy: Policy | null;
  revision: number;
  notes: string;
  authorName: string | null;
  createdAt: Date | null;
}

/** Empty result returned when the per-org feature is disabled. */
const EMPTY_RESULT: OrgActivePolicyResult = {
  policy: null,
  revision: 0,
  notes: "",
  authorName: null,
  createdAt: null,
};

/**
 * Look up the active policy for a specific org. Returns the highest-
 * revision row. If no policy exists for this org (or the feature is
 * disabled), returns the empty shape — caller falls through to the
 * catalog-wide policy.
 */
export async function getActiveOrgPolicy(
  orgId: string,
): Promise<OrgActivePolicyResult> {
  // Feature gate: when off, behave as if no org policy ever exists.
  // This is the safe fail-open: callers fall through to catalog
  // policy, which is the production behavior pre-G-2.
  if (!requireFeature("perOrgPolicy")) {
    return EMPTY_RESULT;
  }

  const row = (await prisma.admissionPolicyOrg.findFirst({
    where: { orgId } as never,
    orderBy: { revision: "desc" } as never,
    include: {
      author: { select: { name: true } } as never,
    } as never,
  })) as
    | {
        revision: number;
        policyJson: string;
        notes: string;
        author: { name: string | null };
        createdAt: Date;
      }
    | null;

  if (!row) {
    return {
      policy: null,
      revision: 0,
      notes: "",
      authorName: null,
      createdAt: null,
    };
  }

  let policy: Policy;
  try {
    policy = JSON.parse(row.policyJson) as Policy;
  } catch (e) {
    console.error(
      `[org-policy] revision ${row.revision} for org ${orgId} has malformed JSON; falling back to default`,
      e,
    );
    policy = DEFAULT_POLICY;
  }

  return {
    policy,
    revision: row.revision,
    notes: row.notes,
    authorName: row.author?.name ?? null,
    createdAt: row.createdAt,
  };
}

/**
 * Save a new org policy revision. Race-safe: re-reads max revision
 * inside a single attempt; retries once on unique-violation.
 *
 * Returns ok=false with a clear message when the feature is disabled,
 * so callers can surface "this feature isn't enabled" rather than
 * silently failing.
 */
export async function saveOrgPolicy(input: {
  orgId: string;
  policy: Policy;
  notes: string;
  authorId: string;
}): Promise<{ ok: true; revision: number } | { ok: false; error: string }> {
  if (!requireFeature("perOrgPolicy")) {
    return {
      ok: false,
      error: "per-org policy feature is not enabled",
    };
  }

  if (!input.notes || input.notes.length < 5) {
    return {
      ok: false,
      error: "notes must be at least 5 characters",
    };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const latest = (await prisma.admissionPolicyOrg.findFirst({
      where: { orgId: input.orgId } as never,
      orderBy: { revision: "desc" } as never,
      select: { revision: true } as never,
    })) as { revision: number } | null;
    const next = (latest?.revision ?? 0) + 1;

    try {
      await prisma.admissionPolicyOrg.create({
        data: {
          orgId: input.orgId,
          revision: next,
          policyJson: JSON.stringify(input.policy),
          notes: input.notes,
          authorId: input.authorId,
        } as never,
      });
      return { ok: true, revision: next };
    } catch (err) {
      // Retry once on the unique-violation race.
      const code = (err as { code?: string }).code;
      if (code === "P2002" && attempt === 0) {
        continue;
      }
      return {
        ok: false,
        error: err instanceof Error ? err.message : "save failed",
      };
    }
  }
  return { ok: false, error: "save failed after retry" };
}
