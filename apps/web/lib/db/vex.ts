import { prisma } from "./prisma";
import { moduleExistsBySlug } from "./queries";

/**
 * Data layer for VexStatement records.
 *
 * Mirrors the lib/db/reviews.ts pattern: row shape, type-safe writers,
 * read helpers used by both the API endpoint that emits the OpenVEX
 * document and the admin UI that lets reviewers manage statements.
 *
 * The status field is "not_affected" | "affected" | "fixed" |
 * "under_investigation" — these are the four OpenVEX 0.2.0 statuses.
 * Stored as string for forward-compat; validated at the API layer.
 */

export type VexStatus =
  | "not_affected"
  | "affected"
  | "fixed"
  | "under_investigation";

/**
 * OpenVEX justifications for status="not_affected". The complete list
 * per the OpenVEX 0.2.0 spec; we accept any of these as valid input.
 */
export type VexJustification =
  | "component_not_present"
  | "vulnerable_code_not_present"
  | "vulnerable_code_not_in_execute_path"
  | "vulnerable_code_cannot_be_controlled_by_adversary"
  | "inline_mitigations_already_exist";

export const VEX_STATUSES: readonly VexStatus[] = [
  "not_affected",
  "affected",
  "fixed",
  "under_investigation",
] as const;

export const VEX_JUSTIFICATIONS: readonly VexJustification[] = [
  "component_not_present",
  "vulnerable_code_not_present",
  "vulnerable_code_not_in_execute_path",
  "vulnerable_code_cannot_be_controlled_by_adversary",
  "inline_mitigations_already_exist",
] as const;

export type CveSeverity = "critical" | "high" | "medium" | "low" | "unknown";

export interface VexStatementRow {
  id: string;
  moduleSlug: string;
  cve: string;
  /**
   * Severity bucket for the CVE this statement applies to. Sourced
   * from Trivy when the statement was created. Nullable on rows
   * that predate the column. The admission-policy evaluator uses
   * this for exact per-bucket subtraction; absent → falls back to
   * the pessimistic "criticals first, then highs" heuristic.
   */
  cveSeverity: CveSeverity | null;
  status: VexStatus;
  justification: VexJustification | null;
  impactStatement: string | null;
  authorId: string;
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DbRow {
  id: string;
  moduleSlug: string;
  cve: string;
  cveSeverity: string | null;
  status: string;
  justification: string | null;
  impactStatement: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string | null };
}

