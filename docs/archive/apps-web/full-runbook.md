# Flareo — full repo runbook

One-zip deliverable: **`flareo-full.zip`**. The entire main app, everything Weeks 1-8 plus the account system, the merged docs site, real dashboard, and the opt-in seed.

## What's in this zip

Whole repo, minus `node_modules`, `.next`, and `package-lock.json` (regenerates on install).

- Marketing landing, catalog, verify tool, pricing, about, signup — all at `/`, `/catalog`, `/verify`, etc.
- Docs at `/docs/*` — 18 MDX pages, previously separate but now merged in.
- Authenticated dashboard at `/app` — real data per signed-in user.
- Settings at `/app/settings/*` — profile, API keys, sessions, notifications, delete account.
- Admin queue at `/app/admin` — real Postgres submission review.
- Publish wizard at `/app/publish` — real POST to `/api/v1/submissions`.
- API v1 surface at `/api/v1/*` — verify, modules, catalog, waitlist, submissions, account, sessions, notifications, whoami, stats, health.

## What's real now that wasn't before

1. **Docs merged in.** `localhost:3000/docs` renders the overview with its sidebar. Every sub-page (install, first-verify, verify-cli, catalog, signing, threat-model, etc.) serves from the main app — no separate docs site needed. The external `docs.flareo.dev` deploy is still an option for production but the main app is now self-sufficient.

2. **Dashboard pulls real data.** `/app` server-side queries `listMyModules(userId)`, `listJobs(userId)`, `getAccountProfile(userId)`. Greeting uses your real name. Metrics strip shows your real module count, pull count, job count, trust score. Recent activity lists your real jobs.

3. **`/app/modules` pulls real data.** Shows only the modules you personally published (via `publisherId = userId`). Renders a proper empty state with a CTA to publish if you haven't.

4. **`/app/publish` is wired.** The 3-step wizard now POSTs to `/api/v1/submissions` (not the old mock `/api/publish`). Uses your signed-in email as contact, derives a slug from the module name. On success redirects to `/app/modules`.

5. **Seed is opt-in.** `prisma db seed` now refuses to run unless `SEED=1` is set. Prevents accidentally clobbering a production catalog with 12 demo modules.

## First-run checklist

```sh
unzip flareo-full.zip
cd apps/web
npm install
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET
# (optional: AUTH_RESEND_KEY, AUTH_RESEND_FROM for magic-link signin)
```

Then:

```sh
npx prisma migrate deploy      # applies all migrations including account_system
npx prisma generate            # build the Prisma client for your machine
```

For **local dev** you probably want demo data so the catalog isn't empty:

```sh
SEED=1 npx prisma db seed
```

For **production** leave `SEED` unset. The catalog starts empty and fills in as the canary pipeline ingests real builds.

Start the dev server:

```sh
npm run dev
```

Visit `localhost:3000`. You should see the real landing page with the hero, pipeline terminal, catalog preview, install block, metrics strip, pricing preview.

## Required env vars

| Variable             | Required | Value                                 |
|----------------------|----------|---------------------------------------|
| `DATABASE_URL`       | yes      | Postgres connection                   |
| `DIRECT_URL`         | for migrations | Same host without pooler        |
| `AUTH_SECRET`        | yes      | `openssl rand -base64 32`             |
| `AUTH_GITHUB_ID`     | yes      | GitHub OAuth App client id            |
| `AUTH_GITHUB_SECRET` | yes      | GitHub OAuth App client secret        |
| `UPSTASH_REDIS_REST_URL`   | no  | If set, rate-limiting uses Upstash. Otherwise in-memory. |
| `UPSTASH_REDIS_REST_TOKEN` | no  | Same                                  |
| `AUTH_RESEND_KEY`    | no       | Enables magic-link signin             |
| `AUTH_RESEND_FROM`   | no       | From address for magic-link emails    |
| `SENTRY_DSN`         | no       | Server error capture                  |
| `NEXT_PUBLIC_SENTRY_DSN` | no   | Client error capture                  |
| `SENTRY_AUTH_TOKEN`  | no       | Source map upload on build            |
| `FLAREO_ADMIN_API_TOKEN` | no   | Canary pipeline → DB writes           |

GitHub OAuth setup: https://github.com/settings/developers → New OAuth App. Callback URL for local dev: `http://localhost:3000/api/auth/callback/github`.

## End-to-end smoke test

