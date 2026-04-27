import type { DefaultSession, NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";

/**
 * Edge-safe NextAuth options (no Prisma, no Node-only imports).
 *
 * Used by `middleware.ts` so the Edge bundle stays under Vercel’s 1 MB
 * limit. The full app uses `lib/auth/config.ts`, which spreads this and
 * adds the Prisma adapter + DB-backed `signIn` checks.
 *
 * Session strategy is JWT so middleware can decode the cookie without a
 * database round-trip. Role is stamped into the JWT at sign-in; promote
 * a user to admin and they pick up the new role on next login (or after
 * `update()` from the client if we add that later).
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
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
    }),
  );
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        const row = user as { role?: string | null };
        token.role = row.role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string | undefined) ?? token.sub ?? "";
        session.user.role = (token.role as string | undefined) ?? "user";
      }
      return session;
    },
  },
};
