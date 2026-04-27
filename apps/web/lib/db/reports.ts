/**
 * Per-module "report a problem" helpers. Users file reports; admins
 * triage them.
 *
 * Access rules:
 *   - Filing a report: authenticated users only. Self-report (reporting
 *     your own module) is allowed — publishers are often the first to
 *     notice their own module's upstream broke.
 *   - Listing reports: admin only. Neither the publisher nor other
 *     users see the report queue in this version.
 *   - The reporter can see the list of their own filed reports via
 *     getMyReports (hooked into /app/submissions-style "history" view
 *     in a future session — not built this round).
 *
 * Rate limit: one open/investigating report per (user, module) at a
 * time, AND one new report per (user, module) per 7 days. Both
 * enforced at the write layer.
 */

import { prisma } from "@/lib/db/prisma";
import { moduleExistsBySlug } from "./queries";

export const REPORT_CATEGORIES = [
  "broken",
  "malicious",
  "metadata",
  "legal",
  "other",
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATES = [
  "open",
  "investigating",
  "resolved",
  "dismissed",
] as const;
export type ReportState = (typeof REPORT_STATES)[number];

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  broken: "Module is broken or won't run",
  malicious: "Module contains malicious content",
  metadata: "Metadata or description is wrong",
  legal: "License, copyright, or legal concern",
  other: "Other issue",
};

export interface ReportRow {
  id: string;
  moduleSlug: string;
  reporterId: string;
  reporterName: string | null;
  reporterUsername: string | null;
  category: ReportCategory;
  body: string;
  state: ReportState;
  resolutionNote: string | null;
  triagedByName: string | null;
  triagedAt: string | null; // ISO
  createdAt: string;
  updatedAt: string;
}

interface DbRow {
  id: string;
  moduleSlug: string;
  reporterId: string;
  category: string;
  body: string;
  state: string;
  resolutionNote: string | null;
  triagedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
    name: string | null;
    username: string | null;
  } | null;
  triagedBy: {
    name: string | null;
  } | null;
}

function rowToReport(r: DbRow): ReportRow {
  return {
    id: r.id,
    moduleSlug: r.moduleSlug,
    reporterId: r.reporterId,
    reporterName: r.reporter?.name ?? null,
    reporterUsername: r.reporter?.username ?? null,
    category: r.category as ReportCategory,
    body: r.body,
    state: r.state as ReportState,
    resolutionNote: r.resolutionNote,
    triagedByName: r.triagedBy?.name ?? null,
    triagedAt: r.triagedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ─── write path ───────────────────────────────────────────────────

export interface CreateReportInput {
  moduleSlug: string;
  reporterId: string;
  category: ReportCategory;
  body: string;
}

export type CreateReportResult =
  | { ok: true; report: ReportRow }
  | {
      ok: false;
      reason:
        | "module_not_found"
        | "duplicate_open"
        | "rate_limited";
      /** For rate_limited: hours until they can file again. */
      retryAfterHours?: number;
    };

const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;

/**
 * Create a new report. Enforces:
 *   - Module must exist (otherwise 404 via the result).
 *   - No open/investigating report already exists for (user, module).
 *   - No report from this user on this module in the last 7 days.
 */
export async function createReport(
  input: CreateReportInput,
): Promise<CreateReportResult> {
  const mod = await moduleExistsBySlug(input.moduleSlug);
  if (!mod) return { ok: false, reason: "module_not_found" };

  // Duplicate-open check.
  const existingOpen = (await prisma.moduleReport.findFirst({
    where: {
      moduleSlug: input.moduleSlug,
      reporterId: input.reporterId,
      state: { in: ["open", "investigating"] },
    } as never,
    select: { id: true } as never,
  })) as { id: string } | null;
  if (existingOpen) return { ok: false, reason: "duplicate_open" };

  // 7-day cooldown window — look at the reporter's most recent report
  // for this module (any state). If within the window, reject.
  const recent = (await prisma.moduleReport.findFirst({
    where: {
      moduleSlug: input.moduleSlug,
      reporterId: input.reporterId,
    } as never,
    orderBy: { createdAt: "desc" } as never,
    select: { createdAt: true } as never,
  })) as { createdAt: Date } | null;
  if (recent) {
    const elapsed = Date.now() - recent.createdAt.getTime();
    if (elapsed < SEVEN_DAYS_MS) {
      return {
        ok: false,
        reason: "rate_limited",
        retryAfterHours: Math.ceil(
          (SEVEN_DAYS_MS - elapsed) / 3_600_000,
        ),
      };
    }
  }

  const row = (await prisma.moduleReport.create({
    data: {
      moduleSlug: input.moduleSlug,
      reporterId: input.reporterId,
      category: input.category,
      body: input.body,
    } as never,
    include: {
      reporter: { select: { name: true, username: true } },
      triagedBy: { select: { name: true } },
    } as never,
  })) as DbRow;

  return { ok: true, report: rowToReport(row) };
}

// ─── admin read/triage ───────────────────────────────────────────

/**
 * Admin queue. Default filters to open+investigating ordered newest
 * first; pass `includeClosed: true` to also include resolved/dismissed
 * for history browsing.
 */
export async function listReportsForAdmin(opts: {
  includeClosed?: boolean;
  limit?: number;
} = {}): Promise<ReportRow[]> {
  const where = opts.includeClosed
    ? {}
    : { state: { in: ["open", "investigating"] } };
  const rows = (await prisma.moduleReport.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" } as never,
    take: opts.limit ?? 100,
    include: {
      reporter: { select: { name: true, username: true } },
      triagedBy: { select: { name: true } },
    } as never,
  })) as DbRow[];
  return rows.map(rowToReport);
}

