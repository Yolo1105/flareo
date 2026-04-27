/**
 * Query helpers for the public /@<username> profile page.
 *
 * Collapses "doesn't exist" and "soft-deleted" into a single null
 * return — deleted accounts should 404, not render an empty
 * tombstone.
 */

import { hasDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import type { Module } from "@/lib/types";
import { shapeToModule } from "./queries";
import type { ModuleShape } from "./queries";

export interface PublicProfile {
  username: string;
  displayName: string | null;
  image: string | null;
  bio: string | null;
  websiteUrl: string | null;
  joinedAt: string; // ISO
  // Counts shown in the profile hero.
  moduleCount: number;
  reviewCount: number;
  // Aggregate across all the user's published modules.
  totalPulls30d: number;
}

interface ProfileRow {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  bio: string | null;
  websiteUrl: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

/**
 * Resolve a username → profile + userId. Returns null for unknown or
 * deleted users. Username lookup is case-insensitive.
 */
export async function getPublicProfile(
  usernameRaw: string,
): Promise<{ profile: PublicProfile; userId: string } | null> {
  if (!hasDatabaseUrl()) return null;
  const username = usernameRaw.trim().toLowerCase();
  if (!username) return null;

  // Case-insensitive lookup. We stored the username verbatim (might
  // include uppercase from an old account that predated the lowercase
  // constraint) but compare against lower(username) via the unique
  // index the migration installed.
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT id, username, name, image, bio, "websiteUrl", "createdAt", "deletedAt"
     FROM "User"
     WHERE lower(username) = $1
     LIMIT 1`,
    username,
  )) as ProfileRow[];

  if (rows.length === 0) return null;
  const row = rows[0];
  if (row.deletedAt) return null;
  if (!row.username) return null;

  // Aggregate stats. Three cheap parallel counts.
  const [moduleCount, reviewCount, pullsAgg] = await Promise.all([
    prisma.module.count({
      where: {
        publisherId: row.id,
        visibility: "public",
      } as never,
    }),
    prisma.moduleReview.count({
      where: {
        authorId: row.id,
        moderation: { not: "hidden" },
      } as never,
    }),
    prisma.module.aggregate({
      where: {
        publisherId: row.id,
        visibility: "public",
      } as never,
      _sum: { pulls30d: true } as never,
    }) as unknown as Promise<{ _sum: { pulls30d: number | null } }>,
  ]);

  const profile: PublicProfile = {
    username: row.username,
    displayName: row.name,
    image: row.image,
    bio: row.bio,
    websiteUrl: row.websiteUrl,
    joinedAt: row.createdAt.toISOString(),
    moduleCount,
    reviewCount,
    totalPulls30d: pullsAgg._sum.pulls30d ?? 0,
  };

  return { profile, userId: row.id };
}

/**
 * Public modules published by this user, newest first. Private
 * modules are excluded — the profile page is public.
 */
export async function getPublicModulesForUser(
  userId: string,
): Promise<Module[]> {
  if (!hasDatabaseUrl()) return [];
  const rows = (await prisma.module.findMany({
    where: {
      publisherId: userId,
      visibility: "public",
    } as never,
    orderBy: { updatedAt: "desc" } as never,
  })) as ModuleShape[];
  return rows.map(shapeToModule);
}

export interface ProfileReview {
  id: string;
  moduleSlug: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

/**
 * Reviews authored by this user, newest first. Hidden reviews are
 * excluded — the public profile shouldn't advertise moderated-out
 * content.
 */
export async function getReviewsByUser(
  userId: string,
  limit = 20,
): Promise<ProfileReview[]> {
  if (!hasDatabaseUrl()) return [];
  const rows = (await prisma.moduleReview.findMany({
    where: {
      authorId: userId,
      moderation: { not: "hidden" },
    } as never,
    orderBy: { createdAt: "desc" } as never,
    take: limit,
  })) as Array<{
    id: string;
    moduleSlug: string;
    rating: number;
    title: string;
    body: string;
    createdAt: Date;
  }>;
  return rows.map((r) => ({
    id: r.id,
    moduleSlug: r.moduleSlug,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  }));
}
