-- Adds canary pipeline artifact columns to Module. Populated by
-- scripts/canary/rebuild-canary.sh via update-module-metadata.ts.
--
-- All columns are nullable because modules created before this
-- migration had no canary artifacts. The rebuild script will backfill
-- them on next run.
--
-- After applying, verify with:
--   \d "Module"   in psql, or inspect via Prisma Studio.

ALTER TABLE "Module"
  ADD COLUMN "imageRef" TEXT,
  ADD COLUMN "upstreamRef" TEXT,
  ADD COLUMN "upstreamDigest" TEXT,
  ADD COLUMN "sbomUrl" TEXT,
  ADD COLUMN "sbomPackages" INTEGER,
  ADD COLUMN "trivyUrl" TEXT,
  ADD COLUMN "rekorIndex" TEXT,
  ADD COLUMN "signerIdentity" TEXT,
  ADD COLUMN "signerIssuer" TEXT,
  ADD COLUMN "lastRebuiltAt" TIMESTAMP(3);
