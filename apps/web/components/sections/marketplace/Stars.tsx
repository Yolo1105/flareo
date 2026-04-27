interface Props {
  value: number;
  size?: number;
}

/**
 * Inline 5-star rating display. Renders filled stars proportional to
 * `value` (a float 0-5). Used on marketplace cards, the spotlight, and
 * the review board.
 */
export function Stars({ value, size = 12 }: Props) {
  const rounded = Math.round(value);
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 16 16"
          className={n <= rounded ? "text-accent" : "text-ink-ghost"}
          fill={n <= rounded ? "currentColor" : "none"}
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
