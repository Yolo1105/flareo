"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Catches render errors from any public or app
 * route. The reset button re-renders the tree after clearing the error.
 *
 * Errors are forwarded to Sentry (see instrumentation.ts). The
 * `digest` that Next.js produces is included as a tag so it matches
 * the digest users might mention when opening an issue.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error, {
        tags: { digest: error.digest ?? "unknown" },
      });
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-8">
      <div className="w-full max-w-[520px] border border-bad bg-canvas-deep">
        <div className="border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[10.5px] tracking-[0.14em] text-bad">
          ERROR &middot; UNHANDLED
        </div>
        <div className="p-6">
          <h1 className="mb-3 font-display text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-ink">
            Something broke while rendering this page.
          </h1>
          <p className="mb-5 font-body text-[13.5px] leading-[1.6] text-ink-softer">
            The error has been logged. You can try again, and if it keeps
            happening, open an issue on GitHub with the digest below.
          </p>

          {error.digest && (
            <div className="mb-5 border border-hairline bg-canvas p-3 font-mono text-[11px] text-accent">
              digest: {error.digest}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
            >
              Try again
            </button>
            <a
              href="/"
              className="border border-hairline px-4 py-2 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
