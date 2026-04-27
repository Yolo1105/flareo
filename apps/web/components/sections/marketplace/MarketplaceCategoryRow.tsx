import Link from "next/link";
import type { Module } from "@/lib/types";
import type { ReviewAggregate } from "@/lib/db/reviews";
import { TrustScore } from "./TrustScore";
import { Stars } from "./Stars";
import { ReceiptsDrawer } from "./ReceiptsDrawer";

export interface CategoryRowItem {
  module: Module;
  blurb: string | null;
  aggregate: ReviewAggregate | null;
}

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  modules: CategoryRowItem[];
}

/**
 * Reusable horizontal/grid row for the marketplace. Used for editor
 * picks beyond the spotlight, trending modules, and per-category
 * groupings. Each card is a Link to the module's detail page; the
 * card itself is information-dense enough that a visitor doesn't HAVE
 * to click to know what they'd be deploying.
 *
 * Layout: 2 cols on mobile, 3 on tablet, 6 on wide screens. Caller
 * pre-slices to ≤6 modules so cards stay generous.
 */
export function MarketplaceCategoryRow({
  eyebrow,
  title,
  subtitle,
  modules,
}: Props) {
  if (modules.length === 0) return null;

  return (
    <section className="border-b border-hairline px-8 py-12">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            {eyebrow}
          </div>
          <h2 className="font-display text-[28px] font-black leading-[1] tracking-[-0.025em] text-ink">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-[560px] font-body text-[13px] leading-[1.55] text-ink-softer">
              {subtitle}
            </p>
          )}
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 md:flex">
          <Link
            href="/catalog"
            className="font-mono text-[11px] text-accent hover:text-accent-hot"
          >
            See all in catalog →
          </Link>
          <Link
            href="/compare-modules"
            className="font-mono text-[10.5px] text-ink-faint hover:text-accent"
          >
            compare modules →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((it) => (
          <ModuleCard key={it.module.slug} item={it} />
        ))}
      </div>
    </section>
  );
}

function ModuleCard({ item }: { item: CategoryRowItem }) {
  const { module: m, blurb, aggregate } = item;
  return (
    <div className="flex flex-col border border-hairline bg-canvas-deep transition-colors hover:border-accent">
      {/* Top region — fully linked into the module page. */}
      <Link
        href={`/modules/${m.slug}`}
        className="group flex flex-col p-5"
      >
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 font-mono text-[9.5px] tracking-[0.12em] text-ink-ghost">
              {m.author} / v{m.version}
            </div>
            <div className="truncate font-display text-[20px] font-black leading-[1.05] tracking-[-0.025em] text-ink group-hover:text-accent">
              {m.name}
            </div>
          </div>
          <TrustScore value={m.trust} size="md" />
        </header>

        <p className="mb-3 line-clamp-2 font-body text-[12.5px] leading-[1.5] text-ink-softer">
          {m.description}
        </p>

        {blurb && (
          <div className="mb-3 border-l-2 border-accent pl-3 font-body text-[11.5px] italic leading-[1.45] text-ink-mute">
            {blurb}
          </div>
        )}

        <div className="mt-auto grid grid-cols-[1fr_auto] items-end gap-3 border-t border-hairline pt-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[10px] text-ink-ghost">
              <span className="text-good">SLSA {m.slsa}</span>
              {m.cves.critical + m.cves.high === 0 ? (
                <span className="text-good">· 0 CVE</span>
              ) : (
                <span className="text-warn">
                  · {m.cves.critical + m.cves.high} CVE
                </span>
              )}
              <span>· {m.size}</span>
            </div>
            {aggregate && aggregate.count > 0 ? (
              <div className="flex items-center gap-1.5">
                <Stars value={aggregate.average ?? 0} size={10} />
                <span className="font-mono text-[10px] text-ink-mute">
                  {aggregate.average?.toFixed(1)}
                  <span className="text-ink-ghost">
                    {" "}
                    ({aggregate.count})
                  </span>
                </span>
              </div>
            ) : (
              <span className="font-mono text-[10px] text-ink-ghost">
                No reviews yet
              </span>
            )}
          </div>
          <span className="shrink-0 font-mono text-[10.5px] text-accent group-hover:text-accent-hot">
            view →
          </span>
        </div>
      </Link>

      {/* Receipts drawer — sibling of the Link so click events don't
          collide. Sits inside the same card border. */}
      <div className="border-t border-hairline px-5 py-3">
        <ReceiptsDrawer module={m} size="compact" />
      </div>
    </div>
  );
}
