#!/usr/bin/env bash
#
# setup-box.sh — bootstrap a fresh Ubuntu 24.04 Hetzner box into a
# Flareo preview host. Run once as root (or with sudo) right after the
# box boots. Idempotent: rerunning is safe.
#
# What this does:
#   1. Update apt and install Docker, curl, gnupg, jq
#   2. Create the `caddy` user (for the Caddy systemd unit)
#   3. Clone this flareo-preview repo into /opt/flareo-preview
#   4. Build the custom Caddy binary with the Cloudflare DNS plugin
#   5. Install the Caddyfile + /etc/caddy/env
#   6. Install both systemd units (caddy.service and the daily reset)
#   7. Enable everything and start it
#
# Before running:
#   - You've pointed preview.flareo.dev and *.preview.flareo.dev A
#     records at this box's public IP in Cloudflare DNS.
#   - You have a Cloudflare API token with Zone:DNS:Edit scope for
#     your zone. You'll be prompted for it.
#   - Your 12 canary modules are published to ECR Public (Week 1).

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "This script needs to run as root (sudo)."
  exit 1
fi

REPO_URL="${FLAREO_PREVIEW_REPO:-https://github.com/flareo/flareo-preview.git}"
INSTALL_DIR="/opt/flareo-preview"

log() { printf '%s  %s\n' "$(date -u +'%H:%M:%S')" "$*"; }

# ──────────────────────────────────────────────────────────────────
# Step 1: packages
# ──────────────────────────────────────────────────────────────────

log "updating apt"
apt-get update -qq
apt-get install -y -qq \
  ca-certificates \
  curl \
  gnupg \
  jq \
  git \
  ufw \
  unattended-upgrades

# ──────────────────────────────────────────────────────────────────
# Step 2: Docker (official convenience script)
# ──────────────────────────────────────────────────────────────────

if ! command -v docker >/dev/null 2>&1; then
  log "installing Docker"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  arch="$(dpkg --print-architecture)"
  codename="$(. /etc/os-release && echo "$VERSION_CODENAME")"
  echo "deb [arch=$arch signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $codename stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin
  systemctl enable --now docker
else
  log "Docker already installed"
fi

# ──────────────────────────────────────────────────────────────────
# Step 3: caddy user
# ──────────────────────────────────────────────────────────────────

if ! id caddy >/dev/null 2>&1; then
  log "creating caddy user"
  useradd --system --home-dir /var/lib/caddy --shell /usr/sbin/nologin caddy
fi

mkdir -p /etc/caddy /var/lib/caddy
chown -R caddy:caddy /var/lib/caddy

# ──────────────────────────────────────────────────────────────────
# Step 4: clone repo
# ──────────────────────────────────────────────────────────────────

if [[ -d "$INSTALL_DIR/.git" ]]; then
  log "repo already at $INSTALL_DIR; pulling latest"
  git -C "$INSTALL_DIR" pull --ff-only
else
  log "cloning $REPO_URL to $INSTALL_DIR"
  rm -rf "$INSTALL_DIR"
  git clone --depth=1 "$REPO_URL" "$INSTALL_DIR"
fi

# ──────────────────────────────────────────────────────────────────
# Step 5: build and install Caddy
# ──────────────────────────────────────────────────────────────────

if ! command -v caddy >/dev/null 2>&1 \
  || ! caddy list-modules 2>/dev/null | grep -q dns.providers.cloudflare; then
  log "building custom caddy with Cloudflare DNS plugin"
  cd "$INSTALL_DIR/caddy"
  bash build-caddy.sh
  install -m 0755 ./caddy /usr/local/bin/caddy
  cd -
else
  log "caddy with Cloudflare plugin already installed"
fi

install -m 0644 -o caddy -g caddy "$INSTALL_DIR/caddy/Caddyfile" /etc/caddy/Caddyfile

# ──────────────────────────────────────────────────────────────────
# Step 6: Cloudflare API token (prompted once)
# ──────────────────────────────────────────────────────────────────

if [[ ! -f /etc/caddy/env ]]; then
  echo
  echo "We need a Cloudflare API token with Zone:DNS:Edit scope to"
  echo "solve ACME DNS-01 challenges for *.preview.flareo.dev."
  echo
  read -r -s -p "Cloudflare API token: " CF_TOKEN
  echo
  if [[ -z "$CF_TOKEN" ]]; then
    echo "empty token, aborting"
    exit 1
  fi
  umask 077
  cat > /etc/caddy/env <<EOF
CLOUDFLARE_API_TOKEN=$CF_TOKEN
EOF
  chown caddy:caddy /etc/caddy/env
  chmod 0600 /etc/caddy/env
else
  log "/etc/caddy/env already present; leaving it alone"
fi

# ──────────────────────────────────────────────────────────────────
# Step 7: install systemd units
# ──────────────────────────────────────────────────────────────────

log "installing systemd units"
install -m 0644 "$INSTALL_DIR/systemd/caddy.service" /etc/systemd/system/
install -m 0644 "$INSTALL_DIR/systemd/flareo-preview-reset.service" /etc/systemd/system/
install -m 0644 "$INSTALL_DIR/systemd/flareo-preview-reset.timer" /etc/systemd/system/
systemctl daemon-reload

# ──────────────────────────────────────────────────────────────────
# Step 8: firewall
# ──────────────────────────────────────────────────────────────────

log "configuring ufw"
ufw --force default deny incoming
ufw --force default allow outgoing
ufw --force allow 22/tcp   # ssh
ufw --force allow 80/tcp   # http (ACME HTTP-01, if needed)
ufw --force allow 443/tcp  # https
ufw --force enable

# ──────────────────────────────────────────────────────────────────
# Step 9: first boot of the compose stack
# ──────────────────────────────────────────────────────────────────

cd "$INSTALL_DIR"
log "pulling canary images"
docker compose pull

log "starting preview services (light profile)"
docker compose up -d

# ──────────────────────────────────────────────────────────────────
# Step 10: start Caddy + timer
# ──────────────────────────────────────────────────────────────────

log "starting Caddy"
systemctl enable --now caddy.service

log "starting daily reset timer"
systemctl enable --now flareo-preview-reset.timer

# ──────────────────────────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────────────────────────

echo ""
echo "============================================================"
echo "  Flareo preview host setup complete"
echo "============================================================"
echo ""
echo "Check service health:"
echo "  systemctl status caddy"
echo "  systemctl status flareo-preview-reset.timer"
echo "  docker compose -f $INSTALL_DIR/docker-compose.yml ps"
echo ""
echo "Wait 2-3 minutes for Caddy to obtain the wildcard certificate,"
echo "then visit:"
echo "  https://s-vaultwarden-demo.preview.flareo.dev"
echo ""
echo "Daily reset is scheduled for 00:00 UTC. To run it manually:"
echo "  sudo systemctl start flareo-preview-reset.service"
echo "  journalctl -u flareo-preview-reset.service -f"
echo ""
