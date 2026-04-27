import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getAccountProfile } from "@/lib/db/account";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { SettingsSidebar } from "@/components/sections/app-settings/SettingsSidebar";
import { DeleteAccountForm } from "@/components/sections/app-settings/DeleteAccountForm";

export const metadata: Metadata = {
  title: "Delete account",
};

export default async function DeleteAccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // After redirect() (return type `never`), TS may not narrow
  // `session.user`. Capture the non-null user as a const.
  const sessionUser = session!.user!;
  const profile = await getAccountProfile(sessionUser.id);
  if (!profile) redirect("/login");

  // After notFound()/redirect() (return type `never`), capture
  // the narrowed value as a const so TS keeps the narrowing.
  const profileSafe = profile!;
  
  // If the user has no email, we can't use the type-to-confirm flow —
  // fall back to a contact-support message.
  if (!profileSafe.email) {
    return (
      <>
        <ViewHeader
          eyebrow="SETTINGS · DANGER ZONE"
          title="Delete account."
          subtitle="Self-service deletion needs a verified email."
        />
        <div className="grid grid-cols-[200px_1fr]">
          <SettingsSidebar active="delete" />
          <div className="px-7 py-7">
            <div className="border border-hairline bg-canvas-deep p-5">
              <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                NO EMAIL ON FILE
              </div>
              <p className="font-body text-[13px] leading-[1.55] text-ink-softer">
                Your account doesn&apos;t have an email address, which
                our self-service deletion flow requires to confirm
                intent. Please email{" "}
                <a
                  href="mailto:privacy@flareo.dev"
                  className="text-accent underline"
                >
                  privacy@flareo.dev
                </a>{" "}
                from any address you control and mention your GitHub
                username. We&apos;ll delete the account within one
                business day.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ViewHeader
        eyebrow="SETTINGS · DANGER ZONE"
        title="Delete account."
        subtitle="30-day reversible deletion. Takes effect permanently after that."
      />
      <div className="grid grid-cols-[200px_1fr]">
        <SettingsSidebar active="delete" />
        <div className="px-7 py-7">
          <DeleteAccountForm
            email={profileSafe.email}
            scheduledAt={profileSafe.deletedAt ? profileSafe.deletedAt.toISOString() : null}
          />
        </div>
      </div>
    </>
  );
}
