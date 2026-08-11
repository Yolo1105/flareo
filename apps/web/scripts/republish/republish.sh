#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# republish.sh
#
# Re-publishes a pinned upstream image with Flareo receipts. Given a
# module slug, this script:
#
#   1. Loads the module config from modules/<slug>.sh
#   2. Pulls the pinned upstream image (does NOT build it)
#   3. Records the upstream digest for byte-equivalence checks
#   4. Re-tags to our ECR Public namespace (bits unchanged)
#   5. Pushes to ECR Public
#   6. Generates a CycloneDX SBOM via Syft
#   7. Runs Trivy CVE scan, saves the JSON report
#   8. Uploads both artifacts to Cloudflare R2
#   9. Signs the image with cosign keyless (OIDC identity)
#  10. Captures the Rekor log index
#  11. Writes metadata to Postgres via update-module-metadata.ts
#
# The image bits are identical to upstream. We re-publish with
# receipts so a stranger can verify signature + upstream digest
# without trusting Flareo.
#
# Usage:
#   ./republish.sh vaultwarden
#
# Required environment variables:
#   AWS_ACCESS_KEY_ID          for ECR push
#   AWS_SECRET_ACCESS_KEY      for ECR push
#   AWS_REGION                 should be "us-east-1" (ECR Public only)
#   ECR_PUBLIC_URL             e.g. "public.ecr.aws/XXXXXX/flareo"
#   R2_ACCOUNT_ID              Cloudflare account ID
#   R2_ACCESS_KEY_ID           R2 access key
#   R2_SECRET_ACCESS_KEY       R2 secret
#   R2_BUCKET_NAME             e.g. "flareo-artifacts"
#   DATABASE_URL               Postgres URL (Neon pooled connection)
#
# Required tools (installed separately):
#   docker, aws, cosign, syft, trivy, jq, node (22+), npx
#
# Callable locally and from GitHub Actions (workflow_dispatch).
# Exits non-zero on any failure so CI fails loudly.
# ────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Parse args ────────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <module-slug>" >&2
  echo "example: $0 vaultwarden" >&2
  exit 2
fi

INPUT_SLUG="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_CONFIG="${SCRIPT_DIR}/modules/${INPUT_SLUG}.sh"

if [[ ! -f "${MODULE_CONFIG}" ]]; then
  echo "error: module config not found: ${MODULE_CONFIG}" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "${MODULE_CONFIG}"

# Guard: every config must set these.
: "${SLUG:?module config missing SLUG}"
: "${NAME:?module config missing NAME}"
: "${VERSION:?module config missing VERSION}"
: "${UPSTREAM_REF:?module config missing UPSTREAM_REF}"
: "${AUTHOR:?module config missing AUTHOR}"
: "${CATEGORY:?module config missing CATEGORY}"
: "${DESCRIPTION:?module config missing DESCRIPTION}"

# Guard: env.
: "${ECR_PUBLIC_URL:?missing ECR_PUBLIC_URL}"
: "${AWS_REGION:?missing AWS_REGION}"
: "${R2_ACCOUNT_ID:?missing R2_ACCOUNT_ID}"
: "${R2_ACCESS_KEY_ID:?missing R2_ACCESS_KEY_ID}"
: "${R2_SECRET_ACCESS_KEY:?missing R2_SECRET_ACCESS_KEY}"
: "${R2_BUCKET_NAME:?missing R2_BUCKET_NAME}"
: "${DATABASE_URL:?missing DATABASE_URL}"

# ─── Derived paths ─────────────────────────────────────────────────

FLAREO_REPO="${ECR_PUBLIC_URL}/${SLUG}"
FLAREO_TAGGED="${FLAREO_REPO}:${VERSION}"
WORKDIR="$(mktemp -d -t flareo-republish-XXXX)"
ARTIFACTS_DIR="${WORKDIR}/artifacts"
mkdir -p "${ARTIFACTS_DIR}"
trap 'rm -rf "${WORKDIR}"' EXIT

SBOM_FILE="${ARTIFACTS_DIR}/sbom.cdx.json"
TRIVY_FILE="${ARTIFACTS_DIR}/trivy.json"

# ─── Helpers ───────────────────────────────────────────────────────

log() {
  # Prefix log lines so they're easy to grep in GHA output.
  echo "[$(date -u +%H:%M:%SZ)] [${SLUG}] $*"
}

