import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ReviewRow } from "@/lib/db/reviews";

interface Props {
  reviews: ReviewRow[];
}

/**
 * "What operators are saying" wall on the landing page. Surfaces real
 * community reviews so a first-time visitor sees that the catalog has
 * actual users behind it without clicking into the catalog. Each card
 * links to the reviewed module's detail page.
 *
 * Renders nothing when no reviews are available — cleaner than a
 * "no reviews yet" placeholder on a marketing surface.
 *
 * Body excerpts are truncated to 220 characters with an ellipsis.
 * That's enough for a meaningful quote without dominating the page,
 * and the full review is one click away.
 */
export function ReviewsWall({ reviews }: Props) {
  if (reviews.length === 0) return null;

  return (
    <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
      <SectionHeader
        num="05"
        label="OPERATORS USING IT"
        title="What people running this in production say."
      >
        Real reviews from people pulling these images and running them
        on their own infrastructure. Not testimonials we paid for —
        operators leaving their honest take after time in production.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reviews.map((r) => (
          <Link
            key={r.id}
            href={`/modules/${r.moduleSlug}`}
            className="group flex flex-col border border-hairline bg-canvas-deep p-5 transition-colors hover:border-accent"
          >
            <header className="mb-3 flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} />
                <h3 className="font-display text-[15px] font-black leading-[1.2] tracking-[-0.01em] text-ink">
                  {r.title}
                </h3>
              </div>
              <span className="shrink-0 font-mono text-[10.5px] text-ink-ghost">
                on {r.moduleSlug}
              </span>
            </header>

            <blockquote className="mb-3 border-l-2 border-hairline pl-3 font-body text-[12.5px] leading-[1.6] text-ink-softer">
              {r.body.length > 220 ? `${r.body.slice(0, 220)}…` : r.body}
            </blockquote>

            <footer className="mt-auto flex items-baseline justify-between font-mono text-[10.5px] text-ink-faint">
              <span>
                — {r.authorName ?? "anonymous"}
                {r.authorName && (
                  <span className="ml-1 text-ink-ghost">
                    · {timeAgo(r.createdAt)}
                  </span>
                )}
              </span>
              <span className="text-accent group-hover:text-accent-hot">
                read more →
              </span>
            </footer>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-right">
        <Link
          href="/catalog"
          className="font-mono text-[11px] text-accent hover:text-accent-hot"
        >
          Browse the catalog and add your own review →
        </Link>
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={11}
          height={11}
          viewBox="0 0 16 16"
          className={n <= value ? "text-accent" : "text-ink-ghost"}
          fill={n <= value ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path d="M8 1.5l2 4.5 5 .5-3.8 3.4 1.1 5L8 12.2l-4.3 2.7 1.1-5L1 6.5l5-.5 2-4.5z" />
        </svg>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 86_400_000,
  );
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
