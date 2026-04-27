# Week 6 runbook: launch prep

Goal by Sunday night: you can publicly announce Flareo without feeling like you shipped something half-baked. Six independent tracks; aim to close each one by Friday so Saturday is polish and Sunday is announcement day.

## Before you start

- Weeks 1-5 complete and verified in production
- `flareo.dev` and `docs.flareo.dev` serving traffic
- 12 canary modules running and daily-rebuilding
- Vercel production deploy on the main `main` branch

## Monday — Legal pages

Apply the Week 6 patch zip. It ships:

- `app/(marketing)/legal/terms/page.tsx` — Terms of Service
- `app/(marketing)/legal/privacy/page.tsx` — Privacy Policy
- `lib/data/nav.ts` — footer links updated to `/legal/terms` and `/legal/privacy`, plus Status → `https://status.flareo.dev`

Action items:

1. Read both pages end to end. They're written plainly but they're *your* terms; you need to agree with every sentence.
2. Replace the `EFFECTIVE` constant at the top of each file if today isn't April 23, 2026. The dates in the PageHero and at the bottom of the page pick this up automatically.
3. Confirm the sub-processor table on the privacy page matches your actual stack (Resend, Neon, Upstash, Vercel, Cloudflare, Hetzner, GitHub, Sigstore, ECR Public). Edit if not.
4. **Get a lawyer to review before any real revenue event.** These are beta-quality drafts; they're NOT a substitute for actual legal advice. Before you charge money or accept enterprise contracts, pay for a 1-hour lawyer review.

Deploy. Visit `flareo.dev/legal/terms` and `flareo.dev/legal/privacy` — they should render.

## Tuesday — Waitlist

The Week 6 patch also wires the existing signup form to a real backend:

- `app/api/v1/waitlist/route.ts` — new endpoint. Validates email with Zod, upserts a `WaitlistEntry`, rate-limits to 10 submissions per 10 minutes per IP.
- `components/sections/signup/SignupForm.tsx` — the existing form, now pointing to `/api/v1/waitlist`.

Action items:

1. Confirm your Prisma schema already has the `WaitlistEntry` model. Open `prisma/schema.prisma`, search for `WaitlistEntry`. It's expected to be there (added in an earlier week). If missing, add it from the schema dump in `week6-runbook.md` at the end.
2. Run `npx prisma migrate deploy` to sync the table to production. It's a no-op if the table already exists.
3. Test locally. Start `npm run dev`, visit `/signup`, enter a real email:

   ```sh
   curl -X POST http://localhost:3000/api/v1/waitlist \
     -H 'content-type: application/json' \
     -d '{"email":"test@example.com","source":"runbook"}'
   ```

   Should return `{ "status": "ok", "message": "..." }`. Confirm the row landed in Postgres:

   ```sh
   npx prisma studio
   # browse WaitlistEntry table
   ```

4. Test rate limiting:

   ```sh
   for i in $(seq 1 15); do
     curl -so /dev/null -w "%{http_code}\n" -X POST \
       http://localhost:3000/api/v1/waitlist \
       -H 'content-type: application/json' \
       -d "{\"email\":\"rl-$i@example.com\"}"
   done | sort | uniq -c
   ```

   Expected: `10 200`, `5 429`.

5. Deploy. Test the real form at `flareo.dev/signup`.

## Wednesday — Instatus status page

No new code; everything needed is already in Week 2's `/api/v1/health`. This is dashboard setup.

