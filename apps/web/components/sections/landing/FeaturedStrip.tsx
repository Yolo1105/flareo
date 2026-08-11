import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Module } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

/**
 * Featured strip — landing-page surface that exposes the editorially-
 * curated picks from /catalog without making the visitor click into
 * the catalog first. Mirrors the Featured strip on /catalog itself
 * but with its own visual treatment so the landing doesn't look
 * like a catalog dump.
 *
 * Renders nothing if the input is empty so the homepage isn't littered
 * with empty section headers when no admin-curated picks exist.
 */
export interface FeaturedLandingItem {
  module: Module;
  blurb: string | null;
}

interface Props {
  items: FeaturedLandingItem[];
}

export function FeaturedStrip({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="04"
        label="EDITOR'S PICKS"
        title="Hand-picked modules worth running."
      >
        Selected by the Flareo team for production-readiness, attention
        to detail, and operator endorsement. Every featured module still
        carries the same cryptographic receipts as the rest of the
        catalog.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((it) => (
          <Link
            key={it.module.slug}
            href={`/modules/${it.module.slug}`}
            className="group flex flex-col border border-hairline bg-canvas-deep p-5 transition-colors hover:border-accent"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1.5 font-mono text-[9.5px] tracking-[0.14em] text-accent">
                  ★ FEATURED
                </div>
                <div className="truncate font-display text-[19px] font-black leading-[1.1] tracking-[-0.02em] text-ink group-hover:text-accent">
                  {it.module.name}
                </div>
                <div className="mt-0.5 font-mono text-[10.5px] text-ink-ghost">
                  v{it.module.version} · signed provenance
                </div>
              </div>
              <div
                className={cn(
                  "shrink-0 font-display text-[28px] font-black leading-none tracking-[-0.02em]",
                  it.module.trust >= 90
                    ? "text-good"
                    : it.module.trust >= 70
                      ? "text-warn"
                      : "text-bad",
                )}
              >
                {it.module.trust}
              </div>
            </div>

            <p className="mb-3 line-clamp-2 font-body text-[12.5px] leading-[1.5] text-ink-softer">
              {it.module.description}
            </p>

            {it.blurb && (
              <div className="mt-auto border-l-2 border-accent pl-3 font-body text-[11.5px] italic leading-[1.45] text-ink-mute">
                {it.blurb}
              </div>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-6 text-right">
        <Link
          href="/catalog"
          className="font-mono text-[11px] text-accent hover:text-accent-hot"
        >
          See all featured + trending in the catalog →
        </Link>
      </div>
    </section>
  );
}
