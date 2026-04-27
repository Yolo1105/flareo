import type { Metadata } from "next";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { SettingsSidebar } from "@/components/sections/app-settings/SettingsSidebar";
import { NotificationPrefs } from "@/components/sections/app-settings/NotificationPrefs";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <>
      <ViewHeader
        eyebrow="SETTINGS · NOTIFICATIONS"
        title="What we email you about."
        subtitle="We send as little as possible. Turn any category off and it stays off."
      />
      <div className="grid grid-cols-[200px_1fr]">
        <SettingsSidebar active="notifications" />
        <div className="px-7 py-7">
          <NotificationPrefs />
        </div>
      </div>
    </>
  );
}
