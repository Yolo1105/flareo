/**
 * update-module-metadata.ts
 *
 * Writes the results of one republish run into the Module table.
 * Called from scripts/republish/republish.sh after the image has
 * been re-tagged, scanned, SBOM'd, and signed (not rebuilt).
 *
 * Reads everything from env vars (set by the shell script) so this
 * file stays a single focused unit of code. If a required var is
 * missing, we bail with a clear error.
 *
 * Writes are upsert-style: matched on slug, everything else gets
 * overwritten with the new run's values. This means if you
 * re-run the pipeline for the same slug, the module row is updated
 * in place rather than duplicated.
 */

import { PrismaClient } from "@prisma/client";

// ─── Env reader helpers ───────────────────────────────────────────

function reqEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    console.error(`[update-module-metadata] missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

function reqInt(name: string): number {
  const raw = reqEnv(name);
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) {
    console.error(`[update-module-metadata] invalid int for ${name}: ${raw}`);
    process.exit(1);
  }
  return n;
}

function optInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

// ─── Trust score computation ──────────────────────────────────────
//
// We compute four sub-scores and an overall. These are deterministic
// functions of the pipeline outputs so the number you see on the site
// maps directly to what just happened during rebuild. No fudge factors.

function scoreFromCVEs(critical: number, high: number, medium: number): number {
  // Simple deduction model. Every critical is worth ~20 points, every high ~8,
  // every medium ~2. Clamped to [0, 100]. A clean scan gives 100.
  const deduction = critical * 20 + high * 8 + medium * 2;
  return Math.max(0, Math.min(100, 100 - deduction));
}

function scoreFromSbom(packageCount: number): number {
  // Having an SBOM with any packages is binary-yes. The count itself just
  // confirms coverage is real. We give 100 if we have >= 5 packages, scaling
  // down below that.
  if (packageCount >= 5) return 100;
  if (packageCount >= 1) return 60 + packageCount * 8;
  return 0;
}

function scoreFromSignature(rekorIndex: string, signerIdentity: string): number {
  // Rekor index and an identity means a real sigstore entry. 100 otherwise 0.
  return rekorIndex && signerIdentity ? 100 : 0;
}

function slsaLevelForCurrentPipeline(): "L1" | "L2" | "L3" {
  // Horizon 1 ships with cosign keyless from GHA with Fulcio. That's SLSA L2
  // in practice (hosted builder, signed provenance via cosign, public Rekor).
  // We'll flip this to L3 in Horizon 2 when slsa-github-generator is wired.
  return "L2";
}

function scoreFromSlsa(level: "L1" | "L2" | "L3"): number {
  return { L1: 40, L2: 70, L3: 100 }[level];
}

// ─── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const slug = reqEnv("FLAREO_SLUG");
  const name = reqEnv("FLAREO_NAME");
  const version = reqEnv("FLAREO_VERSION");
  const author = reqEnv("FLAREO_AUTHOR");
  const category = reqEnv("FLAREO_CATEGORY");
  const description = reqEnv("FLAREO_DESCRIPTION");
  const tags = (process.env.FLAREO_TAGS ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const imageRef = reqEnv("FLAREO_IMAGE_REF");
  const digest = reqEnv("FLAREO_DIGEST");
  const upstreamRef = reqEnv("FLAREO_UPSTREAM_REF");
  const upstreamDigest = reqEnv("FLAREO_UPSTREAM_DIGEST");
  const sizeMb = reqInt("FLAREO_SIZE_MB");
  const sbomUrl = reqEnv("FLAREO_SBOM_URL");
  const sbomPackages = reqInt("FLAREO_SBOM_PACKAGES");
  const trivyUrl = reqEnv("FLAREO_TRIVY_URL");

  const cveCritical = reqInt("FLAREO_CVE_CRITICAL");
  const cveHigh = reqInt("FLAREO_CVE_HIGH");
  const cveMedium = reqInt("FLAREO_CVE_MEDIUM");
  const cveLow = reqInt("FLAREO_CVE_LOW");

  const rekorIndex = reqEnv("FLAREO_REKOR_INDEX");
  const signerIdentity = reqEnv("FLAREO_SIGNER_IDENTITY");
  const signerIssuer = reqEnv("FLAREO_SIGNER_ISSUER");

  // Compute trust sub-scores from real pipeline outputs.
  const trustVulns = scoreFromCVEs(cveCritical, cveHigh, cveMedium);
  const trustSbom = scoreFromSbom(sbomPackages);
  const trustSignature = scoreFromSignature(rekorIndex, signerIdentity);
  const slsaLevel = slsaLevelForCurrentPipeline();
  const trustSlsa = scoreFromSlsa(slsaLevel);
  const trust = Math.round(
    (trustVulns + trustSbom + trustSignature + trustSlsa) / 4,
  );

  // Status: verified only when every sub-score is positive.
  const status =
    trustVulns > 0 && trustSbom > 0 && trustSignature > 0 ? "verified" : "failing";

  const prisma = new PrismaClient();

  // Generate a stable ID if we're creating a new row. Existing rows keep their ID.
  const existing = await prisma.module.findUnique({ where: { slug } });
  const id = existing?.id ?? `FLA-2026-${String(Date.now() % 100000).padStart(5, "0")}`;

  const data = {
    id,
    slug,
    name,
    version,
    author,
    description,
    tags,
    category,
    status,
    slsa: slsaLevel,
    trust,
    trustVulns,
    trustSlsa,
    trustSignature,
    trustSbom,
    cveCritical,
    cveHigh,
    cveMedium,
    cveLow,
    // deploys intentionally omitted — invented counts must not be
    // written. Column remains for a real figure later.
    updatedHours: 0,
    size: `${sizeMb} MB`,
    digest,
    previewable: false,

    imageRef,
    upstreamRef,
    upstreamDigest,
    sbomUrl,
    sbomPackages,
    trivyUrl,
    rekorIndex,
    signerIdentity,
    signerIssuer,
    lastRebuiltAt: new Date(),
  };

  await prisma.module.upsert({
    where: { slug },
    update: data,
    create: data,
  });

  // Append to the audit log so the per-module rebuild history and
  // the admin rebuild log surface this attempt. Outcome is derived
  // from the computed status:
  //   - "verified" after a fresh build → success (we got a new
  //     signed artifact)
  //   - "failing"  after a fresh build → scan_failed (build ran but
  //     Trivy rejected the image; previous artifacts stay live)
  //
  // This script isn't called on build_failed (the shell wrapper exits
  // non-zero before reaching here) or upstream_unchanged (the shell
  // wrapper writes the log row itself via a small bash-side insert
  // using the same connection). That keeps the two outcomes this
  // script knows about cleanly bucketed.
  const outcome: "success" | "scan_failed" =
    status === "verified" ? "success" : "scan_failed";

  const durationMs = optInt("FLAREO_REBUILD_DURATION_MS", 0) || null;

  await prisma.moduleRebuild.create({
    data: {
      moduleSlug: slug,
      outcome,
      durationMs,
      resultDigest: outcome === "success" ? digest : null,
      notes:
        outcome === "scan_failed"
          ? `Trivy found ${cveCritical} critical, ${cveHigh} high CVEs`
          : null,
    },
  });

  console.log(
    `[update-module-metadata] ok: ${slug} trust=${trust} status=${status} rekor=${rekorIndex}`,
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[update-module-metadata] error:", err);
  process.exit(1);
});
