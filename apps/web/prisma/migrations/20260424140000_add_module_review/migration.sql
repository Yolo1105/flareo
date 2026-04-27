-- ModuleReview — user-written reviews of modules.
--
-- Design choices:
--   - Unique (moduleSlug, authorId) — one review per user per module.
--     Users can UPDATE their review; they can't stack multiple.
--   - rating is plain INTEGER, API validates 1-5. Keeping the check
--     out of the DB avoids a migration when/if the scale changes.
--   - moderation is a TEXT enum-by-convention: "visible" (default),
--     "flagged", "hidden". Admin flips the column; rows are never
--     hard-deleted so the author sees their review was removed
--     rather than disappearing silently.
--   - Three indexes: per-module-newest-first (detail page), by
--     moderation state (admin triage), by author (profile page).
--
-- Not enforced at the DB level, enforced in API:
--   - authorId MUST NOT equal module.publisherId (publishers can't
--     review their own modules)
--   - the rating value is 1..5
--   - body has a reasonable length (API schema caps at 4000)

CREATE TABLE "ModuleReview" (
  "id"          TEXT PRIMARY KEY,
  "moduleSlug"  TEXT        NOT NULL,
  "authorId"    TEXT        NOT NULL,
  "rating"      INTEGER     NOT NULL,
  "title"       TEXT        NOT NULL,
  "body"        TEXT        NOT NULL,
  "moderation"  TEXT        NOT NULL DEFAULT 'visible',
  "flagReason"  TEXT,
  "hiddenById"  TEXT,
  "hiddenAt"    TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ModuleReview_moduleSlug_fkey"
    FOREIGN KEY ("moduleSlug")
    REFERENCES "Module"("slug")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "ModuleReview_authorId_fkey"
    FOREIGN KEY ("authorId")
    REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ModuleReview_moduleSlug_authorId_key"
  ON "ModuleReview" ("moduleSlug", "authorId");

CREATE INDEX "ModuleReview_moduleSlug_createdAt_idx"
  ON "ModuleReview" ("moduleSlug", "createdAt");

CREATE INDEX "ModuleReview_moderation_createdAt_idx"
  ON "ModuleReview" ("moderation", "createdAt");

CREATE INDEX "ModuleReview_authorId_idx"
  ON "ModuleReview" ("authorId");