function rowToStatement(r: DbRow): VexStatementRow {
  return {
    id: r.id,
    moduleSlug: r.moduleSlug,
    cve: r.cve,
    cveSeverity: normalizeSeverity(r.cveSeverity),
    // The DB column is freeform string; we cast back to VexStatus and
    // expect API-layer validation to have constrained writes.
    status: r.status as VexStatus,
    justification: (r.justification as VexJustification | null) ?? null,
    impactStatement: r.impactStatement,
    authorId: r.authorId,
    authorName: r.author?.name ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/**
 * Normalize a stored severity string to the typed CveSeverity union.
 * Returns null for null input or any string we don't recognize — the
 * evaluator's fallback path handles null cleanly.
 */
function normalizeSeverity(s: string | null): CveSeverity | null {
  if (s === null) return null;
  switch (s.toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    case "unknown":
      return "unknown";
    default:
      return null;
  }
}

// ─── reads ────────────────────────────────────────────────────────

/**
 * Aggregate counts of VEX statements per module. Used by the admin
 * index page to render annotation coverage without fanning out N
 * queries (one per module).
 *
 * Returns a Map keyed by moduleSlug with the count of statements
 * for that module. Modules with zero statements don't appear in the
 * map; callers should default to 0 on missing keys.
 */
export async function countsBySlug(): Promise<Map<string, number>> {
  const grouped = (await prisma.vexStatement.groupBy({
    by: ["moduleSlug"],
    _count: { _all: true },
  } as never)) as Array<{ moduleSlug: string; _count: { _all: number } }>;
  const out = new Map<string, number>();
  for (const row of grouped) {
    out.set(row.moduleSlug, row._count._all);
  }
  return out;
}

/**
 * List all VEX statements for a module. Used by both the OpenVEX
 * emitter (/api/v1/modules/[slug]/vex) and the admin annotation UI.
 */
export async function listForModule(
  moduleSlug: string,
): Promise<VexStatementRow[]> {
  const rows = (await prisma.vexStatement.findMany({
    where: { moduleSlug } as never,
    include: { author: { select: { name: true } } } as never,
    orderBy: { createdAt: "asc" } as never,
  })) as DbRow[];
  return rows.map(rowToStatement);
}

/**
 * Look up a single statement by (module, cve). Returns null if
 * unannotated. The unique index on (moduleSlug, cve) makes this O(1).
 */
export async function findByModuleCve(
  moduleSlug: string,
  cve: string,
): Promise<VexStatementRow | null> {
  const row = (await prisma.vexStatement.findUnique({
    where: { moduleSlug_cve: { moduleSlug, cve } } as never,
    include: { author: { select: { name: true } } } as never,
  })) as DbRow | null;
  return row ? rowToStatement(row) : null;
}

// ─── writes ───────────────────────────────────────────────────────

export interface UpsertInput {
  moduleSlug: string;
  cve: string;
  /**
   * Severity of the CVE this statement applies to. Sourced from the
   * Trivy report at the time the reviewer creates the annotation.
   * Optional for backward compat — older write paths that don't
   * set it land NULL, and the policy evaluator falls back to its
   * pessimistic-distribution heuristic for those rows. New write
   * paths (including the admin form) populate it from the Trivy
   * findings table.
   */
  cveSeverity?: CveSeverity | null;
  status: VexStatus;
  justification: VexJustification | null;
  impactStatement: string | null;
  authorId: string;
}

export type UpsertResult =
  | { ok: true; statement: VexStatementRow }
  | { ok: false; reason: "module_not_found" | "validation" | "db_error"; message: string };

/**
 * Validation rules:
 *   - status="not_affected" requires a justification
 *   - status="affected" should have an impactStatement (recommended, not enforced)
 *   - cve must match CVE-YYYY-NNNN…NNNN shape
 *   - cveSeverity, if provided, must be one of the typed values
 *   - impactStatement capped at 4000 chars
 */
export function validateUpsert(input: UpsertInput): string | null {
  if (!/^CVE-\d{4}-\d{4,7}$/.test(input.cve)) {
    return "cve must match CVE-YYYY-NNNN…NNNN format";
  }
  if (!VEX_STATUSES.includes(input.status)) {
    return `status must be one of: ${VEX_STATUSES.join(", ")}`;
  }
  if (input.status === "not_affected" && !input.justification) {
    return "status=not_affected requires a justification";
  }
  if (
    input.justification &&
    !VEX_JUSTIFICATIONS.includes(input.justification)
  ) {
    return `justification must be one of: ${VEX_JUSTIFICATIONS.join(", ")}`;
  }
  if (
    input.cveSeverity !== undefined &&
    input.cveSeverity !== null &&
    !["critical", "high", "medium", "low", "unknown"].includes(input.cveSeverity)
  ) {
    return "cveSeverity must be one of: critical, high, medium, low, unknown";
  }
  if (input.impactStatement && input.impactStatement.length > 4000) {
    return "impactStatement must be 4000 chars or fewer";
  }
  return null;
}

/**
 * Upsert a statement. If one exists for (moduleSlug, cve), the
 * existing row is updated and the timestamp bumped. Otherwise a new
 * row is created. Validation happens before the DB call.
 */
export async function upsert(input: UpsertInput): Promise<UpsertResult> {
  const validationError = validateUpsert(input);
  if (validationError) {
    return { ok: false, reason: "validation", message: validationError };
  }

  // Confirm the module exists. Without this check the FK would error
  // on insert with a less helpful message.
  const moduleExists = await moduleExistsBySlug(input.moduleSlug);
  if (!moduleExists) {
    return {
      ok: false,
      reason: "module_not_found",
      message: `module "${input.moduleSlug}" not found`,
    };
  }

  // Normalize undefined severity → null so the DB sees an explicit
  // NULL rather than a Prisma "skip this field" signal. Important on
  // updates: passing undefined would leave the existing severity
  // unchanged, which silently retains stale data after a reviewer
  // re-annotates a CVE whose severity Trivy reclassified.
  const cveSeverity = input.cveSeverity ?? null;

  try {
    const row = (await prisma.vexStatement.upsert({
      where: {
        moduleSlug_cve: {
          moduleSlug: input.moduleSlug,
          cve: input.cve,
        },
      } as never,
      update: {
        cveSeverity,
        status: input.status,
        justification: input.justification,
        impactStatement: input.impactStatement,
        authorId: input.authorId,
      } as never,
      create: {
        moduleSlug: input.moduleSlug,
        cve: input.cve,
        cveSeverity,
        status: input.status,
        justification: input.justification,
        impactStatement: input.impactStatement,
        authorId: input.authorId,
      } as never,
      include: { author: { select: { name: true } } } as never,
    })) as DbRow;
    return { ok: true, statement: rowToStatement(row) };
  } catch (err) {
    return {
      ok: false,
      reason: "db_error",
      message: err instanceof Error ? err.message : "database error",
    };
  }
}

/**
 * Remove a statement. Used when a reviewer decides the annotation was
 * incorrect or the underlying CVE no longer applies (e.g. upstream
 * patched it and Trivy stopped reporting it).
 */
export async function deleteByModuleCve(
  moduleSlug: string,
  cve: string,
): Promise<boolean> {
  try {
    await prisma.vexStatement.delete({
      where: {
        moduleSlug_cve: { moduleSlug, cve },
      } as never,
    });
    return true;
  } catch {
    // Includes the "row not found" case — idempotent delete.
    return false;
  }
}

// ─── OpenVEX emission ────────────────────────────────────────────

/**
 * Render the canonical OpenVEX 0.2.0 document for a module from its
 * stored statements. Returns the full document including the standard
 * @context, @id, author, timestamp, version fields.
 *
 * Consumers download this via /api/v1/modules/<slug>/vex and pass it
 * to their own scanner pipelines as a suppression source.
 */
export interface OpenVexDocument {
  "@context": "https://openvex.dev/ns/v0.2.0";
  "@id": string;
  author: string;
  timestamp: string;
  version: number;
  statements: OpenVexStatement[];
}

export interface OpenVexStatement {
  vulnerability: { name: string };
  products: { "@id": string }[];
  status: VexStatus;
  justification?: VexJustification;
  impact_statement?: string;
  timestamp: string;
}

export function buildOpenVexDocument(
  moduleSlug: string,
  moduleDigest: string,
  statements: VexStatementRow[],
): OpenVexDocument {
  // Stable @id derived from the module slug + digest. If a module
  // rebuilds (digest changes), the @id changes, which is correct
  // OpenVEX semantics — the document refers to a specific version.
  const docId = `https://flareo.app/vex/${moduleSlug}/${moduleDigest.replace("sha256:", "").slice(0, 12)}`;

  return {
    "@context": "https://openvex.dev/ns/v0.2.0",
    "@id": docId,
    author: "Flareo Reviewer Team",
    timestamp: new Date().toISOString(),
    version: 1,
    statements: statements.map((s) => {
      const stmt: OpenVexStatement = {
        vulnerability: { name: s.cve },
        products: [
          {
            "@id": `pkg:oci/${moduleSlug}@${moduleDigest}`,
          },
        ],
        status: s.status,
        timestamp: s.updatedAt.toISOString(),
      };
      if (s.justification) stmt.justification = s.justification;
      if (s.impactStatement) stmt.impact_statement = s.impactStatement;
      return stmt;
    }),
  };
}
