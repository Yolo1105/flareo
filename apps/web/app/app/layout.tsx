import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AppShellProvider } from "@/components/overlays/AppShellProvider";
import { Sidebar } from "@/components/layout/app/Sidebar";
import { TopBar } from "@/components/layout/app/TopBar";
import { StatusBar } from "@/components/layout/app/StatusBar";
import { ToastStack } from "@/components/overlays/ToastStack";
import { NotificationDrawer } from "@/components/overlays/NotificationDrawer";
import { CommandPalette } from "@/components/overlays/CommandPalette";
import { ShortcutOverlay } from "@/components/overlays/ShortcutOverlay";

export const metadata: Metadata = {
  title: {
    default: "App",
    template: "%s",
  },
  robots: { index: false, follow: false },
};

/**
 * Authenticated /app layout.
 *
 * The middleware at the project root already redirects unauthenticated
 * requests to /login, but we double check here too as a belt and braces.
 * Render of the shell requires a session.
 *
 * Layout structure mirrors the marketing pages: a 1440px max-width
 * bordered column centered in the viewport. Sidebar + main content
 * both sit inside the column. On viewports under 1440px the column
 * fills the screen and the gutters collapse — no horizontal scroll
 * or weird overflow.
 *
 * Why apply this to a dashboard at all (most SaaS dashboards go
 * edge-to-edge): consistency with the marketing site's bordered look.
 * Trade-off accepted: slightly less horizontal real estate on wide
 * monitors, in exchange for matching the brand container style.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // After redirect() (return type `never`), capture the narrowed user.
  const sessionUser = session!.user!;

  return (
    <AppShellProvider>
      <div className="relative bg-canvas text-ink">
        <div className="flex min-h-screen">
          <Sidebar
            userName={sessionUser.name ?? sessionUser.email ?? "you"}
            userEmail={sessionUser.email ?? undefined}
            userImage={sessionUser.image ?? undefined}
            role={sessionUser.role}
          />

          <div className="flex min-h-screen flex-1 flex-col">
            <TopBar />
            {/* `<main>` and `<StatusBar>` are siblings in this flex
                column. `<main>` takes flex-1 so it consumes vertical
                space; the StatusBar is a fixed-height footer at the
                bottom of the column. StatusBar uses `sticky bottom-0`
                so it stays visible at the bottom of the viewport even
                when the page content is taller than one screen — but
                it's scoped to this column, not the viewport, so it
                never extends into the right gutter on wide displays. */}
            <main className="flex-1 overflow-x-hidden">{children}</main>
            <StatusBar />
          </div>
        </div>

        <ToastStack />
        <NotificationDrawer />
        <CommandPalette />
        <ShortcutOverlay />
      </div>
    </AppShellProvider>
  );
}
