-- CNB (Cloud Native Buildpacks) fields on Submission.
--
-- Three additive columns. Existing rows get the defaults — every
-- pre-CNB submission was implicitly buildType="dockerfile", so the
-- DEFAULT clause turns the existing rows into self-consistent
-- Dockerfile submissions automatically.
--
--   - buildType          — choice between "dockerfile" and "cnb".
--                          String (not enum) so future build modes
--                          (Nix, ko, etc.) ship without a migration.
--                          DEFAULT 'dockerfile' covers existing rows.
--   - cnbDetectedLanguage — language signal Flareo found at submit
--                          time. NULL for buildType="dockerfile".
--   - cnbBuilder         — canonical Paketo builder image. Pinned per
--                          submission so reviewer-side reproduction
--                          uses the same builder version even after
--                          Paketo bumps "latest". NULL for Dockerfile.
--
-- No CHECK constraint enforcing "(buildType = 'cnb') ↔ (cnbDetected
-- IS NOT NULL)" — application layer is canonical for that invariant
-- (lib/db/submissions.ts validates on insert) and DB-level
-- enforcement would block valid edge cases like a reviewer manually
-- correcting cnbDetectedLanguage after rejection.

ALTER TABLE "Submission"
  ADD COLUMN "buildType" VARCHAR(16) NOT NULL DEFAULT 'dockerfile',
  ADD COLUMN "cnbDetectedLanguage" VARCHAR(32),
  ADD COLUMN "cnbBuilder" VARCHAR(128);
