import Link from "next/link";
import { DocsSidebar } from "./DocsSidebar";
import { neighbors, sectionForSlug, type DocsPage } from "@/lib/docs/sidebar";

interface DocPageProps {
  slug: string;
  title: string;
  children: React.ReactNode;
}

/**
 * Standard docs page layout. Every MDX page wraps its content in this.
 *
 * Structure:
 *   ┌─────────┬─────────────────────────────────────────────────┐
 *   │         │ Breadcrumb                                      │
 *   │ Sidebar │ <h1> (from MDX or title prop)                   │
 *   │         │ MDX content                                     │
 *   │         │ ──────────────────────────────────              │
 *   │         │ Prev / Next pager                               │
 *   └─────────┴─────────────────────────────────────────────────┘
 *
 * On wide monitors the whole sidebar+main flex is centered inside a
 * 1440px max-width column with side hairlines, matching the bordered
 * shell used on marketing and /app/* pages. Reading column inside
 * `<main>` is still capped at 780px so prose lines stay short — the
 * outer cap just keeps the sidebar from drifting into the far edge
 * of an ultra-wide display.
 */
export function DocPage({ slug, title, children }: DocPageProps) {
  const section = sectionForSlug(slug);
  const { prev, next } = neighbors(slug);

  return (
    <div className="flex min-h-screen">
      <DocsSidebar currentSlug={slug} />

      <main className="flex-1 px-6 py-10 lg:px-14 lg:py-16">
        <div className="mx-auto max-w-[780px]">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 font-mono text-[11px] tracking-[0.05em] text-ink-faint">
            <Link href="/" className="hover:text-accent">
              docs
            </Link>
            {section && (
              <>
                <span className="text-ink-ghost">/</span>
                <span>{section}</span>
              </>
            )}
            <span className="text-ink-ghost">/</span>
            <span className="text-ink">{title}</span>
          </div>

          {/* Page content (MDX). Heading-1 is in the MDX itself, keeping
              the MDX canonical source. We inject only the chrome. */}
          <article className="fl-prose">{children}</article>

          {/* Prev/next pager */}
          {(prev || next) && (
            <nav className="mt-16 grid gap-3 border-t border-hairline pt-8 sm:grid-cols-2">
              {prev ? <PagerLink label="Previous" page={prev} dir="prev" /> : <div />}
              {next ? <PagerLink label="Next" page={next} dir="next" /> : <div />}
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}

function PagerLink({
  label,
  page,
  dir,
}: {
  label: string;
  page: DocsPage;
  dir: "prev" | "next";
}) {
  return (
    <Link
      href={page.slug}
      className={`group block border border-hairline bg-canvas-panel p-5 transition-colors hover:border-accent ${
        dir === "next" ? "text-right" : ""
      }`}
    >
      <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-ghost">
        {dir === "prev" ? "← " : ""}
        {label}
        {dir === "next" ? " →" : ""}
      </div>
      <div className="font-display text-[17px] font-black leading-[1.15] tracking-[-0.01em] text-ink group-hover:text-accent">
        {page.title}
      </div>
    </Link>
  );
}
