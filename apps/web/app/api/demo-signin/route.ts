import { NextRequest, NextResponse } from "next/server";
import { encode } from "@auth/core/jwt";
import { prisma } from "@/lib/db/prisma";
import { authSecret, isDemoModeEnabled } from "@/lib/config/env";

/**
 * Demo sign-in shortcut.
 *
 * Lets the operator log in as a fixed demo user without GitHub OAuth,
 * so pipeline / verify / dashboard can be exercised on a clean checkout.
 *
 * Issues a real Auth.js JWT session cookie (matches `session.strategy:
 * "jwt"` in auth.config.ts). The old DB-session approach did not work
 * with middleware auth().
 *
 * SECURITY: hard-disabled in production. Enabled in local dev by default
 * (see isDemoModeEnabled). Never set DEMO_MODE=1 on production deploys.
 */

interface DemoUserSpec {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
}

const DEMO_USERS: Record<string, DemoUserSpec> = {
  admin: {
    id: "user_demo_admin",
    email: "admin@flareo.demo",
    name: "Admin Reviewer",
    username: "flareo-admin",
    role: "admin",
  },
  publisher: {
    id: "user_demo_mai",
    email: "mai@example.com",
    name: "Mai Tanaka",
    username: "mai-ops",
    role: "user",
  },
  submitter: {
    id: "user_demo_priya",
    email: "priya@example.com",
    name: "Priya Shah",
    username: "priya-runs-it",
    role: "user",
  },
  reviewer: {
    id: "user_demo_marco",
    email: "marco@example.com",
    name: "Marco Velasquez",
    username: "marco",
    role: "user",
  },
};

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days — matches auth.config

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 410 });
  }

  if (!isDemoModeEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const asKey = searchParams.get("as") ?? "publisher";
  const spec = DEMO_USERS[asKey];
  if (!spec) {
    return NextResponse.json(
      { error: "unknown_demo_user", available: Object.keys(DEMO_USERS) },
      { status: 400 },
    );
  }

  await prisma.user.upsert({
    where: { id: spec.id },
    update: {
      email: spec.email,
      name: spec.name,
      username: spec.username,
      role: spec.role,
    },
    create: {
      id: spec.id,
      email: spec.email,
      name: spec.name,
      username: spec.username,
      role: spec.role,
    } as never,
  });

  const cookieName = sessionCookieName();
  const sessionToken = await encode({
    token: {
      sub: spec.id,
      id: spec.id,
      role: spec.role,
      name: spec.name,
      email: spec.email,
    },
    secret: authSecret(),
    salt: cookieName,
    maxAge: SESSION_MAX_AGE,
  });

  const callbackUrl = searchParams.get("callbackUrl");
  const redirectTo = callbackUrl
    ? callbackUrl
    : spec.role === "admin"
      ? "/app/admin"
      : "/app/start";

  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  const response = NextResponse.redirect(new URL(redirectTo, req.url), {
    status: 303,
  });
  response.cookies.set({
    name: cookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires,
    path: "/",
  });
  return response;
}

export async function GET(req: NextRequest) {
  return POST(req);
}
