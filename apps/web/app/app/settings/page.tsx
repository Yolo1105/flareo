import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getAccountProfile } from "@/lib/db/account";
import { prisma } from "@/lib/db/prisma";
import { SOFT_DELETE_GRACE_MS } from "@/lib/auth/constants";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { SettingsSidebar } from "@/components/sections/app-settings/SettingsSidebar";
import { ProfileEditor } from "@/components/sections/app-settings/ProfileEditor";
import { PublicProfileEditor } from "@/components/sections/app-settings/PublicProfileEditor";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings",
};

/**
 * Main /app/settings page — the Profile tab.
 *
 * Server component: loads the authenticated user's profile + their
 * linked GitHub account (if any) for display. The editable fields are
 * handed off to a client component (`ProfileEditor`) that owns the
 * save form.
 *
 * If for some reason the session references a user that no longer
 * exists (deleted account, DB reset), we send them back to /login —
 * same fallback as the layout guard.
 */
export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // After redirect() (return type `never`), TS may not narrow
  // `session.user`. Capture the non-null user as a const.
  const sessionUser = session!.user!;

  const profile = await getAccountProfile(sessionUser.id);
  if (!profile) redirect("/login");
  // After redirect() (return type `never`), capture narrowed value.
  const profileSafe = profile!;

  // Look up linked GitHub account (providerId == "github"). If the
  // user signed in with GitHub this returns the provider login; if
  // they used a magic-link email flow it returns null.
  const githubAccount = (await prisma.account.findFirst({
    where: { userId: sessionUser.id, provider: "github" },
    select: { providerAccountId: true },
  })) as { providerAccountId: string } | null;

  return (
    <>
      <ViewHeader
        eyebrow="SETTINGS"
        title="Account & workspace."
        subtitle="Anything that affects who you are in the system or how your publishes default."
      />

      <div className="grid grid-cols-[200px_1fr]">
        <SettingsSidebar active="general" />

        <div className="px-7 py-7">
          <ProfileEditor
            initialName={profileSafe.name ?? ""}
            email={profileSafe.email}
            githubLogin={githubAccount?.providerAccountId ?? null}
            createdAt={profileSafe.createdAt.toISOString()}
            emailVerified={profileSafe.emailVerified !== null}
          />

          <PublicProfileEditor
            initialUsername={profileSafe.username}
            initialBio={profileSafe.bio ?? ""}
            initialWebsiteUrl={profileSafe.websiteUrl ?? ""}
          />

          <section className="mt-8 border border-hairline bg-canvas-deep p-5">
            <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
              WHAT&apos;S EDITABLE HERE
            </div>
            <p className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
              Right now, just your display name. Email changes require an
              email-verify round-trip — that flow is tracked on the
              roadmap. If you need a different email right now, sign in
              on the other email via GitHub and we&apos;ll merge the
              accounts manually; email{" "}
              <a
                href="mailto:hello@flareo.dev"
                className="text-accent underline"
              >
                hello@flareo.dev
              </a>
              .
            </p>
          </section>

          {profileSafe.deletedAt && (
            <section className="mt-8 border border-warn bg-warn/[0.04] p-5">
              <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-warn">
                ACCOUNT SCHEDULED FOR DELETION
              </div>
              <p className="mb-3 font-body text-[12.5px] leading-[1.55] text-ink">
                Your account will be permanently deleted on{" "}
                <strong>
                  {new Date(
                    profileSafe.deletedAt.getTime() + SOFT_DELETE_GRACE_MS
                  ).toLocaleDateString()}
                </strong>
                . You can cancel anytime by emailing{" "}
                <a
                  href="mailto:privacy@flareo.dev"
                  className="text-accent underline"
                >
                  privacy@flareo.dev
                </a>
                .
              </p>
              <Link
                href="/app/settings/delete"
                className="font-mono text-[10.5px] tracking-[0.08em] text-warn hover:text-warn/80"
              >
                view delete status →
              </Link>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
