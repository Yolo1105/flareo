# Week 4 runbook: shared preview demo

Goal by Sunday night: clicking "Preview this module" on `vaultwarden`, `uptime-kuma`, `gitea`, `linkwarden`, `ntfy`, `adguard-home`, or `caddy` opens a working live instance at `s-<slug>-demo.preview.flareo.dev` over HTTPS. The instance resets every 24 hours at 00:00 UTC.

## Before you start

- Week 1 is done: 12 canary modules published to ECR Public.
- Week 2 is done: v1 API is live.
- Week 3 is done: CLI works (optional for this week, but nice to test with).
- You have a Hetzner Cloud account with billing on file.
- You have access to the Cloudflare DNS zone for `flareo.dev`.

## Monday: provision the Hetzner box

1. Log into console.hetzner.cloud
2. Create project `flareo` if not already there.
3. Add an SSH key (your laptop's public key at `~/.ssh/id_ed25519.pub` or similar).
4. Create a new server:
   - Location: Falkenstein or Helsinki (closest to most homelab audiences in the EU/US East)
   - Image: Ubuntu 24.04
   - Type: **CX41** (8 vCPU, 16 GB RAM, 160 GB SSD) — €24/mo
   - Networking: IPv4 + IPv6 enabled
   - SSH keys: select the one you just added
   - Labels: `role=preview`, `env=prod`
   - Name: `flareo-preview-01`

5. Once provisioned (~30 seconds), note the public IPv4. Call it `$BOX_IP`.

6. Point DNS:
   - In Cloudflare, add an A record: `preview.flareo.dev` → `$BOX_IP`, proxy DISABLED (orange cloud off)
   - Add another A record: `*.preview.flareo.dev` → `$BOX_IP`, proxy DISABLED

   **Why proxy disabled:** Cloudflare's proxy strips SNI-less wildcard TLS connections in unexpected ways; running TLS yourself through Caddy against your own wildcard cert is simpler and more reliable. You can enable proxy later if you want CDN caching.

7. SSH in and test:
   ```sh
   ssh root@$BOX_IP
   # once in:
   uptime
   ```

## Tuesday: create Cloudflare API token and push the repo

**Cloudflare API token for DNS-01 ACME:**

1. Cloudflare dashboard → Profile icon → API Tokens → Create Token.
2. Use the "Edit zone DNS" template.
3. Zone Resources: Include → Specific zone → `flareo.dev`.
4. Click Continue → Create Token.
5. Copy the token — you only see it once. Save to your `flareo-secrets.txt`.

**Push the flareo-preview repo:**

Unzip `flareo-preview-week4.zip` somewhere on your laptop, then:

```sh
cd deploy/preview
git init
git add -A
git commit -m "Initial preview infrastructure"
git branch -M main
git remote add origin https://github.com/flareo/flareo-preview.git
git push -u origin main
```

If you prefer this repo to be private, make `flareo-preview` a private repo on GitHub — the setup script clones it over HTTPS, which works either way as long as the box has credentials. For MVP-grade private cloning, use a deploy key or a fine-grained PAT stored as a Hetzner metadata cloud-init secret. Simplest: just make it public since it doesn't contain secrets.

## Wednesday: run setup-box.sh

SSH back into the box:

```sh
ssh root@$BOX_IP
```

Install curl (if missing), then pull and run the setup script:

```sh
apt-get update && apt-get install -y -qq git
git clone https://github.com/flareo/flareo-preview.git /tmp/fp && \
  cd /tmp/fp && bash setup-box.sh
```

The script will:

- Install Docker and compose plugin
- Create the `caddy` user
- Clone this repo into `/opt/flareo-preview`
- Build a custom Caddy binary with the Cloudflare DNS plugin via xcaddy (takes ~2 min)
- Prompt you for the Cloudflare API token (paste it when asked)
- Install all systemd units
- Configure ufw to allow only SSH + 80 + 443
- `docker compose pull` and `docker compose up -d` for the 7 light services
- Start Caddy and the daily reset timer

When it's done (3-5 minutes total), you see:

```
============================================================
  Flareo preview host setup complete
============================================================

Wait 2-3 minutes for Caddy to obtain the wildcard certificate,
then visit:
  https://s-vaultwarden-demo.preview.flareo.dev
```

**Wait 2-3 minutes for Caddy to obtain the wildcard cert from Let's Encrypt via Cloudflare DNS-01.** Then from your laptop:

```sh
curl -I https://s-vaultwarden-demo.preview.flareo.dev
```

Should return `HTTP/2 200` with no TLS errors.

## Thursday: verify every module works

Visit each one in your browser:

- https://s-vaultwarden-demo.preview.flareo.dev — Vaultwarden login page
- https://s-uptime-kuma-demo.preview.flareo.dev — Uptime Kuma setup wizard
- https://s-gitea-demo.preview.flareo.dev — Gitea installation form
- https://s-linkwarden-demo.preview.flareo.dev — Linkwarden login
- https://s-ntfy-demo.preview.flareo.dev — ntfy homepage
- https://s-adguard-home-demo.preview.flareo.dev — AdGuard setup wizard
- https://s-caddy-demo.preview.flareo.dev — Caddy file server demo

Also test that a non-previewable module shows the proper 404 JSON:

```sh
curl -k https://s-home-assistant-demo.preview.flareo.dev
# Should return {"error": "preview_not_available", "message": ...}
```

And a typo or garbage subdomain:

```sh
curl -k https://s-nonsense-demo.preview.flareo.dev
# Same 404 from the catch-all block
```

## Friday: hook up the frontend

Apply the `flareo-week4-patch.zip` over your main flareo project:

```sh
cd path/to/flareo
unzip -o ~/Downloads/flareo-week4-patch.zip
npm run dev
```

Visit a module page locally, e.g. `http://localhost:3000/modules/vaultwarden`. You should see a new "Preview this module →" button in the hero actions. Clicking it opens the live preview in a new tab. 

For non-previewable modules (home-assistant, immich, jellyfin, nextcloud), the same area shows "Preview coming soon" (disabled button).

If the Preview button doesn't appear: check that each module's `previewable` field is correctly set in Postgres. Fix with SQL:

```sql
UPDATE "Module" SET "previewable" = true
  WHERE slug IN ('vaultwarden', 'uptime-kuma', 'gitea', 'linkwarden', 'ntfy', 'adguard-home', 'caddy');

UPDATE "Module" SET "previewable" = false
  WHERE slug IN ('home-assistant', 'immich', 'jellyfin', 'nextcloud', 'paperless-ngx');
```

Deploy to Vercel when you're happy:

```sh
git add -A
git commit -m "Week 4: preview button on module pages"
git push
```

## Saturday: daily reset verification

Manually trigger the reset and watch it work:

```sh
ssh root@$BOX_IP
sudo systemctl start flareo-preview-reset.service
journalctl -u flareo-preview-reset.service -f
```

Expected log output:

```
flareo-preview reset: start
resetting vaultwarden
  wiped flareo-preview_vaultwarden_data
  restarted vaultwarden
resetting uptime-kuma
...
verifying services
  OK     vaultwarden (:8001)
  OK     uptime-kuma (:8002)
  ...
reset complete
```

After the reset, visit any preview URL and sign up for a test account. Wait until 00:00 UTC (or manually run reset again). Visit the URL again. Your account should be gone.

Confirm the timer is scheduled:

```sh
systemctl list-timers flareo-preview-reset.timer
```

Should show `Next: ... 00:00 UTC` with time remaining.

## Sunday: monitoring and polish

**Add the preview host to Instatus:**

In Instatus, add a new uptime check:
- URL: `https://s-vaultwarden-demo.preview.flareo.dev`
- Component: the "Preview Demos" component from Week 0
- Frequency: 5 minutes

**Resource check:**

On the box, confirm memory pressure is OK:

```sh
ssh root@$BOX_IP 'docker stats --no-stream'
```

All services should be sitting below their `mem_limit`. If any is slammed against the cap, reduce its memory footprint or drop it from the demo.

**Update docs:**

In your main flareo-docs repo, write a short page at `/docs/previews` explaining:

- What the shared demos are
- That data resets daily
- Which modules are available
- The safety note about not entering real credentials

## What DIDN'T happen this week (on purpose)

- Per-user isolated Firecracker microVMs. Horizon 3 (months 5-9).
- Session tokens to track "your" preview. Shared demo means shared; no personalization.
- Metrics on who used which preview. Not useful for MVP.
- Automatic image updates when a canary module is rebuilt. Because we pin by `latest` tag in the compose file, the daily reset pulls whatever the most recent canary rebuild pushed. For bit-exact control, swap `:latest` for a pinned digest (Week 5 if needed).

## What to do if something breaks

**Caddy won't start / cert fails.** Check `journalctl -u caddy -f`. Most common: Cloudflare API token is wrong or doesn't have DNS:Edit scope on `flareo.dev`. Fix in `/etc/caddy/env` and `systemctl restart caddy`.

**All containers fail with "image not found."** Confirm ECR Public is public. Test with `docker pull public.ecr.aws/<your-alias>/flareo/vaultwarden:latest` from the box. If that fails, your canary pipeline (Week 1) didn't actually push. Fix that first.

**One container is in a crash loop.** Look at its logs: `docker compose -f /opt/flareo-preview/docker-compose.yml logs vaultwarden`. Common: the image you re-tagged in Week 1 has a newer-upstream breaking change. Pin the upstream digest in the Week 1 env file to a known-good version.

**Daily reset timer never fires.** Check `systemctl list-timers`. If it's disabled, `systemctl enable --now flareo-preview-reset.timer`. If enabled but past `Next:` time and still didn't fire, your box's clock is off; `timedatectl set-ntp true`.

**Preview button doesn't render.** Check the Module row's `previewable` column. SQL above fixes it.

**Disk filling.** The reset script prunes dangling images and volumes, but if a module is pulled frequently and updates often, the pull-cache fills. Run: `docker system prune -a --volumes -f` manually. For long-term, add this to the reset script after confirming it's safe.

## Week 5 preview

Week 5 is docs. The Fumadocs site at `docs.flareo.dev` with 18+ pages, including the preview docs you stubbed on Sunday.
