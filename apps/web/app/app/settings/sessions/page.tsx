import type { Metadata } from "next";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { SettingsSidebar } from "@/components/sections/app-settings/SettingsSidebar";
import { SessionsManager } from "@/components/sections/app-settings/SessionsManager";

export const metadata: Metadata = {
  title: "Sessions",
};

export default function SessionsPage() {
  return (
    <>
      <ViewHeader
        eyebrow="SETTINGS · SESSIONS"
        title="Active sessions."
        subtitle="Every device currently signed into your account. Revoke any that look unfamiliar."
      />
      <div className="grid grid-cols-[200px_1fr]">
        <SettingsSidebar active="sessions" />
        <div className="px-7 py-7">
          <SessionsManager />
        </div>
      </div>
    </>
  );
}