1. Sign up at https://instatus.com — free tier is enough (up to 5 components, 20 uptime checks).
2. Create a status page. Name it "Flareo Status."
3. Custom domain: `status.flareo.dev`. In Cloudflare DNS, add the CNAME Instatus tells you to add.
4. Add these components (the colored dots on the status page):

   | Component         | What it represents                        |
   |-------------------|-------------------------------------------|
   | flareo.dev        | Main web app                              |
   | API v1            | /api/v1/* endpoints                       |
   | docs.flareo.dev   | Documentation site                        |
   | Canary pipeline   | Daily module rebuilds                     |
   | Preview demos     | s-*.preview.flareo.dev                    |

5. Add uptime checks. For each check: method GET, timeout 10s, frequency 3 minutes:

   | Check URL                                          | Component         | Expected |
   |----------------------------------------------------|-------------------|----------|
   | https://flareo.dev                                 | flareo.dev        | 200      |
   | https://flareo.dev/api/v1/health                   | API v1            | 200 body matches `"status":"ok"` |
   | https://docs.flareo.dev                            | docs.flareo.dev   | 200      |
   | https://s-vaultwarden-demo.preview.flareo.dev      | Preview demos     | 200      |
   | https://github.com/flareo/flareo-canary/actions    | Canary pipeline   | 200      |

6. Set up alerting. Go to Notifications. Add email alert to `ops@flareo.dev`. Optional: Slack or Discord webhook.
7. Post a "Launching closed beta" incident message so the page doesn't look empty on launch day.

Verify: visit `https://status.flareo.dev` — it should show all components green.

## Thursday — CLI v0.2.0 release

`flareo verify <image>` is implemented (it was done alongside Week 3 even though the runbook said v0.2.0). Cargo.toml is already at 0.2.0. All that's left is to tag a release.

Action items:

1. Pull the latest `flareo-cli` main branch and confirm the `verify` subcommand is present in `src/commands/verify.rs`.
2. Locally build and test against your production API:

   ```sh
   FLAREO_GITHUB_CLIENT_ID=<your-id> cargo build --release
   ./target/release/flareo verify public.ecr.aws/<your-alias>/flareo/vaultwarden:latest
   ```

   Expected: colorful output, `VERIFIED` or `SIGNED` label, signer identity, Rekor log index, CVE summary, exit code 0. If instead you see `UNSIGNED` on a module you KNOW you signed, something's off in the preview pipeline — debug before tagging.

3. Tag and push:

   ```sh
   git tag -a v0.2.0 -m "flareo verify is real"
   git push origin v0.2.0
   ```

4. Watch the `Release` workflow in GitHub Actions. Four platform builds should each take 5-10 minutes. At the end, a new GitHub Release appears with four signed archives plus the auto-generated install script.

5. Re-run the installer on a clean VM to verify:

   ```sh
   curl -fsSL https://flareo.dev/install | sh
   flareo --version
   # should print: flareo 0.2.0
   flareo verify public.ecr.aws/<alias>/flareo/vaultwarden:latest
   ```

## Friday — Sentry + production hardening

The Week 6 patch adds:

- `instrumentation.ts` — Sentry bootstrap
- `sentry.{server,edge,client}.config.ts` — runtime-specific configs
- `next.config.ts` — wrapped with `withSentryConfig` when `SENTRY_AUTH_TOKEN` is set

Action items:

1. Create a Sentry project at https://sentry.io. Organization name: `flareo`. Project name: `flareo`. Platform: Next.js.
2. Copy the DSN. You'll get two forms — a server DSN and a client DSN. For the Flareo setup, same DSN works for both.
3. Add these env vars to Vercel production:

   | Variable                     | Value                                           |
   |------------------------------|-------------------------------------------------|
   | `SENTRY_DSN`                 | Your Sentry DSN                                 |
   | `NEXT_PUBLIC_SENTRY_DSN`     | Same DSN (exposed to client bundle)             |
   | `SENTRY_AUTH_TOKEN`          | Get from Sentry → Settings → Auth Tokens → Create — needs `project:releases` and `org:read` scopes |
   | `SENTRY_ORG`                 | `flareo`                                        |
   | `SENTRY_PROJECT`             | `flareo`                                        |

4. Trigger a deploy. During the build, Sentry should upload source maps (you'll see "Uploading source maps to Sentry" in build logs).
5. Test Sentry capture by visiting an admin URL that errors out, or by adding a temporary test page that throws. Confirm the error shows up in the Sentry dashboard within ~30 seconds.
6. **Rate limit audit.** Tail your logs for 5 minutes and look for 429s. If any legitimate user flow is hitting rate limits unexpectedly, raise the limits in `lib/ratelimit/index.ts` before launch. Buckets to sanity-check:
   - `verify-anon` (60/hour/IP) — fine for casual demo use
   - `verify-auth` (600/hour/user) — fine for CLI use
   - `modules-list` (300/hour) — should be enough for any reasonable browsing
   - `auth-signin` (10/10min) — reused for waitlist; should be fine for humans
7. **Env var checklist.** Run through `ENV_VARS.md` (at the end of this runbook) and confirm every required variable is set in Vercel production.

## Saturday — Launch content review

Open `launch/blog-post.md` and `launch/short-form.md`. Read them as if you've never seen Flareo before. Edit ruthlessly for:

- Anything that sounds like marketing rather than description
- Anything that overstates what's built (especially "we guarantee X")
- Anything that understates trade-offs ("we haven't done SLSA L3 yet" — yes we have? no we haven't? be honest)
- The Twitter/X thread length — 6 posts is a lot; cut to 4 if any feel soft
- Links — every URL has to 200 on production

Post the blog post somewhere public. Options, in decreasing order of preference:

1. **Your own domain under `flareo.dev/blog/launch`** (build this as a one-off route; future blog infrastructure is Horizon 2)
2. **A Substack or dev.to** if your domain doesn't support blogging yet
3. **A GitHub Gist** as a fallback

Publish the blog post URL as the main "canonical" link. All short-form posts reference it.

Update the "Publish Instatus status update" post on Wednesday's tracker. It should say "Flareo closed beta is now open" with today's timestamp.

## Sunday — Launch day

Timeline:

- **8:00 UTC** — Publish the blog post. Lock everything else until it's live.
- **8:30 UTC** — Set the Instatus "Launching" banner to past tense.
- **9:00 UTC** — Post to Hacker News. Pick ONE title from `launch/short-form.md`. Submit with URL = blog post URL. Within 5 minutes, post the first-comment self-reply.
- **9:15 UTC** — Post to Reddit /r/selfhosted. Adapt the template.
- **9:30 UTC** — Post the Twitter/X/Bluesky/Mastodon thread.
- **10:00 UTC** — Watch Sentry and your Vercel traffic dashboard. If anything breaks, fix it fast. If rate limits start biting, raise them.
- **Throughout the day** — Respond to every HN and Reddit comment personally within 30 minutes. This is load-bearing for launch tone.
- **Evening** — Review signup count, error rate, top-requested modules. Write a short internal note about what worked and what didn't.

Rollback plan (in case of catastrophe):

- Vercel has instant revert to previous deploy. Use it.
- If a specific module is causing rate-limit blowback, mark it private temporarily via SQL: `UPDATE "Module" SET visibility = 'private' WHERE slug = '<slug>';`
- If preview demos are getting hammered, the daily reset timer + mem limits should keep them afloat. If not, stop the public ingress: `sudo ufw deny 443/tcp` on the preview box.

## What DIDN'T happen this week (on purpose)

- **Paid tier / billing.** Intentionally deferred. Closed beta stays free.
- **Account deletion self-service.** Emailing privacy@flareo.dev is the path today; a self-service button lands in Horizon 2.
- **Language localization.** English only. Translations are someone-else's-money-problem for now.
- **SOC 2 / ISO 27001.** Those are Horizon 4 and beyond. The privacy policy reflects what we actually do, not what a certification would document.

## Env vars checklist (reference)

Required in Vercel production for every feature to work:

| Variable                         | Required for                                |
|----------------------------------|---------------------------------------------|
| `DATABASE_URL`                   | Everything                                  |
| `DIRECT_URL`                     | Prisma migrations                           |
| `AUTH_SECRET`                    | NextAuth sessions                           |
| `AUTH_GITHUB_ID`                 | GitHub OAuth (web)                          |
| `AUTH_GITHUB_SECRET`             | GitHub OAuth (web)                          |
| `UPSTASH_REDIS_REST_URL`         | Rate limiting                               |
| `UPSTASH_REDIS_REST_TOKEN`       | Rate limiting                               |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`    | SBOM + scan uploads                         |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY`| Same                                        |
| `CLOUDFLARE_R2_BUCKET`           | Same                                        |
| `RESEND_API_KEY`                 | Waitlist + transactional email              |
| `FLAREO_ADMIN_API_TOKEN`         | Canary pipeline → DB writes                 |
| `SENTRY_DSN`                     | Server error capture                        |
| `NEXT_PUBLIC_SENTRY_DSN`         | Client error capture                        |
| `SENTRY_AUTH_TOKEN`              | Source map upload at build time             |

Optional:

| Variable                    | Effect                                        |
|-----------------------------|-----------------------------------------------|
| `SENTRY_ORG`                | Defaults to "flareo"                          |
| `SENTRY_PROJECT`            | Defaults to "flareo"                          |

## What to do if something breaks

**Legal pages 404.** You deployed without the new `/legal/terms` and `/legal/privacy` routes. Redeploy.

**Waitlist returns 500 on every submission.** Either the `WaitlistEntry` table doesn't exist (run `prisma migrate deploy`) or your `DATABASE_URL` is set to the wrong database. Check Vercel env.

**Instatus shows components red immediately.** Your uptime checks may be pointing at paths that return 401 or 404. Re-check URLs and response expectations.

**CLI install fails with "sha256 mismatch."** The release workflow didn't finish; check Actions tab. Binaries uploaded before the checksum file get inconsistent.

**Sentry not receiving events.** Confirm DSN is set. Check that you're on the right project in Sentry. The free tier has a 5k event/month cap; you probably haven't hit it but check.

**Blog post URL is wrong in short-form posts.** Edit the short-form posts BEFORE publishing on HN/Reddit. You can't change the URL on HN after submission.

## WaitlistEntry schema (for reference)

```prisma
model WaitlistEntry {
  id         String   @id @default(cuid())
  email      String   @unique
  referrer   String?  @db.VarChar(280)
  source     String?  @db.VarChar(64)
  ipSnapshot String?  @db.VarChar(64)
  userAgent  String?  @db.VarChar(200)
  createdAt  DateTime @default(now())
  invitedAt  DateTime?
  invitedBy  String?

  @@index([createdAt])
  @@index([invitedAt])
}
```
