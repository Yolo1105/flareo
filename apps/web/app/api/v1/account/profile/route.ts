import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/validation/schemas";
import {
  bioSchema,
  usernameError,
  usernameSchema,
  websiteUrlSchema,
} from "@/lib/validation/username";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { getUserPlan } from "@/lib/billing/quota";

/**
 * PATCH /api/v1/account/profile
 *   body: { username?, bio?, websiteUrl? }
 *
 * Updates the authenticated user's public profile fields. All fields
 * optional; only the ones provided are modified.
 *
 * Username changes are rate-limited to 1 per day (in addition to the
 * bucket rate-limiter) to prevent identity-swap abuse. The rate
 * limit lives here rather than in the bucket layer because it's a
 * per-field limit, not a per-endpoint limit — bio edits should not
 * burn the username-change quota.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  username: usernameSchema.optional(),
  bio: bioSchema,
  websiteUrl: websiteUrlSchema.or(z.literal("")),
});

const USERNAME_CHANGE_COOLDOWN_MS = 24 * 3600 * 1000;

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in to edit your profile"),
      { status: 401 },
    );
  }

  const key = keyForRequest(userId, req.headers);
  const plan = await getUserPlan(userId);
  const limit = await checkLimit("user-writes", key, plan);
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many profile edits; try again soon"),
      { status: 429, headers },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return NextResponse.json(
      apiError("bad_request", "profile validation failed", msgs),
      { status: 400, headers },
    );
  }

  // Defensive type — Zod's inferred types should give us a clean
  // shape here, but the local TS resolution sometimes loses the
  // string narrowing. Stating the shape inline removes any ambiguity.
  const data = parsed.data as {
    username?: string;
    bio?: string;
    websiteUrl: string;
  };

  // Extra username validation + reservation check. Zod already ran
  // usernameSchema, but it only hits the shape regex — the reserved-
  // word list is a separate check.
  if (data.username !== undefined) {
    const err = usernameError(data.username);
    if (err) {
      return NextResponse.json(
        apiError("bad_request", err),
        { status: 400, headers },
      );
    }
  }

  // Load the current user row so we can enforce the username-change
  // cooldown AND skip a useless write if nothing changed.
  const existing = (await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      profileUpdatedAt: true,
    } as never,
  })) as { username: string | null; profileUpdatedAt: Date | null } | null;
  if (!existing) {
    return NextResponse.json(
      apiError("not_found", "user not found"),
      { status: 404, headers },
    );
  }

  // Username cooldown. First-ever username set is free (existing
  // username is null, which happens only for accounts from before
  // the migration and for any accidental nulls). Subsequent changes
  // are limited to once per 24h.
  if (
    data.username !== undefined &&
    data.username !== null &&
    existing.username !== null &&
    data.username.toLowerCase() !== existing.username.toLowerCase() &&
    existing.profileUpdatedAt !== null
  ) {
    const elapsed = Date.now() - existing.profileUpdatedAt.getTime();
    if (elapsed < USERNAME_CHANGE_COOLDOWN_MS) {
      const hoursLeft = Math.ceil(
        (USERNAME_CHANGE_COOLDOWN_MS - elapsed) / 3_600_000,
      );
      return NextResponse.json(
        apiError(
          "too_soon",
          `You changed your username recently. Try again in ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}.`,
        ),
        { status: 429, headers },
      );
    }
  }

  // Uniqueness check. Case-insensitive. Self-comparison is allowed
  // (no-op update).
  if (
    data.username !== undefined &&
    data.username !== null &&
    data.username.toLowerCase() !== (existing.username ?? "").toLowerCase()
  ) {
    const taken = (await prisma.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE lower(username) = $1 AND id <> $2 LIMIT 1`,
      data.username.toLowerCase(),
      userId,
    )) as Array<{ id: string }>;
    if (taken.length > 0) {
      return NextResponse.json(
        apiError("conflict", "Username is taken."),
        { status: 409, headers },
      );
    }
  }

  // Build the update payload. Only include fields the client sent so
  // a partial PATCH doesn't clobber unset fields. Empty-string
  // websiteUrl is intentionally mapped to null so users can clear it.
  const update: Record<string, unknown> = {};
  if (data.username !== undefined) update.username = data.username;
  if (data.bio !== undefined) update.bio = data.bio === "" ? null : data.bio;
  if (data.websiteUrl !== undefined)
    update.websiteUrl = data.websiteUrl === "" ? null : data.websiteUrl;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { profile: { unchanged: true } },
      { status: 200, headers },
    );
  }

  // Bump profileUpdatedAt when username changed — the cooldown window
  // reads from it. bio/website edits don't restart the window.
  if (data.username !== undefined) {
    update.profileUpdatedAt = new Date();
  }

  const row = (await prisma.user.update({
    where: { id: userId },
    data: update as never,
    select: {
      username: true,
      bio: true,
      websiteUrl: true,
    } as never,
  })) as { username: string | null; bio: string | null; websiteUrl: string | null };

  return NextResponse.json(
    { profile: row },
    { status: 200, headers },
  );
}
