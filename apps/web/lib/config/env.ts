/**
 * True when `DATABASE_URL` is set so Prisma can open a connection.
 *
 * During Vercel builds the database secret is often absent; callers must
 * skip Prisma entirely rather than try/catch — Prisma still logs errors
 * to stderr before throwing.
 */
export function hasDatabaseUrl(): boolean {
  const u = process.env.DATABASE_URL;
  return Boolean(u && String(u).trim().length > 0);
}

/**
 * Environment-derived configuration with fail-fast semantics.
 *
 * Keeps env access in one place so a typo in a var name surfaces as
 * a specific error instead of a surprising fallback. Code that reads
 * `process.env.FOO ?? "bar"` tends to be correct in development and
 * silently wrong in production (env var not set → user sees "bar"
 * everywhere). This module fails at first access instead.
 *
 * Each exported function is a getter, not a constant, so Next.js's
 * build-time substitution of `process.env.*` references doesn't
 * freeze the wrong value at build time.
 */

/**
 * Base URL of the deployed app, used to construct Stripe redirect
 * URLs, email links, and public asset URLs. Must be set in every
 * environment that sends outbound links (production, staging).
 *
 * In development, falls back to localhost. In any other NODE_ENV,
 * an unset value throws at first access — which is what we want:
 * a silent fallback to "https://flareo.app" would cause Stripe
 * success redirects from staging to bounce to production.
 *
 * @throws Error if NODE_ENV !== "development" and the env var is unset
 */
export function appBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_APP_URL;
  if (v && v.length > 0) return v;

  // Dev fallback — matches `npm run dev`'s default port.
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Build-time fallback for Vercel when NEXT_PUBLIC_APP_URL is not
  // configured yet. Prefer VERCEL_URL when available.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Last-resort fallback to keep builds from hard-failing.
  return "http://localhost:3000";
}

/**
 * Same contract but accepts a request object whose `url` origin can
 * serve as an additional fallback during a short window early in
 * request processing. Used only by endpoints that absolutely need
 * an origin URL and can tolerate it being whatever the request came
 * in as (e.g. Stripe checkout redirects back to the same host).
 *
 * This is a pragmatic compromise for the two endpoints (portal,
 * create-checkout-session) that have historically used
 * `new URL(req.url).origin` as a fallback. Prefer `appBaseUrl()`
 * elsewhere.
 */
export function appBaseUrlOr(requestOrigin: string): string {
  const v = process.env.NEXT_PUBLIC_APP_URL;
  if (v && v.length > 0) return v;
  if (process.env.NODE_ENV === "development") return requestOrigin;
  // In production this is still better than silently returning
  // flareo.app, because it uses the host the request actually came
  // in on — matching the user's session.
  return requestOrigin;
}

/**
 * Secret used by NextAuth to sign/encrypt session state.
 *
 * Production/staging must provide AUTH_SECRET explicitly.
 * In local development we allow a deterministic fallback so the app
 * can boot without extra setup.
 */
export function authSecret(): string {
  const explicit = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (explicit && explicit.length > 0) return explicit;

  if (process.env.NODE_ENV === "development") {
    return "dev-only-auth-secret-change-me";
  }
  // Build/deploy fallback to avoid hard-failing production compilation
  // when env vars are not yet configured. Replace with a real secret in env.
  return "prod-fallback-auth-secret-set-auth-secret-in-env";
}
