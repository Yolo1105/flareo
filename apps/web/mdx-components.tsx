import type { MDXComponents } from "mdx/types";

/**
 * Custom MDX component overrides.
 *
 * @next/mdx requires this file at the project root. Every MDX element
 * that needs custom rendering goes in the map below.
 *
 * For now we pass everything through unchanged; the heavy styling work
 * is done by `.fl-prose` in globals.css, which targets raw h1/p/code/
 * pre/etc descendants. No per-component React wrapper needed.
 *
 * Code block syntax highlighting is intentionally NOT done here — we
 * rely on the monospaced, color-less rendering from .fl-prose. This is
 * a deliberate choice:
 *   - no Shiki build cost
 *   - no FOIT/FOUC on shell snippets
 *   - consistent with the main site's terminal blocks
 *
 * If we want real highlighting later, wrap <pre> here and call Shiki
 * at compile time (RSC-friendly since MDX runs on the server).
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
