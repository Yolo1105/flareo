"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, getActiveNav } from "@/lib/data/nav";
import { cn } from "@/lib/utils/cn";

/**
 * Main nav — the one under the meta-strip.
 * Contains the FLAREO wordmark + faceted mark, the mono tagline block,
 * the numbered nav links, and the solid-orange Early access CTA.
 */
export function Nav() {
  const pathname = usePathname();
  const activeNum = getActiveNav(pathname);

  return (
    <nav className="sticky top-[28px] z-50 flex items-center justify-between border-b border-hairline bg-canvas/95 px-8 py-[22px] backdrop-blur-md">
      {/* Brand */}
      <Link href="/" className="flex items-baseline gap-[14px]">
        <span className="flex items-baseline gap-2 font-display text-[26px] font-black tracking-[-0.02em] text-ink">
          <span
            className="block h-5 w-5 translate-y-[2px] bg-accent"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%)",
            }}
          />
          FLAREO
        </span>
        <span className="ml-0.5 border-l border-hairline pl-[14px] font-mono text-[10.5px] leading-[1.5] tracking-[0.08em] text-ink-faint">
          Container supply chain
          <br />
          <span className="text-accent">
            Verification / Preview / Takeaway
          </span>
        </span>
      </Link>

      {/* Right side: links + CTA */}
      <div className="flex items-center gap-7">
        <div className="flex items-center gap-[22px]">
          {NAV_LINKS.map((link) => {
            const active = link.num === activeNum;
            const className = cn(
              "flex items-center gap-1.5 font-mono text-[11.5px] tracking-[0.04em] transition-colors",
              active ? "text-ink" : "text-ink-faint hover:text-ink"
            );
            const content = (
              <>
                <span className="text-[9.5px] text-accent">{link.num}</span>
                {link.label}
              </>
            );
            // External links render as a plain <a> so target=_blank works
            // correctly (Next's Link strips target).
            if (link.external) {
              return (
                <a
                  key={link.num}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {content}
                </a>
              );
            }
            return (
              <Link key={link.num} href={link.href} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
        <Link
          href="/signup"
          className="btn-chamfer bg-accent px-[18px] py-2.5 font-body text-[13px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-accent-hot"
        >
          Early access
        </Link>
      </div>
    </nav>
  );
}
