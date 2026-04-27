-- Retry accounting for the build worker. Supports three-strikes retry
-- with exponential backoff on transient (kind="system") failures, and
-- a dead-letter terminal state ("worker_failures") after strikes exhaust.
--
-- Both columns are additive and non-destructive:
--   * attemptCount defaults to 0 — existing rows are treated as
--     never-retried, so the next system failure counts as attempt 1.
--   * availableAfter is nullable — NULL means "available now", which
--     is the correct behavior for pre-migration rows.
--
-- Verify after applying with:
--     \d "Submission"   in psql, or inspect via Prisma Studio.

ALTER TABLE "Submission"
  ADD COLUMN "attemptCount"   INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN "availableAfter" TIMESTAMP(3);

-- Compound index matching the worker's new claim query:
--   WHERE status = 'approved'
--     AND (availableAfter IS NULL OR availableAfter <= NOW())
--   ORDER BY submittedAt ASC
-- This single index covers both the equality on status and the
-- range-or-null on availableAfter; Postgres uses it for the hot path
-- on every worker poll.
CREATE INDEX "Submission_status_availableAfter_idx"
  ON "Submission" ("status", "availableAfter");
