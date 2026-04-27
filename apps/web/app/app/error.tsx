"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="px-7 py-7">
      <div className="border border-bad bg-canvas-deep">
        <div className="border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[10.5px] tracking-[0.14em] text-bad">
          VIEW FAILED TO RENDER
        </div>
        <div className="p-5">
          <h1 className="mb-2 font-display text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-ink">
            This view hit an error.
          </h1>
          <p className="mb-4 font-body text-[13px] leading-[1.6] text-ink-softer">
            The sidebar and top bar are still working, so navigation is
            unaffected. Retry just this panel below.
          </p>
          {error.digest && (
            <div className="mb-4 font-mono text-[11px] text-accent">
              digest: {error.digest}
            </div>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
