import * as Sentry from "@sentry/nextjs";

/**
 * Sentry config for the browser. Next.js bundles this automatically
 * when @sentry/nextjs is installed.
 *
 * Uses NEXT_PUBLIC_SENTRY_DSN (NEXT_PUBLIC_ so it's inlined at build
 * time for the client bundle).
 *
 * We explicitly do NOT use Session Replay (privacy) and do NOT capture
 * console messages (would drown Sentry in noise from third-party embeds
 * we don't even have yet).
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0,

  // Tag every event with the current release so we can filter regressions.
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",

  // Filter noise from browser extensions and bot traffic.
  ignoreErrors: [
    // Chrome extension / adblocker noise
    /chrome-extension/,
    /moz-extension/,
    // Network errors we can't do anything about
    "Failed to fetch",
    "NetworkError when attempting to fetch resource",
    "Load failed",
    // Bot crawlers running JS they don't understand
    "Non-Error promise rejection captured",
  ],

  // Strip query strings from breadcrumbs so we don't log search queries
  // or auth tokens embedded in URLs.
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.type === "http" && breadcrumb.data?.url) {
      try {
        const url = new URL(breadcrumb.data.url as string);
        breadcrumb.data.url = url.origin + url.pathname;
      } catch {
        /* leave it alone */
      }
    }
    return breadcrumb;
  },
});
