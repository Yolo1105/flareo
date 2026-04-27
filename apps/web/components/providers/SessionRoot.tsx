"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

/**
 * Thin wrapper so the root layout can mount SessionProvider and pass
 * a pre-fetched session as an optimization. On navigation the provider
 * can refetch without a prop dance.
 */
export function SessionRoot({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
