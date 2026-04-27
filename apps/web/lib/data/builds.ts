import type { Build } from "@/lib/types";

/**
 * Build/provenance helpers for the module detail page's Provenance
 * Trail table.
 *
 * Flareo's real build records live on the Submission + ModuleRebuild
 * tables; this helper reconstructs a display-ready Build shape from
 * a Module so the UI doesn't depend on a separate fetch. The stages,
 * timings, and timeline are representative of the actual pipeline
 * (submit → build → scan → attest → sign → publish) — they're not
 * from a specific real build.
 *
 * Per-module variation is driven off the digest: hash fragments
 * come from different byte ranges of the digest so two modules
 * don't show identical trails. Build ID and source commit are
 * derived deterministically from the slug + digest.
 *
 * If the Provenance Trail ever needs to reflect literal build records
 * (exact durations, exact timestamps), this helper swaps to a
 * loader that reads from ModuleRebuild rows. The Module prop alone
 * won't be enough; the page-level data fetch will need to join.
 */

interface Sluggable {
  slug: string;
  digest: string;
  lastRebuiltAt?: string | null;
}

// Hex substring helper — pulls n characters starting at offset,
// wrapping around the digest if the offset runs off the end.
function hexSlice(digest: string, offset: number, n: number): string {
  // Strip the "sha256:" prefix if present.
  const hex = digest.replace(/^sha256:/, "");
  if (hex.length === 0) return "00000000".slice(0, n);
  const start = offset % hex.length;
  if (start + n <= hex.length) return hex.slice(start, start + n);
  // Wrap.
  return (hex.slice(start) + hex.slice(0, n)).slice(0, n);
}

// Deterministic "build number" from slug — a short, human-readable
// integer that visibly differs between modules.
function buildNumberFor(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffffffff;
  }
  // Truncate to a friendly 4-digit build number.
  return `#${(Math.abs(hash) % 9000 + 1000).toString()}`;
}

/**
 * Build a Build object to render the Provenance Trail table for a
 * given module. Values are derived from the module's digest and
 * slug so every module gets its own trail rather than sharing
 * vaultwarden's.
 */
export function buildFor(module: Sluggable): Build {
  const startedAt =
    module.lastRebuiltAt ??
    // Fallback: a static-ish time that changes deterministically
    // per module so it's not identical across all pages.
    new Date(
      Date.UTC(2026, 3, 20, 14, 2 + (module.slug.length % 30), 0),
    ).toISOString();

  return {
    id: buildNumberFor(module.slug),
    moduleSlug: module.slug,
    startedAt,
    sourceCommit: hexSlice(module.digest, 8, 40),
    stages: [
      {
        order: "01",
        name: "submit",
        durationMs: 140 + (module.slug.length % 7) * 10,
        hashFragment: hexSlice(module.digest, 0, 8),
      },
      {
        order: "02",
        name: "build",
        durationMs: 150_000 + (module.slug.length % 13) * 3_000,
        hashFragment: hexSlice(module.digest, 8, 8),
      },
      {
        order: "03",
        name: "scan",
        durationMs: 2_800 + (module.slug.length % 11) * 120,
        hashFragment: hexSlice(module.digest, 16, 8),
      },
      {
        order: "04",
        name: "attest",
        durationMs: 1_700 + (module.slug.length % 9) * 40,
        hashFragment: hexSlice(module.digest, 24, 8),
      },
      {
        order: "05",
        name: "sign",
        durationMs: 800 + (module.slug.length % 5) * 30,
        hashFragment: hexSlice(module.digest, 32, 8),
      },
      {
        order: "06",
        name: "publish",
        durationMs: 4_200 + (module.slug.length % 9) * 100,
        hashFragment: hexSlice(module.digest, 40, 8),
      },
    ],
  };
}
