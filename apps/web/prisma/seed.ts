/**
 * Seed the database for demo / development.
 *
 * Run with:
 *   SEED=1 npx prisma db seed
 *
 * Idempotent: every write is upsert-by-id so rerunning is safe.
 * If ADMIN_EMAIL is set, any user matching that email is promoted to
 * admin at the end.
 *
 * Production gate
 * ---------------
 * Guarded behind SEED=1. A production deployment starts with an empty
 * catalog and fills through the real canary pipeline — not a seed
 * script writing 12 fake modules. The gate exists to prevent an
 * accidental `prisma db seed` in prod from clobbering the real data.
 *
 * What gets seeded
 * ----------------
 * The seed aims for "a demo visitor clicking through should see every
 * feature working, not empty zero-states." Specifically:
 *
 *   1. 12 public modules (MODULES fixture)
 *   2. 4 demo users with usernames/bios (publisher profile pages)
 *   3. 6 of the 12 modules linked to demo publishers so /@handle works
 *   4. ~15 reviews spread across 5 modules (mix of ratings + authors)
 *   5. 4 featured modules (editorial strip on /catalog)
 *   6. Rebuild history for every module (varied outcomes)
 *   7. 4 historical submissions (built / rejected / changes-requested / pending)
 *   8. 3 reports (open / investigating / resolved) for admin queue
 *
 * Everything below is deliberately deterministic — same IDs every
 * time — so reruns produce the same rows rather than piling up
 * duplicates.
 */

import { PrismaClient } from "@prisma/client";
import { MODULES } from "../lib/data/modules";

const prisma = new PrismaClient();

// ─── demo users ───────────────────────────────────────────────────
//
// Four users with seeded IDs. The admin is identifiable via
// ADMIN_EMAIL at the tail of this script; the other three are
// publishers/reviewers whose profile pages demonstrate /@handle.

const DEMO_USERS = [
  {
    id: "user_demo_admin",
    email: "admin@flareo.demo",
    name: "Admin Reviewer",
    username: "flareo-admin",
    bio: "Runs the Flareo pipeline. Reviews every submission personally until the queue outgrows one pair of hands.",
    websiteUrl: "https://flareo.dev",
    role: "admin",
  },
  {
    id: "user_demo_mai",
    email: "mai@example.com",
    name: "Mai Tanaka",
    username: "mai-ops",
    bio: "Homelab operator. Publishes hardened self-hosted tools. Cosign skeptic until SLSA L3 converted me.",
    websiteUrl: "https://example.com/mai",
    role: "user",
  },
  {
    id: "user_demo_marco",
    email: "marco@example.com",
    name: "Marco Velasquez",
    username: "marco",
    bio: "Security engineer. I break things so you don't have to. Reviews skew picky.",
    websiteUrl: null,
    role: "user",
  },
  {
    id: "user_demo_priya",
    email: "priya@example.com",
    name: "Priya Shah",
    username: "priya-runs-it",
    bio: "SRE / infra nerd. Obsessed with supply-chain provenance.",
    websiteUrl: "https://priyashah.example",
    role: "user",
  },
] as const;

// Module → demo publisher mapping. Half the modules stay unowned so
// the demo shows both "module has a linked publisher → clickable
// author name" AND "module with no publisher → plain text author."
const MODULE_PUBLISHER: Record<string, string> = {
  vaultwarden: "user_demo_mai",
  authentik: "user_demo_mai",
  immich: "user_demo_mai",
  "uptime-kuma": "user_demo_priya",
  grafana: "user_demo_priya",
  caddy: "user_demo_marco",
  // Remaining 6 (nginx-proxy-manager, gitea, crowdsec, keycloak,
  // forgejo, jellyfin) stay unowned to show both states.
};

// ─── reviews ──────────────────────────────────────────────────────
//
// Mix of ratings and substantial bodies. Deliberately includes:
//   - Multiple reviews on single modules so histograms are non-empty
//   - One 3-star and one 2-star so the aggregate isn't uniformly 5.0
//   - At least one review per featured/trending candidate module

interface SeedReview {
  id: string;
  moduleSlug: string;
  authorId: string;
  rating: number;
  title: string;
  body: string;
  // Days ago relative to seed time.
  daysAgo: number;
}

