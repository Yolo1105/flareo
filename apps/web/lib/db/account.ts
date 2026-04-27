/**
 * Account-specific database helpers.
 *
 * Kept separate from `queries.ts` because the account surface
 * (profile, prefs, sessions, soft-delete) is growing fast and deserves
 * its own module. Same conventions as queries.ts: return plain domain
 * types, not Prisma rows.
 */

import { prisma } from "./prisma";

// ─── Types ─────────────────────────────────────────────────────────

export interface AccountProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: Date;
  emailVerified: Date | null;
  deletedAt: Date | null;
  // Public-profile fields (nullable until the user fills them in or
  // the migration backfilled a username).
  username: string | null;
  bio: string | null;
  websiteUrl: string | null;
}

export interface NotificationPreferences {
  security: boolean;
  submission: boolean;
  product: boolean;
  marketing: boolean;
}

export interface AccountSession {
  id: string;
  // A label derived from the session token / user-agent. NextAuth's
  // Session model doesn't store UA today; we leave this as a stable
  // hash of the session ID so the UI has *something* to differentiate
  // active sessions visually.
  label: string;
  expires: Date;
  isCurrent: boolean;
}

// Shape we pull from Prisma. We cast to this because the generated
// client doesn't know about the new fields until `prisma generate`
// runs locally. Keeps typecheck clean in the sandbox; behaves
// identically once Prisma's types catch up.
interface UserShape {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: Date;
  emailVerified: Date | null;
  deletedAt: Date | null;
  profileUpdatedAt: Date | null;
  notifySecurity: boolean;
  notifySubmission: boolean;
  notifyProduct: boolean;
  notifyMarketing: boolean;
  username: string | null;
  bio: string | null;
  websiteUrl: string | null;
}

// ─── Profile read/write ───────────────────────────────────────────

export async function getAccountProfile(
  userId: string
): Promise<AccountProfile | null> {
  const row = (await prisma.user.findUnique({
    where: { id: userId },
  })) as UserShape | null;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    createdAt: row.createdAt,
    emailVerified: row.emailVerified,
    deletedAt: row.deletedAt,
    username: row.username,
    bio: row.bio,
    websiteUrl: row.websiteUrl,
  };
}

/**
 * Update the user's display name. Email changes go through a separate
 * flow (verify the new address before committing) — see
 * `requestEmailChange` below.
 */
export async function updateDisplayName(
  userId: string,
  name: string
): Promise<AccountProfile | null> {
  // Trim and cap at 80 chars — Prisma's column accepts whatever, but
  // the UI is not designed for book-length names.
  const clean = name.trim().slice(0, 80);
  if (clean.length < 1) {
    return null;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      // Cast because the `profileUpdatedAt` field isn't on the
      // Prisma type in the sandbox yet.
      name: clean,
      profileUpdatedAt: new Date(),
    } as unknown as { name: string },
  });
  return getAccountProfile(userId);
}

// ─── Notification preferences ────────────────────────────────────

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const row = (await prisma.user.findUnique({
    where: { id: userId },
  })) as UserShape | null;
  if (!row) return null;
  return {
    security: row.notifySecurity,
    submission: row.notifySubmission,
    product: row.notifyProduct,
    marketing: row.notifyMarketing,
  };
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences | null> {
  const data: Record<string, boolean> = {};
  if (prefs.security !== undefined) data.notifySecurity = prefs.security;
  if (prefs.submission !== undefined) data.notifySubmission = prefs.submission;
  if (prefs.product !== undefined) data.notifyProduct = prefs.product;
  if (prefs.marketing !== undefined) data.notifyMarketing = prefs.marketing;
  if (Object.keys(data).length === 0) {
    return getNotificationPreferences(userId);
  }
  await prisma.user.update({
    where: { id: userId },
    data: data as unknown as { notifySecurity: boolean },
  });
  return getNotificationPreferences(userId);
}

// ─── Sessions ─────────────────────────────────────────────────────

interface SessionShape {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

/**
 * List active (non-expired) sessions for the user. The session that's
 * making this call is marked `isCurrent: true` so the UI can disable
 * the "revoke" button on it (revoking your own current session just
 * logs you out, which is probably not what you meant).
 */
export async function listAccountSessions(
  userId: string,
  currentSessionToken: string | null
): Promise<AccountSession[]> {
  const now = new Date();
  const rows = (await prisma.session.findMany({
    where: { userId, expires: { gt: now } },
    orderBy: { expires: "desc" },
  })) as SessionShape[];

  return rows.map((s) => ({
    id: s.id,
    // NextAuth's Session doesn't keep useragent. Show the last 6
    // chars of the token hash as a stable identifier so the user
    // can at least tell two sessions apart.
    label: `session-${s.id.slice(-6)}`,
    expires: s.expires,
    isCurrent: currentSessionToken !== null && s.sessionToken === currentSessionToken,
  }));
}

/**
 * Revoke a single session (delete the row; NextAuth will treat the
 * user as signed out on next request).
 *
 * Returns true on success, false if the session didn't belong to the
 * user or didn't exist.
 */
export async function revokeAccountSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const result = await prisma.session.deleteMany({
    where: { id: sessionId, userId },
  });
  return (result as { count: number }).count > 0;
}

/**
 * Revoke every session except the current one. Useful as a "sign out
 * everywhere else" button.
 */
export async function revokeOtherSessions(
  userId: string,
  currentSessionToken: string | null
): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      ...(currentSessionToken ? { NOT: { sessionToken: currentSessionToken } } : {}),
    },
  });
  return (result as { count: number }).count;
}

// ─── Account deletion ────────────────────────────────────────────

/**
 * Soft-delete an account. Sets `deletedAt` to now; a nightly job
 * purges rows where `deletedAt < now - 30 days`.
 *
 * Also:
 *   - Revokes every API key
 *   - Revokes every session
 *   - Stops notification delivery
 *   - Leaves public modules published (per Privacy Policy §7:
 *     public contributions remain unless specifically requested for
 *     removal)
 */
export async function softDeleteAccount(userId: string): Promise<void> {
  // Using the interactive callback form of $transaction, which types
  // cleanly across all Prisma client versions. Each step is awaited
  // sequentially inside one transaction; any error rolls back all three.
  await prisma.$transaction(async (tx: typeof prisma) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        // Tear down notifications; the /data still exists for 30 days
        // but we stop pushing messages to it.
        notifySecurity: false,
        notifySubmission: false,
        notifyProduct: false,
        notifyMarketing: false,
      } as unknown as { deletedAt: Date },
    });
    await tx.apiKey.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    await tx.session.deleteMany({
      where: { userId },
    });
  });
}

/**
 * Cancel a pending soft-delete. If the user signs in during the grace
 * window we clear `deletedAt`; their API keys stay revoked (they have
 * to generate fresh ones) but the account itself is alive again.
 */
export async function restoreAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: null } as unknown as { deletedAt: null },
  });
}

/**
 * Check whether an account is in its soft-delete grace window.
 */
export async function isAccountSoftDeleted(userId: string): Promise<boolean> {
  const row = (await prisma.user.findUnique({
    where: { id: userId },
  })) as UserShape | null;
  return row?.deletedAt !== null && row?.deletedAt !== undefined;
}
