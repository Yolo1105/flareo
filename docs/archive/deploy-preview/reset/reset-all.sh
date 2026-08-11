#!/usr/bin/env bash
#
# reset-all.sh — wipe every demo instance's data. Fired by
# flareo-preview-reset.timer daily at 00:00 UTC.
#
# For each active service:
#   1. docker compose stop the service
#   2. remove its named volumes (the `docker compose down -v` pattern
#      but scoped per-service so one slow container doesn't delay the
#      others)
#   3. docker compose start the service — it recreates fresh volumes
#
# Logs go to the journal via systemd; view with:
#   journalctl -u flareo-preview-reset.service --since today
#
# Manual one-off run:
#   sudo systemctl start flareo-preview-reset.service
#
# Rollback isn't a thing. Once this runs, demo state is gone. That's
# the whole point.

set -euo pipefail

# ──────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────

COMPOSE_DIR="/opt/flareo-preview"
COMPOSE_FILE="${COMPOSE_DIR}/docker-compose.yml"

# The services we actively reset. Matches the light-profile services in
# docker-compose.yml. Add a slug here when you enable a new previewable
# module.
SERVICES=(
  "vaultwarden"
  "uptime-kuma"
  "gitea"
  "linkwarden"
  "linkwarden-db"
  "ntfy"
  "adguard-home"
  "caddy-demo"
)

# The named volumes each service owns. Structured as "service:volume1,volume2".
# Matches the `volumes:` sections in docker-compose.yml.
declare -A VOLUMES=(
  ["vaultwarden"]="flareo-preview_vaultwarden_data"
  ["uptime-kuma"]="flareo-preview_uptime_kuma_data"
  ["gitea"]="flareo-preview_gitea_data"
  ["linkwarden"]="flareo-preview_linkwarden_data"
  ["linkwarden-db"]="flareo-preview_linkwarden_db"
  ["ntfy"]="flareo-preview_ntfy_cache,flareo-preview_ntfy_data"
  ["adguard-home"]="flareo-preview_adguard_work,flareo-preview_adguard_conf"
  ["caddy-demo"]="flareo-preview_caddy_demo_data,flareo-preview_caddy_demo_config"
)

# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────

log() {
  printf '%s  %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

reset_service() {
  local svc="$1"
  local vols="${VOLUMES[$svc]:-}"

  log "resetting $svc"

  # Stop (but don't remove) the container. --timeout 10 gives graceful
  # SIGTERM a chance; then SIGKILL.
  docker compose -f "$COMPOSE_FILE" stop --timeout 10 "$svc" >/dev/null 2>&1 || true

  # Remove the stopped container so its anonymous mounts get cleaned.
  docker compose -f "$COMPOSE_FILE" rm --force --stop "$svc" >/dev/null 2>&1 || true

  # Wipe each named volume. `docker volume rm` fails if a container
  # still references it, so we've stopped + rm'd the container first.
  if [[ -n "$vols" ]]; then
    IFS=',' read -r -a vol_array <<< "$vols"
    for vol in "${vol_array[@]}"; do
      if docker volume inspect "$vol" >/dev/null 2>&1; then
        docker volume rm "$vol" >/dev/null \
          && log "  wiped $vol" \
          || log "  WARN: could not wipe $vol (still in use?)"
      fi
    done
  fi

  # Start it back up. Compose recreates the named volumes empty.
  docker compose -f "$COMPOSE_FILE" up -d --no-deps "$svc" >/dev/null
  log "  restarted $svc"
}

# ──────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────

log "flareo-preview reset: start"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  fail "compose file not found at $COMPOSE_FILE"
fi

if ! docker info >/dev/null 2>&1; then
  fail "docker daemon is not running"
fi

failed_services=()

for svc in "${SERVICES[@]}"; do
  if reset_service "$svc"; then
    :
  else
    log "  FAILED: $svc"
    failed_services+=("$svc")
  fi
done

# Post-reset: prune dangling images and volumes that piled up over the
# course of the day (upstream image updates, etc). Cheap and keeps the
# disk from filling.
log "pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true

log "pruning dangling volumes"
docker volume prune -f >/dev/null 2>&1 || true

# Final verification: curl each expected port to confirm services came
# back healthy. Non-fatal; just log.
log "verifying services"
declare -A PORTS=(
  ["vaultwarden"]="8001"
  ["uptime-kuma"]="8002"
  ["gitea"]="8003"
  ["linkwarden"]="8004"
  ["ntfy"]="8005"
  ["adguard-home"]="8006"
  ["caddy-demo"]="8008"
)

# Give services 30 seconds to finish booting before we curl them.
sleep 30

for svc in "${!PORTS[@]}"; do
  port="${PORTS[$svc]}"
  if curl -sf -o /dev/null --max-time 5 "http://127.0.0.1:${port}"; then
    log "  OK     $svc (:$port)"
  else
    log "  UNREADY $svc (:$port)"
  fi
done

if [[ ${#failed_services[@]} -gt 0 ]]; then
  log "reset complete with errors: ${failed_services[*]}"
  exit 1
fi

log "reset complete"
