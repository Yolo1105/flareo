# Week 1 — notes and Monday plan

Everything in this note is new vs the Week 0 baseline zip. Nothing else in the project was touched.

## What was added

**Pipeline:**

- `scripts/canary/rebuild-canary.sh` — the end-to-end rebuild for one module (pull → re-tag → push to ECR → SBOM → scan → R2 upload → cosign sign → Postgres write). Run with `./scripts/canary/rebuild-canary.sh vaultwarden`.
- `scripts/canary/update-module-metadata.ts` — TypeScript follow-up that upserts the Module row in Postgres. Called automatically by the shell script. Computes real trust scores from the scan output.
- `scripts/canary/canary-modules/*.sh` — 12 module configs, one per canary. Each declares the upstream image to rebuild, pinned to a specific version tag.
- `scripts/canary/README.md` — the full reference. Read this first.

**Workflow:**

- `.github/workflows/canary-rebuild.yml` — historically scheduled; now superseded by manual-dispatch republish. One matrix job per module runs in parallel. All actions pinned by full commit SHA. Harden-runner blocks egress by default, allowlist of only the hosts the pipeline needs.

**Schema:**

- `prisma/schema.prisma` — Module table now has ten new nullable columns: `imageRef`, `upstreamRef`, `upstreamDigest`, `sbomUrl`, `sbomPackages`, `trivyUrl`, `rekorIndex`, `signerIdentity`, `signerIssuer`, `lastRebuiltAt`.
- `prisma/migrations/20260424000000_add_canary_artifacts/migration.sql` — the SQL to apply those columns. You will regenerate this against your real Neon database in step 3 below.

**Docs:**

- `.env.example` — extended with all the canary pipeline env vars.
- This file.

## Monday checklist, in order

1. **Install deps locally.**
   ```bash
   cd ~/path/to/flareo
   npm install
   ```

2. **Copy `.env.example` → `.env.local`.** Fill every value from your Week 0 `flareo-secrets.txt`. Especially `DATABASE_URL`, `DIRECT_URL`, `ECR_PUBLIC_URL`, the four R2 vars, and the two AWS vars.

3. **Apply the schema change to your Neon database.**
   ```bash
   npx prisma migrate dev --name add_canary_artifacts
   ```
   Prisma will detect the new columns and generate the real migration. The file I scaffolded in `prisma/migrations/` is mostly for reference; delete it after Prisma generates the real one.

4. **Install the binary tools on your local machine.**
   - macOS: `brew install cosign syft trivy jq awscli` and Docker Desktop.
   - Linux: follow the release pages. Use the pinned versions from the workflow file.

5. **Run the pipeline for Vaultwarden first.**
   ```bash
   set -a; source .env.local; set +a
   ./scripts/canary/rebuild-canary.sh vaultwarden
   ```
   First cosign sign will open a browser to GitHub OAuth. Approve it.

6. **Verify from outside Flareo.** Take the digest the script printed and run:
   ```bash
   cosign verify public.ecr.aws/YOUR_ALIAS/flareo/vaultwarden@sha256:<digest> \
     --certificate-identity-regexp='.*' \
     --certificate-oidc-issuer-regexp='.*'
   ```
   If that passes, the Week 1 wedge is real. You now have one module that a stranger can cryptographically verify.

7. **Run the pipeline for the other 11 modules.** One by one or all at once:
   ```bash
   for m in immich jellyfin homeassistant nextcloud paperlessngx adguardhome gitea linkwarden ntfy uptimekuma caddy; do
     ./scripts/canary/rebuild-canary.sh "$m" || break
   done
   ```

8. **Push to GitHub and configure Actions secrets.**
   Create the repo `apps/web/flareo` (public) if you haven't. Push the project.
   Add every Week 0 secret as a repo secret under Settings → Secrets and variables → Actions. Names must match exactly what the workflow file references.

9. **Trigger the workflow manually once to confirm CI works.**
   GitHub → Actions → `canary-rebuild` → Run workflow → leave `only` empty → Run. Watch 12 jobs succeed.

After that, the weekly cron runs itself and Week 1 is complete.

## Target for Monday night

By end of day Monday, you should have:

- One real signed Vaultwarden image on ECR Public.
- A real Rekor entry with your identity on it.
- One Module row in Postgres with real digest and real trust score.
- A green `cosign verify` from a clean terminal.

That is the moment Flareo stops being a plan and starts being a product.

## Week 2 preview

Next week we wire the real `/verify` tool (replace mock state-mapping with live Sigstore verification) and ship the versioned API surface the CLI will talk to. All the scaffolding for that is in this project already; we just replace the mock data path.
