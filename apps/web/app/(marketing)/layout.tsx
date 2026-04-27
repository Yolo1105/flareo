import { MetaStrip } from "@/components/layout/MetaStrip";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Grain } from "@/components/layout/Grain";

/**
 * Layout shared by every public page.
 *
 * Two layers:
 *   1. Outer canvas — full viewport, has the grain texture and a
 *      thin 1px border that frames the whole window.
 *   2. Inner content frame — capped at 1440px and centered. On wide
 *      monitors the content sits in the middle with empty gutters on
 *      either side; on viewports under 1440px it fills the screen.
 *      No visible side lines — just the centering.
 *
 * The Nav and Footer ALSO sit inside the inner frame so they're
 * centered with the content. MetaStrip stays on the outer canvas
 * because it functions as a top-bar that should reach full-width on
 * every viewport.
 *
 * If you want a section to break out of the inner frame and span
 * full width (rare — full-bleed images, marquee strips), wrap that
 * section in `<div className="full-bleed">` — the helper class is
 * defined in globals.css.
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative overflow-hidden border border-hairline bg-canvas text-ink">
      <Grain />
      <div className="relative z-[2]">
        <MetaStrip />
        <div>
          <Nav />
          {children}
          <Footer />
        </div>
      </div>
    </div>
  );
}
