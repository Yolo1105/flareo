# Republish pipeline

Flareo's primary catalog pipeline. It **does not build images**. For each
curated module it pulls a **pinned upstream image**, re-tags it under the
Flareo ECR Public namespace (bits unchanged), and attaches receipts: a
CycloneDX SBOM (Syft), a full-severity Trivy scan, a cosign keyless
signature, and a Rekor log index. The upstream digest is recorded so
byte-equivalence with upstream is checkable.

That is the claim nothing else in this space makes cleanly:

> `public.ecr.aws/<alias>/flareo/vaultwarden@sha256:X` is byte-identical
> to the pinned upstream digest. We did not rebuild it. We re-published
> it with receipts.

## What it does for each module

1. Loads `modules/<slug>.sh` (pinned upstream ref, metadata).
2. `docker pull` the pinned upstream image; record the upstream digest.
3. Re-tag and push to `public.ecr.aws/<alias>/flareo/<slug>:<version>`.
4. Generate a CycloneDX SBOM via Syft.
5. Run Trivy in JSON mode against the pushed image.
6. Upload SBOM + Trivy report to Cloudflare R2.
7. Sign with cosign keyless (GHA OIDC in CI, or local GitHub identity).
8. Capture the Rekor log index and signer identity/issuer.
9. Upsert the `Module` row via `update-module-metadata.ts`.

## Running locally

```
docker     any recent version
aws        aws-cli v2 (for ECR auth + R2 uploads)
cosign     v3.0+
syft       v1.42+
trivy      v0.70+
jq         any recent version
node       v22+
```

From `apps/web` with secrets loaded:

```bash
set -a; source .env.local; set +a
npm install
npx prisma generate
./scripts/republish/republish.sh vaultwarden
```

Verify from anywhere with:

```bash
cosign verify public.ecr.aws/<alias>/flareo/vaultwarden@sha256:<digest> \
  --certificate-identity-regexp='.*' \
  --certificate-oidc-issuer-regexp='.*'
```

## Running in CI

Configure these as GitHub repo secrets, then **Actions → republish →
Run workflow**. Optional `only` input scopes to a single module slug.
There is no schedule trigger: a silent failing cron is worse than
manual dispatch; the site surfaces `lastRebuiltAt` instead of asserting
a cadence.

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
ECR_PUBLIC_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
DATABASE_URL
```

## Files

```
scripts/republish/
├── modules/                  one .sh config per module
├── republish.sh              the main pipeline
├── update-module-metadata.ts upserts the Module row in Postgres
└── README.md                 this file
```

Workflow: `.github/workflows/republish.yml`.

## Adding a module

1. Create `modules/<slug>.sh` with a pinned upstream reference (never `:latest`).
2. Add the slug to the matrix in `.github/workflows/republish.yml`.
3. Run `./scripts/republish/republish.sh <slug>` locally once.
4. Commit and dispatch the workflow.

## Trust score

The `trust` field is the integer mean of four equal-weight sub-scores
derived from pipeline output (`trustVulns`, `trustSbom`, `trustSignature`,
and provenance stored in `trustSlsa`). Formula lives in
`update-module-metadata.ts`.

## Failure behavior

`set -euo pipefail` aborts a module run on any failed step. In CI,
`fail-fast: false` so one failure does not block the other modules. The
database row stays at its last successful run; no partial upsert.
