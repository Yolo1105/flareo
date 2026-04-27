import type { Session } from "next-auth";
import { auth } from "./config";

/**
 * Helpers for reading the current session inside server components
 * and route handlers.
 */

export async function getSession(): Promise<Session | null> {
  return auth();
}

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return session;
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "admin";
}
