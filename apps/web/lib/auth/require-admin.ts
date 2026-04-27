/**
 * Helper: ensure the request has an admin session. Used by every
 * /api/v1/admin/* route so the auth check is in one place.
 *
 * Returns either the session's userId (success) or a NextResponse
 * that the caller should return directly (failure).
 */

import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { apiError } from "@/lib/validation/schemas";

export async function requireAdmin(): Promise<
  | { userId: string }
  | { error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        apiError("unauthenticated", "admin access requires signin"),
        { status: 401 }
      ),
    };
  }
  if (session.user.role !== "admin") {
    return {
      error: NextResponse.json(
        apiError("forbidden", "admin role required"),
        { status: 403 }
      ),
    };
  }
  return { userId: session.user.id };
}

/**
 * Page-level admin gate. Redirects unauthenticated users to /login,
 * and signed-in-but-non-admin users to /app. On success returns
 * the session's userId.
 *
 * Middleware already redirects /app/admin/* before this runs in
 * production, but Next.js rendering paths can still hit the server
 * component without the middleware firing in dev + some edge cases,
 * so the check is duplicated here defensively. Calling this helper
 * replaces the two-line redirect boilerplate that was copied into
 * every admin page.
 */
export async function requireAdminPage(): Promise<{ userId: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const sessionUser = session!.user!;
  if (sessionUser.role !== "admin") redirect("/app");
  return { userId: sessionUser.id };
}
