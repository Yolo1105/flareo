-- ModuleFeatured — editorial curation for the catalog's "Featured"
-- strip. One row per featured module. Admins create/remove/edit rows
-- via /app/admin/featured; the public catalog reads active rows
-- (where expiresAt IS NULL OR expiresAt > NOW()) ordered by position.
--
-- Unique constraint on moduleSlug prevents two simultaneous feature
-- entries for the same module. If an admin wants to change the
-- position or blurb for an already-featured module, they UPDATE the
-- existing row rather than inserting a second.
--
-- FK to User.curatorId is ON DELETE CASCADE — deleting a curator
-- (rare, only for admin account deletion) removes their features.
-- An alternative would be SET NULL to preserve history; the current
-- product has a single admin so cascade is a reasonable default.

CREATE TABLE "ModuleFeatured" (
  "id"          TEXT PRIMARY KEY,
  "moduleSlug"  TEXT        NOT NULL UNIQUE,
  "position"    INTEGER     NOT NULL,
  "blurb"       TEXT,
  "featuredAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"   TIMESTAMP(3),
  "curatorId"   TEXT        NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ModuleFeatured_moduleSlug_fkey"
    FOREIGN KEY ("moduleSlug")
    REFERENCES "Module"("slug")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "ModuleFeatured_curatorId_fkey"
    FOREIGN KEY ("curatorId")
    REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "ModuleFeatured_position_idx" ON "ModuleFeatured" ("position");
CREATE INDEX "ModuleFeatured_featuredAt_idx" ON "ModuleFeatured" ("featuredAt");
