import type { NavLink } from "@/lib/types";

/**
 * Primary navigation shown in the right side of the top-bar.
 * Numeric prefix matches the site's indexing convention.
 *
 * Marketplace is the demand-side discovery surface (curated, full-bleed
 * cards, inline reviews) — distinct from Catalog (dense filterable
 * grid). Both link into the same /modules/<slug> detail pages.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { num: "01", label: "Pipeline", href: "/" },
  { num: "02", label: "Marketplace", href: "/marketplace" },
  { num: "03", label: "Catalog", href: "/catalog" },
  { num: "04", label: "Verify", href: "/verify" },
  { num: "05", label: "Docs", href: "/docs" },
  { num: "06", label: "Pricing", href: "/pricing" },
] as const;

export const FOOTER_LINKS = [
  { label: "Status", href: "https://status.flareo.dev", external: true },
  { label: "Changelog", href: "/changelog" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "FAQ", href: "/faq" },
  { label: "Docs", href: "/docs" },
  { label: "About", href: "/about" },
  { label: "Security", href: "/security" },
  { label: "Incidents", href: "/incidents" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "GitHub", href: "https://github.com/flareo", external: true },
] as const;

/**
 * Helper to decide which nav link is currently active.
 * Docs-group pages (concepts, architecture, compare) all highlight "Docs".
 * Module detail pages stay highlighted as Marketplace (the curated
 * discovery surface) — the visitor likely arrived from there.
 */
export function getActiveNav(pathname: string): string | null {
  if (pathname === "/") return "01";
  if (pathname.startsWith("/marketplace") || pathname.startsWith("/modules"))
    return "02";
  if (pathname.startsWith("/catalog")) return "03";
  if (pathname.startsWith("/verify")) return "04";
  if (pathname.startsWith("/docs")) return "05";
  if (pathname.startsWith("/pricing")) return "06";
  return null;
}

/** Meta-strip telemetry values (would be a server fetch in production) */
export const META_STRIP = {
  version: "0.4.2",
  region: "us-east-1",
  buildsSevenDay: 41,
} as const;
