"use client";

import { useState, useMemo } from "react";
import type { Module } from "@/lib/types";
import { MODULES, getCategoryCounts } from "@/lib/data/modules";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatLastRebuiltAt } from "@/lib/utils/time";

type SortField = "trust" | "updated" | "name";

const CATEGORY_LABELS: Record<Module["category"] | "all", string> = {
  all: "All",
  security: "Security",
  proxy: "Proxy",
  monitoring: "Monitoring",
  auth: "Auth",
  devops: "DevOps",
  media: "Media",
};

export interface FeaturedStripItem {
  module: Module;
  blurb: string | null;
  position: number;
}

export interface TrendingStripItem {
  module: Module;
  recentReviews: number;
  avgRating: number | null;
}

export interface CatalogExplorerProps {
  /**
   * DB-sourced module list. When provided, drives the main grid.
   * When undefined (e.g. DB unreachable, or server fetch threw),
   * falls back to the static MODULES fixture so the page still
   * renders something useful.
   */
  modules?: Module[];
  /**
   * Editorially-featured modules. Rendered as a strip above the
   * filter bar. Hidden entirely when empty — no zero-state clutter.
   */
  featured?: FeaturedStripItem[];
  /**
   * Algorithmically trending modules. Rendered as a compact strip
   * below Featured. Hidden when empty.
   */
  trending?: TrendingStripItem[];
}

