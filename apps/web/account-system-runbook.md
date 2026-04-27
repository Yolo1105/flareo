# Account system runbook

End-to-end guide for deploying and operating the personal account system. Covers the schema migration, the new API surface, the new pages, the Resend magic-link provider, and the nightly job that purges expired soft-deletes.

## What shipped

Five user-facing pages under `/app/settings/*`:

| Path                               | Function                                        |
|------------------------------------|-------------------------------------------------|
| `/app/settings`                    | Profile — edit display name, see email/GitHub   |
| `/app/settings/api-keys`           | API keys — list, create, revoke (already real)  |
| `/app/settings/sessions`           | Active sessions — per-row revoke, sign out everywhere |
| `/app/settings/notifications`      | Email preferences — 4 categories, toggle switches |
| `/app/settings/delete`             | Delete account — 30-day reversible flow         |

Six API endpoints under `/api/v1/account/*`:

| Method | Path                                                 | What it does                         |
|--------|------------------------------------------------------|--------------------------------------|
| GET    | `/api/v1/account`                                    | Returns the signed-in user's profile |
| PATCH  | `/api/v1/account`                                    | Updates the display name             |
| DELETE | `/api/v1/account`                                    | Soft-deletes (type-to-confirm email) |
| GET    | `/api/v1/account/notifications`                      | Returns prefs                        |
| PATCH  | `/api/v1/account/notifications`                      | Updates any subset of prefs          |
| GET    | `/api/v1/account/sessions`                           | Lists active sessions                |
| POST   | `/api/v1/account/sessions/[id]/revoke`               | Revokes one session                  |
| POST   | `/api/v1/account/sessions/revoke-others`             | Revokes every session                |

Plus one signin change: added Resend magic-link provider to NextAuth (opt-in via `AUTH_RESEND_KEY` env var).

## Monday — Apply the repo and migrate

This deliverable (`flareo-account-system-full.zip`) is the **whole repo**, not a patch. If you already have a working `apps/web/` directory, either back it up first or diff against it. If you don't, just unzip and go:

```sh
unzip flareo-account-system-full.zip
cd apps/web
npm install
cp .env.example .env.local   # then fill in DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_*
```

**One important structural change in this zip vs. previous weeks:** the authenticated route group was renamed from `app/(app)/` (parentheses, which Next.js treats as an invisible organizational group) to `app/app/` (a real URL segment). This was necessary because two pages — `/(app)/page.tsx` and `/(marketing)/page.tsx` — both resolved to the same URL `/`, which Next 15 correctly treats as a build error. The rename means:

- `/` now cleanly serves the marketing landing (no collision)
- The authenticated dashboard lives at `/app` (matches what `middleware.ts` already expected)
- All settings pages are at `/app/settings`, `/app/settings/sessions`, etc — same URLs as before, just no longer ambiguous

If you were relying on any existing link to `/(app)/...`, nothing changes — route groups are invisible to the URL in the first place. This change is pure cleanup.

Run the migration against your dev DB:

```sh
npx prisma migrate dev --name account_system
npx prisma generate
```

The migration adds 7 columns to `User` and one index. Non-destructive; existing rows get defaults. Review the generated SQL at `prisma/migrations/<timestamp>_account_system/migration.sql` before running against production.

Smoke-check:

```sh
npx prisma studio
# Open User table. New columns should be visible:
#   deletedAt, profileUpdatedAt, notifySecurity, notifySubmission,
#   notifyProduct, notifyMarketing
```

When the dev migration looks right, ship to prod:

```sh
npx prisma migrate deploy
```

## Tuesday — Env vars for Resend magic-link (optional)

Magic-link sign-in (email provider) is **off by default**. Leaving `AUTH_RESEND_KEY` unset keeps NextAuth on GitHub-only, exactly like Weeks 1-8. Users who want email signin get it when you set two vars in Vercel production:

| Variable           | Value                                                     |
|--------------------|-----------------------------------------------------------|
| `AUTH_RESEND_KEY`  | Your Resend API key (same one used for the waitlist)      |
| `AUTH_RESEND_FROM` | `hello@flareo.dev` (or any verified domain in Resend)     |

Magic-link sends a 24-hour-valid link to the typed email. NextAuth creates a `User` row on first successful click. The login page automatically renders an email input alongside the GitHub button when the provider is registered — no UI changes needed.