1. `localhost:3000` → landing. Click **Pipeline**, **Catalog**, **Verify**, **Docs**, **Pricing** in the nav — each loads real pages.
2. `localhost:3000/docs` → docs overview with sidebar. Click into **Install**, **First verify**, **Verify CLI**, etc. — each renders.
3. `localhost:3000/verify` → paste an image reference, e.g. `nginx:latest`. Submit. Hits `/api/v1/verify` and shows the result.
4. `localhost:3000/login` → **Sign in with GitHub**.
5. `localhost:3000/app` → real dashboard. If you're a new account with no modules, you see the empty state and a "publish your first module" CTA. If you have modules (seeded via `SEED=1`), you see the real counts.
6. `localhost:3000/app/settings` → your real profile. Edit the display name, refresh — persists.
7. `localhost:3000/app/settings/api-keys` → create a key. Copy it. `curl -s localhost:3000/api/v1/whoami -H "Authorization: Bearer <token>"` returns your user id.
8. `localhost:3000/app/settings/sessions` → your session listed.
9. `localhost:3000/app/settings/notifications` → toggle preferences.
10. `localhost:3000/app/settings/delete` → type your email, confirm. Soft-deletes with 30-day grace. Sign back in to restore.
11. `localhost:3000/app/publish` → fill in source + name + version, click through. POSTs to `/api/v1/submissions`. Redirects to `/app/modules`.

## What's still mock

Being honest about gaps:

- **`/app/admin` queue.** Reads real `Submission` rows but the `decideSubmission` endpoint still wraps the Prisma call in `simulatedLatency(220, 520)`. The update itself is real; the delay is cosmetic. Drop the delay when you care.
- **Notifications in `/app`.** The notification drawer reads real rows from Postgres, but the endpoints that mark-read still wrap in `simulatedLatency`. Same story — real underneath, fake delay on top.
- **`ViewHeader` subtitles with fabricated numbers.** A couple of subtitles in the catalog/landing pages still reference invented numbers (e.g. "7 days uptime 99.87%"). These come from the hardcoded data in `lib/data/*`, not from the DB. Wire them to real Prometheus/Instatus queries when you have the endpoint.

## Route structure note

The authenticated section is now at `app/app/*` (real URL segment), not `app/(app)/*` (invisible route group). This was a required fix — the route-group form caused a build error in Next 15 because `(app)/page.tsx` and `(marketing)/page.tsx` both resolved to `/`. The new structure matches what `middleware.ts` was already written for.

If you were importing from any path containing `(app)`, nothing changes — route group names don't appear in TypeScript imports.

## What DIDN'T ship here

Called out so you don't assume:

- **Email change flow.** To change the login email, a user currently has to email `hello@flareo.dev`. Self-service email-change needs a verify-then-commit round-trip.
- **Real-time updates.** No WebSocket or SSE for live-updating job progress or notifications. Polling on navigation is the pattern today.
- **Organizations / teams.** Single user per account. Team support means schema changes and new routes.
- **Reactivate-from-delete self-service.** If you soft-delete your account, the only way back is to email privacy@flareo.dev or have a DB admin clear `deletedAt`.
- **Public user profiles.** No `/u/<username>` pages. Module detail pages show the author name; there's no profile page to click through to.

## What to do if something breaks

**Landing page shows the old placeholder ("Local app shell").** You have an `app/page.tsx` somewhere that's shadowing the marketing group. Delete it; the real landing is at `app/(marketing)/page.tsx`.

**`/docs` 404s.** You forgot to install MDX deps. Run `npm install` again; verify `@next/mdx`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings` are in `node_modules`.

**Prisma migration fails with "column already exists."** You've already applied the migration. Safe to skip with `npx prisma migrate resolve --applied <migration-name>`.

**`/app` shows my name but zero of my modules even though I seeded.** Seed assigns modules to a specific user id (`dani-garcia`). If your GitHub account is someone else, you won't see those modules — they're owned by a different user. Either (a) publish your own via `/app/publish` or (b) reassign in Postgres: `UPDATE "Module" SET "publisherId" = '<your-user-id>' WHERE "publisherId" IS NULL;`.

**Build fails with `Failed to fetch font 'Archivo Black'`.** You're building offline. Either enable network or swap the Google Fonts imports in `app/layout.tsx` for local font files.

**Magic-link signin 500s with `Cannot read properties of undefined (reading 'from')`.** `AUTH_RESEND_KEY` is set but `AUTH_RESEND_FROM` is not. Add it, or unset both to fall back to GitHub-only.