const DEMO_REVIEWS: SeedReview[] = [
  // vaultwarden — 4 reviews, high aggregate
  {
    id: "review_seed_vw_1",
    moduleSlug: "vaultwarden",
    authorId: "user_demo_priya",
    rating: 5,
    title: "Running in production for 6 months, zero issues",
    body: "Replaced the upstream vaultwarden image with this one after a CVE forced us to patch in a hurry. The SLSA L3 provenance and daily rebuilds mean we no longer need to maintain our own fork. The SBOM caught a transitive dependency we didn't know we had. The rebuild cadence is the real unlock — we see a fresh image within 24h of upstream cutting a release.",
    daysAgo: 5,
  },
  {
    id: "review_seed_vw_2",
    moduleSlug: "vaultwarden",
    authorId: "user_demo_marco",
    rating: 4,
    title: "Solid, but the image is larger than upstream",
    body: "Image is ~15MB larger than the stock vaultwarden image because of the additional scan instrumentation. Fair tradeoff for the receipts but worth knowing if you're pulling on every deploy. Trust-score delta alone made the swap worthwhile for our security team.",
    daysAgo: 2,
  },
  {
    id: "review_seed_vw_3",
    moduleSlug: "vaultwarden",
    authorId: "user_demo_admin",
    rating: 5,
    title: "Exactly what I wanted from a container registry",
    body: "Signature verification is the feature I've been waiting for. No more 'trust me bro' pulls from Docker Hub. Highly recommend.",
    daysAgo: 1,
  },

  // uptime-kuma — 3 reviews, including a 3-star for variety
  {
    id: "review_seed_uk_1",
    moduleSlug: "uptime-kuma",
    authorId: "user_demo_mai",
    rating: 5,
    title: "Daily canary is the killer feature",
    body: "Our monitoring stack depends on this running reliably. The daily rebuild with upstream-unchanged short-circuit means we're never more than 24h from a patched image but also not wastefully churning deployments. Perfect balance.",
    daysAgo: 8,
  },
  {
    id: "review_seed_uk_2",
    moduleSlug: "uptime-kuma",
    authorId: "user_demo_marco",
    rating: 3,
    title: "Works but build size could be better",
    body: "Functional and the receipts are clean, but at 180MB this is still substantially larger than the smallest upstream alpine variant. Not a dealbreaker, but I'd take a 'minimal' variant if offered.",
    daysAgo: 4,
  },
  {
    id: "review_seed_uk_3",
    moduleSlug: "uptime-kuma",
    authorId: "user_demo_priya",
    rating: 4,
    title: "Dropped in without issue",
    body: "Migration from upstream was a digest swap. No behavior changes, no configuration changes. The way infrastructure upgrades should feel.",
    daysAgo: 12,
  },

  // authentik — 3 reviews, one lower rating
  {
    id: "review_seed_auth_1",
    moduleSlug: "authentik",
    authorId: "user_demo_priya",
    rating: 5,
    title: "Best auth solution we've deployed",
    body: "Authentik itself is great and this verified variant makes it enterprise-deployable without the compliance team complaining about supply chain risk. SBOM satisfied our Series B audit.",
    daysAgo: 15,
  },
  {
    id: "review_seed_auth_2",
    moduleSlug: "authentik",
    authorId: "user_demo_marco",
    rating: 2,
    title: "Version is behind upstream",
    body: "Version 2024.12.3 when upstream is on 2025.02. Understand the review turnaround but for a security-critical piece like auth this lag matters. Would like a 'fast track' path for auth/security components.",
    daysAgo: 3,
  },

  // immich — 2 reviews
  {
    id: "review_seed_im_1",
    moduleSlug: "immich",
    authorId: "user_demo_priya",
    rating: 5,
    title: "Self-hosted photos with receipts — finally",
    body: "Immich is great for family photo backup but the upstream release cadence is aggressive. Daily verification here gives me confidence the image I just pulled isn't a supply-chain surprise.",
    daysAgo: 7,
  },
  {
    id: "review_seed_im_2",
    moduleSlug: "immich",
    authorId: "user_demo_mai",
    rating: 4,
    title: "GPU acceleration intact",
    body: "Was worried the rebuild would strip GPU support. It didn't — all CUDA bits survived the hermetic build. Photo indexing speed matches upstream.",
    daysAgo: 2,
  },

  // grafana — 2 reviews, one lukewarm
  {
    id: "review_seed_gf_1",
    moduleSlug: "grafana",
    authorId: "user_demo_marco",
    rating: 4,
    title: "Solid replacement for upstream",
    body: "Running in production across three clusters. Dashboards, plugins, auth proxies all work. Trust score gave security team cover to approve the migration.",
    daysAgo: 9,
  },
  {
    id: "review_seed_gf_2",
    moduleSlug: "grafana",
    authorId: "user_demo_priya",
    rating: 3,
    title: "Plugin compatibility varies",
    body: "A couple of our custom plugins wouldn't load initially — turned out they relied on a transitive dependency path the rebuild optimized away. Worked around it but worth knowing.",
    daysAgo: 4,
  },
];

