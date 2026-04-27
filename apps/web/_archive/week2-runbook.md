# Week 2 runbook: real verify tool + v1 API

Goal by Sunday night: `/verify` really verifies against Sigstore, and the five v1 API endpoints the Rust CLI needs in Week 3 are live and documented.

## Before you start

Week 1 is done: all 12 canary modules are real, with real digests, signatures, and Rekor entries in the database. If any of those are still placeholders, finish Week 1 first.

## Monday: dependencies and schema

Pull the Week 2 patch and install new dependencies:

```bash
cd path/to/flareo
git pull
npm install
```

The new packages are:

- `@sigstore/verify` — offline signature verification
- `@sigstore/oci` — fetch signature manifests from OCI registries
- `@sigstore/bundle` — Sigstore bundle parser
- `zod` — request validation on every v1 endpoint
- `@upstash/redis` and `@upstash/ratelimit` — rate limiting in production

If you don't have Upstash set up yet, that's fine: the rate limiter falls back to in-memory for `npm run dev` and you can provision Upstash any day this week. Create an Upstash Redis database at https://console.upstash.com (free tier), copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into your `.env.local` and into Vercel env vars.

## Tuesday: test each endpoint by hand

Start the dev server:

```bash
npm run dev
```

Then in another terminal, curl each endpoint and confirm they respond sensibly:

**Health check.** Should be 200 with `status: "ok"` after `prisma migrate deploy` has connected the DB.

```bash
curl -s http://localhost:3000/api/v1/health | jq
```

Expected:

```json
{
  "status": "ok",
  "checks": { "database": { "ok": true, "latencyMs": 42 } },
  "uptime": 123.4,
  "timestamp": "2026-04-23T...",
  "respondedInMs": 45
}
```

**Stats.**

```bash
curl -s http://localhost:3000/api/v1/stats | jq
```

Expected: real counts pulled from your 12 canary modules.

**Modules list.**

```bash
curl -s 'http://localhost:3000/api/v1/modules?limit=5' | jq
curl -s 'http://localhost:3000/api/v1/modules?q=vault' | jq
curl -s 'http://localhost:3000/api/v1/modules?category=security&limit=3' | jq
```

**Module detail.**

```bash
curl -s http://localhost:3000/api/v1/modules/vaultwarden | jq
```

You should see `sbomUrl`, `rekorIndex`, `signerIdentity` populated from Week 1's work.

**Module by digest.**

```bash
# Replace the digest with an actual one from your DB:
DIGEST=$(curl -s http://localhost:3000/api/v1/modules/vaultwarden | jq -r .digest)
curl -s "http://localhost:3000/api/v1/modules/by-digest/$DIGEST" | jq
```

**Verify endpoint — unsigned image.**

```bash
curl -sX POST http://localhost:3000/api/v1/verify \
  -H 'content-type: application/json' \
  -d '{"imageRef":"nginx:1.27"}' | jq
```

Expected: `status: "unsigned"`, a resolved digest, no signer info.

**Verify endpoint — Sigstore-signed image outside our catalog.**

```bash
curl -sX POST http://localhost:3000/api/v1/verify \
  -H 'content-type: application/json' \
  -d '{"imageRef":"ghcr.io/sigstore/cosign:v2.4.1"}' | jq
```

Expected: `status: "signed"` with a resolved digest but no `flareoModule`.

**Verify endpoint — one of YOUR modules.**

```bash
curl -sX POST http://localhost:3000/api/v1/verify \
  -H 'content-type: application/json' \
  -d '{"imageRef":"public.ecr.aws/YOUR_ALIAS/flareo/vaultwarden:latest"}' | jq
```

Expected: `status: "verified"` with full `flareoModule` enrichment including trust score, CVE counts, sbomUrl, rekorUrl.

**Verify endpoint — bad input.**

```bash
curl -sX POST http://localhost:3000/api/v1/verify \
  -H 'content-type: application/json' \
  -d '{"imageRef":""}' | jq
```

Expected: 400 with `{ "error": { "code": "bad_request", ... } }`.

**Whoami — no auth.**

```bash
curl -s http://localhost:3000/api/v1/whoami | jq
```

Expected: 401.

**Whoami — with an API key.** First generate one via the admin UI at `/app/admin/api-keys` (you must be promoted to admin in the DB). Copy the `fla_<token>` string that's shown once. Then:

