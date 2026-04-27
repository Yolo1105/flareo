import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { PublishWizard } from "@/components/sections/app-publish/PublishWizard";
import { getUserPlan } from "@/lib/billing/quota";

export const metadata: Metadata = {
  title: "Publish",
};

export const dynamic = "force-dynamic";

export default async function AppPublishPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // After redirect() (return type `never`), TS may not narrow
  // `session.user`. Capture the non-null user as a const.
  const sessionUser = session!.user!;

  // Plan drives the visibility toggle — pro can pick private, free
  // is locked to public. Fetched server-side so the wizard renders
  // the right shape on first paint (no flicker, no client round-trip).
  const plan = await getUserPlan(sessionUser.id);

  return (
    <>
      <ViewHeader
        eyebrow="PUBLISH"
        title="Submit a new module."
        subtitle="Three-step flow. Point at source, declare the manifest, review and publish. A human reviewer looks over every submission before it's ingested."
      />
      <PublishWizard
        initialContactEmail={sessionUser.email ?? ""}
        userPlan={plan}
      />
    </>
  );
}
