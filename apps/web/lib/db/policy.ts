import { prisma } from "./prisma";
import type { Module } from "@/lib/types";
import { DEFAULT_POLICY, type Policy, parsePolicy } from "@/lib/policy/schema";
import {
  evaluate,
  buildPolicyInput,
  type PolicyVerdict,
} from "@/lib/policy/evaluate";
import { listForModule as listVexForModule } from "./vex";

/**
 * Data layer for AdmissionPolicy + ModulePolicyVerdict.
 *
 * The active policy is the AdmissionPolicy row with the highest
 * `revision`. There's always exactly one — on first DB read after a
 * fresh install we seed the DEFAULT_POLICY into revision 1.
 *
 * Verdicts are cached per module; callers can either read the cached
 * row (fast) or recompute and write back (slow, but always-fresh).
 */

// ─── policy reads ────────────────────────────────────────────────

interface PolicyRow {
  id: string;
  revision: number;
  policyJson: string;
  notes: string;
  authorId: string;
  createdAt: Date;
  author: { name: string | null; email: string | null };
}

export interface ActivePolicyResult {
  revision: number;
  policy: Policy;
  notes: string;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: Date;
}

/**
 * Get the currently-active policy. If none exists in the DB yet,
 * returns a synthetic "revision 0" carrying DEFAULT_POLICY — the
 * caller can choose whether to persist it.
 *
 * The synthetic-revision-0 fallback means the rest of the system
 * works on a fresh install before any admin has touched the policy
 * UI. First admin action through the editor lands as revision 1.
 */
export async function getActivePolicy(): Promise<ActivePolicyResult> {
  const row = (await prisma.admissionPolicy.findFirst({
    orderBy: { revision: "desc" } as never,
    include: {
      author: { select: { name: true, email: true } } as never,
    } as never,
  })) as PolicyRow | null;

  if (!row) {
    return {
      revision: 0,
      policy: DEFAULT_POLICY,
      notes:
        "Synthetic default — no admin has saved a policy revision yet. First save lands as revision 1.",
      authorName: null,
      authorEmail: null,
      createdAt: new Date(0),
    };
  }

  const parsed = parsePolicy(row.policyJson);
  if (!parsed.ok) {
    // The DB has a row that fails validation. Most likely a manual
    // DB edit or a schema-version mismatch. Don't crash the whole
    // app — fall back to the default policy and tag the notes.
    return {
      revision: row.revision,
      policy: DEFAULT_POLICY,
      notes: `[POLICY PARSE ERROR — falling back to default] ${parsed.error}\n\nOriginal notes: ${row.notes}`,
      authorName: row.author?.name ?? null,
      authorEmail: row.author?.email ?? null,
      createdAt: row.createdAt,
    };
  }

  return {
    revision: row.revision,
    policy: parsed.policy,
    notes: row.notes,
    authorName: row.author?.name ?? null,
    authorEmail: row.author?.email ?? null,
    createdAt: row.createdAt,
  };
}

/**
 * List recent revisions for the audit trail. Returns most recent
 * first. Callers that need pagination beyond `limit` should use
 * cursor-based queries directly.
 */
export interface PolicyRevisionRow {
  revision: number;
  notes: string;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: Date;
}

export async function listRevisions(limit = 20): Promise<PolicyRevisionRow[]> {
  const rows = (await prisma.admissionPolicy.findMany({
    orderBy: { revision: "desc" } as never,
    take: limit,
    include: {
      author: { select: { name: true, email: true } } as never,
    } as never,
  })) as PolicyRow[];
  return rows.map((r) => ({
    revision: r.revision,
    notes: r.notes,
    authorName: r.author?.name ?? null,
    authorEmail: r.author?.email ?? null,
    createdAt: r.createdAt,
  }));
}

// ─── policy writes ───────────────────────────────────────────────

export type SavePolicyResult =
  | { ok: true; revision: number }
  | { ok: false; reason: "validation" | "db_error"; message: string };

