-- ModuleRebuild — one row per canary-rebuild attempt. Populated by the
-- rebuild-canary.sh script after each module is re-built and re-signed.
--
-- Separate from Build (which tracks initial / reviewer-triggered builds)
-- because the two chains have different semantics: Build is one-per-
-- submission, ModuleRebuild is many-per-module over the module's lifetime.
--
-- Three indexes cover the read patterns:
--   (moduleSlug, attemptedAt)   for the module detail page's
--                                "last 10 rebuilds for this module"
--   attemptedAt                 for the admin log's
--                                "latest rebuilds across all modules"
--   outcome                     for the admin log's
--                                "show only failures" filter
--
-- Non-destructive: Module already has the lastRebuiltAt column, which
-- this table does not backfill. Existing Module.lastRebuiltAt values
-- remain authoritative for the "when was the last rebuild" denormalized
-- read; ModuleRebuild is the audit log for the UI that wants history.
--
-- Verify:
--     \d "ModuleRebuild"   in psql

CREATE TABLE "ModuleRebuild" (
  "id"            TEXT PRIMARY KEY,
  "moduleSlug"    TEXT        NOT NULL,
  "attemptedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "durationMs"    INTEGER,
  "outcome"       TEXT        NOT NULL,
  "resultDigest"  TEXT,
  "notes"         TEXT,

  CONSTRAINT "ModuleRebuild_moduleSlug_fkey"
    FOREIGN KEY ("moduleSlug")
    REFERENCES "Module"("slug")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "ModuleRebuild_moduleSlug_attemptedAt_idx"
  ON "ModuleRebuild" ("moduleSlug", "attemptedAt");

CREATE INDEX "ModuleRebuild_attemptedAt_idx"
  ON "ModuleRebuild" ("attemptedAt");

CREATE INDEX "ModuleRebuild_outcome_idx"
  ON "ModuleRebuild" ("outcome");
