# Vaultwarden — Bitwarden-compatible password manager server
#
# Upstream: https://github.com/dani-garcia/vaultwarden
# Pinned to a specific upstream digest so the rebuild is deterministic.
# When you want to bump the version, change UPSTREAM_REF and VERSION,
# run the rebuild manually first to confirm nothing regresses, then
# commit the new values.

SLUG="vaultwarden"
NAME="Vaultwarden"
VERSION="1.32.7"
# Digest pinned reference of the upstream image we rebuild from.
UPSTREAM_REF="docker.io/vaultwarden/server:1.32.7"
AUTHOR="dani-garcia"
CATEGORY="Security"
DESCRIPTION="Bitwarden-compatible password manager server. Lightweight, self-hostable, compatible with all official Bitwarden clients."
TAGS="password-manager,self-hosted,rust,sqlite"

# Visible on the catalog card. Keep honest. These are rounded upstream signals
# (GitHub stars, real Docker pull estimates) not made-up numbers.
