"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BrandMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  userName: string;
  userEmail?: string;
  userImage?: string;
  role: string;
}

interface NavGroup {
  label: string;
  items: {
    num: string;
    label: string;
    href: string;
    adminOnly?: boolean;
    badge?: string;
  }[];
}

const GROUPS: NavGroup[] = [
  {
    label: "WORKSPACE",
    items: [
      { num: "00", label: "Start here", href: "/app/start" },
      { num: "01", label: "Dashboard", href: "/app" },
      { num: "02", label: "My modules", href: "/app/modules", badge: "4" },
      { num: "03", label: "My submissions", href: "/app/submissions" },
      { num: "04", label: "Publish", href: "/app/publish" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { num: "05", label: "Jobs", href: "/app/jobs" },
      { num: "06", label: "Admin queue", href: "/app/admin", badge: "4", adminOnly: true },
      { num: "07", label: "Worker health", href: "/app/admin/worker", adminOnly: true },
      { num: "08", label: "Rebuild log", href: "/app/admin/rebuilds", adminOnly: true },
      { num: "09", label: "Review moderation", href: "/app/admin/reviews", adminOnly: true },
      { num: "10", label: "Featured curation", href: "/app/admin/featured", adminOnly: true },
      { num: "11", label: "Module reports", href: "/app/admin/reports", adminOnly: true },
      { num: "12", label: "VEX annotations", href: "/app/admin/vex", adminOnly: true },
      { num: "13", label: "Admission policy", href: "/app/admin/policy", adminOnly: true },
      { num: "14", label: "Analytics", href: "/app/admin/analytics", adminOnly: true },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { num: "15", label: "Settings", href: "/app/settings" },
      { num: "16", label: "API keys", href: "/app/settings/api-keys" },
    ],
  },
];

export function Sidebar({ userName, userEmail: _userEmail, userImage, role }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  function isActive(href: string): boolean {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  const initial = (userName || "?").trim().charAt(0).toUpperCase();

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-hairline bg-canvas">
      <div className="flex h-[48px] shrink-0 items-center justify-between border-b border-hairline px-5">
        <Link
          href="/app"
          className="flex items-baseline gap-2 font-display text-[18px] font-black tracking-[-0.02em] text-ink transition-colors hover:text-accent"
        >
          <BrandMark size={14} />
          FLAREO
        </Link>
        <Link
          href="/"
          title="Return to public site"
          className="font-mono text-[10px] tracking-[0.08em] text-ink-ghost transition-colors hover:text-ink"
        >
          site
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-none py-3">
        {GROUPS.map((group) => {
          const visibleItems = group.items.filter((i) => !i.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-5">
              <div className="mb-1.5 px-5 font-mono text-[9.5px] font-medium tracking-[0.14em] text-ink-ghost">
                {group.label}
              </div>
              <ul className="space-y-0">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between border-l-2 py-1.5 pl-4 pr-5 font-mono text-[12px] tracking-[0.02em] transition-colors",
                          active
                            ? "border-l-accent bg-accent/[0.04] text-accent"
                            : "border-l-transparent text-ink-softer hover:border-l-ink-ghost hover:text-ink"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px]",
                              active ? "text-accent" : "text-ink-ghost"
                            )}
                          >
                            {item.num}
                          </span>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              "border px-1.5 text-[9.5px] font-medium tracking-[0.08em]",
                              active
                                ? "border-accent text-accent"
                                : "border-hairline text-ink-mute"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-hairline px-5 py-4">
        <div className="mb-2 flex items-center gap-2.5">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt=""
              className="h-7 w-7 object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center bg-accent font-display text-[13px] font-black text-canvas">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-body text-[12.5px] font-medium text-ink">
              {userName}
            </div>
            <div className="truncate font-mono text-[10px] text-ink-ghost">
              {role === "admin" ? "Admin" : "Pro, free in beta"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-1.5 border border-hairline bg-transparent py-1.5 font-mono text-[10.5px] tracking-[0.08em] text-ink-mute transition-colors hover:border-ink-ghost hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
