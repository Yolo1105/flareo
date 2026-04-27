# flareo-worker

Build worker that processes approved submissions end-to-end: fetches the user-supplied Dockerfile, builds it in a sandbox, scans for CVEs, generates an SBOM, pushes to ECR Public, and signs with cosign.

Target host: Hetzner AX41-NVMe running Debian 12.

## What this does

1. Polls Postgres every 30 seconds for `Submission` rows with `status="approved"`
2. Atomically claims one via `SELECT ... FOR UPDATE SKIP LOCKED` and flips it to `status="building"`
3. Downloads the user's Dockerfile from R2
4. Runs `docker build` with strict sandbox flags (4 GB RAM, 2 CPUs, 20 GB layer ceiling, 10 min timeout, `--network=none` by default, `--pids-limit 1024`)
5. Post-build: `trivy image --severity CRITICAL,HIGH` — rejects on finding
6. Generates a CycloneDX SBOM via `trivy image --format cyclonedx`
7. Pushes the image to `public.ecr.aws/flareo/<slug>:<version>`
8. Signs with `cosign` (keyless, GitHub OIDC identity)
9. Writes everything back: `Submission` marked `built`, new `Module` row created with the submitter as `publisherId`

On failure: classifies as `user`, `system`, or `scan`, writes the reason to `buildErrorMessage`, uploads the log to R2, emails the submitter via the main app's email sender.

## Prerequisites on the host

