# Tier 1 trust-content session

Built the proposal's "essential trust-building content" — six new pages plus one component on the module detail page. All content/honest-framing work, no schema or backend changes.

## What's new

### 1. Trust Score breakdown component (`components/sections/module-detail/TrustBreakdown.tsx`)

Renders below the module hero on every module detail page. Four-card panel showing each contribution to the headline trust number:

- VULNERABILITY POSTURE (max 40, varies by CVE counts)
- SLSA ATTESTATION (max 25)
- SIGNATURE CHAIN (max 20)
- SBOM COMPLETENESS (max 15)

Each card has the value, max, percentage bar, sub-label explaining why that score, color-graded by tier (≥90% good, ≥60% warn, <60% bad). Methodology link points at /docs/trust-score.

This addresses the proposal's Trust Score "first-class content" requirement — until now the score was a single number with no decomposition. Now visitors see the proof.

### 2. `/docs/trust-score` methodology page

Full methodology: the formula, every weight, the rationale for each weight, color thresholds, what the score is NOT (not a reachability analysis, not operational quality, not maintainer reputation, not a guarantee), open questions about user-tunability with three positions laid out, audit-it-yourself shell snippets.

Added to the docs sidebar under "Security" between Threat model and How we sign modules.

### 3. `/faq` page

Four sections, 14 questions answering the proposal's specific objections:

- **Why this exists** — Docker Hub, Artifact Hub, Railway/Fly/Vercel, Coolify/Dokku comparisons
- **How verification works** — what "verified" means, "is a verified module still malicious", who reviews the admin review, can I verify independently
- **Operations and limits** — what data Flareo sees during preview, preview expiry behavior, what happens if Flareo shuts down, can I self-host
- **Submitting modules** — do submitters get paid, abandoned upstream, takedown criteria, what happens to my code on takedown

Proposal called this "Tier 1 trust-building content."

### 4. `/roadmap` page

Five categories — shipped / in progress / planned / considered / parked — with concrete entries in each. Items include:

- **Shipped**: marketplace + pipeline pages, demo signin, reviews + reports + featured + profiles, build worker + Stripe billing, public catalog of 12 modules
- **In progress**: audit-your-own-image for any registry
- **Planned**: CNB auto-detect (Q3), VEX annotation surface (Q3), policy-as-code gate (Q4), self-host bundle (Q4), module comparison UI (Q4)
- **Considered**: live unauthenticated preview, submitter revenue share, user-tunable Trust Score weights, RSS digest
- **Parked**: mobile app, marketplace search by image hash

Includes a closing "How items move between categories" section explaining the rules — including the honest one: "Planned → considered when a date slips, rather than rolling the date silently."

The roadmap page also closes a dangling thread from Session 2 — the `/pipeline` page references "ETA: 2026 Q3" for VEX/CNB and now those references have a destination.

### 5. `/security` page

Five sections covering responsible disclosure end-to-end:

- **How to report** — security@flareo.dev, PGP fingerprint, urgent-exploit subject convention
- **In scope / out of scope** — explicit lists. In scope: pipeline integrity, sandbox escapes, auth bugs, privilege escalation, Trust Score forgery, web vulns, malicious modules. Out of scope: upstream project vulns, missing security headers on marketing pages, SPF/DMARC tuning, self-XSS, DDoS, scanner-generated reports without proof.
- **Response timeline** — acknowledgement 24h, triage 72h, mitigation by severity (P0 24h, P1 7d, P2 30d, P3 best-effort), coordinated disclosure 90d, public incident log entry after disclosure
- **Safe harbor** — explicit "we will not pursue legal action" wording with conditions
- **Bounty program** — honest "we don't run a paid one yet, here's why and what we offer instead" rather than silence

### 6. `/incidents` page

Public log with empty-state framing — at launch the list is empty, the page explains exactly what kinds of incidents will appear here, why we publish even bad-looking ones, and that "empty is honest, empty is also temporary."

Six "what goes here" cards: Platform vulnerabilities, Module CVEs discovered post-listing, Modules taken down, Supply-chain events, Operational incidents, Postmortems.

The empty-state itself reads: "We've kept this page visible from launch (rather than waiting until we have something to put on it) because the commitment to publish is the part you can verify before any incident exists." That's the proposal's "publishing the policy of how the unhappy path works" principle made concrete.

### 7. "What Flareo is not" section on About

The proposal called this out specifically. Six negation cards inserted between the founder note and Quick Facts:

- Not a hosting platform
- Not a CI/CD tool
- Not a Kubernetes distribution
- Not a Docker Hub replacement
- Not an enterprise compliance product
- Not a moat against malicious code (with link to FAQ)

Closing paragraph: "Defining scope negatively clarifies positioning and reduces the mismatched-expectation conversations that drain support time. Counterintuitively, saying clearly 'we don't do X' is one of the stronger signals you can give a sophisticated audience."

### Footer expansion

Added Roadmap, FAQ, Security, Incidents to the footer. Made the footer wrap on narrow widths so 11 links fit gracefully. All four new top-level pages now reachable from any page.

## What this resolves from the audit

| Tier 1 item from audit | Status |
|---|---|
| Trust Score breakdown panel on module detail | ✅ Done |
| Trust Score methodology page | ✅ Done |
| General FAQ page preempting top objections | ✅ Done |
| "What Flareo is not" section | ✅ Done (on About) |
| Roadmap page | ✅ Done |
| Public incident log | ✅ Done (empty-state at launch) |
| Security contact + responsible disclosure | ✅ Done |

## What's still outstanding (Tier 2 + Tier 3)

**Tier 2 — submit-side completeness**: expand `/publish` page to cover takedown policy, IP handling, attribution, economic relationship more explicitly. Currently the page covers the build flow well but underplays the contract terms. One focused session.

**Tier 3 — engineering work, not content**:
- Audit-your-own-image for arbitrary public images (in-progress per roadmap)
- Live unauthenticated preview from landing (Caddy + DinD orchestration, considered)
- "Receipts drawer" UI on every module card (proposal Idea 3)
- Module comparison UI (planned for Q4)

**Tier 4 — polish**:
- Helm chart fragment alongside compose
- RSS / weekly digest
- Named founder note expansion

## Files added

- `app/(marketing)/faq/page.tsx`
- `app/(marketing)/roadmap/page.tsx`
- `app/(marketing)/security/page.tsx`
- `app/(marketing)/incidents/page.tsx`
- `app/docs/trust-score/page.tsx`
- `app/docs/trust-score/content.mdx`
- `components/sections/module-detail/TrustBreakdown.tsx`

## Files modified

- `app/(marketing)/modules/[slug]/page.tsx` — wire TrustBreakdown
- `app/(marketing)/about/page.tsx` — "What Flareo is not" section + NotCard helper
- `lib/docs/sidebar.ts` — trust-score under Security
- `lib/data/nav.ts` — Roadmap, FAQ, Security, Incidents in footer
- `components/layout/Footer.tsx` — wrap support for additional links

## Project state

Every Tier 1 trust-building content piece from the proposal audit is now present. The commitments the proposal said the site needed to make explicitly — about submitter economics, about preview data, about takedown, about what happens if Flareo shuts down, about responsible disclosure, about scope boundaries — all have public surfaces with concrete answers.

The platform now reads as a serious product: substantive engineering, honest content, no claims-without-proof, no silence on the questions that matter.