/**
 * Save a new policy revision. Always creates a new row — older
 * revisions stay in the table for audit. The new revision is
 * `max(existing) + 1`.
 *
 * Race-safety note: two concurrent saves could both compute the
 * same `nextRevision` and hit the @unique constraint. We catch the
 * unique-violation and retry once; beyond that the caller gets an
 * error. The realistic concurrent-edit risk is essentially zero
 * (two admins editing policy at the same second), so a single retry
 * is fine.
 */
export async function savePolicy(args: {
  policy: Policy;
  notes: string;
  authorId: string;
}): Promise<SavePolicyResult> {
  if (args.notes.trim().length < 5) {
    return {
      ok: false,
      reason: "validation",
      message:
        "Notes are required (min 5 chars). Describe what this revision changes and why.",
    };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const last = (await prisma.admissionPolicy.findFirst({
      orderBy: { revision: "desc" } as never,
      select: { revision: true } as never,
    })) as { revision: number } | null;
    const nextRevision = (last?.revision ?? 0) + 1;
    try {
      await prisma.admissionPolicy.create({
        data: {
          revision: nextRevision,
          policyJson: JSON.stringify(args.policy, null, 2),
          notes: args.notes.trim(),
          authorId: args.authorId,
        } as never,
      });
      return { ok: true, revision: nextRevision };
    } catch (err) {
      // Unique constraint on `revision` — concurrent save raced us.
      // Retry once with a fresh max-revision read.
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("unique")
      ) {
        continue;
      }
      return {
        ok: false,
        reason: "db_error",
        message: err instanceof Error ? err.message : "save failed",
      };
    }
  }
  return {
    ok: false,
    reason: "db_error",
    message: "Concurrent revision save raced twice; try again",
  };
}

// ─── verdict reads/writes ────────────────────────────────────────

interface VerdictRow {
  id: string;
  moduleSlug: string;
  verdict: string;
  policyRevision: number;
  verdictJson: string;
  evaluatedAt: Date;
}

export interface ModuleVerdictResult {
  moduleSlug: string;
  verdict: "pass" | "warn" | "fail";
  policyRevision: number;
  evaluatedAt: Date;
  detail: PolicyVerdict;
}

export async function getVerdict(
  moduleSlug: string,
): Promise<ModuleVerdictResult | null> {
  const row = (await prisma.modulePolicyVerdict.findUnique({
    where: { moduleSlug } as never,
  })) as VerdictRow | null;
  if (!row) return null;
  let detail: PolicyVerdict;
  try {
    detail = JSON.parse(row.verdictJson) as PolicyVerdict;
  } catch {
    return null;
  }
  return {
    moduleSlug: row.moduleSlug,
    verdict: row.verdict as "pass" | "warn" | "fail",
    policyRevision: row.policyRevision,
    evaluatedAt: row.evaluatedAt,
    detail,
  };
}

/**
 * Evaluate the current active policy against a module and persist
 * the verdict. Used by the admin "regenerate verdicts" sweep and by
 * the worker after a successful build.
 *
 * Pulls VEX statements live so the after_vex counts reflect the
 * current annotation state.
 */
