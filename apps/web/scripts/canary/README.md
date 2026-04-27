# Canary rebuild pipeline

This is the **Week 1** deliverable. It rebuilds the 12 curated self-hosted modules from their upstream images, re-publishes them under the Flareo ECR Public namespace, and attaches real SBOMs, CVE scans, and cosign signatures. Every module in the Flareo catalog has its metadata populated by this pipeline.

The pipeline is a shell script plus a TypeScript follow-up, wired into a GitHub Actions workflow that runs weekly on Sundays. Same code path locally and in CI.

## What it does for each module

1. Pulls the pinned upstream image (e.g. `docker.io/vaultwarden/server:1.32.7`).
2. Re-tags to `public.ecr.aws/<your-alias>/flareo/<slug>:<version>`.
3. Pushes to ECR Public.
4. Generates a CycloneDX SBOM via Syft.
5. Runs Trivy in JSON mode against the pushed image.
6. Uploads the SBOM and Trivy report to Cloudflare R2.
7. Signs the image with cosign keyless (via GHA OIDC identity in CI, or your personal GitHub identity locally).
8. Captures the Rekor log index from the signing operation.
9. Upserts the `Module` row in Postgres with real digest, trust scores, and artifact URLs.

Result: a module row in your database where every claim is verifiable. A stranger running `cosign verify public.ecr.aws/...@sha256:...` gets a passing signature back from Rekor with no Flareo credentials.

## Running locally (recommended first)

You need these tools installed on your machine:

```
docker     any recent version
aws        aws-cli v2 (for ECR auth + R2 uploads)
cosign     v3.0+
syft       v1.42+
trivy      v0.70+
jq         any recent version
node       v22+
```

Put all the secrets from your Week 0 `flareo-secrets.txt` file in a local `.env.local` at the project root. Then:

```bash
# Load the env vars
set -a; source .env.local; set +a

# Install deps (once)
npm install
npx prisma generate

# Run the pipeline for one module
./scripts/canary/rebuild-canary.sh vaultwarden
```

The first cosign sign will open a browser for GitHub OAuth. Subsequent runs in the same session reuse the cert.

When it finishes, verify from anywhere with:

```bash
cosign verify public.ecr.aws/<alias>/flareo/vaultwarden@sha256:<digest> \
  --certificate-identity-regexp='.*' \
  --certificate-oidc-issuer-regexp='.*'
```

That command has no Flareo code in it. If it passes, the pipeline worked end to end.

## Running in CI

Configure these as GitHub repo secrets (Settings → Secrets and variables → Actions):

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
ECR_PUBLIC_URL              e.g. public.ecr.aws/XXXXXX/flareo
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME              e.g. flareo-artifacts
DATABASE_URL                Neon pooled connection string
```

Then go to Actions → canary-rebuild → Run workflow. Select the branch and optionally a single module slug in the `only` field. The workflow runs one job per module in parallel. The default schedule fires every Sunday at 02:00 UTC.

## Files in this directory

```
scripts/canary/
├── canary-modules/           one .sh config per module
│   ├── vaultwarden.sh
│   ├── immich.sh
│   └── ... (10 more)
├── rebuild-canary.sh         the main pipeline
├── update-module-metadata.ts upserts the Module row in Postgres
└── README.md                 this file
```

Workflow lives at `.github/workflows/canary-rebuild.yml`.

## Adding a new module

1. Create `canary-modules/<slug>.sh` with the same variable set as existing modules. Pick a pinned upstream reference; never use `:latest`.
2. Add the slug to the matrix in `.github/workflows/canary-rebuild.yml`.
3. Run the pipeline once locally with `./scripts/canary/rebuild-canary.sh <slug>` to confirm it works end to end.
4. Commit and push. The next Sunday run will include it.

## Why we re-tag upstream instead of rebuilding from source

During Horizon 1 (demo-grade launch), we re-tag and re-sign upstream images rather than building hermetically from the upstream's source. This gives us real cosign signatures, real SBOMs, and real CVE scans attached to images that are identical to what upstream publishes. The signature identifies Flareo as the publisher; the digest matches the upstream digest.

In Horizon 2 we replace this with real source-to-binary rebuilds on our own BuildKit workers, with SLSA L3 provenance via `slsa-github-generator`. The user-facing API stays the same; only the `slsa` column on the Module row changes from `L2` to `L3`.

## Trust score formula

The `trust` field on the Module row is the integer mean of four sub-scores, each in `[0, 100]`. Every score is a deterministic function of the pipeline's real output for that module. No fudge factors.

- `trustVulns` — derived from Trivy counts. Every critical deducts 20 points; every high, 8; every medium, 2. Clamped at zero.
- `trustSbom` — 100 if the CycloneDX SBOM has at least 5 components, scaling down below that.
- `trustSignature` — 100 if Rekor log index and signer identity are both present. Otherwise 0.
- `trustSlsa` — L1 is 40, L2 is 70, L3 is 100. Horizon 1 ships L2.

The formula is in `update-module-metadata.ts` and can be tuned there.

## What happens on failure

The shell script uses `set -euo pipefail`, so any step failing aborts the run for that module immediately. In CI, the matrix has `fail-fast: false`, so one failing module doesn't block the other eleven. You get a red check on GitHub and the full log; the database row for the failed module stays stale from its previous successful run. No partial state gets committed.

If Trivy is down or Sigstore is down (rare but possible), the module fails to update but the previous run's data stays valid on the site.
