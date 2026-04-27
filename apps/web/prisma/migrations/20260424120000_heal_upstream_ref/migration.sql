-- Heal the upstreamRef corruption caused by the worker passing
-- row.submitterId into the SQL arg slot that maps to "upstreamRef".
-- Published modules written before this migration landed may have
-- a user-id-shaped value (cuid, e.g. "cmc8xxxxxxxxxxxxxxxxxx") or a
-- UUID in the upstreamRef column where we expected an https:// URL.
--
-- Strategy:
--   1. For every Module whose upstreamRef is missing, empty, or doesn't
--      start with a protocol (http:// / https://), try to recover the
--      correct URL from the owning Submission's flagsJson.upstreamUrl.
--   2. Match Submission → Module via moduleName = Module.slug. The
--      original publish path sets Submission.moduleName = slug and
--      Module.slug = Submission.moduleName so this is a reliable key.
--   3. Use the most recent approved/built submission for the module
--      (MAX submittedAt) in case a slug has been through
--      changes_requested → resubmit cycles.
--
-- Safety:
--   - Read-only for any Module whose upstreamRef already looks like a
--     URL (starts with http:// or https://). No correct row is touched.
--   - NULL stays NULL if we can't recover a valid URL — better to leave
--     the column empty than overwrite with more junk.
--   - The UPDATE is idempotent: re-running the migration is a no-op
--     once every Module has a URL-shaped upstreamRef.
--
-- Verify after applying:
--     SELECT slug, "upstreamRef" FROM "Module"
--     WHERE "upstreamRef" IS NULL
--        OR "upstreamRef" NOT LIKE 'http%';
--   → should be empty (every row has a URL or NULL only if the
--     submission genuinely had no upstream URL recorded).

UPDATE "Module" m
SET "upstreamRef" = COALESCE(
  (
    SELECT (s."flagsJson"::jsonb ->> 'upstreamUrl')
    FROM "Submission" s
    WHERE s."moduleName" = m.slug
      AND s.status IN ('built', 'approved', 'building')
      AND s."flagsJson" IS NOT NULL
      AND (s."flagsJson"::jsonb ->> 'upstreamUrl') LIKE 'http%'
    ORDER BY s."submittedAt" DESC
    LIMIT 1
  ),
  m."upstreamRef"  -- keep whatever is there if we can't recover
)
WHERE
  m."upstreamRef" IS NULL
  OR m."upstreamRef" = ''
  OR m."upstreamRef" NOT LIKE 'http%';

-- Second pass: any row that STILL has a non-URL value in upstreamRef
-- (because the submission's flagsJson also didn't have a valid URL)
-- gets cleared to NULL rather than leaving user-id-shaped strings
-- visible on the module detail page.
UPDATE "Module"
SET "upstreamRef" = NULL
WHERE "upstreamRef" IS NOT NULL
  AND "upstreamRef" != ''
  AND "upstreamRef" NOT LIKE 'http%';
