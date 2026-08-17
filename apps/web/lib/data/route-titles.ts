import { ALL_PAGES } from "@/lib/docs/sidebar";
import { NAV_LINKS } from "@/lib/data/nav";

/**
 * Human-readable page titles keyed by pathname.
 * Used for browser tab titles (via page metadata) and in-app breadcrumbs.
 * Keep labels aligned with sidebar/nav copy and each route's metadata.title.
 */

/** Static routes → display title (exact pathname match). */
const STATIC_ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/pipeline": "Pipeline",
  "/marketplace": "Marketplace",
  "/catalog": "Catalog",
  "/verify": "Verify",
  "/pricing": "Pricing",
  "/login": "Sign in",
  "/signup": "Join waitlist",
  "/about": "About",
  "/architecture": "Architecture",
  "/changelog": "Changelog",
  "/compare": "Compare",
  "/compare-modules": "Compare modules",
  "/concepts": "Concepts",
  "/faq": "FAQ",
  "/incidents": "Incidents",
  "/publish": "Publish a module",
  "/roadmap": "Roadmap",
  "/sandbox": "Sandbox",
  "/security": "Security",
  "/status": "Status",
  "/legal/privacy": "Privacy Policy",
  "/legal/terms": "Terms of Service",
  "/docs/cli": "CLI Reference",

  "/app": "Dashboard",
  "/app/start": "Start here",
  "/app/modules": "My modules",
  "/app/submissions": "My submissions",
  "/app/publish": "Publish",
  "/app/jobs": "Jobs",
  "/app/admin": "Admin queue",
  "/app/admin/worker": "Worker health",
  "/app/admin/rebuilds": "Rebuild log",
  "/app/admin/reviews": "Review moderation",
  "/app/admin/featured": "Featured curation",
  "/app/admin/reports": "Module reports",
  "/app/admin/vex": "VEX annotations",
  "/app/admin/policy": "Admission policy",
  "/app/admin/analytics": "Analytics",
  "/app/settings": "Settings",
  "/app/settings/api-keys": "API keys",
  "/app/settings/billing": "Billing",
  "/app/settings/notifications": "Notifications",
  "/app/settings/sessions": "Sessions",
  "/app/settings/delete": "Delete account",
};

/** Build docs titles from the sidebar (single source of truth). */
for (const page of ALL_PAGES) {
  STATIC_ROUTE_TITLES[page.slug] = page.title;
}

/** Nav link labels for public primary routes. */
for (const link of NAV_LINKS) {
  STATIC_ROUTE_TITLES[link.href] = link.label;
}

export interface RouteCrumb {
  label: string;
  href: string;
}

function normalizePath(pathname: string): string {
  const trimmed = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (trimmed !== "/" && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed || "/";
}

/**
 * Best-effort title for a pathname. Falls back to a humanized last segment.
 */
export function getRouteTitle(pathname: string): string {
  const path = normalizePath(pathname);

  if (STATIC_ROUTE_TITLES[path]) {
    return STATIC_ROUTE_TITLES[path];
  }

  const segments = path.split("/").filter(Boolean);

  if (path.startsWith("/modules/") && segments.length >= 2) {
    return humanizeSlug(segments[1]!);
  }

  if (path.startsWith("/u/") && segments.length >= 2) {
    return `@${segments[1]}`;
  }

  if (path.startsWith("/app/modules/") && path.endsWith("/preview")) {
    const slug = segments[2];
    return slug ? `${humanizeSlug(slug)} preview` : "Preview";
  }

  if (path.startsWith("/app/jobs/") && segments.length >= 3) {
    return `Job ${segments[2]}`;
  }

  if (path.startsWith("/app/submissions/") && segments.length >= 3) {
    return `Submission ${shortId(segments[2]!)}`;
  }

  if (path.startsWith("/app/admin/vex/") && segments.length >= 4) {
    return `VEX · ${humanizeSlug(segments[3]!)}`;
  }

  if (path.startsWith("/app/admin/") && segments.length >= 3) {
    const tail = segments[2]!;
    if (/^[a-z0-9_-]{8,}$/i.test(tail) && !STATIC_ROUTE_TITLES[`/app/admin/${tail}`]) {
      return "Submission review";
    }
  }

  // Longest-prefix static match (e.g. partial paths while resolving).
  const prefixes = Object.keys(STATIC_ROUTE_TITLES)
    .filter((key) => path.startsWith(key) && key !== "/")
    .sort((a, b) => b.length - a.length);
  if (prefixes[0]) {
    return STATIC_ROUTE_TITLES[prefixes[0]!]!;
  }

  const last = segments[segments.length - 1];
  return last ? humanizeSlug(last) : "Flareo";
}

/**
 * Breadcrumb trail for the app shell top bar.
 */
export function getRouteBreadcrumbs(pathname: string): RouteCrumb[] {
  const path = normalizePath(pathname);
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Home", href: "/" }];
  }

  const crumbs: RouteCrumb[] = [];
  let acc = "";

  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    crumbs.push({
      href: acc,
      label: isLast ? getRouteTitle(acc) : getRouteTitle(acc),
    });
  }

  // Drop redundant leading "app" segment — show "Dashboard" not "app / Dashboard".
  if (crumbs[0]?.href === "/app" && crumbs.length > 1) {
    crumbs.shift();
  }

  return crumbs;
}

function humanizeSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}
