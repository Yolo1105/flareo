-- ModuleReport — per-module "report a problem" inbox.
--
-- Distinct from ModuleReview flags: review flags target abusive
-- reviews, these target the module itself (broken, malicious,
-- metadata wrong, legal issue, etc).
--
-- No unique constraint on (moduleSlug, reporterId) — a single user
-- may have multiple reports on the same module over time (e.g. a
-- resolved-then-recurring issue). Rate limiting lives at the API
-- layer, not the DB constraint.
--
-- triagedById is nullable FK with ON DELETE SET NULL so deleting an
-- admin account (rare) doesn't cascade-destroy the triage history
-- of reports they handled. The report rows themselves stay; only
-- the "triaged by <name>" attribution goes to null.
--
-- reporterId is ON DELETE CASCADE — if a reporter deletes their
-- account, their filed reports go with them. This is the same rule
-- we apply to reviews and submissions. If GDPR or audit concerns
-- require preserving anonymized reports across account deletion,
-- future migration converts this to SET NULL and the API layer
-- renders "deleted user" in the UI.

CREATE TABLE "ModuleReport" (
  "id"             TEXT PRIMARY KEY,
  "moduleSlug"     TEXT        NOT NULL,
  "reporterId"     TEXT        NOT NULL,
  "category"       TEXT        NOT NULL,
  "body"           TEXT        NOT NULL,
  "state"          TEXT        NOT NULL DEFAULT 'open',
  "resolutionNote" TEXT,
  "triagedById"    TEXT,
  "triagedAt"      TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ModuleReport_moduleSlug_fkey"
    FOREIGN KEY ("moduleSlug")
    REFERENCES "Module"("slug")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "ModuleReport_reporterId_fkey"
    FOREIGN KEY ("reporterId")
    REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "ModuleReport_triagedById_fkey"
    FOREIGN KEY ("triagedById")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- Admin queue: filter by state (typically open/investigating), newest first.
CREATE INDEX "ModuleReport_state_createdAt_idx"
  ON "ModuleReport" ("state", "createdAt");

-- Per-module history view (future publisher dashboard).
CREATE INDEX "ModuleReport_moduleSlug_createdAt_idx"
  ON "ModuleReport" ("moduleSlug", "createdAt");

-- Per-reporter lookup for API-level rate limiting.
CREATE INDEX "ModuleReport_reporterId_createdAt_idx"
  ON "ModuleReport" ("reporterId", "createdAt");
