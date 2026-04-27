/**
 * Submitter-facing submission queries. Mirror the admin queries in
 * `admin-submissions.ts` but scoped to `submitterId = userId` so a
 * submitter only ever sees their own rows.
 *
 * The returned shape is intentionally narrower than AdminSubmission:
 * no flagsJson reviewer-internal fields, no decidedById linking to an
 * admin user record. Just what a submitter needs to track their
 * own work.
 */

import { prisma } from "@/lib/db/prisma";

export interface MySubmission {
  id: string;
  moduleName: string;
  version: string;
  status: string;
  visibility: string;
  submittedAt: string; // ISO
  decidedAt: string | null;
  // Terminal / in-flight details the submitter cares about:
  buildStartedAt: string | null;
  buildCompletedAt: string | null;
  buildErrorKind: string | null;    // "user" | "scan" | "system" | null
  buildErrorMessage: string | null; // safe-to-display text
  buildLogUrl: string | null;        // R2 signed URL, if present
  // When the build succeeded:
  resultDigest: string | null;
  resultImageRef: string | null;
  // Metadata pulled from flagsJson so the UI doesn't have to parse:
  category: string;
  description: string;
  upstreamUrl: string;
}

interface Row {
  id: string;
  moduleName: string;
  version: string;
  status: string;
  visibility: string | null;
  submittedAt: Date;
  decidedAt: Date | null;
  buildStartedAt: Date | null;
  buildCompletedAt: Date | null;
  buildErrorKind: string | null;
  buildErrorMessage: string | null;
  buildLogUrl: string | null;
  resultDigest: string | null;
  resultImageRef: string | null;
  flagsJson: string;
}

interface FlagsShape {
  slug?: string;
  description?: string;
  category?: string;
  upstreamUrl?: string;
}

function parseFlags(raw: string): FlagsShape {
  try {
    return JSON.parse(raw) as FlagsShape;
  } catch {
    return {};
  }
}

function rowToMine(r: Row): MySubmission {
  const flags = parseFlags(r.flagsJson);
  return {
    id: r.id,
    moduleName: r.moduleName,
    version: r.version,
    status: r.status,
    visibility: r.visibility ?? "public",
    submittedAt: r.submittedAt.toISOString(),
    decidedAt: r.decidedAt?.toISOString() ?? null,
    buildStartedAt: r.buildStartedAt?.toISOString() ?? null,
    buildCompletedAt: r.buildCompletedAt?.toISOString() ?? null,
    buildErrorKind: r.buildErrorKind,
    buildErrorMessage: r.buildErrorMessage,
    buildLogUrl: r.buildLogUrl,
    resultDigest: r.resultDigest,
    resultImageRef: r.resultImageRef,
    category: flags.category ?? "",
    description: flags.description ?? "",
    upstreamUrl: flags.upstreamUrl ?? "",
  };
}

/**
 * List the authenticated user's submissions, newest first.
 * Returns every submission they've ever created — pending, in-flight,
 * terminal. The UI paginates if needed; today's list is small enough
 * that a single query returns everything.
 */
export async function listMySubmissions(
  userId: string,
): Promise<MySubmission[]> {
  const rows = (await prisma.submission.findMany({
    where: { submitterId: userId } as never,
    orderBy: { submittedAt: "desc" } as never,
  })) as Row[];
  return rows.map(rowToMine);
}

/**
 * Fetch one submission, but only if it belongs to the caller.
 * Returns null when the row doesn't exist OR when it exists but
 * belongs to someone else. The null-vs-exists distinction is
 * deliberately collapsed so a submitter can't probe for other
 * users' submission ids.
 */
export async function getMySubmission(
  userId: string,
  submissionId: string,
): Promise<MySubmission | null> {
  const row = (await prisma.submission.findUnique({
    where: { id: submissionId } as never,
  })) as Row | null;
  if (!row) return null;
  // Inspect submitterId against the caller.
  const rowWithSubmitter = row as Row & { submitterId: string | null };
  if (rowWithSubmitter.submitterId !== userId) return null;
  return rowToMine(row);
}