// ─── featured ─────────────────────────────────────────────────────
//
// 4 editorially-featured modules with blurbs. Positions 1-4.

interface SeedFeatured {
  id: string;
  moduleSlug: string;
  position: number;
  blurb: string;
  // Days from now. Null = no expiration.
  expiresInDays: number | null;
}

const DEMO_FEATURED: SeedFeatured[] = [
  {
    id: "featured_seed_1",
    moduleSlug: "vaultwarden",
    position: 1,
    blurb:
      "Every self-hoster's password manager, now with a full provenance trail and daily rebuilds.",
    expiresInDays: null,
  },
  {
    id: "featured_seed_2",
    moduleSlug: "immich",
    position: 2,
    blurb:
      "Photo backup that respects your storage. Hermetic rebuild, GPU acceleration preserved.",
    expiresInDays: 30,
  },
  {
    id: "featured_seed_3",
    moduleSlug: "authentik",
    position: 3,
    blurb:
      "SSO that your compliance team will actually approve — SBOM and SLSA L3 attestation included.",
    expiresInDays: null,
  },
  {
    id: "featured_seed_4",
    moduleSlug: "caddy",
    position: 4,
    blurb:
      "Automatic HTTPS with receipts. The rebuild chain catches upstream binary swaps that signature-only registries miss.",
    expiresInDays: 14,
  },
];

// ─── rebuilds ─────────────────────────────────────────────────────
//
// Every module gets 5 rebuild history rows — four successful + one
// varying (unchanged/failed) to show the range of outcomes. The
// failure lives on a non-featured module so the Featured strip stays
// clean.

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

// ─── submissions ──────────────────────────────────────────────────
//
// 4 historical submissions spanning the state machine.

interface SeedSubmission {
  id: string;
  moduleName: string;
  version: string;
  author: string;
  status: string;
  submitterId: string;
  daysAgo: number;
  decidedDaysAgo?: number;
  decidedById?: string;
  flags: string[];
  errorKind?: string;
  errorMessage?: string;
}

const DEMO_SUBMISSIONS: SeedSubmission[] = [
  {
    id: "sub_demo_built_01",
    moduleName: "paperless-ngx",
    version: "2.8.0",
    author: "mai-ops",
    status: "built",
    submitterId: "user_demo_mai",
    daysAgo: 8,
    decidedDaysAgo: 7,
    decidedById: "user_demo_admin",
    flags: ["signed-by-maintainer", "has-sbom"],
  },
  {
    id: "sub_demo_rejected_01",
    moduleName: "sus-miner",
    version: "1.0.0",
    author: "priya-runs-it",
    status: "rejected",
    submitterId: "user_demo_priya",
    daysAgo: 5,
    decidedDaysAgo: 5,
    decidedById: "user_demo_admin",
    flags: ["missing-dockerfile", "trust-pitch-mismatch"],
  },
  {
    id: "sub_demo_changes_01",
    moduleName: "mealie",
    version: "1.5.0",
    author: "marco",
    status: "changes_requested",
    submitterId: "user_demo_marco",
    daysAgo: 2,
    decidedDaysAgo: 1,
    decidedById: "user_demo_admin",
    flags: ["upstream-unreachable"],
  },
  {
    id: "sub_demo_pending_01",
    moduleName: "n8n",
    version: "1.83.2",
    author: "mai-ops",
    status: "pending",
    submitterId: "user_demo_mai",
    daysAgo: 0,
    flags: [],
  },
];

// ─── reports ──────────────────────────────────────────────────────

interface SeedReport {
  id: string;
  moduleSlug: string;
  reporterId: string;
  category: string;
  body: string;
  state: string;
  daysAgo: number;
  resolutionNote?: string;
  triagedById?: string;
  triagedDaysAgo?: number;
}

const DEMO_REPORTS: SeedReport[] = [
  {
    id: "report_seed_open_01",
    moduleSlug: "nginx-proxy-manager",
    reporterId: "user_demo_priya",
    category: "broken",
    body: "The embedded LetsEncrypt client fails to renew on containers running for >90 days. Reproduced in 3 separate deployments. Upstream doesn't have this bug; seems specific to the rebuild.",
    state: "open",
    daysAgo: 1,
  },
  {
    id: "report_seed_investigating_01",
    moduleSlug: "gitea",
    reporterId: "user_demo_marco",
    category: "metadata",
    body: "Description says 'SSH + HTTPS' but this variant doesn't expose the SSH port by default. Either update the docs or update the defaults.",
    state: "investigating",
    daysAgo: 3,
  },
  {
    id: "report_seed_resolved_01",
    moduleSlug: "jellyfin",
    reporterId: "user_demo_priya",
    category: "metadata",
    body: "Listed as SLSA L3 but the attestation I pulled only claims L2. Either the claim is wrong or the attestation is stale.",
    state: "resolved",
    daysAgo: 12,
    resolutionNote:
      "Confirmed the attestation metadata was out of date. Re-ran the canary to refresh. Current attestation claims L3 correctly. Thanks for catching this.",
    triagedById: "user_demo_admin",
    triagedDaysAgo: 10,
  },
];

