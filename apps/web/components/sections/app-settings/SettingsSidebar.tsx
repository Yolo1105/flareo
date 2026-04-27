import Link from "next/link";

/**
 * Sidebar for /app/settings/*. Kept as its own component so the five
 * settings pages don't duplicate the nav block.
 *
 * The `active` prop is the route slug — pass "general" on the main
 * settings page, "api-keys" on api-keys, etc. Matches against the
 * items below.
 */
export function SettingsSidebar({ active }: { active: string }) {
  const items: { label: string; href: string; slug: string }[] = [
    { label: "Profile", href: "/app/settings", slug: "general" },
    { label: "API keys", href: "/app/settings/api-keys", slug: "api-keys" },
    { label: "Billing", href: "/app/settings/billing", slug: "billing" },
    { label: "Sessions", href: "/app/settings/sessions", slug: "sessions" },
    { label: "Notifications", href: "/app/settings/notifications", slug: "notifications" },
    { label: "Danger zone", href: "/app/settings/delete", slug: "delete" },
  ];
  return (
    <aside className="sticky top-[48px] h-fit border-r border-hairline py-6">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = item.slug === active;
          return (
            <li key={item.slug}>
              <Link
                href={item.href}
                className={`block border-l-2 px-5 py-1.5 font-mono text-[12px] tracking-[0.02em] transition-colors ${
                  isActive
                    ? "border-l-accent bg-accent/[0.04] text-accent"
                    : "border-l-transparent text-ink-softer hover:border-l-ink-ghost hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
