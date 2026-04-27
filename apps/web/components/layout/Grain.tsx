/**
 * Subtle radial-dot noise texture that sits at the root of every page.
 * Kept as a component so you can disable it globally with one edit.
 */
export function Grain() {
  return <div className="fl-grain" aria-hidden />;
}
