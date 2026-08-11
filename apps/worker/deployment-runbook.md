# Build worker deployment runbook

> **HISTORICAL.** Build-host provisioning below (Docker Engine, userns-remap,
> ECR docker login, smoke `docker build`) applied to the retired Dockerfile
> build path. See ADR-012. Kept as an operations record; do not follow these
> steps for new hosts unless deliberately reviving that path.

Sequence to take the worker from scratch code to a running service on a fresh Hetzner box. Follow in order; skipping steps is how you end up with a half-configured worker that silently fails builds.

## Day 1 — host setup (~2 hours)

> **Historical (ADR-012).** Docker Engine install and related tooling below
> were for the sandboxed `docker build` path, which no longer runs.

```sh
apt update && apt upgrade -y
apt install -y \
  build-essential curl git jq \
  ca-certificates gnupg lsb-release \
  ufw fail2ban unattended-upgrades

# Docker Engine (not Docker Desktop)
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Trivy
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | \
  gpg --dearmor | tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] \
  https://aquasecurity.github.io/trivy-repo/deb generic main" \
  > /etc/apt/sources.list.d/trivy.list
apt update && apt install -y trivy

# Cosign — pin version
COSIGN_VERSION=v2.4.1
curl -fsSL -o /usr/local/bin/cosign \
  https://github.com/sigstore/cosign/releases/download/${COSIGN_VERSION}/cosign-linux-amd64
chmod +x /usr/local/bin/cosign

# AWS CLI (for ECR auth)
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o aws.zip
apt install -y unzip && unzip -q aws.zip
./aws/install && rm -rf aws aws.zip

# Firewall — deny-by-default inbound
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw --force enable
```

## Day 1 — user and directories

> **Historical (ADR-012).** `usermod -aG docker` and the `flareo-build`
> remap user were for the retired host Docker sandbox.

```sh
useradd -r -m -d /opt/flareo-worker -s /bin/bash flareo-worker
usermod -aG docker flareo-worker

# The build-time remap user. Separate from the worker-runtime user;
# this is the one files-inside-container get mapped TO on the host.
useradd -r -M -s /usr/sbin/nologin flareo-build

# Working directories
mkdir -p /var/lib/flareo-worker/builds /var/log/flareo-worker
chown -R flareo-worker:flareo-worker /var/lib/flareo-worker /var/log/flareo-worker

mkdir -p /etc/flareo-worker
chmod 700 /etc/flareo-worker
```

## Day 1 — Docker userns-remap

> **Historical (ADR-012).** userns-remap was the primary host-side control
> for the retired DinD / `docker build` sandbox.

This is the single most important security control. Without it, a container-escape bug gives host-root.

```sh
# /etc/subuid and /etc/subgid entries for flareo-build
usermod --add-subuids 100000-165535 flareo-build
usermod --add-subgids 100000-165535 flareo-build

cat > /etc/docker/daemon.json <<'EOF'
{
  "userns-remap": "flareo-build",
  "live-restore": true,
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker

# Verify userns-remap is active — should show a userns_remap field
# with the UID flareo-build is mapped to:
docker info | grep -i userns
```

## Day 2 — secrets

Create the env file that systemd reads. **Do not commit this file anywhere.**

```sh
cat > /etc/flareo-worker/env <<'EOF'
DATABASE_URL=postgres://user:pass@host:5432/flareo?sslmode=require
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_SUBMISSIONS=flareo-submissions
R2_BUCKET_ARTIFACTS=flareo-artifacts

AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
ECR_REPOSITORY_PREFIX=public.ecr.aws/flareo/

SENTRY_DSN=https://xxxxxxxxxxxxxx@xxxxxxxxxxxx.ingest.sentry.io/xxxxxxxxxxxx

LOG_LEVEL=info
POLL_INTERVAL_MS=30000
BUILD_TIMEOUT_MS=600000
WORKER_ID=hetz-worker-01
EOF

chmod 600 /etc/flareo-worker/env
chown root:root /etc/flareo-worker/env
```

Also configure ECR auth:

> **Historical (ADR-012).** `docker login` against ECR Public was required
> for the retired push-after-build path.

```sh
sudo -u flareo-worker mkdir -p ~flareo-worker/.docker
sudo -u flareo-worker aws configure
# Enter the AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / region when prompted
# Then run initial auth so docker can talk to ECR public:
sudo -u flareo-worker aws ecr-public get-login-password --region us-east-1 | \
  sudo -u flareo-worker docker login --username AWS --password-stdin public.ecr.aws

# ECR tokens expire every 12 hours. Set up a cron to refresh:
cat > /etc/cron.d/ecr-refresh <<'EOF'
# Refresh ECR Public login every 6 hours
0 */6 * * * flareo-worker /usr/local/bin/aws ecr-public get-login-password --region us-east-1 | /usr/bin/docker login --username AWS --password-stdin public.ecr.aws > /dev/null 2>&1
EOF
```

## Day 2 — deploy code

