-- Submission.visibility — "public" or "private". Propagated to the
-- resulting Module row when the worker publishes; enforced at submit
-- time against the submitter's plan (free can only submit public;
-- pro can submit either).
--
-- Additive and non-destructive: existing rows default to "public",
-- which matches current behavior (the submission endpoint has always
-- created public modules).
--
-- Verify after applying:
--     \d "Submission"   in psql

ALTER TABLE "Submission"
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'public';

-- No index needed — we never filter submissions on visibility alone
-- in hot paths. When we do (admin queue filtering), it'll be combined
-- with status in a compound index added then.
