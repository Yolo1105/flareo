-- BuildLogLine — incremental build-log chunks appended by the worker
-- as a docker build runs. Enables /api/v1/submissions/[id]/build-log
-- to stream new lines to a polling client while the build is in
-- progress.
--
-- Design notes:
--   - Ordered by (submissionId, seq) — seq is monotonic per submission,
--     assigned by the worker as chunks arrive from the child process.
--   - `stream` column distinguishes stdout / stderr / synthetic system
--     markers ("--- build started ---"). The UI groups stderr lines
--     visually so errors stand out.
--   - Unique index on (submissionId, seq) makes the worker's write
--     path safe against re-emission after a worker crash: upsert
--     rather than insert and a replay is a no-op.
--   - ON DELETE CASCADE so deleting a Submission cleans its log
--     lines too; the archival copy lives in R2 via buildLogUrl.
--
-- Verify:
--     \d "BuildLogLine"   in psql

CREATE TABLE "BuildLogLine" (
  "id"            TEXT PRIMARY KEY,
  "submissionId"  TEXT        NOT NULL,
  "seq"           INTEGER     NOT NULL,
  "text"          TEXT        NOT NULL,
  "stream"        TEXT        NOT NULL DEFAULT 'stdout',
  "emittedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BuildLogLine_submissionId_fkey"
    FOREIGN KEY ("submissionId")
    REFERENCES "Submission"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "BuildLogLine_submissionId_seq_key"
  ON "BuildLogLine" ("submissionId", "seq");

CREATE INDEX "BuildLogLine_submissionId_emittedAt_idx"
  ON "BuildLogLine" ("submissionId", "emittedAt");
