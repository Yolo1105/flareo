import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getAccountProfile,
  updateDisplayName,
  softDeleteAccount,
} from "@/lib/db/account";
import { apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { z } from "zod";

/**
 * /api/v1/account
 *
 *   GET    → the signed-in user's profile
 *   PATCH  → update the display name (only field editable today)
 *   DELETE → soft-delete the account (30-day grace window)
 *
 * Email changes go through a separate verify-then-commit flow at
 * /api/v1/account/email (not shipped in this endpoint; see issue
 * tracker for the design).
 */

export const runtime = "nodejs";

const PatchSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

/** Required field `confirmText` must match the user's email; prevents
 * accidental delete. We intentionally do NOT accept `?force=true` or
 * similar shortcuts — this should feel deliberate. */
const DeleteSchema = z.object({
  confirmText: z.string().min(1),
});

type RequireUserResult =
  | { error: NextResponse; userId: null }
  | { error: null; userId: string };

async function requireUser(): Promise<RequireUserResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      error: NextResponse.json(
        apiError("unauthenticated", "sign in to access your account"),
        { status: 401 }
      ),
      userId: null,
    };
  }
  return { error: null, userId };
}

export async function GET(req: NextRequest) {
  const r = await requireUser();
  if (r.error) return r.error;

  const limit = await checkLimit(
    "modules-list",
    keyForRequest(r.userId, req.headers)
  );
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(apiError("rate_limited", "too many requests"), {
      status: 429,
      headers,
    });
  }

  const profile = await getAccountProfile(r.userId);
  if (!profile) {
    return NextResponse.json(apiError("not_found", "account not found"), {
      status: 404,
      headers,
    });
  }

  return NextResponse.json(
    {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.image,
      role: profile.role,
      createdAt: profile.createdAt,
      emailVerified: profile.emailVerified,
      // Expose deletedAt so the UI can show a "your account is scheduled
      // for deletion in N days — cancel?" banner.
      deletedAt: profile.deletedAt,
    },
    { headers }
  );
}

export async function PATCH(req: NextRequest) {
  const r = await requireUser();
  if (r.error) return r.error;

  // Rate-limit profile edits aggressively — renaming twice an hour is
  // more than enough for any legitimate flow.
  const limit = await checkLimit(
    "auth-signin",
    keyForRequest(r.userId, req.headers)
  );
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many profile updates; try again later"),
      { status: 429, headers }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        "bad_request",
        parsed.error.issues[0]?.message ?? "invalid body"
      ),
      { status: 400, headers }
    );
  }

  const updated = await updateDisplayName(r.userId, parsed.data.name);
  if (!updated) {
    return NextResponse.json(
      apiError("bad_request", "display name must be at least 1 character"),
      { status: 400, headers }
    );
  }

  return NextResponse.json(
    { status: "ok", name: updated.name },
    { headers }
  );
}

export async function DELETE(req: NextRequest) {
  const r = await requireUser();
  if (r.error) return r.error;

  const limit = await checkLimit(
    "auth-signin",
    keyForRequest(r.userId, req.headers)
  );
  const headers = rateLimitHeaders(limit);
  if (!limit.success) {
    return NextResponse.json(apiError("rate_limited", "try again later"), {
      status: 429,
      headers,
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }

  const parsed = DeleteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("bad_request", "confirmText is required"),
      { status: 400, headers }
    );
  }

  // Require the user's own email as the confirm string. Similar to
  // GitHub's repo-delete pattern. Prevents "oops I clicked delete".
  const profile = await getAccountProfile(r.userId);
  if (!profile) {
    return NextResponse.json(apiError("not_found", "account not found"), {
      status: 404,
      headers,
    });
  }

  if (
    !profile.email ||
    parsed.data.confirmText.trim().toLowerCase() !== profile.email.toLowerCase()
  ) {
    return NextResponse.json(
      apiError(
        "confirm_mismatch",
        "confirmText must match your email address exactly"
      ),
      { status: 400, headers }
    );
  }

  await softDeleteAccount(r.userId);

  return NextResponse.json(
    {
      status: "scheduled",
      message:
        "Your account is scheduled for deletion. You have 30 days to restore it by signing in again; after that it's permanent. All active sessions have been signed out.",
    },
    { headers }
  );
}
