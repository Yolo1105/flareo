import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { LoginButtons } from "@/components/sections/login/LoginButtons";
import { auth } from "@/lib/auth/config";
import { isDemoModeEnabled } from "@/lib/config/env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Authenticate with GitHub to publish modules or manage your account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error("[login] session check failed", err);
  }
  if (session?.user) {
    redirect("/app/start");
  }
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? null;

  return (
    <div className="flex min-h-[calc(100vh-28px-94px)] items-center justify-center px-8 py-16">
      <div className="w-full max-w-[440px] border border-hairline bg-canvas-deep">
        <div className="px-10 py-12">
          <div className="mb-8 flex items-center gap-3">
            <BrandMark size={26} />
            <span className="font-display text-[32px] font-black leading-[1] tracking-[-0.025em] text-ink">
              FLAREO
            </span>
          </div>

          <h1 className="mb-3 font-display text-[28px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
            Sign in to continue.
          </h1>
          <p className="mb-10 font-body text-[14px] leading-[1.6] text-ink-softer">
            Flareo uses GitHub OAuth for all authentication. We read your email
            and org membership. We do not read your code, we do not post on
            your behalf.
          </p>

          <LoginButtons />

          {isDemoModeEnabled() && (
            <DemoSignInPanel callbackUrl={callbackUrl} />
          )}

          <div className="space-y-4 border-t border-hairline pt-6">
            <div className="grid grid-cols-[90px_1fr] items-start gap-4 font-mono text-[11px] leading-[1.7]">
              <span className="text-ink-ghost">SCOPES</span>
              <span className="text-ink-mute">
                read:user, read:org. Nothing more.
              </span>
            </div>
            <div className="grid grid-cols-[90px_1fr] items-start gap-4 font-mono text-[11px] leading-[1.7]">
              <span className="text-ink-ghost">STORAGE</span>
              <span className="text-ink-mute">
                Token stored in{" "}
                <span className="text-accent">~/.flareo/config.json</span> with
                mode 0600
              </span>
            </div>
            <div className="grid grid-cols-[90px_1fr] items-start gap-4 font-mono text-[11px] leading-[1.7]">
              <span className="text-ink-ghost">ALTERNATIVE</span>
              <span className="text-ink-mute">
                <Link
                  href="/docs/cli"
                  className="text-accent hover:text-accent-hot"
                >
                  flareo login with token
                </Link>{" "}
                using a PAT
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-hairline bg-canvas-panel px-10 py-4 font-body text-[12px] text-ink-softer">
          Do not have an account yet?{" "}
          <span className="text-ink">
            GitHub sign in creates one automatically.
          </span>{" "}
          No signup form, no confirmation email.
        </div>
      </div>
    </div>
  );
}

/**
 * Render the demo-mode quick-sign-in panel.
 * Only mounted when DEMO_MODE=1 — see app/api/demo-signin/route.ts for
 * the env-flag and production-lock guards. This component intentionally
 * does NOT enforce the gate itself (caller does); a malicious page
 * replacing it would still be blocked by the route's hard checks.
 */
function DemoSignInPanel({ callbackUrl }: { callbackUrl: string | null }) {
  // Demo accounts the seed script also creates. Each links to
  // /api/demo-signin?as=<role>, which sets a session cookie for the
  // matching seeded user and redirects into the appropriate landing
  // (or the original callbackUrl if the visitor was bounced here from
  // a protected page like /pipeline).
  const ROLES = [
    {
      role: "publisher",
      label: "Publisher (mai-ops)",
      blurb:
        "Best for demos — walk pipeline, verify, and browse published modules.",
    },
    {
      role: "admin",
      label: "Admin Reviewer",
      blurb:
        "Triage queue, moderation, featured curation, rebuild log, reports inbox.",
    },
    {
      role: "submitter",
      label: "Submitter (priya-runs-it)",
      blurb:
        "Submission history with built / rejected / changes-requested rows.",
    },
    {
      role: "reviewer",
      label: "Reviewer (marco)",
      blurb: "Has filed a few reviews, has one open report.",
    },
  ] as const;

  return (
    <div className="my-6 border border-dashed border-warn/50 bg-warn/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10.5px] tracking-[0.12em] text-warn">
          ◆ DEMO MODE — DEV ONLY
        </span>
        <span className="font-mono text-[9.5px] text-ink-ghost">
          no OAuth needed
        </span>
      </div>
      <p className="mb-3 font-body text-[12px] leading-[1.55] text-ink-softer">
        Skip GitHub OAuth — pick a demo persona and go straight to the
        pipeline, verify tool, or dashboard. Local development only.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {ROLES.map((r) => {
          const params = new URLSearchParams({ as: r.role });
          if (callbackUrl) params.set("callbackUrl", callbackUrl);
          return (
          <a
            key={r.role}
            href={`/api/demo-signin?${params.toString()}`}
            className="group flex items-start justify-between gap-3 border border-hairline bg-canvas-deep px-3 py-2.5 transition-colors hover:border-warn"
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11.5px] text-ink group-hover:text-warn">
                {r.label}
              </div>
              <div className="mt-0.5 truncate font-body text-[11px] text-ink-softer">
                {r.blurb}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[10.5px] text-ink-ghost group-hover:text-warn">
              sign in →
            </span>
          </a>
          );
        })}
      </div>
    </div>
  );
}
