import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/data/nav";

/**
 * Footer — thin, mono, same on every page.
 */
export function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-hairline px-8 py-8 font-mono text-[11px] tracking-[0.06em] text-ink-ghost">
      <div>
        © 2026 FLAREO &nbsp;·&nbsp; CONTAINER SUPPLY CHAIN &nbsp;·&nbsp; PUBLIC
        BETA v0.4.2
      </div>
      <div className="flex flex-wrap justify-end gap-x-5 gap-y-2 font-body text-xs font-medium tracking-[0.02em]">
        {FOOTER_LINKS.map((link) => {
          const className =
            "text-[#8A8278] transition-colors hover:text-ink";
          if ("external" in link && link.external) {
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {link.label}
              </a>
            );
          }
          return (
            <Link key={link.label} href={link.href} className={className}>
              {link.label}
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
