# Deploy runbook

A single ordered sequence to take the workspace from "shipped in zip" to "running in production." Follow top-to-bottom; each step has a success check before moving on.

If a step fails, **stop**. Don't continue. Paste the error in the next session and I'll fix it.

---

## 0. One-time prep (skip if already done)

- A Postgres 16+ database (managed: Neon, Supabase, RDS; self-hosted is fine too)
- Vercel account (or any Node 20+ hosting target)
- A Cloudflare R2 bucket for SBOM/build-log storage
- A Stripe account (test mode is fine for initial deploy)
- A Plausible account at https://plausible.io
- The Hetzner box for the shared preview demos (already exists per `deploy/preview/`)
- A worker host — a small VPS (Hetzner CX21, DigitalOcean droplet, or similar) with Docker + cosign + Trivy installed
- Anthropic-compatible domain DNS (the project assumes you control `flareo.app` and, for shared demos, preview subdomains documented under `deploy/preview/`)

---

## 1. Apply database migrations

```sh
cd apps/web
cp .env.example .env
# Edit .env: at minimum set DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL
npm install
npx prisma migrate deploy
npx prisma generate
```

**Success check:**
```sh
npx prisma db pull --print | head -20
```
Should print your live schema. The 4 migrations from this session add: `VexStatement`, CNB fields on Submission, `AdmissionPolicy` + `ModulePolicyVerdict`, `cveSeverity` column.

If `migrate deploy` fails: most likely cause is a column collision from earlier ad-hoc DDL. Resolution: `npx prisma migrate resolve --applied <migration_name>` to mark already-applied migrations as satisfied.

---

## 2. Verify type safety holds

```sh
npm run typecheck
```

**Success check:** ≤ 5 errors. The validation pass should have cleaned everything fixable; remainder are environmental (Stripe types, Sentry types) that resolve once their packages are installed properly.

If you see > 5 errors that look real: paste them in the next session.

Then run the cleanup script:
```sh
npx tsx scripts/cleanup/remove-as-never.ts
npm run typecheck   # check again — should still be ≤ 5
```
If typecheck breaks after cleanup: `git checkout` the affected files and ignore. The casts can stay; they're only cosmetic.

---

## 3. Build the main app

```sh
npm run build
```

**Success check:** exit 0 with `.next/` populated.

If build fails on environment variables: set the placeholder values per `.env.example` for build-time-only vars (DATABASE_URL needs to be reachable at build time for Prisma client init).

---

## 4. Run the e2e suite locally

```sh
npm install -D @playwright/test
npx playwright install chromium
npm run test:e2e
```

**Success check:** all 9 tests green. Some assertions might need to be relaxed if your seed data differs — paste failures and I'll adjust.

---

## 5. Deploy main app to Vercel

This is a monorepo. The Next.js app lives in `apps/web`. Vercel needs to be told that.

### First-time setup (Vercel dashboard)

1. **Connect the git repo** to a new Vercel project.
2. **Project Settings → General → Root Directory** → set to `apps/web` and click Save. This is the single most important step. Without it, Vercel tries to build from the monorepo root and fails because there's no Next.js app there.
3. **Framework Preset** → Next.js (auto-detected once root is set).
4. **Build Command, Install Command, Output Directory** → leave on defaults. Vercel reads from `apps/web/package.json`.

### Required environment variables

Set all of these in Project Settings → Environment Variables. Mark them for Production (and Preview if you want preview deployments).

**Required for build to succeed:**

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection string. Must be reachable from Vercel's build environment (use a managed Postgres service like Neon, Supabase, or Railway). |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed app (e.g. `https://flareo.app`). `lib/config/env.ts` throws if unset in production. Used by sitemap, robots, and Stripe redirect URLs. |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32`. Required by NextAuth. |

**Required for sign-in to work:**

| Var | Purpose |
|-----|---------|
| `AUTH_GITHUB_ID` | GitHub OAuth app client ID. Create at https://github.com/settings/developers. Callback URL: `https://<your-domain>/api/auth/callback/github`. |
| `AUTH_GITHUB_SECRET` | OAuth app client secret. |

**Required for the worker integration to work:**

| Var | Purpose |
|-----|---------|
| `FLAREO_WORKER_SECRET` | Shared secret for worker callbacks. Same value on main app and worker. Generate with `openssl rand -hex 32`. |

**Optional (graceful degradation when unset):**

| Var | Purpose |
|-----|---------|
| `STRIPE_SECRET_KEY` | Stripe API key. Without it, billing routes return "stripe not configured". |
| `STRIPE_PRICE_ID_PRO` | Stripe Price ID for the Pro plan. |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint signing secret. |
| `RESEND_API_KEY` | Resend API key for transactional email. Without it, emails are no-ops. |
| `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Sentry error capture and source-map upload. Without them, builds skip Sentry entirely. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate-limit storage. Without them, rate-limiting falls back to in-memory (fine for single-instance, not multi-instance). |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_SUBMISSIONS`, `R2_BUCKET_ARTIFACTS` | Cloudflare R2 for SBOM/Trivy report storage. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECR_PUBLIC_URL` | AWS ECR for container image push. |
| `ADMIN_EMAIL` | First-login auto-promotion to admin role on seed. |

### Deploy

```sh
# Push to main, or:
vercel --prod
```

**Success check:** the deployed URL renders `/` without errors. Visit `/api/v1/health` for a JSON health pulse. Visit `/sitemap.xml` to verify the sitemap built correctly (it queries Postgres at build/revalidate time — failure here means `DATABASE_URL` is wrong).

### Common build failures

- **`NEXT_PUBLIC_APP_URL is not set`** → set the env var as above.
- **`Module not found: Can't resolve '.prisma/client/default'`** → Prisma client wasn't generated. The `build` script in `apps/web/package.json` runs `prisma generate && next build`; if you've overridden the build command in Vercel, restore it.
- **`PrismaClientInitializationError` during build** → `DATABASE_URL` is set but unreachable. The sitemap queries Postgres at build time; if your DB is behind a VPN or only listens on a private network, build fails here. Use a Postgres provider that allows public-internet connections from Vercel's build environment.