Test locally with a fake DSN if you don't want to touch production Resend:

```sh
# Set a dummy key so the provider registers, but use NextAuth's debug logger
AUTH_RESEND_KEY=re_test_xxx AUTH_RESEND_FROM=dev@flareo.dev npm run dev
```

Then visit `/login` and look for the email field. Ctrl+F for "magic link" in the browser network tab to confirm the call shape.

## Wednesday — End-to-end test

Run through the user flow:

1. **Sign in via GitHub** at `/login`. Land on `/app`.
2. Navigate to **`/app/settings`**. Confirm the profile shows your real GitHub name, email, and avatar.
3. Edit the display name, hit save. Confirm the toast appears; refresh and the new name persists.
4. Go to **`/app/settings/api-keys`**. Click "New key". Type a label, pick scopes, confirm the one-time token appears. Copy it.
5. Use the token against the API:

   ```sh
   curl -s https://flareo.dev/api/v1/whoami \
     -H "Authorization: Bearer <the-token-you-copied>"
   ```

   Should return your user ID. If it returns 401, the token isn't wired — check `lib/auth/apikey.ts`.

6. Revoke the key in the UI. Retry the curl — should now 401.
7. **`/app/settings/sessions`**. Your current session is listed. Open another browser (or incognito), sign in there; refresh sessions page, two rows appear. Revoke the other one from the primary browser. Refresh the incognito tab — should redirect to /login.
8. **`/app/settings/notifications`**. Toggle marketing off, refresh. Should stay off.
9. **`/app/settings/delete`**. Type anything other than your email into the box — button stays disabled. Type exactly your email — button enables. Click. Confirm the dialog. After it succeeds, you get signed out and bounced to /login. Sign back in — the callback detects `deletedAt` is set but within 30 days, so sign-in succeeds. Navigate to `/app/settings` — the "scheduled for deletion" banner should be visible.
10. Manually restore: `psql -d flareo -c "UPDATE \"User\" SET \"deletedAt\" = NULL WHERE email = 'you@example.com';"`. Banner disappears.

If any step fails, check Sentry for the specific error. Most likely causes: missing migration, missing `AUTH_GITHUB_*` env in local dev, or the browser blocking cookies.

## Thursday — Nightly purge job

Soft-delete has a 30-day grace window. After that the account should be hard-deleted. There's no cron baked in yet — add one.

Create `scripts/purge-soft-deleted.ts`:

```ts
import { prisma } from "../lib/db/prisma";

async function main() {
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const expired = await prisma.user.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
    select: { id: true, email: true },
  }) as Array<{ id: string; email: string | null }>;

  console.log(`purging ${expired.length} expired soft-deleted users`);
  for (const u of expired) {
    // Cascade deletes on Session, Account, ApiKey, Submission, Notification
    // per the foreign-key rules in schema.prisma. Modules the user published
    // STAY — they're community artifacts, owned by the catalog.
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`  purged ${u.id} (${u.email ?? "no-email"})`);
  }
}

void main().catch((e) => { console.error(e); process.exit(1); });
```

Schedule it. Two options:

