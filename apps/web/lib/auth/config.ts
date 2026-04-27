import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { authSecret } from "@/lib/config/env";
import { authConfig } from "./auth.config";

/**
 * NextAuth.js v5 — full Node configuration (route handlers, RSC, API).
 *
 * Spreads `authConfig` (edge-safe, JWT session) and adds the Prisma
 * adapter for OAuth account linking + user persistence. Middleware must
 * NOT import this file — it pulls Prisma and blows past Vercel’s 1 MB
 * Edge limit; use `middleware.ts` + `auth.config.ts` instead.
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: authSecret(),
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Block sign-in if the account is soft-deleted AND the grace window
     * has expired. Inside the window, signing in cancels the deletion
     * (restoration behavior) — we look at the existing user, and if
     * deletedAt is set but recent, we'll clear it in a post-signin
     * handler. For simplicity this callback just allows the signin;
     * the UI reads `deletedAt` and decides what to show.
     */
    async signIn({ user }) {
      if (!user?.email) return true;
      const existing = (await prisma.user.findUnique({
        where: { email: user.email },
      })) as { deletedAt: Date | null } | null;
      if (!existing?.deletedAt) return true;
      const daysSince =
        (Date.now() - existing.deletedAt.getTime()) / 86400000;
      if (daysSince > 30) {
        return false;
      }
      return true;
    },
  },
});