Copy the `apps/worker/` directory contents to `/opt/flareo-worker/`. Common options: `scp -r`, `rsync`, or a CI pipeline.

```sh
# Copy prisma/schema.prisma from main repo
cp /path/to/flareo/prisma/schema.prisma /opt/flareo-worker/prisma/

cd /opt/flareo-worker
chown -R flareo-worker:flareo-worker .
sudo -u flareo-worker npm install --omit=dev
sudo -u flareo-worker npx prisma generate
sudo -u flareo-worker npm run build

# Sanity check — this should exit immediately with a config-error message
# if env isn't loaded:
sudo -u flareo-worker node dist/index.js
```

## Day 2 — systemd

```sh
cp systemd/flareo-worker.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable flareo-worker
systemctl start flareo-worker

# Watch it start:
journalctl -u flareo-worker -f
```

Expected first output is a line like:
```json
{"ts":"2026-04-23T16:30:00.000Z","level":"info","msg":"worker started","workerId":"hetz-worker-01","pollIntervalMs":30000}
```

## Day 3 — smoke test

With the worker running, manually insert an approved submission via psql:

```sql
-- Start a Node shell on the main app host:
INSERT INTO "Submission" (
  id, "moduleName", version, author, "submittedAt", status,
  "queueAgeSec", "flagsJson", "autoCosign", "autoTrivy", "autoSlsa",
  "requiresNetwork", "submitterId"
) VALUES (
  'sub_smoketest_001',
  'hello',
  '1.0.0',
  'smoke test',
  NOW(),
  'approved',
  0,
  '{"slug":"hello","description":"smoke test","category":"devtools","license":"MIT","upstreamUrl":"https://github.com/test/hello","contactEmail":"you@yours.com","dockerfile":"FROM alpine:3.19\nCMD [\"echo\",\"hello\"]"}',
  false,
  false,
  false,
  false,
  (SELECT id FROM "User" WHERE email = 'you@yours.com')
);
```

Within 30 seconds the worker should pick it up. Watch the journal:

```
submission processing
build succeeded
scan passed
sbom uploaded
push succeeded
signed
submission built
```

If it works, the Submission row now has `status='built'` with a digest and Rekor index, and a new Module row appears in the catalog.

If it fails, check in order:
1. `journalctl -u flareo-worker -n 100` — what errored?
2. Did Docker accept the build? (`docker images | grep flareo-build` should show the built image briefly before cleanup)
3. Did ECR push work? (`aws ecr-public describe-repositories --region us-east-1`)
4. Did cosign run? Try `cosign sign --yes hello-world:latest` manually to verify OIDC is available.

## Day 3 — red team

Block a full day. Open `docs/red-team-playbook.md` from the main repo and walk through all 14 attacks. **Do not skip this step.** Any failure in categories A/B/C gates public rollout.

## Day 4 — enable public

Only after red-team passes:

1. Remove any trusted-submitter allowlist from `/api/v1/submissions` (if you added one)
2. Announce on the changelog/blog that submissions are open
3. Watch the queue for the first week — Sentry should be quiet

## Operational — common tasks

### "My worker seems stuck"
```sh
# What's it doing?
journalctl -u flareo-worker -n 50

# What's claimed but not finishing?
psql -c 'SELECT id, status, "buildStartedAt" FROM "Submission" WHERE status = '\''building'\'' ORDER BY "buildStartedAt"'

# Release stuck rows (they'll re-pick-up on next cycle):
psql -c 'UPDATE "Submission" SET status = '\''approved'\'', "buildStartedAt" = NULL WHERE status = '\''building'\'' AND "buildStartedAt" < NOW() - INTERVAL '\''30 minutes'\'''
```

### "Worker died during build"
Systemd restart will re-pick-up the row (status stays `building`, worker's next claim SKIPs it because of the lock released on process death reset by the UPDATE above). The run-away row should be reset via the query above or manually.

### "Disk is filling up"
```sh
# Biggest offenders:
du -sh /var/lib/docker/* 2>/dev/null | sort -h
docker system df

# Safe cleanup:
docker system prune -af --filter "until=24h"

# Nuclear option (worker will rebuild caches):
systemctl stop flareo-worker
docker system prune -af
systemctl start flareo-worker
```

### "Need to rotate Resend / DB / R2 secrets"
Edit `/etc/flareo-worker/env`, then `systemctl restart flareo-worker`. In-flight builds complete first.

## What's explicitly NOT in this runbook

Things you might expect but aren't here:

- **Rootless Docker.** Docker rootless mode would be ideal security, but it has enough rough edges (networking, storage drivers) that for day one we use regular Docker with userns-remap. Revisit when one working pipeline exists.
- **gVisor / Kata.** Alternative container runtimes give stronger isolation. Not worth the operational tax at current scale.
- **Ephemeral build VMs.** Fresh kernel per build via firecracker or kvm. Nice in theory. Adds minutes per build; not justified below 100 builds/day.
- **Multiple workers.** The DB lock primitive is ready for it; we just don't need more than one yet.

Revisit all three at the quarter retrospective.
