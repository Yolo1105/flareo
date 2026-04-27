import * as Sentry from "@sentry/nextjs";

/**
 * Sentry config for the server runtime (Node.js functions and route
 * handlers). Imported by instrumentation.ts on boot.
 *
 * Sampling strategy for the closed beta:
 *   - 100% error capture
 *   - 0% performance traces (disabled — adds latency, not useful yet)
 *   - 100% profile rate of whatever traces we DO capture (nothing)
 *
 * Flip tracesSampleRate to a non-zero number (0.1 is a good start) when
 * you start caring about latency regression tracking. Not yet.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,

  tracesSampleRate: 0,

  // Strip PII from error breadcrumbs by default. IPs and emails that
  // appear in URLs would otherwise end up in Sentry forever.
  sendDefaultPii: false,

  // Release tagging — Vercel injects this for us.
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,

  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",

  // Filter out noisy errors that aren't actionable.
  beforeSend(event, hint) {
    const err = hint?.originalException;
    if (err instanceof Error) {
      // Rate-limit responses aren't errors.
      if (err.message.includes("rate_limited")) return null;
      // Client disconnects aren't errors.
      if (err.message.includes("Request aborted")) return null;
    }
    return event;
  },
});
