import * as Sentry from "@sentry/nextjs";

/**
 * Sentry config for the edge runtime (middleware, edge route handlers).
 * Same shape as the server config but edge-runtime-compatible.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,

  tracesSampleRate: 0,
  sendDefaultPii: false,

  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
});
