import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "ghost" | "danger";

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  /** When true and href is set, opens the link in a new tab with
   *  safe rel attrs. Used for external links like preview demos. */
  newTab?: boolean;
}

/**
 * Three button variants match the tokenized CTA language across every
 * page. Renders as <Link> when href is provided, else <button>. When
 * `newTab` is true, renders a plain `<a>` with target=_blank instead
 * (Next's Link does not pass target through correctly).
 *
 * Visual note: every button mirrors the BrandMark logo — a rectangle
 * with a single chamfered bottom-right corner.
 *
 * Two rendering strategies depending on variant:
 *
 *   - PRIMARY (solid fill, no border): uses CSS `clip-path` to cut
 *     the corner. Works because there's no border to break.
 *
 *   - GHOST / DANGER (outlined): uses an absolutely-positioned SVG
 *     to paint the chamfered outline as a stroke. Can't use
 *     `clip-path` here because it would clip the rendered border
 *     mid-line, leaving the diagonal corner edge un-stroked. The
 *     SVG approach paints the full chamfered path including the
 *     diagonal, so the border looks intentional all the way around.
 *
 * Both strategies produce identical exterior shapes; the difference
 * is only in how the visible edge is drawn.
 */

const CHAMFER_PX = 12;

/** clip-path for the solid-fill PRIMARY variant. */
const CHAMFER_CLIP = `polygon(0 0, 100% 0, 100% calc(100% - ${CHAMFER_PX}px), calc(100% - ${CHAMFER_PX}px) 100%, 0 100%)`;

const VARIANTS: Record<
  ButtonVariant,
  { container: string; outlineColor: string | null }
> = {
  primary: {
    container:
      "group bg-accent text-canvas hover:bg-accent-hot hover:text-canvas",
    outlineColor: null, // no SVG outline; clip-path handles the shape
  },
  ghost: {
    // No CSS border — the SVG below paints the visible outline.
    // Hover state changes the SVG stroke via a CSS variable swap.
    container:
      "group text-ink hover:text-accent [--btn-stroke:var(--color-hairline)] hover:[--btn-stroke:var(--color-accent)]",
    outlineColor: "var(--btn-stroke)",
  },
  danger: {
    container:
      "group text-warn hover:bg-warn/[0.06] hover:text-warn [--btn-stroke:var(--color-hairline)] hover:[--btn-stroke:var(--color-warn)]",
    outlineColor: "var(--btn-stroke)",
  },
};

/**
 * SVG outline that follows the chamfered button shape. Paints a
 * 1px stroke on the inside of the bounding box. Used by the outlined
 * variants (ghost, danger).
 *
 * Why SVG instead of CSS:
 *   - `clip-path` cuts the rendered border, leaving the diagonal
 *     corner edge un-stroked.
 *   - `border` + `border-radius` can't make a single chamfered corner
 *     (it rounds all four equally).
 *   - SVG `<path>` lets us draw exactly the shape we want.
 *
 * Implementation notes:
 *   - `preserveAspectRatio="none"` stretches the path to fit any
 *     button width/height. With a 100×100 viewBox the chamfer
 *     becomes 12% of each dimension — close enough to the 12px
 *     constant for typical button sizes (40-50px tall, 80-200px
 *     wide). Buttons that get unusually wide will see a slightly
 *     elongated chamfer; acceptable trade-off.
 *   - `vector-effect="non-scaling-stroke"` keeps the stroke at
 *     exactly 1px regardless of how the SVG is stretched.
 *   - The hover stroke color is read from a CSS variable
 *     `--btn-stroke` set by the variant's container class. This
 *     means hover styling propagates from the parent's :hover
 *     state without needing JS.
 */
function ChamferedOutline() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full transition-[color] duration-150 [&_path]:stroke-[var(--btn-stroke)]"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <path
        d="M 0 0 L 100 0 L 100 88 L 88 100 L 0 100 Z"
        fill="none"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Button({
  href,
  onClick,
  variant = "primary",
  children,
  className,
  icon,
  disabled,
  type = "button",
  newTab = false,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const base =
    "group relative inline-flex cursor-pointer items-center gap-2 px-[18px] py-3 font-body text-[13px] font-medium tracking-[0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const classes = cn(base, v.container, className);

  // PRIMARY: clip-path on the element itself.
  // GHOST / DANGER: no clip-path; SVG outline overlay.
  const elementStyle =
    variant === "primary"
      ? ({ clipPath: CHAMFER_CLIP } as React.CSSProperties)
      : undefined;

  const outline = v.outlineColor ? <ChamferedOutline /> : null;

  // Wrap text/icon in spans with z-index so they paint above the SVG
  // outline. The outline is `position: absolute` and would otherwise
  // sit on top of the inline content.
  const content = (
    <>
      {outline}
      {icon && (
        <span className="relative z-[1] flex items-center transition-transform duration-150 group-hover:scale-110">
          {icon}
        </span>
      )}
      <span className="relative z-[1]">{children}</span>
    </>
  );

  if (href) {
    if (newTab) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          style={elementStyle}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} style={elementStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={elementStyle}
    >
      {content}
    </button>
  );
}
