/**
 * API key authentication.
 *
 * The CLI and other programmatic clients authenticate by sending an
 * `Authorization: Bearer fla_<random>` header. We look up the key by
 * its sha256 hash (never by the raw token) and return the associated
 * user. Used by `/api/v1/whoami` and any other v1 endpoint that wants
 * to know who's calling.
 *
 * Raw tokens exist in plaintext ONLY at the moment of creation in
 * /app/admin/api-keys; they are never stored and never logged. The
 * one-time-reveal UI in the dashboard is the only path that ever shows
 * the raw token to a human.
 */

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

export interface AuthenticatedKey {
  userId: string;
  keyId: string;
  label: string;
}

/**
 * Given a Bearer token, look up the owning user. Returns null for
 * invalid tokens, unknown tokens, revoked tokens, or malformed headers.
 * Updates `lastUsedAt` as a side effect on success.
 */
export async function authenticateApiKey(
  authHeader: string | null
): Promise<AuthenticatedKey | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || !token.startsWith("fla_")) return null;
  if (token.length < 20 || token.length > 200) return null;

  const hash = createHash("sha256").update(token).digest("hex");

  const row = (await prisma.apiKey.findFirst({
    where: { tokenHash: hash, revoked: false },
  })) as {
    id: string;
    userId: string | null;
    label: string;
  } | null;

  if (!row || !row.userId) return null;

  // Fire-and-forget: bump lastUsedAt. We don't await this because the
  // auth path is hot; a missed update is harmless.
  prisma.apiKey
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      /* logged at DB level; non-fatal */
    });

  return {
    userId: row.userId,
    keyId: row.id,
    label: row.label,
  };
}