```bash
curl -s -H "Authorization: Bearer fla_<your-token>" http://localhost:3000/api/v1/whoami | jq
```

Expected: 200 with your user info and `authSource: "apikey"`.

## Wednesday: verify the UI works end-to-end

Open the site in your browser at http://localhost:3000/verify.

Try these inputs one by one and confirm each renders correctly:

1. `public.ecr.aws/<your-alias>/flareo/vaultwarden:latest` — should show the green PASS state with real signer identity, Rekor index, SBOM link, and CVE counts from your actual DB.

2. `ghcr.io/sigstore/cosign:v2.4.1` — should show PASS but with a note that it's signed but not in the Flareo catalog.

3. `nginx:1.27` — should show FAIL with "no Sigstore signature found" and an explanation.

4. `alpine:3.20` — same as nginx, unsigned.

5. `foobarbaz` — should error out cleanly (can't resolve manifest).

If any of these render the old mock terminal output (fixed text about "Vaultwarden" or "CVE-2023-4863 libwebp"), your browser is caching an old bundle. Hard-reload.

## Thursday: OpenAPI spec

The spec is at `public/openapi.json`. Visit http://localhost:3000/openapi.json — you should see the JSON. Visit https://editor.swagger.io and paste in the spec URL (after deploy) or the file contents to confirm it validates as valid OpenAPI 3.1.

If you want an in-app docs viewer, you can install `@scalar/nextjs-api-reference` later (not required for MVP).

## Friday: rate-limit sanity check

Hit the verify endpoint 70 times in a row and confirm the 61st gets a 429:

```bash
for i in $(seq 1 70); do
  curl -so /dev/null -w "%{http_code}\n" -X POST \
    http://localhost:3000/api/v1/verify \
    -H 'content-type: application/json' \
    -d '{"imageRef":"nginx:1.27"}'
done | sort | uniq -c
```

Expected (with in-memory limiter): `60 200` and `10 429`.

With Upstash configured, the same test should produce identical results, plus you'll see the key `flareo:ratelimit:verify-anon:ip:127.0.0.1` in the Upstash console.

## Saturday: deploy to Vercel (if you haven't)

If Vercel is not wired yet:

```bash
cd apps/web
# One-time:
npx vercel link
npx vercel env add DATABASE_URL
npx vercel env add DIRECT_URL
npx vercel env add AUTH_SECRET
npx vercel env add AUTH_GITHUB_ID
npx vercel env add AUTH_GITHUB_SECRET
npx vercel env add UPSTASH_REDIS_REST_URL
npx vercel env add UPSTASH_REDIS_REST_TOKEN
npx vercel env add FLAREO_ADMIN_API_TOKEN

# Deploy:
npx vercel --prod
```

After deploy, re-run the curl tests against your production URL to confirm everything still works.

## Sunday: close out

- The `/verify` page is real.
- Five v1 API endpoints are live: `/verify`, `/modules`, `/modules/:slug`, `/modules/by-digest/:digest`, `/whoami`, plus `/health` and `/stats` bonus endpoints.
- OpenAPI spec published.
- Rate limiting active.
- All 12 canary modules appear in `/api/v1/modules` with real digests and Rekor links.

## What DIDN'T happen this week (on purpose)

- Full offline Sigstore bundle verification with `@sigstore/verify`. The week-2 implementation confirms a signature MANIFEST exists on the registry; it doesn't cryptographically validate the bundle end-to-end. That's Week 4 when we build the same check into the Rust CLI (where offline verification is the point). The web page already does what a casual user needs: "does this image have a signature, and is it one of ours?"
- No Rust CLI yet. Weeks 3 and 4.
- No admission policy / Kubernetes stuff. Horizon 2.

## What to do if something breaks

Most likely failures:

**`status: "error"` on the verify endpoint for a Flareo image.** Usually a network issue between Vercel and ECR Public. Retry. If persistent, check Vercel function logs — the registry might be throttling unauthenticated manifest requests.

**Upstash "invalid token" on every request.** Double-check the two env vars are on Vercel production, and that they're from the same database (not different projects).

**TypeScript errors about Prisma types.** Run `npx prisma generate`. The generator doesn't run automatically after `npm install`.

**Module detail page shows placeholders instead of real digests.** Your Week 1 data isn't in the prod DB yet. Run the canary pipeline pointed at the prod `DATABASE_URL` once.

Week 3 is the Rust CLI. Reply "Week 2 done" when everything above passes.