export function CatalogExplorer({
  modules,
  featured = [],
  trending = [],
}: CatalogExplorerProps = {}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Module["category"] | "all">("all");
  const [sort, setSort] = useState<SortField>("trust");

  // Source-of-truth: DB modules when available, fixture otherwise.
  // The fallback exists so a DB outage doesn't make the whole
  // catalog a blank page — users see the demo-set instead.
  const source = modules && modules.length > 0 ? modules : MODULES;

  // Category counts reflect whatever data we're actually rendering.
  const counts = useMemo(() => {
    if (modules && modules.length > 0) {
      const out: Record<string, number> = {
        all: source.length,
        security: 0,
        proxy: 0,
        monitoring: 0,
        auth: 0,
        devops: 0,
        media: 0,
      };
      for (const m of source) out[m.category] = (out[m.category] ?? 0) + 1;
      return out;
    }
    return getCategoryCounts();
  }, [modules, source]);

  const filtered = useMemo(() => {
    let result = [...source];
    if (category !== "all") {
      result = result.filter((m) => m.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "trust") result.sort((a, b) => b.trust - a.trust);
    else if (sort === "updated") {
      // Prefer lastRebuiltAt (nulls last); fall back to updatedHours.
      result.sort((a, b) => {
        const aTs = a.lastRebuiltAt
          ? new Date(a.lastRebuiltAt).getTime()
          : null;
        const bTs = b.lastRebuiltAt
          ? new Date(b.lastRebuiltAt).getTime()
          : null;
        if (aTs !== null && bTs !== null) return bTs - aTs;
        if (aTs !== null) return -1;
        if (bTs !== null) return 1;
        return a.updatedHours - b.updatedHours;
      });
    } else result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [query, category, sort, source]);

  const CATEGORIES: (Module["category"] | "all")[] = [
    "all",
    "security",
    "proxy",
    "monitoring",
    "auth",
    "devops",
    "media",
  ];

  return (
    <>
      {/* Featured strip — editorial picks. Only renders when curator
          has something active. */}
      {featured.length > 0 && <FeaturedStrip items={featured} />}

      {/* Trending strip — algorithmic. Only renders when there's
          meaningful signal. */}
      {trending.length > 0 && <TrendingStrip items={trending} />}

      {/* Sticky filter bar */}
      <div className="sticky top-[calc(28px+94px)] z-40 border-b border-hairline bg-canvas/95 px-8 py-4 backdrop-blur-md">
        <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-4">
          <div className="flex items-center gap-2 border border-hairline bg-canvas-deep px-3 py-2 focus-within:border-accent">
            <span className="font-mono text-[11px] text-ink-ghost">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="module name, tag, description..."
              className="flex-1 bg-transparent font-mono text-[13px] text-ink placeholder:text-ink-ghost focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              SORT
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortField)}
              className="border border-hairline bg-canvas-deep px-2 py-2 font-mono text-[12px] text-ink focus:border-accent focus:outline-none"
            >
              <option value="trust">trust score</option>
              <option value="updated">recently updated</option>
              <option value="name">name</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] transition-colors",
                category === c
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-hairline text-ink-faint hover:border-ink-ghost hover:text-ink"
              )}
            >
              {CATEGORY_LABELS[c]}
              <span className="text-[10px] text-ink-ghost">{counts[c]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Module grid */}
      <div className="px-8 py-8">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-hairline bg-canvas-deep p-12 text-center">
            <div className="mb-4 font-mono text-[13px] text-ink-mute">
              <span className="text-accent">$</span> flareo search{" "}
              <span className="text-warn">&quot;{query || category}&quot;</span>
              <span className="ml-3 text-ink-ghost">· 0 results</span>
            </div>
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="font-mono text-[11.5px] text-accent hover:text-accent-hot"
            >
              CLEAR FILTERS →
            </button>
          </div>
        ) : (
          <div className="space-y-0 border border-hairline">
            {filtered.map((m, i) => (
              <Link
                key={m.slug}
                href={`/modules/${m.slug}`}
                className={cn(
                  "grid grid-cols-[48px_3fr_1fr] items-center gap-5 bg-canvas-deep px-6 py-5 transition-colors hover:bg-canvas-panel",
                  i < filtered.length - 1 && "border-b border-hairline"
                )}
              >
                <div>
                  <div className="font-mono text-[10px] tracking-[0.1em] text-ink-ghost">
                    [{String(i + 1).padStart(2, "0")}]
                  </div>
                  <div className="mt-1 font-mono text-[9.5px] tracking-[0.04em] text-ink-ghost">
                    {m.id}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <StatusBadge
                      tone={
                        m.status === "verified"
                          ? "ok"
                          : m.status === "pending"
                            ? "warn"
                            : "bad"
                      }
                    >
                      {m.status.toUpperCase()}
                    </StatusBadge>
                    <span className="font-mono text-[9.5px] tracking-[0.1em] text-ink-faint">
                      SLSA {m.slsa}
                    </span>
                  </div>
                  <div className="mb-1 flex items-baseline gap-3">
                    <span className="font-display text-[22px] font-black leading-[1] tracking-[-0.025em] text-ink">
                      {m.name}
                    </span>
                    <span className="border border-hairline px-2 py-0.5 font-mono text-[10px] text-ink-mute">
                      v{m.version}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-faint">
                      by {m.author}
                    </span>
                  </div>
                  <div className="mb-2 font-body text-[13px] text-ink-softer">
                    {m.description}
                  </div>
                  <div className="mb-2 flex items-center gap-2 font-mono text-[11.5px] text-ink-mute">
                    <span className="text-accent">$</span>
                    <span>
                      flareo pull {m.slug}@{m.version}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {m.tags.map((t) => (
                      <span
                        key={t}
                        className="border border-hairline bg-canvas-panel px-2 py-0.5 font-mono text-[10px] text-ink-faint"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "font-display text-[52px] font-black leading-[0.95] tracking-[-0.035em]",
                      m.trust >= 90
                        ? "text-good"
                        : m.trust >= 70
                          ? "text-warn"
                          : "text-bad"
                    )}
                  >
                    {m.trust}
                  </div>
                  <div className="mb-2 h-1 w-full overflow-hidden bg-hairline">
                    <div
                      className={cn(
                        "h-full transition-all",
                        m.trust >= 90
                          ? "bg-good"
                          : m.trust >= 70
                            ? "bg-warn"
                            : "bg-bad"
                      )}
                      style={{ width: `${m.trust}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-right font-mono text-[10px]">
                    <span className="text-ink-ghost">CVE</span>
                    <span
                      className={
                        m.cves.critical > 0 ? "text-bad" : "text-ink-mute"
                      }
                    >
                      {m.cves.critical}/{m.cves.high}/{m.cves.medium}/
                      {m.cves.low}
                    </span>
                    <span className="text-ink-ghost">REBUILT</span>
                    <span
                      className={
                        m.lastRebuiltAt ? "text-ink-mute" : "text-ink-ghost"
                      }
                    >
                      {formatLastRebuiltAt(m.lastRebuiltAt)}
                    </span>
                    <span className="text-ink-ghost">SIZE</span>
                    <span className="text-ink-mute">{m.size}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-hairline bg-canvas-panel px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-[20px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
              Don&apos;t see a module you need?
            </div>
            <div className="mt-1 font-body text-[13px] text-ink-softer">
              Submit a verified build and we&apos;ll add it to the catalog.
            </div>
          </div>
          <Link
            href="/publish"
            className="bg-accent px-5 py-3 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot"
          >
            Submit a module
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── Featured strip ──────────────────────────────────────────────

function FeaturedStrip({ items }: { items: FeaturedStripItem[] }) {
  return (
    <section className="border-b border-hairline bg-canvas-panel px-8 py-7">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
            ★ FEATURED
          </div>
          <h2 className="mt-1 font-display text-[18px] font-black tracking-[-0.02em] text-ink">
            Editor&apos;s picks
          </h2>
        </div>
        <div className="font-mono text-[10.5px] text-ink-faint">
          curated by the Flareo team
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.module.slug}
            href={`/modules/${it.module.slug}`}
            className="group flex flex-col border border-hairline bg-canvas-deep p-4 transition-colors hover:border-accent"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <StatusBadge
                    tone={
                      it.module.status === "verified"
                        ? "ok"
                        : it.module.status === "pending"
                          ? "warn"
                          : "bad"
                    }
                  >
                    {it.module.status.toUpperCase()}
                  </StatusBadge>
                  <span className="font-mono text-[9.5px] tracking-[0.1em] text-ink-ghost">
                    SLSA {it.module.slsa}
                  </span>
                </div>
                <div className="font-display text-[17px] font-black leading-[1.1] tracking-[-0.02em] text-ink group-hover:text-accent">
                  {it.module.name}
                </div>
              </div>
              <div
                className={cn(
                  "shrink-0 font-display text-[24px] font-black leading-none tracking-[-0.02em]",
                  it.module.trust >= 90
                    ? "text-good"
                    : it.module.trust >= 70
                      ? "text-warn"
                      : "text-bad",
                )}
              >
                {it.module.trust}
              </div>
            </div>
            <p className="mb-3 line-clamp-2 font-body text-[12px] leading-[1.5] text-ink-softer">
              {it.module.description}
            </p>
            {it.blurb && (
              <div className="mt-auto border-l-2 border-accent pl-3 font-body text-[11.5px] italic leading-[1.45] text-ink-mute">
                {it.blurb}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Trending strip ──────────────────────────────────────────────

function TrendingStrip({ items }: { items: TrendingStripItem[] }) {
  return (
    <section className="border-b border-hairline bg-canvas px-8 py-6">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
            ↗ TRENDING
          </div>
          <h2 className="mt-1 font-display text-[16px] font-black tracking-[-0.02em] text-ink">
            Gaining attention
          </h2>
        </div>
        <div className="max-w-[320px] text-right font-mono text-[10px] leading-[1.4] text-ink-ghost">
          ranked by recent reviews + fresh rebuilds + trust — not raw pull
          counts
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline md:grid-cols-4">
        {items.slice(0, 8).map((it, i) => (
          <Link
            key={it.module.slug}
            href={`/modules/${it.module.slug}`}
            className="group flex flex-col bg-canvas-deep p-3 transition-colors hover:bg-canvas-panel"
          >
            <div className="mb-1 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint">
              #{i + 1}
            </div>
            <div className="mb-1 font-display text-[13.5px] font-black leading-[1.15] tracking-[-0.01em] text-ink group-hover:text-accent">
              {it.module.name}
            </div>
            <div className="font-mono text-[10px] text-ink-softer">
              {it.recentReviews > 0
                ? `${it.recentReviews} new review${it.recentReviews === 1 ? "" : "s"}`
                : "quiet but rising"}
              {it.avgRating !== null && (
                <span className="ml-2 text-ink-ghost">
                  · {it.avgRating.toFixed(1)}★
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
