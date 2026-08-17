"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";

/**
 * The two buttons on the login card. Client side so they can call signIn.
 * The callbackUrl is read from the search params so middleware redirects
 * land users back where they were.
 */
function LoginButtonsInner() {
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") ?? "/app/start";
  const error = search.get("error");
  const [loading, setLoading] = useState<"github" | null>(null);

  async function handleGitHub() {
    setLoading("github");
    await signIn("github", { callbackUrl });
    setLoading(null);
  }

  return (
    <>
      {error && (
        <div className="mb-4 border border-bad bg-bad/[0.08] px-3 py-2 font-mono text-[11px] text-bad">
          Sign in failed. Please try again.
        </div>
      )}

      <button
        type="button"
        onClick={handleGitHub}
        disabled={loading !== null}
        className="group mb-4 flex w-full cursor-pointer items-center justify-center gap-3 border border-hairline bg-canvas px-5 py-3.5 font-body text-[14px] font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          className="transition-transform duration-150 group-hover:scale-110 group-disabled:scale-100"
        >
          <path d="M12 .296a12 12 0 00-3.793 23.392c.6.11.82-.26.82-.577v-2.234c-3.338.725-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.744.082-.729.082-.729 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.333-5.467-5.93 0-1.31.467-2.38 1.235-3.22-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.506 11.506 0 016.003 0c2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.92.432.372.817 1.102.817 2.222v3.293c0 .32.218.693.825.576A12 12 0 0012 .296z" />
        </svg>
        <span>
          {loading === "github" ? "Redirecting to GitHub" : "Continue with GitHub"}
        </span>
      </button>

      <button
        type="button"
        disabled
        title="Device code flow requires the Flareo CLI. Install it first."
        className="mb-8 flex w-full items-center justify-center gap-3 border border-hairline bg-transparent px-5 py-3.5 font-mono text-[12.5px] text-ink-ghost transition-colors disabled:cursor-not-allowed"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span>Device code flow (use the CLI)</span>
      </button>
    </>
  );
}

/**
 * Wrapping in Suspense is required for useSearchParams in Next 15.
 */
export function LoginButtons() {
  return (
    <Suspense fallback={null}>
      <LoginButtonsInner />
    </Suspense>
  );
}
