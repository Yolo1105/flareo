import Link from "next/link";
import type { ReviewRow } from "@/lib/db/reviews";
import { Stars } from "./Stars";

interface Props {
  reviews: ReviewRow[];
}

/**
 * Marketplace review board — surfaces ~6 substantive recent reviews
 * across modules, with each card linking to the module being reviewed.
 *
 * Distinct from the homepage's smaller ReviewsWall: this one shows
 * 6 (vs 4) and includes the rating histogram-influence so the
 * presentation rewards multi-paragraph operator notes over short ones.
 */
export function MarketplaceReviewBoard({ reviews }: Props) {
  return (
    <section className="border-b border-hairline bg-canvas-panel px-8 py-12">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            ★ / WHAT OPERATORS SAY
          </div>
          <h2 className="font-display text-[28px] font-black leading-[1] tracking-[-0.025em] text-ink">
            Recent reviews from the field.
          </h2>
          <p className="mt-2 max-w-[560px] font-body text-[13px] leading-[1.55] text-ink-softer">
            Real notes from operators running these images on their own
            infrastructure. Every review links back to the module being
            reviewed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <Link
            key={r.id}
            href={`/modules/${r.moduleSlug}#reviews`}
            className="group flex flex-col border border-hairline bg-canvas-deep p-5 transition-colors hover:border-accent"
          >
            <header className="mb-3 flex items-baseline justify-between gap-3">
              <Stars value={r.rating} size={11} />
              <span className="font-mono text-[10px] text-ink-ghost">
                on{" "}
                <span className="text-ink-mute group-hover:text-accent">
                  {r.moduleSlug}
                </span>
              </span>
            </header>
            <h3 className="mb-2 font-display text-[15px] font-black leading-[1.2] tracking-[-0.01em] text-ink">
              {r.title}
            </h3>
            <blockquote className="mb-3 border-l-2 border-hairline pl-3 font-body text-[12.5px] leading-[1.6] text-ink-softer">
              {r.body.length > 240 ? `${r.body.slice(0, 240)}…` : r.body}
            </blockquote>
            <footer className="mt-auto flex items-baseline justify-between font-mono text-[10.5px] text-ink-faint">
              <span>— {r.authorName ?? "anonymous"}</span>
              <span className="text-accent group-hover:text-accent-hot">
                read →
              </span>
            </footer>
          </Link>
        ))}
      </div>
    </section>
  );
}
