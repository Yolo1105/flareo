import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AppShellProvider } from "@/components/overlays/AppShellProvider";
import { Sidebar } from "@/components/layout/app/Sidebar";
import { TopBar } from "@/components/layout/app/TopBar";
import { StatusBar } from "@/components/layout/app/StatusBar";
import { ToastStack } from "@/components/overlays/ToastStack";
import { NotificationDrawer } from "@/components/overlays/NotificationDrawer";
import {
  CommandPalette,
  type CommandPaletteModule,
} from "@/components/overlays/CommandPalette";
import { ShortcutOverlay } from "@/components/overlays/ShortcutOverlay";
import { hasDatabaseUrl } from "@/lib/config/env";
import { listModules } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: {
    default: "App",
    template: "%s · Flareo",
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

  // Live public modules for Cmd+K — empty on DB failure, never fixtures.
  let paletteModules: CommandPaletteModule[] = [];
  if (hasDatabaseUrl()) {
    try {
      const all = await listModules();
      paletteModules = all
        .filter((m) => m.visibility === "public")
        .map((m) => ({
          slug: m.slug,
          name: m.name,
          description: m.description,
        }));
    } catch (err) {
      console.error("[app] command palette: failed to load modules", err);
    }
  }

  return (
    <AppShellProvider>
      <div className="relative h-screen overflow-hidden bg-canvas text-ink">
        <div className="flex h-full">
          <Sidebar
            userName={sessionUser.name ?? sessionUser.email ?? "you"}
            userEmail={sessionUser.email ?? undefined}
            userImage={sessionUser.image ?? undefined}
            role={sessionUser.role}
          />

          <div className="flex h-full min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none">
              {children}
            </main>
            <StatusBar />
          </div>
        </div>

        <ToastStack />
        <NotificationDrawer />
        <CommandPalette modules={paletteModules} />
        <ShortcutOverlay />
      </div>
    </AppShellProvider>
  );
}
