import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/config/env";

/**
 * /robots.txt.
 *
 * Public site: allow everything.
 * App area (/app/*): disallow — requires auth, no value in indexing.
 * API: disallow — bots crawling API paths just waste our rate limits.
 *
 * Base URL comes from `appBaseUrl()` which throws in production if
 * NEXT_PUBLIC_APP_URL isn't set. That's intentional — a silent
 * fallback to flareo.dev would mean staging environments tell Google
 * the production sitemap is canonical, which is wrong.
 */
export default function robots(): MetadataRoute.Robots {
  const base = appBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/app/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
