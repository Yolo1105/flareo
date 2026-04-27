interface Props {
  modulesIndexed: number;
  featuredCount: number;
  trendingCount: number;
  reviewsCount: number;
}

/**
 * Quad strip directly below the marketplace page hero. Shows the
 * honest counts — actual modules, actual featured picks, actual
 * trending entries, actual reviews. The stat values are real DB
 * counts (not the "1,247 / 2.4M" placeholder numbers the proposal
 * specifically warned against).
 *
 * If a count is zero we still render the tile but with a "—"
 * placeholder rather than hiding it; an empty marketplace is part of
 * the honest reading too.
 */
export function MarketplaceHeroStrip({
  modulesIndexed,
  featuredCount,
  trendingCount,
  reviewsCount,
}: Props) {
  const stats = [
    {
      label: "MODULES",
      value: modulesIndexed,
      sub: "verified + indexed",
    },
    {
      label: "FEATURED",
      value: featuredCount,
      sub: "editorial picks",
    },
    {
      label: "TRENDING",
      value: trendingCount,
      sub: "rising this week",
    },
    {
      label: "REVIEWS",
      value: reviewsCount,
      sub: "recent operator notes",
    },
  ];

  return (
    <section className="border-b border-hairline bg-canvas-deep px-8 py-6">
      <div className="grid grid-cols-2 gap-px bg-hairline md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-baseline justify-between gap-3 bg-canvas-deep px-5 py-4"
          >
            <div>
              <div className="font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
                {s.label}
              </div>
              <div className="mt-0.5 font-body text-[11.5px] text-ink-softer">
                {s.sub}
              </div>
            </div>
            <div className="font-display text-[36px] font-black leading-none tracking-[-0.025em] text-ink">
              {s.value > 0 ? s.value : "—"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