---

## 6. Wire F0 analytics

On the Hetzner preview box (per `deploy/preview/README.md`):

```sh
ssh root@<preview-box>
cd /opt/flareo-preview
git pull   # pulls in the F0 caddy injection from this session

# Create the Plausible site at https://plausible.io for preview.flareo.dev

# Rebuild Caddy with the analytics module
./caddy/build-caddy.sh

# Restart
systemctl restart caddy
```

**Success check:**
```sh
curl -sI https://s-vaultwarden-demo.preview.flareo.dev | grep -i x-flareo-analytics
```
Should return a header confirming the injection is live.

**Then mark day-0 in decisions.md:**

Edit `docs/decisions.md`, find the G-1 section, fill in the "Day-0 anchor" line with today's date in `YYYY-MM-DD UTC` format. Add a calendar reminder for 30 days from now: "F0 decision day — read conversion rate, follow G-1 pre-committed branch."

This is the most important step. Without it the gate doesn't exist.

---

## 7. Set worker shared secrets

The worker calls back to the main app for policy evaluation and submission status. Same shared secret on both sides:

```sh
# Generate a secret
openssl rand -hex 32 > worker-secret.txt

# On the main app (Vercel project settings):
FLAREO_WORKER_SECRET=<value from worker-secret.txt>

# On the worker host:
FLAREO_WORKER_SECRET=<same value>
MAIN_APP_URL=https://flareo.app   # or whatever your deployed URL is
```

Restart the main app (Vercel redeploys automatically). Restart the worker process.

**Success check:** `curl -X POST https://flareo.app/api/v1/worker/heartbeat -H "x-worker-secret: <value>"` returns 200.

---

## 8. Deploy the worker

On your worker host (the Docker-equipped VPS):

```sh
git clone <your-repo> /opt/flareo-worker
cd /opt/flareo-worker
npm install
npm run build
npm test   # 17/17 should pass

# systemd unit (sample):
cat > /etc/systemd/system/flareo-worker.service <<'EOF'
[Unit]
Description=Flareo build worker
After=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/flareo-worker
EnvironmentFile=/opt/flareo-worker/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now flareo-worker
```

Required env on the worker:
- `DATABASE_URL` (same as main app)
- `MAIN_APP_URL`, `FLAREO_WORKER_SECRET`
- AWS / R2 credentials for SBOM upload
- `COSIGN_KEY_REF` for signing (KMS or local key path)
- `SENTRY_DSN` for error capture

**Success check:**
```sh
journalctl -u flareo-worker -n 50
```
Should show heartbeat lines every 30 seconds, no errors.

---

## 9. Configure Stripe

```
- Create Stripe products: free tier (free, just for billing dashboard) + Pro tier (€12/mo)
- Note the price ID for Pro
- Add webhook endpoint: https://flareo.app/api/v1/billing/webhook
- Subscribe to events: customer.subscription.created, .updated, .deleted, invoice.paid
- Copy webhook signing secret → STRIPE_WEBHOOK_SECRET in env
- Copy Pro price ID → STRIPE_PRICE_ID_PRO in env
```

**Success check:** Visit `/pricing` while signed in, click "Upgrade." Stripe checkout opens. After test-mode payment, verify the user's plan flipped to `pro` in the DB.

---

## 10. Configure remaining external services

- **GitHub OAuth app** at https://github.com/settings/developers — set callback URL to `https://flareo.app/api/auth/callback/github`. Copy ClientID/Secret to env.
- **Resend** — verify your sending domain. Set `RESEND_API_KEY`.
- **ECR** — create the public repo `public.ecr.aws/flareo/<your-org>` and grant push role to the worker's IAM identity.
- **Sigstore** — no setup; the worker uses keyless OIDC via GitHub Actions identity tokens.
- **Sentry** — set `SENTRY_DSN` on both main app and worker. Verify by triggering a deliberate error and checking the Sentry dashboard.

---

## 11. Final smoke test on production

```sh
# From any machine
curl -s https://flareo.app/api/v1/health
# Expected: {"status":"ok",...}

curl -s https://flareo.app/api/v1/stats
# Expected: JSON with module counts, build counts, etc.
```

Visit:
- `/` — landing page renders
- `/marketplace` — module cards visible
- `/modules/vaultwarden` — detail page with receipts
- `/verify` — paste any image ref, submit, see Sigstore result
- `/docs/install` — curl-pipe install snippet
- Sign in via GitHub. Get to `/app`. Submit a test module. Watch worker log claim it.

**Success check:** all of the above complete without console errors.

---

## 12. Mark deployment date and stop

In decisions.md:
- G-1: write the day-0 anchor
- Add a top-of-file dated entry: "YYYY-MM-DD: production deploy. F0 clock running."

**Then stop adding code.** For 30 days. Read F0 numbers daily without acting. At day 30, run the G-1 gate.

The discipline is the whole product.
