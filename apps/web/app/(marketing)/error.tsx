"use client";

import { useEffect } from "react";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketing route error:", error);
  }, [error]);

  return (
    <div className="px-8 py-20">
      <div className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-bad">
        ERROR IN THIS PAGE
      </div>
      <h1 className="mb-3 font-display text-[32px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
        We hit a wall rendering this page.
      </h1>
      <p className="mb-6 max-w-[520px] font-body text-[13.5px] leading-[1.6] text-ink-softer">
        The chrome around this area is intact, which is a small comfort. You
        can retry just this view without reloading the whole app.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="btn-chamfer bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
      >
        Retry
      </button>
    </div>
  );
}
