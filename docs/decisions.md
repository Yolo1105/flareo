# Flareo decision log

This file is the canonical record for **gated decisions** — work that's deliberately deferred behind an evidence trigger. Each entry has:

- A **trigger criterion** (what must be true before the decision happens)
- A **decision date** (when we look at the evidence — usually a calendar reminder)
- A **pre-committed branch** (what we'll do based on what the data says, written *before* the data lands)
- A **dated entry log** below, append-only, where the actual decision and reasoning live

The point of this file: prevent motivated reasoning at decision time. The criteria are written when emotions are cold; the decision happens when emotions might be hot.

**The only rule:** don't relitigate the criteria at decision time. If the criteria turn out to be wrong, capture *that* as a meta-decision (a new entry: "we changed how we measure X because Y") rather than quietly shifting the goalposts.

---

## Active gates

### G-1 — F0 conversion-rate decision

**Status:** clock running. Day 0 = the date the analytics-wired Caddy reloads in production with the `(inject_analytics)` snippet active. Decision date = day 30 from then.

**What we're measuring:**
- Plausible site `preview.flareo.dev` — pageview count and unique visitors
- Plausible main site — `PreviewConversion` event count
- Conversion rate = `PreviewConversion` count / unique preview-site visitors

**Pre-committed branches (do not change at decision time):**

| Conversion rate | Action | What ships next |
|---|---|---|
| `< 5%` | Original kill criterion fires. Don't build per-user previews. | Reallocate the 6-8 weeks to docs, conversion, revenue work |
| `5-15%` | Weak signal. Build cheaper alternative. | Pick one of: `flareo run --ephemeral` (already shipped — promote it heavily), per-session shared reset (~1 week), recorded walkthroughs (~1 week per module) |
| `> 15%` | Real demand. F1 scaffold next session. | Schema + UI + stub allocator (1 session); F2 substrate decision after that |

**Day-0 anchor:** to be filled in by the operator when Caddy reloads. Format: `YYYY-MM-DD UTC`.

**Day-30 reminder:** add to your calendar / ticket system the day Caddy reloads. The reminder should say "F0 decision day — read the conversion rate, look up G-1 in decisions.md, follow the pre-committed branch."

**Boundary cases** (these are *not* relitigation, they're recognized ambiguities):

- Rate is a hairline 4.9% — treat as <5%. The boundary is the boundary; the asymmetry of premature building justifies erring conservative.
- Rate is exactly 5.0% — same: treat as bottom of the 5-15% band, build cheaper alternative.
- Sample is small (e.g. <500 unique preview visitors). Conversion rate from a small sample isn't reliable. **In this case, extend by 30 days, do not build either way.** Capture the extension as a dated entry; don't repeat indefinitely (max 2 extensions).

**Decision log:**
- *2026-04-26: speculative scaffold landed before any clock data. User explicitly authorized speculative build. Schema (`PreviewInstance`), allocator interface (`lib/preview/allocator.ts`) with stub implementation, API endpoints (`POST /api/v1/modules/[slug]/preview`, `GET/DELETE /api/v1/preview/[id]`), and UI surface (`LaunchPrivatePreviewButton` on signed-in module pages) are all in place. Stub allocator returns mock URLs that don't resolve — this is intentional; F2 swaps the real substrate in. The day-30 gate criteria below are unchanged; if the data says <5%, delete the speculative scaffold and the schema additions.*

---

### G-2 — Per-org policy override

**Status:** waiting for trigger.

**Trigger criteria (any one is sufficient):**

1. A specific paying customer asks for it as a hard requirement (contract or churn-risk signal)
2. ≥3 distinct prospects mention it in sales conversations within the same 90-day window — tracked in this file's "Per-org demand log" section below
3. A regulated-industry deal (gov, fintech, healthcare) is contingent on it

**What's pre-committed:**
- The plan in `phase-e-per-org-plan.md` is the implementation blueprint. Don't redesign on trigger; execute.
- If trigger #1 fires, design *for that customer's specific requirements* not the generic plan. Real customer asks have surprises.
- If trigger #2 or #3 fires, follow the generic plan as-is.

**Demand log (append-only, date + source + ask):**

| Date | Source | What they asked for | Tier signal |
|------|--------|---------------------|-------------|
| *(empty)* | | | |

When this table reaches 3 entries within a 90-day rolling window, trigger #2 fires. Pre-commit to acting within 1 week of trigger fire — schedule the per-org session, don't let it slip.

**Decision log:**
- *2026-04-26: speculative scaffold landed before trigger fired. User explicitly authorized speculative build. Schema (`Org`, `OrgMember`, `AdmissionPolicyOrg`) and data layer (`lib/db/org-policy.ts`) are in place. No admin UI for managing per-org policies yet — wait until first real org needs one to design the right surface. When a real customer arrives, expect to redesign based on their requirements; the schema is the educated guess.*

---

### G-3 — SLSA L3

**Status:** waiting for trigger. Premise superseded — no SLSA build level is claimed.

The republish pipeline re-publishes upstream images rather than building them, so no SLSA build level is claimed at any level. The fourth trust signal is now provenance (Rekor entry present, upstream digest recorded), not SLSA. This gate's premise was superseded by ADR-012 and is retained as a record.

**Trigger criteria (any one is sufficient):**

1. A specific paying customer or prospect requires L3 as a precondition for purchase
2. ≥2 distinct prospects mention SLSA L3 specifically in sales conversations within the same 90-day window
3. A competitor (Chainguard, Docker Verified Publisher, etc.) materially gates revenue with L3 status

**What L3 actually requires:**
- Hermetic builders (one job cannot influence another) — not solvable on shared GitHub Actions runners
- Two implementation paths to evaluate when triggered:
  - Pay for Chainguard's L3-certified build infrastructure (cost-driven decision)
  - Run a hermetic builder on bare metal (operations-driven decision)

**Pre-committed scope when triggered:**
- 4 weeks of work, blocked behind hermetic builder access
- Update `/docs/threat-model` and `/docs/signing` to remove the "no customer has asked" framing
- Re-run SLSA attestations for all existing modules under the new builder (rebuild canary)

**Demand log:**

| Date | Source | What they asked for | Customer status |
|------|--------|---------------------|------------------|
| *(empty)* | | | |

**Decision log:**
- *2026-04-26: speculative scaffold landed before trigger fired. User explicitly authorized speculative build. Schema (`ModuleProvenance`) and read helpers (`lib/db/provenance.ts`) are in place. Worker doesn't yet write to the table; canary rebuild needs an L3-aware mode for that. The L3 build infrastructure decision (Chainguard vs hermetic builders) is unchanged — that's a customer-driven decision when a real customer arrives.*

---

### G-4 — Reproducible builds (Diffoscope)

**Status:** waiting for trigger. Lower priority than L3 but related.

**Trigger criteria:**

1. SLSA L3 work is in progress (reproducible builds are a natural extension)
2. A research/security customer asks for cryptographic build verification (rare but real for high-assurance contexts)
3. We accumulate enough non-determinism reports from publishers that batch-fixing makes sense

**Pre-committed scope:**
- Diffoscope-based CI that compares two independent builds of the same source
- Per-module work to fix non-determinism (timestamps, build-host metadata, compiler outputs)
- Not gateable on a single decision — it's a long road, ~1 module per week

**Decision log:**
- *2026-04-26: speculative scaffold landed alongside G-3 (same `ModuleProvenance` table tracks both). User explicitly authorized speculative build. The Diffoscope verification pipeline itself is not built — that's per-module work that only pays off after L3 hermetic builders are in place.*

---

### G-5 — Self-host Enterprise bundle

**Status:** waiting for trigger. Mentioned in roadmap; not built.

**Trigger criteria:**

1. A specific Enterprise prospect requires self-hosting as a precondition (contract terms with deal value > €5k/month)
2. Multi-tenant compliance audit (SOC 2, ISO 27001) becomes a deal-blocker that self-hosting would resolve

**Pre-committed scope:**
- Self-host bundle = Docker Compose + Postgres + Redis + Build worker + minimal Caddy
- Customer-managed Stripe + email + cosign keys
- ~3 weeks engineering, ~1 week documentation

**Decision log:**
- *2026-04-26: speculative scaffold landed before trigger fired. User explicitly authorized speculative build. Schema (`Org.selfHostedAt`) is in place. Bundle artifacts under `selfhost/README.md` document what ships when the trigger fires. The actual docker-compose bundle is not built — that's a 3-week effort and only worth doing against a specific customer's requirements.*

---

## How to use this file

- **At decision time** for an active gate: open this file, find the gate, read the pre-committed branch, follow it. Don't read the rest of the file. Don't read external advice. The whole point is to use what cold-you decided.
- **When a demand-log entry comes in:** add a row immediately. Don't wait for the conversation to "feel important enough." Inflated criteria are how the failure mode happens.
- **When you want to add a new gate:** add it. Future-you adding criteria for future-decisions is exactly the pattern this file exists for.
- **When you want to change criteria for an existing gate:** add a *meta-decision* entry. Don't quietly edit. The audit trail is the value.

---

## Closed gates / completed decisions

*(empty)*
