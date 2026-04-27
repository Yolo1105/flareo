import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

/**
 * Security headers applied to every HTML response.
 *
 * These are the baseline headers every site should have; they're cheap
 * to set and catch many common browser-side attacks:
 *
 *   - HSTS forces HTTPS for future visits (12 months)
 *   - X-Frame-Options prevents clickjacking via iframe embedding
 *   - X-Content-Type-Options stops MIME-type sniffing
 *   - Referrer-Policy limits what URLs we leak to third parties
 *   - Permissions-Policy disables browser APIs we don't use
 *
 * A full CSP would be nice but needs per-route tuning for:
 *   - inline styles from Tailwind (partially fixed by hashing)
 *   - Sentry's browser bundle
 *   - GitHub avatar CDN (avatars.githubusercontent.com)
 *
 * Not shipping a CSP until we can do it without false positives.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Let browsers know we care about privacy: no FLoC, no Topics API.
  {
    key: "Permissions-Policy-Report-Only",
    value: "browsing-topics=()",
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Tell Next that .mdx files under app/ are also valid page files.
  // That lets app/docs/<slug>/page.mdx render (we use page.tsx + content.mdx
  // today, so this is forward-looking but cheap).
  pageExtensions: ["ts", "tsx", "mdx"],
  async headers() {
    return [
      {
        // Everything except the Sentry tunnel (which needs its own headers).
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    // Enable modern features as needed
  },
};

/**
 * MDX config. Pipeline:
 *   - remark-gfm: GitHub-flavored markdown (tables, strikethrough, task lists)
 *   - rehype-slug: add id="..." to every heading
 *   - rehype-autolink-headings: make headings clickable anchor links
 *
 * Syntax highlighting is intentionally NOT configured here — we rely on
 * the .fl-prose styles in globals.css to render code blocks without
 * colors. Consistent with the terminal blocks elsewhere on the site.
 */
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: { className: ["anchor"] },
        },
      ],
    ],
  },
});

/**
 * Sentry webpack plugin config.
 *
 * Uploads source maps to Sentry at build time so stack traces are
 * human-readable. Only activates when SENTRY_AUTH_TOKEN is present,
 * so local and CI builds without the secret still work — they just
 * skip the upload step.
 *
 * Chain: MDX wrapper runs first (compiles .mdx), then Sentry wraps
 * the whole thing. Order matters only in that Sentry has to be the
 * outermost wrapper.
 */
const withMdxConfig = withMDX(config);

export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(withMdxConfig, {
      org: process.env.SENTRY_ORG || "flareo",
      project: process.env.SENTRY_PROJECT || "flareo",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      // Upload source maps but delete them from the deploy so they don't
      // leak to users.
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      // Wrapper for console.log reporting etc — off for now.
      disableLogger: true,
    })
  : withMdxConfig;
