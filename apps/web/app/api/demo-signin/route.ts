import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

/**
 * Demo sign-in shortcut.
 *
 * Lets the operator log in as a fixed demo user without GitHub OAuth or
 * a Resend magic-link, so the authenticated surface (dashboard, /app/*,
 * marketplace, pipeline) can be exercised end-to-end on a clean checkout
 * with no third-party setup.
 *
 * SECURITY POSTURE
 * ----------------
 * This endpoint MUST refuse to do anything in production. The only
 * thing standing between this endpoint and a back-door full-admin
 * login is the DEMO_MODE=1 env flag.
 *
 *   - DEMO_MODE not set OR != "1"  →  404 (the route doesn't exist)
 *   - NODE_ENV === "production"     →  410 (gone, even if DEMO_MODE=1)
 *
 * The product-level instructions on top of this:
 *   - never set DEMO_MODE=1 in the production deployment
 *   - the seeded demo users have predictable emails (demo@flareo.local,
 *     etc.) so an external scan looking for production accounts won't
 *     collide with them
 *
 * If you ever need a back-door for support — that is a separate, audited
 * impersonation flow, not this. This is for clean-checkout demos only.
 *
 * DEMO USERS
 * ----------
 * Selectable via ?as=admin | submitter | reviewer | publisher (default
 * admin). Each maps to a fixed user that the seed script also creates,
 * so seeded reviews / featured / submissions all reference these
 * accounts and the dashboard is non-empty on first sign-in.
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

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

const SESSION_LIFETIME_DAYS = 7;

export async function POST(req: NextRequest) {
  // Hard production lock — even if DEMO_MODE=1 leaks into prod, refuse.
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 410 });
  }

  // Env-flag gate — if DEMO_MODE isn't set, the route effectively
  // doesn't exist. 404 (not 403) so a probe can't tell whether the
  // route is gated-and-rejecting or absent.
  if (process.env.DEMO_MODE !== "1") {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const asKey = searchParams.get("as") ?? "admin";
  const spec = DEMO_USERS[asKey];
  if (!spec) {
    return NextResponse.json(
      { error: "unknown_demo_user", available: Object.keys(DEMO_USERS) },
      { status: 400 },
    );
  }

  // Upsert user — keep the username/role fresh in case the seed script
  // changed values between sign-ins.
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

  // Create a NextAuth-shaped session row directly. NextAuth's database
  // adapter will pick this session up on the next request as long as
  // the cookie matches.
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(
    Date.now() + SESSION_LIFETIME_DAYS * 24 * 60 * 60 * 1000,
  );
  await prisma.session.create({
    data: {
      sessionToken,
      userId: spec.id,
      expires,
    },
  });

  // Default redirect: where the operator probably wants to land after
  // signing in as this role. Admins → admin queue, everyone else → /app.
  const callbackUrl = searchParams.get("callbackUrl");
  const redirectTo = callbackUrl
    ? callbackUrl
    : spec.role === "admin"
      ? "/app/admin"
      : "/app";

  const response = NextResponse.redirect(new URL(redirectTo, req.url), {
    status: 303,
  });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
  return response;
}

// Allow GET as a convenience so a plain link "Sign in as demo admin"
// works without form posts. Forward to the same handler.
export async function GET(req: NextRequest) {
  return POST(req);
}