// ─── main ──────────────────────────────────────────────────────────

function daysAgoToDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main(): Promise<void> {
  if (process.env.SEED !== "1") {
    console.log(
      "Seed skipped. Set SEED=1 to populate the database with demo fixture data.",
    );
    console.log(
      "  (production deployments should leave this unset so the catalog starts empty.)",
    );
    return;
  }

  // 1. Users.
  console.log("Seeding users");
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        username: u.username,
        bio: u.bio,
        websiteUrl: u.websiteUrl,
        role: u.role,
      },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        username: u.username,
        bio: u.bio,
        websiteUrl: u.websiteUrl,
        role: u.role,
        createdAt: daysAgoToDate(180),
      },
    });
  }

  // 2. Modules, linking half to demo publishers.
  console.log("Seeding modules");
  for (const m of MODULES) {
    const publisherId = MODULE_PUBLISHER[m.slug] ?? null;
    await prisma.module.upsert({
      where: { id: m.id },
      update: { publisherId },
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
        publisherId,
        // lastRebuiltAt gets stamped by the rebuild block below.
      },
    });
  }

  // 3. Reviews.
  console.log("Seeding reviews");
  for (const r of DEMO_REVIEWS) {
    const at = daysAgoToDate(r.daysAgo);
    await prisma.moduleReview.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        moduleSlug: r.moduleSlug,
        authorId: r.authorId,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: at,
        updatedAt: at,
      },
    });
  }

  // 4. Featured.
  console.log("Seeding featured picks");
  for (const f of DEMO_FEATURED) {
    const expiresAt =
      f.expiresInDays === null
        ? null
        : new Date(Date.now() + f.expiresInDays * 24 * 60 * 60 * 1000);
    await prisma.moduleFeatured.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        moduleSlug: f.moduleSlug,
        position: f.position,
        blurb: f.blurb,
        expiresAt,
        curatorId: "user_demo_admin",
      },
    });
  }

  // 5. Rebuilds — 5 per module, plus stamp Module.lastRebuiltAt.
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

  // 6. Submissions.
  console.log("Seeding submissions");
  for (const s of DEMO_SUBMISSIONS) {
    await prisma.submission.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        moduleName: s.moduleName,
        version: s.version,
        author: s.author,
        submitterId: s.submitterId,
        submittedAt: daysAgoToDate(s.daysAgo),
        status: s.status,
        queueAgeSec: s.daysAgo * 24 * 3600,
        flagsJson: JSON.stringify(s.flags),
        autoCosign: s.status !== "rejected",
        autoTrivy: s.status !== "rejected",
        autoSlsa: s.status !== "rejected",
        decidedAt: s.decidedDaysAgo !== undefined
          ? daysAgoToDate(s.decidedDaysAgo)
          : null,
        decidedById: s.decidedById ?? null,
        buildErrorKind: s.errorKind ?? null,
        buildErrorMessage: s.errorMessage ?? null,
      },
    });
  }

  // 7. Reports.
  console.log("Seeding reports");
  for (const r of DEMO_REPORTS) {
    const at = daysAgoToDate(r.daysAgo);
    await prisma.moduleReport.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        moduleSlug: r.moduleSlug,
        reporterId: r.reporterId,
        category: r.category,
        body: r.body,
        state: r.state,
        resolutionNote: r.resolutionNote ?? null,
        triagedById: r.triagedById ?? null,
        triagedAt: r.triagedDaysAgo !== undefined
          ? daysAgoToDate(r.triagedDaysAgo)
          : null,
        createdAt: at,
        updatedAt: at,
      },
    });
  }

  // Promote ADMIN_EMAIL if set (beyond the seeded admin user, for
  // the real operator's account).
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
  console.log(`  Users:        ${DEMO_USERS.length}`);
  console.log(`  Modules:      ${MODULES.length}`);
  console.log(`  Reviews:      ${DEMO_REVIEWS.length}`);
  console.log(`  Featured:     ${DEMO_FEATURED.length}`);
  console.log(`  Rebuilds:     ${MODULES.length * REBUILD_PATTERNS.length}`);
  console.log(`  Submissions:  ${DEMO_SUBMISSIONS.length}`);
  console.log(`  Reports:      ${DEMO_REPORTS.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
