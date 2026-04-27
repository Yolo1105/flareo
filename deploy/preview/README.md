# flareo-preview

Shared preview infrastructure for the Flareo MVP.

Runs one instance of each previewable Flareo module on a single Hetzner CX41, behind Caddy with wildcard TLS, with a daily reset cron that wipes all state at 00:00 UTC.

## What this repo contains

```
flareo-preview/
├── docker-compose.yml           # 7 light + 1 heavy service definitions
├── setup-box.sh                 # one-shot bootstrap for a fresh Ubuntu box
├── caddy/
│   ├── Caddyfile                # reverse proxy + wildcard TLS
│   └── build-caddy.sh           # xcaddy build w/ Cloudflare DNS plugin
├── systemd/
│   ├── caddy.service
│   ├── flareo-preview-reset.service
│   └── flareo-preview-reset.timer
├── reset/
│   └── reset-all.sh             # daily wipe script
├── week4-runbook.md             # day-by-day execution guide
└── README.md
```

## Live instances

| Module        | URL                                                |
|---------------|-----------------------------------------------------|
| Vaultwarden   | https://s-vaultwarden-demo.preview.flareo.dev       |
| Uptime Kuma   | https://s-uptime-kuma-demo.preview.flareo.dev       |
| Gitea         | https://s-gitea-demo.preview.flareo.dev             |
| Linkwarden    | https://s-linkwarden-demo.preview.flareo.dev        |
| ntfy          | https://s-ntfy-demo.preview.flareo.dev              |
| AdGuard Home  | https://s-adguard-home-demo.preview.flareo.dev      |
| Caddy         | https://s-caddy-demo.preview.flareo.dev             |

All instances reset daily at 00:00 UTC. **Do not enter real credentials.** They are shared with every other visitor to the internet.

## Non-previewable modules (currently)

- `home-assistant` — needs USB/bluetooth passthrough
- `immich` — requires GPU to demo meaningfully
- `jellyfin` — video streaming saturates shared network
- `nextcloud` — 2+ GB boot
- `paperless-ngx` — heavy OCR consumer, enabled with `docker compose --profile heavy up`

The Flareo module pages for these show "Preview coming soon."

## Setup (fresh box)

See `week4-runbook.md`. Quick version:

```sh
git clone https://github.com/flareo/flareo-preview.git /tmp/fp
cd /tmp/fp && bash setup-box.sh
```

## Common operations

**Restart one service:**
```sh
cd /opt/flareo-preview
docker compose restart vaultwarden
```

**Trigger the reset manually:**
```sh
sudo systemctl start flareo-preview-reset.service
journalctl -u flareo-preview-reset.service -f
```

**Pull updated canary images and restart:**
```sh
cd /opt/flareo-preview
docker compose pull
docker compose up -d
```

**Check timer schedule:**
```sh
systemctl list-timers flareo-preview-reset.timer
```

**Rotate Cloudflare API token:**
```sh
sudo $EDITOR /etc/caddy/env  # update CLOUDFLARE_API_TOKEN=
sudo systemctl restart caddy
```

## Cost

One Hetzner CX41 at €24.49/month as of April 2026. No additional services (R2, ECR, and the main app all live elsewhere).

## Phase F0 analytics — measuring evaluation demand

Before per-user Firecracker previews are built (horizon-2-plan.md Bet 2),
we need 30 days of real data to make the go/no-go call. The kill criterion
in the original plan was: `<5%` of preview visitors do anything beyond
click-around → defer. Building per-user previews against feeling, not
evidence, would be a 6-8 week mistake.

This phase ships analytics that produce the data, then waits.

### What's measured

The Caddyfile applies an `(inject_analytics)` snippet to every preview
block. The snippet uses the `replace-response` plugin to insert a small
script tag before `</head>` on HTML responses. The script POSTs a
pageview to Plausible's events API tagged with the module slug.

| Where | Event | Property |
|---|---|---|
| Preview page-view | `pageview` (Plausible default) | `module=<slug>` |
| Click on "Preview this module" link from `/modules/<slug>` | `PreviewLinkClicked` | `moduleSlug`, `signedIn=yes\|no` |
| Landing on `/signup`, `/verify`, `/pricing`, `/marketplace`, `/docs/install` AFTER coming from a preview subdomain | `PreviewConversion` | `sourceModule=<slug>`, `target=<page>` |

The first event (preview pageview) lives in a separate Plausible site,
`preview.flareo.dev`, because preview-side traffic and main-site traffic
have very different shapes. The other two events live in the main
`flareo.dev` Plausible site so the conversion funnel stays in one place.

### Setup before deploy

1. **Create the Plausible site.** In your Plausible account, add a new
   site with the domain `preview.flareo.dev`. No DNS or script-tag
   verification needed — the events API accepts any domain you've
   registered.
2. **Build Caddy with the new plugin.** `replace-response` is now in
   `build-caddy.sh`. Re-run `bash build-caddy.sh` and reinstall the
   binary. ~2 minutes.
3. **Reload Caddy** with the updated Caddyfile: `sudo systemctl reload
   caddy`. Verify with `caddy validate /etc/caddy/Caddyfile` first.
4. **Smoke test.** Hit a preview URL in a browser. Open DevTools →
   Network. You should see a POST to `plausible.io/api/event` within
   ~500ms of page load. Check the Plausible dashboard for the new
   `preview.flareo.dev` site — pageviews should appear within a minute.

### Reading the data — the 30-day clock

The clock starts the day analytics-wired Caddy reloads on production.
Mark the date. Then:

- **Day 7** — quick gut check. Is data flowing? Is anything broken?
  No decisions made; we're just verifying the instrumentation works.
- **Day 30** — the decision gate. Pull these numbers from Plausible:
  - Total preview pageviews (`preview.flareo.dev` site)
  - Total `PreviewConversion` events (main site, sum across all targets)
  - Conversion rate = `PreviewConversion` count / unique preview
    visitors (Plausible's "Visitors" metric on the preview site)

Decision criteria, exact and pre-committed:

| Conversion rate | Decision |
|---|---|
| `< 5%` | The original kill criterion fires. Don't build per-user previews. Reallocate the 6-8 weeks. |
| `5-15%` | Weak signal. Build something cheaper than per-user (CLI ephemeral path, per-session shared reset, or recorded walkthroughs — see HORIZON_2_PLAN). |
| `> 15%` | Real demand. Build per-user previews — F1 scaffold session next, F2 substrate decision after that. |

### Privacy

The injected snippet sends:
- The page URL (the preview subdomain + path)
- The user's IP and User-Agent (Plausible needs both for unique-visitor
  counting; both are hashed daily and discarded — not stored)
- The module slug as a custom prop

It does NOT send any data the visitor types into the preview, any
cookies, or any browser fingerprinting beyond what Plausible's normal
pageview tracking does. Plausible is GDPR-compliant by default; no
cookie banner needed.

### Operational notes

- The `replace-response` plugin inspects HTML responses byte-by-byte.
  For typical previewable modules (Vaultwarden, Uptime Kuma) the
  overhead is ~5-15ms per response. For SSE-streaming modules (ntfy)
  the `stream` flag avoids buffering.
- If a preview's page is ALREADY missing `</head>` (some SPAs render
  client-side and serve a near-empty document), the injection silently
  no-ops. We measure what we can; what we can't measure stays absent
  rather than corrupted.
- The fetch to `plausible.io/api/event` is async and `.catch()`s
  silently. If Plausible is down, the preview page still loads; we
  just lose the event.
