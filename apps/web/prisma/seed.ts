/**
 * Structural production seed — catalog scaffolding only.
 *
 * This file contains no personas, reviews, or demo metrics.
 * Demo users, testimonials, featured blurbs, submissions, and
 * reports live in `seed.dev.ts`, which refuses to run outside
 * development.
 *
 * Run with:
 *   SEED=1 npx prisma db seed
 *   SEED=1 npm run db:seed
 *
 * For a populated local demo, also run:
 *   SEED=1 npm run db:seed:dev
 *
 * Idempotent: every write is upsert-by-id so rerunning is safe.
 * If ADMIN_EMAIL is set, any user matching that email is promoted to
 * admin at the end.
 *
 * Production gate
 * ---------------
 * Guarded behind SEED=1. A production deployment starts with an empty
 * catalog and fills through the real canary pipeline — not a seed
 * script writing fake modules. The gate exists to prevent an
 * accidental `prisma db seed` in prod from clobbering the real data.
 *
 * What gets seeded
 * ----------------
 *   1. Module rows from the MODULES fixture (local catalog structure)
 *   2. Rebuild history per module (structural outcomes, no personas)
 *
 * Everything below is deliberately deterministic — same IDs every
 * time — so reruns produce the same rows rather than piling up
 * duplicates.
 */

import { PrismaClient } from "@prisma/client";
import { MODULES } from "../lib/data/modules";

const prisma = new PrismaClient();

// ─── rebuilds ─────────────────────────────────────────────────────
//
// Every module gets 5 rebuild history rows — four successful + one
// varying (unchanged/failed) to show the range of outcomes. The
// failure lives on a non-featured module so the Featured strip stays
// clean when demo featured picks are layered on via seed.dev.ts.

const REBUILD_PATTERNS = [
  { outcome: "success", ago: 4, duration: 182_000, hasDigestChange: false },
  { outcome: "upstream_unchanged", ago: 28, duration: 3_400, hasDigestChange: false },
  { outcome: "success", ago: 52, duration: 174_000, hasDigestChange: true },
  { outcome: "upstream_unchanged", ago: 76, duration: 3_100, hasDigestChange: false },
  { outcome: "success", ago: 100, duration: 188_000, hasDigestChange: false },
] as const;

// Modules where the most recent rebuild failed instead of succeeded —
// gives the rebuild log "failures" filter something to find.
const REBUILD_FAILURE_SLUGS = new Set(["keycloak"]);

// ─── main ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (process.env.SEED !== "1") {
    console.log(
      "Seed skipped. Set SEED=1 to populate the database with structural fixture data.",
    );
    console.log(
      "  (production deployments should leave this unset so the catalog starts empty.)",
    );
    console.log(
      "  Demo personas/reviews: SEED=1 npm run db:seed:dev (development only).",
    );
    return;
  }

  // 1. Modules — catalog structure only; no publisher personas.
  console.log("Seeding modules");
  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        slug: m.slug,
        name: m.name,
        version: m.version,
        author: m.author,
        description: m.description,
        tags: [...m.tags],
        category: m.category,
        status: m.status,
        slsa: m.slsa,
        trust: m.trust,
        trustVulns: m.trustBreakdown.vulns,
        trustSlsa: m.trustBreakdown.slsa,
        trustSignature: m.trustBreakdown.signature,
        trustSbom: m.trustBreakdown.sbom,
        cveCritical: m.cves.critical,
        cveHigh: m.cves.high,
        cveMedium: m.cves.medium,
        cveLow: m.cves.low,
        deploys: m.deploys,
        updatedHours: m.updatedHours,
        size: m.size,
        digest: m.digest,
        previewable: m.previewable,
        // lastRebuiltAt gets stamped by the rebuild block below.
      },
    });
  }

  // 2. Rebuilds — 5 per module, plus stamp Module.lastRebuiltAt.
  console.log("Seeding rebuild history");
  for (const m of MODULES) {
    const isFailureCase = REBUILD_FAILURE_SLUGS.has(m.slug);
    for (let i = 0; i < REBUILD_PATTERNS.length; i++) {
      const p = REBUILD_PATTERNS[i];
      // Most recent row (i=0) on a failure-case module becomes a
      // build_failed outcome instead of success.
      const outcome =
        isFailureCase && i === 0 ? "build_failed" : p.outcome;
      const id = `rebuild_seed_${m.slug}_${i}`;
      const attemptedAt = new Date(Date.now() - p.ago * 60 * 60 * 1000);
      await prisma.moduleRebuild.upsert({
        where: { id },
        update: {},
        create: {
          id,
          moduleSlug: m.slug,
          attemptedAt,
          durationMs: outcome === "build_failed" ? 72_000 : p.duration,
          outcome,
          resultDigest:
            outcome === "success"
              ? p.hasDigestChange
                ? `sha256:${m.digest.replace("sha256:", "").slice(0, 8)}-rebuilt-${i}`
                : m.digest
              : null,
          notes:
            outcome === "build_failed"
              ? "Exit 2 during build step: apt-get failed to fetch package (upstream mirror 503). Retrying on next cron."
              : outcome === "upstream_unchanged"
                ? "Upstream digest matches last successful build; no rebuild necessary."
                : null,
        },
      });
    }

    // Stamp lastRebuiltAt on the module — most recent SUCCESSFUL
    // rebuild, not most recent attempt.
    const lastSuccessHoursAgo = isFailureCase
      ? REBUILD_PATTERNS[1].ago
      : REBUILD_PATTERNS[0].ago;
    await prisma.module.update({
      where: { id: m.id },
      data: {
        lastRebuiltAt: new Date(Date.now() - lastSuccessHoursAgo * 60 * 60 * 1000),
      },
    });
  }

  // Promote ADMIN_EMAIL if set (for the real operator's account).
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && adminEmail.trim().length > 0) {
    const updated = await prisma.user.updateMany({
      where: { email: adminEmail.trim() },
      data: { role: "admin" },
    });
    if (updated.count > 0) {
      console.log(`Promoted ${adminEmail} to admin`);
    } else {
      console.log(
        `ADMIN_EMAIL ${adminEmail} did not match any existing user. Sign in once, then rerun seed.`,
      );
    }
  }

  console.log("Seed complete.");
  console.log(`  Modules:      ${MODULES.length}`);
  console.log(`  Rebuilds:     ${MODULES.length * REBUILD_PATTERNS.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
