import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { appBaseUrl } from "@/lib/config/env";

/**
 * /sitemap.xml — listing all publicly crawlable URLs.
 *
 * Three sources:
 *   1. Static marketing pages (hand-listed below)
 *   2. Every public module, dynamically from Postgres
 *   3. Legal pages (/legal/terms, /legal/privacy)
 *
 * Docs live on docs.flareo.dev and have their own sitemap (static, in
 * the flareo-docs repo). Intentionally separate because the two hosts
 * have different deploy cadences and we don't want a docs rebuild to
 * invalidate the main-site sitemap.
 *
 * Base URL comes from `appBaseUrl()` — production must set
 * NEXT_PUBLIC_APP_URL or this throws. Prevents staging from emitting
 * a sitemap that points search engines at production URLs.
 */

export const revalidate = 3600; // regenerate at most once an hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appBaseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1.0, changeFrequency: "weekly" },
    { url: `${base}/catalog`, lastModified: now, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/verify`, lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/pricing`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/about`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${base}/signup`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/changelog`, lastModified: now, priority: 0.6, changeFrequency: "weekly" },
    { url: `${base}/concepts`, lastModified: now, priority: 0.5, changeFrequency: "monthly" },
    { url: `${base}/architecture`, lastModified: now, priority: 0.5, changeFrequency: "monthly" },
    { url: `${base}/compare`, lastModified: now, priority: 0.5, changeFrequency: "monthly" },
    { url: `${base}/legal/terms`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${base}/legal/privacy`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
  ];

  // Every public module gets its detail page in the sitemap with its
  // real lastRebuiltAt so search engines know when it actually changed.
  let modulePages: MetadataRoute.Sitemap = [];
  try {
    const modules = (await prisma.module.findMany({
      where: { visibility: "public" },
      select: { slug: true, lastRebuiltAt: true },
    })) as Array<{ slug: string; lastRebuiltAt: Date | null }>;

    modulePages = modules.map((m) => ({
      url: `${base}/modules/${m.slug}`,
      lastModified: m.lastRebuiltAt ?? now,
      priority: 0.8,
      changeFrequency: "daily" as const,
    }));
  } catch {
    // If the DB is unreachable, return a partial sitemap rather than
    // erroring out. Better to list static pages than to 500 the crawler.
  }

  return [...staticPages, ...modulePages];
}
