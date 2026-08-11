# Phase 2 runbook

How to deploy the submission → build → publish automation from a zero state. Assumes the 8-week MVP is already live.

This maps to Weeks 11-13 of `q1-plan.md`. If you're earlier than Week 11, don't deploy this yet — the post-launch triage window matters more than racing ahead.

## What this phase ships

Three big pieces, one zip:

1. **Main app: admin review UI + API + email templates.** Lives in the main `apps/web/` repo. Ship with a single Prisma migration and a redeploy.
2. **Worker: build → scan → sign pipeline.** Lives in the sibling `apps/worker/` repo. Deployed to its own Hetzner box (not the main app host).
3. **Docs page: `/docs/submitting-dockerfiles`.** The user-facing guide linked from all failed-build emails. Shipped with the main app.

Each can be deployed independently in that order. You can deploy (1) without (2) — submissions will just sit in "approved" state until the worker is up. You cannot deploy (2) without (1) — the worker expects the new schema columns and API endpoints.

## Order of operations

### Day 1: database migration

**Before anything else.** Everything downstream depends on the schema.

```sh
cd apps/web
# Review the generated SQL before applying:
npx prisma migrate dev --name build_worker_schema --create-only
# Read prisma/migrations/<timestamp>_build_worker_schema/migration.sql
# Confirm:
#   - New columns on Submission are all nullable (non-destructive)
#   - User gets two new relation names (submitter, decider)
#   - SubmissionAudit is a brand new table with no dependent data
# Then apply:
npx prisma migrate deploy
npx prisma generate
```

This adds:
- 13 new columns to `Submission`
- New `SubmissionAudit` table
- 2 new indexes on Submission (status+submittedAt, submitterId)
- Renames one User→Submission relation internally (zero runtime impact)

If you have any existing pending submissions from the 8-week MVP, back-fill their `submitterId` before running the worker. The worker uses `submitterId` to email the submitter; legacy rows have the user id stashed in `flagsJson`:

```sql
UPDATE "Submission" s
SET "submitterId" = (
  SELECT id FROM "User"
  WHERE email = (s."flagsJson"::jsonb ->> 'contactEmail')
)
WHERE s."submitterId" IS NULL
  AND s."flagsJson"::jsonb ->> 'contactEmail' IS NOT NULL;
```

