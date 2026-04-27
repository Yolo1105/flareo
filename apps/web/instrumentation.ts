/**
 * Next.js instrumentation hook.
 *
 * Next.js calls `register()` once per server process before any request
 * is served. We use it to initialize Sentry for server and edge runtimes.
 *
 * The CLIENT runtime is initialized by `sentry.client.config.ts` which
 * Next.js bundles automatically when @sentry/nextjs is installed.
 *
 * Set NEXT_PUBLIC_SENTRY_DSN for client, SENTRY_DSN for server. Leaving
 * either unset disables Sentry for that runtime cleanly — the app keeps
 * working, errors just aren't reported anywhere.
 */

export async function register() {
  // Avoid pulling in Sentry + OpenTelemetry in local/dev when DSN is unset.
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  const runtime = process.env.NEXT_RUNTIME;

  if (runtime === "nodejs") {
    await import("./sentry.server.config");
  } else if (runtime === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Forwards uncaught request errors to Sentry with request context.
 * Next.js calls this from its internal error boundary when a server
 * component or route handler throws.
 */
export const onRequestError = (
  err: Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  // Lazy-import so this doesn't run in environments without Sentry.
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.captureRequestError(err, request, context);
    })
    .catch(() => {
      // Sentry not installed / DSN missing — silently drop.
    });
};
