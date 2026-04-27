-- User public profile fields:
--   username   — /@<username> handle, required for the profile page
--   bio        — free-text about-me
--   websiteUrl — optional personal/project URL displayed on profile
--
-- Three-step migration for username to avoid breaking existing accounts:
--
-- STEP 1: add the column nullable so existing rows stay valid.
--
-- STEP 2: backfill from email local-part, de-duplicated with numeric
--         suffix when the local-part collides. The logic runs in
--         pgplpgsql so we don't need to coordinate with the app layer;
--         everyone gets a working username before the unique index is
--         applied.
--
-- STEP 3: add the unique index. Deferred to the tail of the migration
--         so any constraint failure happens AFTER backfill, not in the
--         middle of it.
--
-- Accounts created after this migration must supply a username at
-- signup; the API layer enforces that separately.

-- STEP 1
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "websiteUrl" TEXT;

-- STEP 2: backfill usernames from email local-part.
-- Base candidate is lowercase(split_part(email, '@', 1)) with anything
-- not in [a-z0-9-] replaced by '-', collapsed runs of '-', trimmed to
-- 3-30 chars. Collisions get a numeric suffix; users without email
-- fall back to "user-<first 8 of cuid>".
DO $$
DECLARE
  rec RECORD;
  base_name TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR rec IN
    SELECT id, email FROM "User" WHERE "username" IS NULL
  LOOP
    -- Derive the base candidate.
    IF rec.email IS NULL OR position('@' IN rec.email) = 0 THEN
      base_name := 'user-' || substring(rec.id FROM 1 FOR 8);
    ELSE
      base_name := lower(split_part(rec.email, '@', 1));
      base_name := regexp_replace(base_name, '[^a-z0-9-]', '-', 'g');
      base_name := regexp_replace(base_name, '-{2,}', '-', 'g');
      base_name := regexp_replace(base_name, '^-+|-+$', '', 'g');
      -- Make sure the first char is alphanumeric, not a dash.
      IF length(base_name) = 0 OR base_name !~ '^[a-z0-9]' THEN
        base_name := 'user-' || substring(rec.id FROM 1 FOR 8);
      END IF;
      -- Truncate to fit the 3-30 char window.
      IF length(base_name) < 3 THEN
        base_name := base_name || '-' || substring(rec.id FROM 1 FOR 4);
      END IF;
      IF length(base_name) > 30 THEN
        base_name := substring(base_name FROM 1 FOR 30);
        -- Strip trailing dash produced by truncation.
        base_name := regexp_replace(base_name, '-+$', '', 'g');
      END IF;
    END IF;

    -- Find a free username. Start with the base, then -1, -2, ...
    candidate := base_name;
    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM "User" WHERE lower("username") = lower(candidate)) LOOP
      suffix := suffix + 1;
      candidate := substring(base_name FROM 1 FOR 28) || '-' || suffix::text;
    END LOOP;

    UPDATE "User" SET "username" = candidate WHERE id = rec.id;
  END LOOP;
END $$;

-- STEP 3: apply the case-insensitive unique constraint.
-- We use a functional unique index rather than relying on the
-- column-level @unique so "Alice" and "alice" can't coexist.
CREATE UNIQUE INDEX "User_username_lower_key"
  ON "User" (lower("username"))
  WHERE "username" IS NOT NULL;