fail() {
  echo "[${SLUG}] FAIL: $*" >&2
  exit 1
}

# ─── 1. Pull upstream ──────────────────────────────────────────────

log "1/9 pulling upstream: ${UPSTREAM_REF}"
docker pull --quiet "${UPSTREAM_REF}" >/dev/null \
  || fail "docker pull failed for ${UPSTREAM_REF}"

# Resolve upstream digest so we can record what we actually rebuilt.
UPSTREAM_DIGEST="$(docker inspect --format '{{index .RepoDigests 0}}' "${UPSTREAM_REF}" | awk -F@ '{print $2}')"
log "    upstream digest: ${UPSTREAM_DIGEST}"

# ─── 2. ECR login ──────────────────────────────────────────────────

log "2/9 logging in to ECR Public"
aws ecr-public get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin public.ecr.aws \
    >/dev/null 2>&1 \
  || fail "ECR login failed"

# ─── 3. Re-tag + push ──────────────────────────────────────────────

log "3/9 tagging as ${FLAREO_TAGGED} and pushing"
docker tag "${UPSTREAM_REF}" "${FLAREO_TAGGED}"
docker push --quiet "${FLAREO_TAGGED}" >/dev/null \
  || fail "docker push failed"

# Resolve the digest on our ECR repo. Pushing does not necessarily
# produce a RepoDigests entry until we inspect again, so pull back.
docker pull --quiet "${FLAREO_TAGGED}" >/dev/null
FLAREO_DIGEST="$(docker inspect --format '{{index .RepoDigests 0}}' "${FLAREO_TAGGED}" | awk -F@ '{print $2}')"
FLAREO_PINNED="${FLAREO_REPO}@${FLAREO_DIGEST}"
log "    flareo digest: ${FLAREO_DIGEST}"

# Image size, reported in bytes, converted to MB for the catalog card.
IMAGE_BYTES="$(docker inspect --format '{{.Size}}' "${FLAREO_TAGGED}")"
IMAGE_SIZE_MB=$(( (IMAGE_BYTES + 524288) / 1048576 ))

# ─── 4. SBOM via Syft ──────────────────────────────────────────────

log "4/9 generating SBOM (CycloneDX)"
syft "${FLAREO_PINNED}" \
  --quiet \
  --source-name "${SLUG}" \
  --source-version "${VERSION}" \
  -o cyclonedx-json="${SBOM_FILE}" \
  || fail "syft failed"

SBOM_PACKAGE_COUNT="$(jq '.components | length' < "${SBOM_FILE}")"
log "    SBOM components: ${SBOM_PACKAGE_COUNT}"

# ─── 5. Trivy scan ─────────────────────────────────────────────────

log "5/9 running Trivy scan"
trivy image \
  --format json \
  --quiet \
  --severity CRITICAL,HIGH,MEDIUM,LOW \
  --ignore-unfixed=false \
  --timeout 10m \
  --output "${TRIVY_FILE}" \
  "${FLAREO_PINNED}" \
  || fail "trivy scan failed"

# Extract counts via jq. Trivy's output structure nests Vulnerabilities inside Results.
CVE_CRITICAL="$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' < "${TRIVY_FILE}")"
CVE_HIGH="$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="HIGH")] | length' < "${TRIVY_FILE}")"
CVE_MEDIUM="$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="MEDIUM")] | length' < "${TRIVY_FILE}")"
CVE_LOW="$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="LOW")] | length' < "${TRIVY_FILE}")"
log "    CVEs: ${CVE_CRITICAL}C ${CVE_HIGH}H ${CVE_MEDIUM}M ${CVE_LOW}L"

# ─── 6. Upload artifacts to R2 ─────────────────────────────────────

log "6/9 uploading artifacts to R2"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PREFIX="modules/${SLUG}/${FLAREO_DIGEST}"
# We override AWS credentials locally for these calls so the script's
# default ECR creds are untouched.
AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
aws s3 cp "${SBOM_FILE}" \
  "s3://${R2_BUCKET_NAME}/${R2_PREFIX}/sbom.cdx.json" \
  --endpoint-url "${R2_ENDPOINT}" \
  --quiet \
  || fail "R2 upload: SBOM"

AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
aws s3 cp "${TRIVY_FILE}" \
  "s3://${R2_BUCKET_NAME}/${R2_PREFIX}/trivy.json" \
  --endpoint-url "${R2_ENDPOINT}" \
  --quiet \
  || fail "R2 upload: trivy"

