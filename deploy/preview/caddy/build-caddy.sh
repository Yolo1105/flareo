#!/usr/bin/env bash
#
# Build a custom Caddy binary with the Cloudflare DNS plugin compiled in.
# Run once on the Hetzner box during setup. Takes about 2 minutes.
#
# The plugin is what lets Caddy solve ACME DNS-01 challenges against
# Cloudflare, which is what gets us a wildcard cert for
# *.preview.flareo.dev without needing 100 individual HTTP-01 challenges.

set -euo pipefail

if ! command -v go >/dev/null 2>&1; then
  echo "installing Go (xcaddy needs it to build Caddy)..."
  curl -fsSL https://go.dev/dl/go1.23.4.linux-amd64.tar.gz -o /tmp/go.tgz
  sudo rm -rf /usr/local/go
  sudo tar -C /usr/local -xzf /tmp/go.tgz
  rm /tmp/go.tgz
  export PATH="/usr/local/go/bin:$PATH"
fi

if ! command -v xcaddy >/dev/null 2>&1; then
  echo "installing xcaddy..."
  go install github.com/caddyserver/xcaddy/cmd/xcaddy@v0.4.2
  export PATH="$HOME/go/bin:$PATH"
fi

echo "building caddy v2.9.1 with caddy-dns/cloudflare and replace-response..."
xcaddy build v2.9.1 \
  --with github.com/caddy-dns/cloudflare@v0.0.0-20250220170335-27d20c4f0f23 \
  --with github.com/caddyserver/replace-response@v1.4.0

echo ""
echo "custom caddy built at: $(pwd)/caddy"
echo ""
echo "install with:"
echo "  sudo install -m 0755 ./caddy /usr/local/bin/caddy"
echo ""
caddy version
