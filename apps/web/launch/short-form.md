# Short-form launch copy

Pick and adapt. Don't post all of these; different surfaces call for different angles.

---

## Hacker News title options

Pick one. Put URL in the URL field, not the title. No "Show HN:" unless you're confident in HN being the first surface.

1. **Flareo: container supply chain for self-hosters** (neutral, safest)
2. **Signed, rebuilt, scanned: containers you don't have to trust** (more opinionated)
3. **Show HN: I rebuilt 12 homelab containers so you can verify the supply chain** (personal, "show HN")
4. **We rebuild Vaultwarden, Immich, Jellyfin etc. from source and sign with Sigstore** (specific, descriptive)

First comment (self-reply) within 5 minutes of posting. Something like:

> Hey HN. Quick context on what this is and isn't:
>
> What it is: rebuilds of 12 popular self-hosted apps (Vaultwarden, Immich, Jellyfin, Gitea, etc) with Sigstore signatures, CycloneDX SBOMs, and daily CVE scans. Everything publicly verifiable end-to-end.
>
> What it isn't: a Docker Hub replacement. We curate a small catalog. That's the whole pitch.
>
> Closed beta, no paid tier, free for as long as the free tier lets us operate honestly. Built for homelabbers. Happy to answer questions.

---

## Twitter / X / Bluesky / Mastodon thread

**Post 1** (240 chars max, image attached):

> Launching Flareo: signed container images for self-hosters.
>
> Rebuild your Vaultwarden, Immich, Jellyfin etc. from source, with Sigstore signatures + SBOM + CVE scans you can verify yourself.
>
> Free. No signup required to verify.
>
> flareo.dev

**Post 2:**

> The pitch: you shouldn't have to trust Flareo to benefit from Flareo.
>
> Every image has a cosign signature anchored in Sigstore's public transparency log. You can verify offline with `cosign verify` — we don't sit in your trust path.

**Post 3:**

> What's in the catalog today:
>
> • Vaultwarden
> • Immich
> • Jellyfin
> • Home Assistant
> • Nextcloud
> • Paperless-ngx
> • AdGuard Home
> • Gitea
> • Linkwarden
> • ntfy
> • Uptime Kuma
> • Caddy

**Post 4** (image: screenshot of shared demo):

> 7 of the 12 have live click-to-try previews. No installation, no account. Resets daily.
>
> preview.flareo.dev/...

**Post 5:**

> Also shipping: a Rust CLI for browsing + verifying from the terminal.
>
> curl -fsSL https://flareo.dev/install | sh
> flareo search vault
> flareo verify public.ecr.aws/flareo/vaultwarden@sha256:...

**Post 6:**

> Everything is open source, AGPL-3.0.
> github.com/flareo
>
> Infrastructure costs us ~€24/month. We'll probably lose money on this for a while. That's OK — it's the right shape of product.
>
> Questions → hello@flareo.dev

---

## Reddit /r/selfhosted post

**Title:** Launched Flareo, a signed-container service for the homelab community

**Body:**

Hey /r/selfhosted,

I wanted to share something I've been building that I think some of you will find useful.

Most of us pull containers from Docker Hub, maybe LinuxServer, maybe GHCR. For the most part that works fine, but if you've ever thought "I wish I had cryptographic proof that this image really came from where I think it came from," Flareo is that.

**What it does:**

- Takes 12 popular self-hosted apps (full list in the comments)
- Rebuilds them from source every day on GitHub Actions
- Signs them with Sigstore cosign
- Scans with Trivy, publishes a CycloneDX SBOM for every build
- Pushes to ECR Public where you can pull them exactly as we built them

**What makes it different from just running `cosign sign` yourself:**

Nothing cryptographically. You could do exactly this yourself. The value is that it's already done for the apps you're most likely to run, the pipeline runs continuously so your CVE status stays fresh, and there's a website / CLI that makes verification a one-liner instead of a research project.

**What this isn't:**

- Not a Docker Hub replacement. Small curated catalog.
- Not a guarantee the upstream project is secure. Only that we built what upstream shipped.
- Not paid (yet, maybe ever for the free tier).

**Try the verify tool without installing anything:** flareo.dev/verify

**Catalog:** flareo.dev/catalog

**Seven of the twelve** have click-to-try demos at preview.flareo.dev/*, resets every 24h.

Happy to answer questions. Open to requests for additional modules but honestly the bar is high — we maintain these, and "maintaining" means promising a daily rebuild and scan until we drop them.

Source is AGPL'd at github.com/flareo.

---

## Waitlist welcome email (sent via Resend)

Subject: **You're on the Flareo waitlist**

---

Thanks for signing up. You're on the waitlist for Flareo closed beta.

Right now the site is live and free for anyone to browse and verify — no account needed. What you're waiting for is early access to:

- Submitting your own modules for signing
- Per-user private previews
- The paid tier (when we launch it)

We'll email when that opens up. In the meantime:

→ Browse the catalog: flareo.dev/catalog
→ Verify any container: flareo.dev/verify
→ Install the CLI: curl -fsSL https://flareo.dev/install | sh
→ Read the docs: docs.flareo.dev

Questions? Hit reply. I read every email.

— The Flareo team

---

You're receiving this because you signed up at flareo.dev/signup. Unsubscribe: [one-click link]

---

## Status page "we are live" post

Title: **Flareo closed beta is open**

Components: all green.

Message: Flareo is now available in closed beta. The catalog at flareo.dev lists 12 modules; the /verify tool is live; the CLI is available via `curl -fsSL https://flareo.dev/install | sh`. If you encounter issues, email hello@flareo.dev or open an issue at github.com/flareo.

---

## Footer copy for closing out Week 6

> Flareo is in closed beta. The catalog, verify tool, and CLI are free and require no account. Higher API rate limits and module submission require GitHub signin.