**Option A: Vercel Cron (simplest if you already deploy on Vercel).** Add a route `app/api/cron/purge-soft-deleted/route.ts` that gates on a `CRON_SECRET` header and calls the same logic. Register it in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/purge-soft-deleted", "schedule": "0 3 * * *" }
  ]
}
```

Runs daily at 03:00 UTC.

**Option B: GitHub Actions.** Same script, run via `gh workflow run`, scheduled via `cron: '0 3 * * *'`. Needs `DATABASE_URL` in secrets.

Both work; Vercel Cron is lighter if you're already there.

## Friday — Notification sending

The prefs table exists; nothing currently reads from it. That's fine for launch — the flags are forward-looking. When you start sending emails:

- **Security advisories** — check `notifySecurity` before sending
- **Submission decisions** — check `notifySubmission`
- **Product / marketing digests** — check `notifyProduct` / `notifyMarketing`

Pattern, roughly:

```ts
const prefs = await prisma.user.findUnique({
  where: { id: userId },
  select: { notifySecurity: true, email: true, deletedAt: true },
});
if (!prefs?.email || prefs.deletedAt) return;       // no contact or deleted
if (!prefs.notifySecurity) return;                  // opted out
await sendEmail({ to: prefs.email, ... });
```

The `deletedAt` check matters — soft-deleted users should stop receiving everything during the grace window.

## Operational notes

### The "sign out everywhere" caveat

NextAuth v5's database strategy doesn't expose the current request's session token in the session callback, so the server can't tell which session is "this one" when you call `/api/v1/account/sessions`. Result: `isCurrent: false` on every row, and "Sign out everywhere" revokes the current session too (logging you out). The UI copy reflects this ("Sign out everywhere" not "everywhere else"). If we ever want proper "other sessions" behavior, we'd extend the Session model with a client-visible hashed identifier set on first write.

### Soft-delete blocks re-signup on the same email

If a user soft-deletes, their `User` row still exists (email is still unique-constrained in Postgres). They can't sign up a fresh account on the same email during the grace window. Signing in again via GitHub or magic-link finds the existing row, sees `deletedAt` is set, checks the grace window in the `signIn` callback, and either allows (restore) or blocks (past 30 days).

To manually restore before 30 days: `UPDATE "User" SET "deletedAt" = NULL WHERE email = ?;`

To hard-delete early (user asks via privacy@flareo.dev): `DELETE FROM "User" WHERE id = ?;` — Prisma cascades handle everything downstream.

### Rate limits

Profile updates, notification prefs, and deletions all hit the `auth-signin` bucket (10 per 10 minutes per user). Reads hit `modules-list` (300/hour). Nothing account-related should be touching those limits under normal use; if Sentry starts seeing 429s on `/api/v1/account/*`, it's probably a bug.

## Env var checklist (updated)

Required for the account system to function fully:

| Variable              | Required for                                |
|-----------------------|---------------------------------------------|
| `DATABASE_URL`        | All account persistence                     |
| `DIRECT_URL`          | Migrations                                  |
| `AUTH_SECRET`         | NextAuth sessions                           |
| `AUTH_GITHUB_ID`      | GitHub OAuth                                |
| `AUTH_GITHUB_SECRET`  | GitHub OAuth                                |

Optional:

| Variable              | Effect                                                      |
|-----------------------|-------------------------------------------------------------|
| `AUTH_RESEND_KEY`     | Enables magic-link signin                                   |
| `AUTH_RESEND_FROM`    | "From" address for magic-link emails (default hello@flareo.dev) |
| `CRON_SECRET`         | Required if you use Vercel Cron for the nightly purge       |

## What DIDN'T ship here

Called out because it's easy to assume they did:

- **Email change flow.** Changing your login email requires a verify-then-commit round-trip (send a link to the new address, click to confirm, only then update the row). The code to do it is ~200 lines and wasn't in scope. Users with a typo'd email can email `hello@flareo.dev` and a human merges accounts.
- **Two-factor auth.** NextAuth supports it via the WebAuthn provider but it needs its own UI. Probably Horizon 2.
- **Account recovery.** If a user loses access to both their GitHub account AND their email, they're locked out. Self-service recovery is out of scope for this round.
- **Public profiles.** No "view dani-garcia's public modules" page. If/when we build module submission at scale, we'll want this. For now profiles are private.
- **Organizations / teams.** Single-user only. The schema doesn't model teams; adding them is a Horizon 3 effort.
- **Audit log.** We log name changes (`profileUpdatedAt`) and account deletion (`deletedAt`), but there's no UI to review your own account history. Low priority.

## What to do if something breaks

**Migration fails with "column already exists."** You've already applied this migration to production. Skip.

**"Cannot find module '@auth/prisma-adapter'" at runtime.** You forgot `npx prisma generate` after the schema change. Run it.

**Magic-link signin fails silently.** Check Resend dashboard: is the email being sent? If yes, is it being delivered to spam? Verify the `AUTH_RESEND_FROM` address is on a domain you control with verified DKIM in Resend.

**"Session not found" on revoke.** The session ID you passed was already expired and cleaned up by NextAuth's session janitor. Safe to ignore; the UI will drop the row on next refresh.

**Delete-account button stays disabled forever.** Your email in the DB differs in case or whitespace from what the UI is comparing. Check `profile.email` — it should be normalized lowercase already, but old rows from before that normalization could trip this. Manual fix: `UPDATE "User" SET email = LOWER(TRIM(email)) WHERE id = ?;`.

**"Your account has been soft-deleted for more than 30 days."** Signin callback is working as designed. If the user wants back in, a human with DB access clears `deletedAt`.
