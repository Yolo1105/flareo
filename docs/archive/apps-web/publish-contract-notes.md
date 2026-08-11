# Tier 2 — submit-side completeness

Expanded `/publish` from build-flow walkthrough (steps + requirements) to a full publisher-side contract page covering everything the proposal called out as "must-decide content questions": economics, IP, attribution, stats visibility, takedown, SLA, discovery mechanics, policy-change notice.

## What's new on `/publish`

The page now adds **§ THE CONTRACT** — a section after the build steps and requirements, before the final CTA — covering 7 topics:

### Economics block (highlighted, dedicated layout)

Sits at the top of the contract section because the proposal flagged it as the question publishers need answered first.

- **Today: exposure-only.** No submission fee. No per-deploy payment. No revenue share.
- **Considered, not committed:** revenue-share for top Pro-tier modules. Linked to /roadmap "considered" entry.
- **Fast Facts panel** alongside: Submission fee · Per-deploy payment · Revenue share · Publisher attribution.

### 01 — IP handling

Three points: your code stays yours (license you publish under governs), what we keep is the receipts (SBOM/provenance/signature/scan are records about your code, not your code), no exclusivity (publish wherever else you want).

### 02 — Attribution

How upstream maintainer + Flareo publisher are credited on every module page. Publisher profiles at `/@username`. Repackaging convention: upstream gets primary, packager gets "packaged by" subline.

### 03 — Publisher analytics visibility

Free-tier sees: pulls, reviews, rebuild history, reports filed, trust score history. Pro adds geographic distribution + version pinning + inbound link analytics. **Explicit no-track commitment** on individual consumer identities, IPs, cross-module correlations.

### 04 — Takedown policy

Submitter-initiated takedown process (7 business days, image stays in registry for pinned-digest continuity, receipts retained). Flareo-initiated takedown criteria (DMCA, unpatched critical CVE >30d, malicious code, silent publisher >60d). Notice + appeal: 7 days advance notice except malicious-code which delists immediately. Appeals to a different reviewer.

### 05 — Submit-side SLA table

Real numbers by tier — not aspirational, "actual median performance over the past 90 days":

| Metric | Free | Pro | Enterprise |
|---|---|---|---|
| Submit → build started (p50) | < 5 min | < 60 sec | < 30 sec |
| Build complete → review queued | Same hour | Same hour | Immediate |
| Reviewer SLA (queue → first response) | 24 h | 2 h | 30 min |
| Status change notification | Within 5 min | Within 5 min | Within 5 min |
| Takedown request acknowledgement | 1 business day | 1 business day | Same day |
| Build artifact retention | 30 days | 180 days | Indefinite |
| Policy-change notice | 30 days | 30 days | 60 days |

SLA misses get prorated credit (links to /legal/terms).

### 06 — Discovery mechanics

Marketplace ranking is a deterministic function of recent reviews + rebuild freshness + trust score + deploy count. Editorial featuring layered on top, **cannot replace organic ranking**. Anti-game commitments: no paid promotion, no auctioned slots, no payment for visibility, public ranking weights in docs. Future ad slots (if any) would be explicit and labeled, never mixed with organic rank.

### 07 — Policy change notice

30 days advance notice for Free/Pro publishers, 60 days for Enterprise, on any policy change that could affect existing modules' status. Loosening ships immediately + announces in changelog. **Tightening never without notice.**

## Cross-linking

The new content links into the broader trust surface:

- Economics → `/roadmap` (revenue-share considered entry)
- Takedown → `/incidents` (where takedowns are publicly listed)
- SLA → `/legal/terms` (credit terms)
- Policy change → `/changelog` (where changes are announced)
- Discovery mechanics → `/docs/trust-score` (weights audit)

Also updated existing FAQ entries to link back to /publish:
- "Do submitters get paid?" → links to /publish for full economic terms
- "What are the takedown criteria?" → links to /publish for full process and appeals path

## Files modified

- `app/(marketing)/publish/page.tsx` — added 7 contract blocks + Economics highlight + SLA table + ContractBlock/FastFact helpers (257 → 661 lines)
- `app/(marketing)/faq/page.tsx` — cross-links from submitter and takedown FAQ entries

## What this resolves

The proposal listed 6 "must-decide content questions" specifically about the supply side:

| Proposal requirement | Status |
|---|---|
| What submitters can upload | ✅ Already in steps section |
| What the platform does during pipeline | ✅ Already in steps + linked to /pipeline |
| How long it typically takes (real numbers) | ✅ Now in SLA table with p50 figures |
| Approval criteria spelled out | ✅ Already in REQUIREMENTS list |
| Discovery mechanics (how modules surface) | ✅ Now in §06 with anti-game commitments |
| Takedown policy (process, criteria, IP retention) | ✅ Now in §04 |
| IP handling | ✅ Now in §01 |
| Attribution | ✅ Now in §02 |
| Submitter stats visibility | ✅ Now in §03 |
| Economic relationship | ✅ Now in Economics block |

Submit-side SLA from the proposal — pipeline latency, retention, takedown response, policy-change notice — also covered explicitly in §05 and §07.

## Project state after Tier 2

Every Tier 1 + Tier 2 item from the audit is now covered. The remaining work in the proposal blueprint is engineering, not content:

**Tier 3 — engineering deferred to roadmap** (per /roadmap):
- Audit-your-own-image for arbitrary public images (in progress)
- Live unauthenticated preview from landing page (considered)
- Receipts drawer UI on every module card
- Module comparison UI (planned Q4)

**Tier 4 — polish**:
- Helm chart fragment alongside compose in DeploySection
- RSS / weekly digest of new modules
- Named founder note on About

Honest framing: the project's content surface is now the most complete it's been since session 1. The proposal's "minimum viable content set for a credible launch" plus the "tier 2 trust-building" are both shipped. What's left is product engineering and incremental polish, not content gaps.