SBOM_URL="${R2_ENDPOINT}/${R2_BUCKET_NAME}/${R2_PREFIX}/sbom.cdx.json"
TRIVY_URL="${R2_ENDPOINT}/${R2_BUCKET_NAME}/${R2_PREFIX}/trivy.json"

# ─── 7. Cosign sign (keyless via OIDC) ─────────────────────────────

log "7/9 signing image with cosign keyless"
# COSIGN_YES suppresses the interactive prompt. In GitHub Actions this
# uses the runner's OIDC token (id-token: write perm); locally it opens
# your browser for GitHub OAuth the first time.
COSIGN_YES=true cosign sign --recursive "${FLAREO_PINNED}" 2>&1 \
  | tee "${ARTIFACTS_DIR}/cosign-sign.log" \
  || fail "cosign sign failed"

# ─── 8. Capture Rekor log index ───────────────────────────────────

log "8/9 verifying signature + capturing Rekor index"
# We re-verify to get the full bundle info. In local dev this uses your
# personal identity; in GHA it uses the workflow identity.
COSIGN_OUT="$(cosign verify \
  --certificate-identity-regexp='.*' \
  --certificate-oidc-issuer-regexp='.*' \
  "${FLAREO_PINNED}" \
  --output json 2>/dev/null || true)"

if [[ -z "${COSIGN_OUT}" ]]; then
  fail "cosign verify returned empty output"
fi

REKOR_INDEX="$(echo "${COSIGN_OUT}" | jq -r '.[0].optional.Bundle.Payload.logIndex // empty')"
SIGNER_IDENTITY="$(echo "${COSIGN_OUT}" | jq -r '.[0].optional.Subject // empty')"
SIGNER_ISSUER="$(echo "${COSIGN_OUT}" | jq -r '.[0].optional.Issuer // empty')"

[[ -n "${REKOR_INDEX}" ]] || fail "could not extract Rekor log index"
log "    rekor index: ${REKOR_INDEX}"
log "    signer: ${SIGNER_IDENTITY}"

# ─── 9. Write metadata to Postgres ────────────────────────────────

log "9/9 writing metadata to Postgres"

# Export every value the TS script will read. Uppercase env names so
# they don't collide with local lower-case vars.
export FLAREO_SLUG="${SLUG}"
export FLAREO_NAME="${NAME}"
export FLAREO_VERSION="${VERSION}"
export FLAREO_AUTHOR="${AUTHOR}"
export FLAREO_CATEGORY="${CATEGORY}"
export FLAREO_DESCRIPTION="${DESCRIPTION}"
export FLAREO_TAGS="${TAGS:-}"
export FLAREO_IMAGE_REF="${FLAREO_REPO}"
export FLAREO_DIGEST="${FLAREO_DIGEST}"
export FLAREO_UPSTREAM_REF="${UPSTREAM_REF}"
export FLAREO_UPSTREAM_DIGEST="${UPSTREAM_DIGEST}"
export FLAREO_SIZE_MB="${IMAGE_SIZE_MB}"
export FLAREO_SBOM_URL="${SBOM_URL}"
export FLAREO_SBOM_PACKAGES="${SBOM_PACKAGE_COUNT}"
export FLAREO_TRIVY_URL="${TRIVY_URL}"
export FLAREO_CVE_CRITICAL="${CVE_CRITICAL}"
export FLAREO_CVE_HIGH="${CVE_HIGH}"
export FLAREO_CVE_MEDIUM="${CVE_MEDIUM}"
export FLAREO_CVE_LOW="${CVE_LOW}"
export FLAREO_REKOR_INDEX="${REKOR_INDEX}"
export FLAREO_SIGNER_IDENTITY="${SIGNER_IDENTITY}"
export FLAREO_SIGNER_ISSUER="${SIGNER_ISSUER}"

# Resolve the project root: scripts/republish -> ../..
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${PROJECT_ROOT}"
npx tsx scripts/republish/update-module-metadata.ts \
  || fail "update-module-metadata.ts failed"

log "done: ${FLAREO_PINNED}"
log "verify anywhere:"
log "  cosign verify ${FLAREO_PINNED} \\"
log "    --certificate-identity-regexp='.*' \\"
log "    --certificate-oidc-issuer-regexp='.*'"
