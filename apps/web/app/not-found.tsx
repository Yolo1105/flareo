import Link from "next/link";

/**
 * Root 404. Styled to match the rest of the site rather than the default
 * Next placeholder.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-8">
      <div className="w-full max-w-[520px]">
        <div className="mb-4 font-mono text-[10.5px] tracking-[0.14em] text-accent">
          404 &middot; NOT FOUND
        </div>
        <h1 className="mb-3 font-display text-[56px] font-black leading-[0.95] tracking-[-0.035em] text-ink">
          PAGE NOT
          <br />
          FOUND.
        </h1>
        <p className="mb-6 max-w-[420px] font-body text-[14.5px] leading-[1.6] text-ink-softer">
          That URL does not resolve to anything in the catalog or the app.
          If you got here from a link inside Flareo, please open an issue.
        </p>
        <div className="flex gap-2">
          <Link
            href="/"
            className="bg-accent px-5 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
          >
            Back to landing
          </Link>
          <Link
            href="/catalog"
            className="border border-hairline px-5 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
          >
            Browse catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
