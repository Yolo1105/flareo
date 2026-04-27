import Link from "next/link";
import { DOCS_SECTIONS } from "@/lib/docs/sidebar";

interface SidebarProps {
  currentSlug: string;
}

/**
 * Left rail nav. Lists every section with its pages. The current page
 * is highlighted with an accent underline.
 *
 * This is a server component — no interactivity needed for the nav
 * beyond what <Link> provides. Keep it that way; docs sites render
 * faster when nothing ships to the client.
 */
export function DocsSidebar({ currentSlug }: SidebarProps) {
  return (
    <nav
      aria-label="Documentation"
      className="sticky top-0 hidden h-screen w-[260px] shrink-0 overflow-y-auto border-r border-hairline px-6 py-8 lg:block"
    >
      <Link
        href="/"
        className="mb-8 block font-display text-[18px] font-black tracking-[-0.02em] text-ink hover:text-accent"
      >
        FLAREO
        <span className="ml-2 font-mono text-[10.5px] font-normal tracking-[0.12em] text-accent">
          DOCS
        </span>
      </Link>

      <div className="space-y-7">
        {DOCS_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-ghost">
              {section.title}
            </div>
            <ul className="space-y-1">
              {section.pages.map((page) => {
                const active = page.slug === currentSlug;
                return (
                  <li key={page.slug}>
                    <Link
                      href={page.slug}
                      className={`block border-l-2 py-1 pl-3 font-body text-[13.5px] transition-colors ${
                        active
                          ? "border-accent text-ink"
                          : "border-transparent text-ink-mute hover:border-hairline-soft hover:text-ink"
                      }`}
                    >
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-hairline pt-6">
        <a
          href="https://flareo.dev"
          className="block font-mono text-[11px] tracking-[0.08em] text-ink-faint hover:text-accent"
        >
          ← flareo.dev
        </a>
        <a
          href="https://github.com/flareo"
          className="mt-1 block font-mono text-[11px] tracking-[0.08em] text-ink-faint hover:text-accent"
        >
          github.com/flareo
        </a>
      </div>
    </nav>
  );
}
