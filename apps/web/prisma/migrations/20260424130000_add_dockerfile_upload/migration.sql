-- DockerfileUpload — ownership record for staged Dockerfile uploads.
-- Created by /api/v1/submissions/dockerfile-upload, read by
-- /api/v1/submissions at commit time to verify the requester owns
-- the upload they're trying to attach to a submission.
--
-- Without this table, ownership was implicit via the unguessability
-- of the sub_<16 hex> id. This closes the gap where a leaked /
-- logged / shared id could let another authenticated user commit
-- a submission using someone else's staged file.
--
-- Insert-only:
--   - submissionId is unique — one upload per submission id
--   - userId is the authenticated user at staging time
--   - sha256 + sizeBytes are copied from the upload request so the
--     commit endpoint can verify consistency
--
-- Backward compat: submissions made before this table landed have
-- no matching row. The commit endpoint tolerates a missing record
-- (treated as "legacy submission, proceed without ownership check")
-- for at least one deploy cycle; remove the fallback once the
-- submissions queue has drained of pre-migration rows.

CREATE TABLE "DockerfileUpload" (
  "id"            TEXT PRIMARY KEY,
  "submissionId"  TEXT        NOT NULL UNIQUE,
  "userId"        TEXT        NOT NULL,
  "sha256"        TEXT        NOT NULL,
  "sizeBytes"     INTEGER     NOT NULL,
  "uploadedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DockerfileUpload_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "DockerfileUpload_userId_uploadedAt_idx"
  ON "DockerfileUpload" ("userId", "uploadedAt");
