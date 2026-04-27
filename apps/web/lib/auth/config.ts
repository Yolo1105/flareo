import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { authSecret } from "@/lib/config/env";

/**
 * NextAuth.js v5 configuration.
 *
 * Strategy: database sessions. That lets us read the user's role column
 * off the User row on every request without carrying it in a JWT, so a
 * role change takes effect immediately.
 *
 * Two providers:
 *   - GitHub OAuth (primary; also how CLI device-flow sign-in works)
 *   - Resend magic-link (for people who don't want GitHub account)
 *
 * If AUTH_RESEND_KEY is missing, the Resend provider is silently not
 * included. Same pattern as Sentry — no env, no feature, no error.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

const providers: NextAuthConfig["providers"] = [
  GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
  }),
];

if (process.env.AUTH_RESEND_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_RESEND_FROM ?? "hello@flareo.dev",
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret(),
  session: { strategy: "database" },
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  callbacks: {
    /**
     * On every session read, hydrate session.user with fields we keep in
     * the database (id and role) so components can gate on them.
     */
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // The adapter types don't know about our custom role column, so
        // we refetch it once here. Cached by Next per request.
        const record = (await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })) as { role: string } | null;
        session.user.role = record?.role ?? "user";
      }
      return session;
    },
    /**
     * Block sign-in if the account is soft-deleted AND the grace window
     * has expired. Inside the window, signing in cancels the deletion
     * (restoration behavior) — we look at the existing user, and if
     * deletedAt is set but recent, we'll clear it in a post-signin
     * handler. For simplicity this callback just allows the signin;
     * the UI reads `deletedAt` and decides what to show.
     */
    async signIn({ user }) {
      if (!user?.email) return true; // first-signin case; nothing to check
      const existing = (await prisma.user.findUnique({
        where: { email: user.email },
      })) as { deletedAt: Date | null } | null;
      if (!existing?.deletedAt) return true;
      const daysSince =
        (Date.now() - existing.deletedAt.getTime()) / 86400000;
      if (daysSince > 30) {
        // Hard window expired; nightly job will purge them soon. Refuse.
        return false;
      }
      return true;
    },
  },
});
