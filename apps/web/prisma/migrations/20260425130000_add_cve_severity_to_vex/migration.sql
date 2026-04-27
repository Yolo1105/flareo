-- Add cveSeverity column to VexStatement.
--
-- Lets the policy evaluator subtract suppressed CVEs from their actual
-- severity bucket rather than the pessimistic "criticals first" heuristic
-- previously used.
--
-- Nullable because:
--   - Existing VexStatement rows from before this migration have
--     no severity to backfill — the original Trivy report timestamp
--     no longer corresponds to current upstream-DB severity (CVEs
--     get re-classified). Pretending we know would be lying.
--   - The policy evaluator handles NULL cleanly via the heuristic
--     fallback path (see lib/db/policy.ts:evaluateAndPersist).
--   - New rows from the admin form always populate it from the
--     Trivy finding's current severity at annotation time.
--
-- Application layer (lib/db/vex.ts:validateUpsert) constrains the
-- value to {"critical","high","medium","low","unknown"}. No CHECK
-- constraint at the DB layer because future severity vocabularies
-- (CVSS-band buckets, exploit-prediction scores, etc.) might extend
-- the set, and DB-level rigidity would block experimentation.

ALTER TABLE "VexStatement"
  ADD COLUMN "cveSeverity" VARCHAR(16);