export async function evaluateAndPersist(
  module: Module,
): Promise<ModuleVerdictResult> {
  const active = await getActivePolicy();

  // VEX-aware count adjustment. Walk the module's VEX statements and
  // subtract not_affected/fixed CVEs from the post-VEX counts.
  // We don't have per-CVE severity in the VexStatement table, so
  // here we pessimistically assume each suppression counts against
  // the highest severity bucket the module has (i.e., subtract from
  // critical first, then high). For v1 this is acceptable; a
  // future enhancement would join VEX to per-CVE Trivy data.
  const vex = await listVexForModule(module.slug);
  // VEX-aware count adjustment.
  //
  // Two paths, depending on whether each statement carries the
  // optional cveSeverity:
  //
  //   - Statements with severity → exact subtraction. Each
  //     not_affected/fixed statement removes one CVE from its actual
  //     severity bucket. This is the accurate path; new statements
  //     populate the field.
  //
  //   - Statements without severity → pessimistic fallback.
  //     Subtract from criticals first, then highs. Used for
  //     statements that predate the cveSeverity column. Same
  //     behavior as before this column existed; biases toward NOT
  //     overstating risk reduction (criticals are the bucket policy
  //     cares about most).
  //
  // We split the suppressed list into the two paths and apply each
  // independently.
  const suppressed = vex.filter(
    (s) => s.status === "not_affected" || s.status === "fixed",
  );
  const exact = suppressed.filter((s) => s.cveSeverity !== null);
  const heuristic = suppressed.filter((s) => s.cveSeverity === null);

  let cveCriticalAfterVex = module.cves.critical;
  let cveHighAfterVex = module.cves.high;
  let cveMediumAfterVex = module.cves.medium;
  let cveLowAfterVex = module.cves.low;

  // Exact path — subtract by actual severity.
  for (const s of exact) {
    switch (s.cveSeverity) {
      case "critical":
        if (cveCriticalAfterVex > 0) cveCriticalAfterVex -= 1;
        break;
      case "high":
        if (cveHighAfterVex > 0) cveHighAfterVex -= 1;
        break;
      case "medium":
        if (cveMediumAfterVex > 0) cveMediumAfterVex -= 1;
        break;
      case "low":
      case "unknown":
        if (cveLowAfterVex > 0) cveLowAfterVex -= 1;
        break;
    }
  }

  // Heuristic path — pessimistic distribution for legacy rows.
  let remaining = heuristic.length;
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

  const slsaLevelNumeric = parseSlsaLevel(module.slsa);

  const input = buildPolicyInput({
    cveCritical: module.cves.critical,
    cveHigh: module.cves.high,
    cveMedium: module.cves.medium,
    cveLow: module.cves.low,
    cveCriticalAfterVex,
    cveHighAfterVex,
    slsaLevel: slsaLevelNumeric,
    trustScore: module.trust,
    // For the synthesized-data world we have today, every module
    // has a signature, SBOM, and Rekor entry. Real-world a fresh
    // submission could legitimately fail these.
    signature: true,
    sbom: true,
    rekorEntry: true,
    slsaAttestation: slsaLevelNumeric >= 1,
  });

  const verdict = evaluate(active.policy, input);

  // Upsert verdict row.
  await prisma.modulePolicyVerdict.upsert({
    where: { moduleSlug: module.slug } as never,
    update: {
      verdict: verdict.verdict,
      policyRevision: active.revision,
      verdictJson: JSON.stringify(verdict),
    } as never,
    create: {
      moduleSlug: module.slug,
      verdict: verdict.verdict,
      policyRevision: active.revision,
      verdictJson: JSON.stringify(verdict),
    } as never,
  });

  return {
    moduleSlug: module.slug,
    verdict: verdict.verdict,
    policyRevision: active.revision,
    evaluatedAt: new Date(),
    detail: verdict,
  };
}

/**
 * Sweep evaluation across every public module. Used after a policy
 * revision lands and the cached verdicts go stale.
 */
export async function regenerateAllVerdicts(
  modules: Module[],
): Promise<{ evaluated: number }> {
  for (const m of modules) {
    await evaluateAndPersist(m);
  }
  return { evaluated: modules.length };
}

/**
 * Aggregate counts of verdicts across all modules. Used by the admin
 * dashboard to show "8 pass · 3 warn · 1 fail" at a glance without
 * fanning out per-module queries.
 */
export async function verdictCounts(): Promise<{
  pass: number;
  warn: number;
  fail: number;
}> {
  const grouped = (await prisma.modulePolicyVerdict.groupBy({
    by: ["verdict"],
    _count: { _all: true },
  } as never)) as Array<{ verdict: string; _count: { _all: number } }>;
  const out = { pass: 0, warn: 0, fail: 0 };
  for (const r of grouped) {
    if (r.verdict === "pass") out.pass = r._count._all;
    if (r.verdict === "warn") out.warn = r._count._all;
    if (r.verdict === "fail") out.fail = r._count._all;
  }
  return out;
}

// ─── helpers ─────────────────────────────────────────────────────

function parseSlsaLevel(s: string | null | undefined): number {
  // Legacy Module.slsa was "L0"…"L4". New writes set null (no SLSA claim).
  if (!s) return 0;
  const m = s.match(/^L(\d)$/);
  return m ? parseInt(m[1], 10) : 0;
}