- Docker Engine 25+ with userns-remap configured:

  ```json
  // /etc/docker/daemon.json
  {
    "userns-remap": "flareo-build"
  }
  ```

  Plus `/etc/subuid` and `/etc/subgid` entries for `flareo-build`. See [Docker docs on user namespace remap](https://docs.docker.com/engine/security/userns-remap/).

- `trivy` CLI. Pin version via: `apt-get install -y trivy=0.56.2`.

- `cosign` CLI. Pin via: download a tagged release from https://github.com/sigstore/cosign/releases and install to `/usr/local/bin/cosign`.

- `aws` CLI, already authenticated for ECR Public push. The simplest setup is a long-lived IAM user with `AmazonEC2ContainerRegistryPublicPowerUser` attached.

- Node.js 20+.

## Install

```sh
# On the build host, as root:
useradd -r -m -d /opt/flareo-worker -s /bin/bash flareo-worker
usermod -aG docker flareo-worker
mkdir -p /var/lib/flareo-worker/builds /var/log/flareo-worker /etc/flareo-worker
chown -R flareo-worker:flareo-worker /var/lib/flareo-worker /var/log/flareo-worker

# Copy the worker source and install:
cd /opt/flareo-worker
# (copy files from this directory)
sudo -u flareo-worker npm install --omit=dev
sudo -u flareo-worker npm run build

# Environment file — only root readable:
cat > /etc/flareo-worker/env <<'EOF'
DATABASE_URL=postgres://...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_SUBMISSIONS=flareo-submissions
R2_BUCKET_ARTIFACTS=flareo-artifacts
ECR_REGION=us-east-1
ECR_REPOSITORY_PREFIX=public.ecr.aws/flareo/
SENTRY_DSN=https://...
LOG_LEVEL=info
EOF
chmod 600 /etc/flareo-worker/env
chown root:root /etc/flareo-worker/env

# Systemd unit:
cp systemd/flareo-worker.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable flareo-worker
systemctl start flareo-worker

# Tail logs:
journalctl -u flareo-worker -f
```

## Environment variables

| Variable                  | Required | Default                          | Purpose                               |
|---------------------------|----------|----------------------------------|---------------------------------------|
| `DATABASE_URL`            | yes      | —                                | Same Postgres the main app uses       |
| `R2_ACCOUNT_ID`           | yes      | —                                | Cloudflare R2 account                 |
| `R2_ACCESS_KEY_ID`        | yes      | —                                | R2 credential                         |
| `R2_SECRET_ACCESS_KEY`    | yes      | —                                | R2 credential                         |
| `R2_BUCKET_SUBMISSIONS`   | no       | `flareo-submissions`             | Where Dockerfile uploads live         |
| `R2_BUCKET_ARTIFACTS`     | no       | `flareo-artifacts`               | Where logs and SBOMs get written      |
| `ECR_REGION`              | no       | `us-east-1`                      | Region for ECR Public auth            |
| `ECR_REPOSITORY_PREFIX`   | no       | `public.ecr.aws/flareo/`         | Registry path                         |
| `POLL_INTERVAL_MS`        | no       | `30000`                          | How often to poll for new work        |
| `BUILD_TIMEOUT_MS`        | no       | `600000`                         | Max build duration (10 min)           |
| `BUILD_ROOT`              | no       | `/var/lib/flareo-worker/builds`  | Build staging                         |
| `DOCS_URL`                | no       | flareo.dev docs URL              | Included in failure messages          |
| `SENTRY_DSN`              | no       | —                                | Reports worker crashes                |
| `WORKER_ID`               | no       | `worker-<pid>`                   | Identifies self in audit logs         |
| `LOG_LEVEL`               | no       | `info`                           | `debug` or `info`                     |

## How to test locally

The worker needs a real Postgres, real R2, and real Docker. For development, point `DATABASE_URL` at a local Postgres (same schema as main app), skip R2 by mocking with a local MinIO, and skip cosign by commenting out `signImage` calls in `src/index.ts`.

Quickest smoke test without real dependencies:

1. Create a `Submission` row with `status="approved"` directly in Postgres
2. Ensure its `flagsJson` contains a trivial `dockerfile` field
3. Run `npm run dev`
4. Watch `journalctl` output

Expected: `build failed` if Docker isn't configured, `build success` if it is.

## Monitoring

The worker writes a heartbeat to `/var/lib/flareo-worker/heartbeat.json` on every poll cycle. The main Next.js app exposes this at `/api/v1/worker/heartbeat`. Instatus polls that URL every minute. Three consecutive failures → incident.

Key metrics to graph (pull from the JSON logs via your log aggregator):

- **Queue depth**: count of `status="approved"` rows. Should stay under 5.
- **Build duration p50 / p95**: from `msg=submission built` log lines.
- **Failure rate**: count of `kind=user` / `kind=system` / `kind=scan` per day.
- **Disk usage**: monitor `/var/lib/docker`, `/var/lib/flareo-worker/builds`. Alert at 80%.

## Failure handling reference

| Step                  | Failure classification | Retryable by admin? |
|-----------------------|------------------------|---------------------|
| Fetch Dockerfile      | `system`               | Yes                 |
| `docker build` OOM    | `user`                 | No — user fixes     |
| `docker build` timeout| `user`                 | No — user fixes     |
| `docker build` other  | `user` (default)       | No — user fixes     |
| Trivy crash           | `system`               | Yes                 |
| Trivy finds CVE       | `scan`                 | No — user fixes     |
| SBOM crash            | `system`               | Yes                 |
| ECR push              | `system`               | Yes                 |
| Cosign sign           | `system`               | Yes                 |
| DB update             | (logged, retries once) | Yes                 |

System failures show a "Retry build" button in the admin detail view. User / scan failures require the submitter to fix their Dockerfile and resubmit.

## What this worker does NOT do

- **Auto-containerize from raw source.** Users must supply a Dockerfile. Auto-detection is a different product (Railway/Fly.io territory).
- **Run the built image.** We build, scan, sign, push. We never `docker run` user code.
- **Support private git upstreams.** If a Dockerfile references a private repo via `COPY --from=`, the build fails.
- **Multi-arch.** `linux/amd64` only. `linux/arm64` is a future-quarter feature if enough users ask.
- **Multi-worker clustering.** One worker on day one. The DB lock primitive (`SELECT FOR UPDATE SKIP LOCKED`) makes adding a second worker trivial when we need it, but we won't until queue depth regularly exceeds 5 for more than an hour.

## Security

Read `docs/red-team-playbook.md` in the main repo before enabling public submissions. The 14 documented attacks test every meaningful threat. Rerun after any change to `build.ts`.

If you find a sandbox escape, file a private security report to `security@flareo.dev` — do not open a public GitHub issue.
