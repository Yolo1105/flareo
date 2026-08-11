# Tier 3 — receipts drawer + module comparison + expanded takeaway

Three concrete proposal items: the per-card receipts drawer (Idea 3 from Green Hat), the module comparison UI (Idea 8), and the expanded takeaway artifacts on `DeploySection`. All three concrete, no engineering deferrals.

## #1 — Receipts drawer on every module card

`components/sections/marketplace/ReceiptsDrawer.tsx` — interactive client component that renders a small "RECEIPTS" toggle on each module card. On click, expands a drawer in place showing the full attestation chain summary:

- DIGEST
- BUILD ID
- BUILT (timestamp)
- SOURCE (commit hash)
- SBOM (CycloneDX 1.5 + size)
- SIGNATURE (cosign keyless OIDC)
- REKOR (logged + entry index)
- POLICY (allow/deny based on actual CVE counts)

Plus a "full receipts on module page →" link to `/modules/<slug>#receipts` for the deep view.

Wired into `MarketplaceCategoryRow`'s ModuleCard so it appears on every marketplace card. The drawer sits as a sibling of the card's main `<Link>` (rather than inside it) to avoid click-event collisions — clicking the toggle expands the drawer; clicking the rest of the card navigates to the module page.

Per-module values are derived from `buildFor(module)` so two visitors looking at two different modules see different drawers — same code path. Matches the values shown on the pipeline page and module detail receipts section, so the chain is consistent across surfaces.

The proposal called this "Idea 3 — a literal paper-metaphor drawer that slides out showing the full attestation chain." This is the metaphor of Flareo-as-archive/custodian made visible on every card.

## #2 — `/compare-modules` page

Pick-two-modules side-by-side comparison. Two modes:

**Picker mode** (when a or b is missing) — modules grouped by category so visitors compare like-with-like. Click a card to select as A; if A is set, second click selects as B and the comparison renders. Already-selected cards show "DESELECT" — clicking them clears.

**Compare mode** (both a and b present) — full side-by-side comparison:

- **Headline cards** for each pick — large name, trust score badge, full description, link to module page
- **Comparison rows** for 11 signals:
  - Trust Score (composite)
  - SLSA level (provenance)
  - Critical CVEs (blocking)
  - High CVEs (actionable)
  - Image size (smaller is better)
  - Last rebuild (canary freshness)
  - Lifetime deploys
  - Pulls last 30 days (recent traction)
  - Reviews (count of visible)
  - Average rating (only if both have reviews)
  - Preview supported (yes/no)

Each row marks "← BETTER ON THIS SIGNAL" for whichever pick is meaningfully ahead — with a 2% rounding tolerance so near-ties show "tied" rather than rewarding noise. Rows handle direction correctly (smaller is better for image size, larger is better for everything else).

Page closes with honest framing: "What this comparison can't tell you" — operational fit, feature compatibility, learning curve, maintainer responsiveness. The numbers narrow the field; the final pick is still the visitor's.

URL-shareable: `/compare-modules?a=vaultwarden&b=gitea` works as a direct link, supports copy-paste sharing of specific comparisons.

Wired into the marketplace via a "compare modules →" link in every category row header.

## #3 — Expanded takeaway artifacts (DeploySection)

The proposal called this "What you walk away with" — section showing literal compose YAML + Helm values + .env so the no-lock-in claim is self-evident from the artifacts themselves.

Old `DeploySection` had three tabs (compose, Helm, run) with Helm at 13 stub lines. Rewritten to four tabs with substantial content:

**Docker Compose** — full compose with healthcheck, environment block referencing per-category env keys, volume mounts that match the upstream project's documented paths (auth gets `/data` + `/etc/config:ro`; monitoring gets grafana paths; media gets `photos:/usr/src/app/upload`; etc.)

**Helm Values** — proper values.yaml with image.repository + image.digest, verification block (cosign issuer + identity + SLSA level + sbomDownload), service definition, ingress stub, resources requests/limits, persistence, env section. ~40 lines per module.

**.env** — fresh tab. Per-category env keys with descriptions and placeholder values, plus a Flareo metadata block (FLAREO_MODULE / VERSION / DIGEST / TRUST_SCORE / SLSA_LEVEL) that gives the operator a self-contained audit trail.

**Docker Run** — single command with all the env flags + the digest-pinned image reference + post-run verification commands.

Per-category specialization (`portFor`, `volumesFor`, `envKeysFor`):
- auth → port 9000, ADMIN_TOKEN + DOMAIN + SMTP_HOST envs
- monitoring → port 3000, grafana paths
- media → port 2283, JWT_SECRET + DB_HOSTNAME
- git → port 3000, gitea-shaped envs
- networking → port 80, ACME registration email
- security → port 80, generic ADMIN_TOKEN
- productivity → port 8080

Two visitors looking at two modules in different categories see meaningfully different artifacts — not a generic template renamed.

No-lock-in framing card below the tabs: "These files run anywhere — your VPS, your Kubernetes cluster, a homelab NUC, an air-gapped lab. Flareo is not in your runtime path after you copy them out." Plus a `flareo takeaway <slug> --all` command hint for getting them all from the CLI.

## Files added

- `components/sections/marketplace/ReceiptsDrawer.tsx` (160 lines)
- `app/(marketing)/compare-modules/page.tsx` (633 lines)

## Files modified

- `components/sections/marketplace/MarketplaceCategoryRow.tsx` — refactored ModuleCard to support drawer as sibling; added compare-modules link to row header
- `components/sections/module-detail/DeploySection.tsx` — rewritten with 4 tabs, per-category specialization, no-lock-in framing

## What this resolves

Three Tier 3 items from the audit:

| Item | Status |
|---|---|
| Receipts drawer on every module card (proposal Idea 3) | ✅ Built |
| Module comparison UI (proposal Idea 8) | ✅ Built |
| Helm chart fragment alongside compose (audit Tier 4 #13) | ✅ Built — full 4-tab takeaway with .env added |

## Project state

The proposal's first-priority + second-priority + third-priority content surface is now built. Remaining items are deferred to engineering (audit-your-own-image for any registry, live unauthenticated preview from landing) and minor polish (RSS digest, founder note expansion).

The site reads as a serious product across both demand-side (marketplace + receipts drawers + module compare + module detail with trust breakdown) and supply-side (publish contract + pipeline walkthrough + roadmap + security + incidents) surfaces. Every claim has its corresponding receipt or methodology page; every commitment the proposal said the site needed to make explicitly is made.
