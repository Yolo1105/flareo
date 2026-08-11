# Flareo: container supply chain for self-hosters

*Draft — pick a title before posting. Target word count: 800-1200.*

---

**TL;DR.** We rebuild 12 popular self-hosted apps — Vaultwarden, Immich, Jellyfin, and so on — from source, sign them with Sigstore, and publish them to a public registry anyone can verify. It's free. [flareo.dev](https://flareo.dev).

---

## The problem

You run things on your own hardware. A Synology, a Raspberry Pi, a homelab in the basement, a couple of Hetzner boxes, maybe a tiny Kubernetes cluster. You're not running LinkedIn; you're running a password manager for your family, a photo library, a home-automation hub, ad-blocking DNS.

And for most of those services, the path between "the maintainer pushed code" and "the container running in your house" is: someone else builds an image, pushes it to Docker Hub, you pull it, and run it. The build is a black box. The person running the build is rarely the person maintaining the upstream project. The image layers could contain anything.

Most of the time, it's fine. The community is mostly decent; the maintainers are mostly careful. But "mostly" is load-bearing.

## What we built

Flareo is a container supply chain platform. For a curated set of popular self-hosted apps:

1. We run a **republish pipeline** that rebuilds modules from upstream source on GitHub Actions. The site shows `lastRebuiltAt` rather than promising a fixed cadence.
2. Every build is **scanned** with Trivy for known CVEs, and we generate a **CycloneDX SBOM**.
3. Every build is **signed** with [Sigstore's cosign](https://docs.sigstore.dev/cosign/) using keyless signing tied to our GitHub Actions OIDC identity. The signature goes into the public Rekor transparency log.
4. Images are published to **ECR Public**, pinned by digest, so you can pull them exactly as we built them.

And — critically — **you can verify every step yourself**, without trusting us, with tools you already have or can install in five minutes.

## The "don't trust us, verify yourself" part

The whole product is designed around one sentence: you shouldn't have to trust Flareo to benefit from Flareo.

- Paste any image at [flareo.dev/verify](https://flareo.dev/verify) and it runs the same Sigstore checks a security auditor would.
- Or run it yourself: `cosign verify --certificate-identity-regexp 'https://github.com/flareo/.+' --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' <image>`.
- Or install `flareo` (the CLI) and run `flareo verify <image>`.

All three produce the same verdict. None of them requires Flareo's servers to be up, honest, or even reachable after the initial verification.

If our AWS account gets compromised tomorrow and an attacker tries to push a new image, the signature won't verify. If our domain expires, every digest you've already pinned remains cryptographically valid forever, anchored in Rekor.

That property — Flareo going away doesn't invalidate anything Flareo signed — is the whole point.

## What's in the catalog today

Twelve modules across five categories:

- **Security**: Vaultwarden
- **Media**: Immich, Jellyfin
- **Automation**: Home Assistant
- **Productivity**: Nextcloud, Paperless-ngx, Linkwarden
- **Network**: AdGuard Home, Caddy
- **Communication**: ntfy
- **Monitoring**: Uptime Kuma
- **DevTools**: Gitea

Seven of them have **live click-to-try previews** at `s-<slug>-demo.preview.flareo.dev` — no installation, no account, no commitment. Previews reset every 24 hours; don't put real data in them.

## What Flareo is NOT

Being clear about what we DON'T claim, since security marketing can slip into it:

- Not a Docker Hub replacement. We curate 12 modules; we don't accept arbitrary images.
- Not a guarantee against upstream maliciousness. Our signature says "we built the source upstream shipped." It doesn't say "the source is trustworthy."
- Not a substitute for running your own security review of critical software.
- Not a replacement for the existing Sigstore ecosystem — we're using it, not replacing it.

## The roadmap, in broad strokes

- **Now (Horizon 1):** the 12-module catalog, the verification tool, the CLI, the shared previews. Closed beta open. Free.
- **Soon (Horizon 2):** third-party publishing, Kubernetes admission controllers, a small paid tier for high-volume API usage.
- **Later (Horizon 3):** per-user isolated previews, SLSA Level 3, reproducible-build verification.

## How to try it

1. Visit [flareo.dev](https://flareo.dev) — no signup, no cookies, no tracking.
2. Browse the catalog.
3. Paste any image into the verify tool.
4. Install the CLI with `curl -fsSL https://flareo.dev/install | sh`.

If you like what you see and want early access to beta features, [join the waitlist](https://flareo.dev/signup). We'll email when a slot opens.

If you want to propose a module, open a [GitHub issue](https://github.com/flareo/flareo/issues) with the `module-proposal` template.

## Open source

Flareo's web app, CLI, canary pipeline, and preview infrastructure are all AGPL-3.0-or-later. Source at [github.com/flareo](https://github.com/flareo). We build in public; every decision has a trail.

Questions: [hello@flareo.dev](mailto:hello@flareo.dev). Security issues: [security@flareo.dev](mailto:security@flareo.dev). Everything else: [flareo.dev/about](https://flareo.dev/about).