export interface TriageInput {
  reportId: string;
  newState: ReportState;
  resolutionNote: string | null;
  adminId: string;
}

/**
 * Admin moves a report between states. When transitioning OUT of
 * "open", stamps triagedById + triagedAt. Once moved to resolved or
 * dismissed, the report is terminal — the API layer rejects further
 * transitions to prevent flip-flopping.
 */
export async function triageReport(
  input: TriageInput,
): Promise<{ ok: boolean; reason?: "not_found" | "terminal" | "invalid_state" }> {
  if (!REPORT_STATES.includes(input.newState)) {
    return { ok: false, reason: "invalid_state" };
  }

  const current = (await prisma.moduleReport.findUnique({
    where: { id: input.reportId } as never,
    select: { state: true } as never,
  })) as { state: string } | null;
  if (!current) return { ok: false, reason: "not_found" };
  if (current.state === "resolved" || current.state === "dismissed") {
    return { ok: false, reason: "terminal" };
  }

  const data: Record<string, unknown> = {
    state: input.newState,
    resolutionNote: input.resolutionNote,
  };
  // Stamp triage attribution when leaving "open" for the first time.
  if (current.state === "open" && input.newState !== "open") {
    data.triagedById = input.adminId;
    data.triagedAt = new Date();
  }

  await prisma.moduleReport.update({
    where: { id: input.reportId } as never,
    data: data as never,
  });

  return { ok: true };
}

/**
 * Reports filed by a specific user, newest first. Not wired to a UI
 * this session but exposed for a future "/app/submissions-style"
 * report history view. Also useful for testing and diagnostics.
 */
export async function getReportsByReporter(
  reporterId: string,
  limit = 50,
): Promise<ReportRow[]> {
  const rows = (await prisma.moduleReport.findMany({
    where: { reporterId } as never,
    orderBy: { createdAt: "desc" } as never,
    take: limit,
    include: {
      reporter: { select: { name: true, username: true } },
      triagedBy: { select: { name: true } },
    } as never,
  })) as DbRow[];
  return rows.map(rowToReport);
}

/**
 * Counts for the admin sidebar badge. Only counts open reports — the
 * "attention needed" signal. Investigating reports are admin's own
 * work-in-progress, not new work.
 */
export async function countOpenReports(): Promise<number> {
  return prisma.moduleReport.count({
    where: { state: "open" } as never,
  });
}
