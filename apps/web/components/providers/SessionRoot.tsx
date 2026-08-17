"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

/**
 * Mounts SessionProvider for the app tree.
 *
 * Session is optional: the root layout no longer prefetches it on the
 * server (that forced every page dynamic). When omitted, the provider
 * loads /api/auth/session on the client.
 */
export function SessionRoot({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session} refetchOnWindowFocus={false}>{children}</SessionProvider>;
}
