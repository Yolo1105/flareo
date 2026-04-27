# Flareo self-host bundle

**SPECULATIVE — see decisions.md G-5.**

This directory will eventually contain the Docker Compose bundle that ships Flareo on a customer's own infrastructure.

## What ships in the bundle (when implemented)

```
flareo-self-host/
├── docker-compose.yml           # Main app + worker + Postgres + Redis
├── caddy/                       # Caddyfile for ingress
├── env/
│   ├── .env.example             # All required env vars
│   └── README.md                # Per-var documentation
├── scripts/
│   ├── bootstrap.sh             # First-run: gen secrets, init DB
│   ├── upgrade.sh               # Upgrade between versions
│   └── backup.sh                # Postgres backup helper
├── docs/
│   ├── INSTALL.md               # Customer-facing install guide
│   ├── OPERATIONS.md            # Day-2 ops
│   └── LICENSE.md               # Customer-managed cosign keys, etc.
└── VERSION
```

## What customers manage themselves

When a customer self-hosts:

- **Stripe** — they don't bill through us; they're already paid (probably annual contract)
- **Email** — point at their SMTP (Resend, SES, Mailgun, on-prem)
- **Cosign keys** — customer-managed KMS, not ours
- **OAuth providers** — their internal SSO, not GitHub
- **ECR / registry** — their own registry credentials

The main-app code path detects self-host mode via `FLAREO_SELFHOST=true` env and skips all flareo.dev-specific behavior (no canary upload to our R2, no remote canary trigger, no Stripe webhook routing to flareo.dev).

## Why this is speculative

No enterprise prospect has asked for self-host. Trigger criteria for actually building this:

1. A specific Enterprise prospect requires self-hosting as a precondition (deal value > €5k/month)
2. SOC 2 / ISO 27001 audit becomes a deal-blocker that self-hosting would resolve

The `Org.selfHostedAt` column ships now so the licensing and support routing schema is in place. The actual bundle artifacts ship when the trigger fires.

## What's NOT in scope for the eventual bundle

- **Multi-region.** Self-host is single-region. Multi-region would need to ship as a separate enterprise+ tier.
- **High availability beyond Postgres replication.** Worker / main app run as single instances. HA is a customer-side concern (run two compose stacks behind a load balancer if you want).
- **Air-gapped operation.** Some customers want zero outbound. We currently call out to Sigstore for verification; air-gap mode would need an internal Rekor mirror. Defer until asked.