(If flagsJson isn't JSONB-queryable, export flagsJson and do the update via a script. Two-dozen rows max, manual is fine.)

### Day 1: deploy the main app

Already-done changes in this zip:

- 5 new API routes under `/api/v1/admin/submissions/*`
- 2 new routes under `/api/v1/worker/*` (heartbeat read + build-completed)
- Real `/app/admin` page with filters and queue stats
- New `/app/admin/[id]` detail page with 3-column layout
- Dockerfile viewer + decision panel components
- 5 React Email templates in `emails/`
- Email sender module in `lib/email/submission-emails.ts`
- New `requireAdmin()` helper in `lib/auth/require-admin.ts`
- Admin query layer in `lib/db/admin-submissions.ts`
- `/docs/submitting-dockerfiles` MDX page

Deploy checklist:

```sh
# From the main flareo repo
npm install              # picks up resend, @react-email/*
npx prisma generate      # regenerate client with new schema
npm run build            # typecheck + build Next.js
# Deploy via your usual path (Vercel, Hetzner, Docker, whatever)
```

Set the new env vars in production:

| Variable               | Required | Purpose                                   |
|------------------------|----------|-------------------------------------------|
| `RESEND_API_KEY`       | yes      | Decision emails                           |
| `AUTH_RESEND_FROM`     | yes      | From address, e.g. hello@flareo.dev       |
| `FLAREO_WORKER_SECRET` | yes      | Auth for worker → main-app callback       |
| `NEXT_PUBLIC_APP_URL`  | yes      | Used in email links, e.g. https://flareo.dev |

Smoke test — sign in as admin, open `/app/admin`. Queue should render real rows (or an empty state). Open any submission's detail page, confirm the left/middle/right layout renders.

Don't click approve yet — the worker isn't up. If you click it now, the submission will sit in `approved` state forever until the worker is deployed.

### Day 2: set up the build host

Fresh Hetzner AX41-NVMe (or equivalent). Do NOT share with the preview-demo host. Docker daemon permissions on this host should be considered compromised until the red-team playbook is complete.

Full host setup is in `apps/worker/README.md`; the short version:

```sh
# Install Docker, trivy, cosign, Node 20
# Create flareo-worker user, add to docker group
# Configure /etc/docker/daemon.json with userns-remap — critical
# Copy worker source to /opt/flareo-worker
# Install systemd unit
# Create /etc/flareo-worker/env with R2/ECR/DB credentials
systemctl enable --now flareo-worker
```

Verify:

```sh
journalctl -u flareo-worker -f
# Should see: {"msg":"worker started","workerId":"hetzner-01",...}
# Then every 30s: {"msg":"polling","queueDepth":0,...}
```

### Day 3: end-to-end test

With both pieces up:

1. Submit a simple module via `/app/publish` (or via the CLI). Use a toy Dockerfile like:

   ```dockerfile
   FROM alpine:3.19
   RUN echo "hello" > /greeting
   CMD ["cat", "/greeting"]
   ```

2. Approve it in `/app/admin` as your admin account.

3. Watch the worker pick it up:
   ```sh
   journalctl -u flareo-worker -f
   ```
   Should see: `claimed submission`, `building`, `trivy scan`, `pushing to ECR`, `signing`, `completed`.

4. Check the submission detail page — status should flip through `approved` → `building` → `built`. You should receive both the approval email and the build-success email.

5. Verify the published image:
   ```sh
   docker pull public.ecr.aws/flareo/your-test-slug@sha256:...
   flareo verify your-test-slug@sha256:...
   ```

If all of that works — the loop is closed. Move to the red-team playbook (Week 13 day), then open up to real submissions.

## Rollback plan

### Schema rollback

The migration is non-destructive (only added columns and a table). To roll back without data loss:

```sh
# Revert the migration without deleting data
npx prisma migrate resolve --rolled-back build_worker_schema
# Then drop the new table and columns manually:
```
```sql
DROP TABLE IF EXISTS "SubmissionAudit";
ALTER TABLE "Submission"
  DROP COLUMN IF EXISTS "dockerfileUrl",
  DROP COLUMN IF EXISTS "dockerfileSha256",
  DROP COLUMN IF EXISTS "requiresNetwork",
  DROP COLUMN IF EXISTS "buildStartedAt",
  DROP COLUMN IF EXISTS "buildCompletedAt",
  DROP COLUMN IF EXISTS "buildErrorKind",
  DROP COLUMN IF EXISTS "buildErrorMessage",
  DROP COLUMN IF EXISTS "buildLogUrl",
  DROP COLUMN IF EXISTS "resultImageRef",
  DROP COLUMN IF EXISTS "resultDigest",
  DROP COLUMN IF EXISTS "resultSbomUrl",
  DROP COLUMN IF EXISTS "resultRekorIndex",
  DROP COLUMN IF EXISTS "submitterId";
```

### Main-app rollback

Redeploy the previous git tag. The new API routes just disappear (404 for any admin UI calls), old admin UI still works because it only uses `listSubmissions`.

### Worker rollback

```sh
systemctl stop flareo-worker
systemctl disable flareo-worker
```

Any in-flight build finishes or times out. The submission stays in `building` state until you either:
- Manually flip back to `approved` (restart worker to re-process)
- Manually flip to `failed` with kind="system" (admin UI retry button works)

## Known gaps after this phase ships

Documented so nobody calls them bugs:

- **No mass-approve.** One-at-a-time by design. If the queue is overwhelming, use the pause banner.
- **No collaborative review.** Single reviewer per submission. Fine for a team of one.
- **No edit-Dockerfile-and-approve.** Reviewer can't modify the submitter's Dockerfile. Request changes instead.
- **Emails are fire-and-forget.** If Resend is down when a decision is made, the recipient doesn't get the email. The submission row is still correct; the admin can resend manually.
- **No auto-retry.** System failures need a reviewer click. Document says we can add auto-retry later; for now human-in-the-loop is fine.
- **Worker is single-host.** If the Hetzner box dies, builds stop. Queue backs up, status shows on heartbeat alert. Solution: bring the host back. Multi-worker is a later problem.

## What you should do the day this ships

1. Submit a test module. End-to-end.
2. Reject a test module. Read the rejection email — does the tone feel right?
3. Request changes on a test module. Reply to the email as the submitter, update the submission, re-approve.
4. Let one build fail (submit a Dockerfile with `apt-get install curl` in it). Read the failed-build email. Does the error message help the submitter fix it?
5. Open the red-team playbook. Block a full day on the calendar for Week 13.

Items 1-4 take about 90 minutes together. Do them before opening submissions to anyone else.
