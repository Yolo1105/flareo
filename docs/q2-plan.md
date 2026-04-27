# Q2 Plan — Flareo

Written alongside `q1-retro.md`. This plan has a twist: the first week is verification-focused, not feature-focused, because Q1 shipped code ahead of verified reality. The rest of Q2 branches based on what that first week turns up.

## Q2 thesis

Q1 was "build the product". Q2 is **"prove the product works and get the first five people who aren't me to use it"**. The shift is from implementation to traction. Feature work continues but is scoped narrowly; the main activity is external-facing.

Ship criterion for the quarter: **three paying customers by end of Week 13**. Not "one", not "a pipeline to accept payment" — three people who were not previously in my orbit, who submitted or are using Flareo modules in production, who have paid €12/month for at least one billing cycle.

This is deliberately harder than Q1's "one paying customer" because Q1's target was written before Stripe existed; with Stripe shipped, the remaining bottleneck is acquisition, not infrastructure.

## Week 1 — Verification

No new features. Five items. This week is fixed scope.

1. **Execute the red-team day.** Full calendar day blocked, no other work. Work through `docs/red-team-playbook.md`'s fourteen attacks on the dedicated build host (confirm separation from preview host first). Any fail blocks public opening until remediated. Record outcomes in a new `RED_TEAM_RESULTS_2026Q2.md`.

2. **Confirm five end-to-end submissions from non-maintainers.** Reach out to 5-10 candidates — people who emailed about Flareo during Q1, small homelab Discord communities, r/selfhosted contacts. Goal: five people submit a real module, each gets approved or meaningfully rejected. Track in a spreadsheet: who, when submitted, decision, time-to-decision, pain points.

3. **Observe one unattended weekend.** Friday evening through Monday morning with the pipeline live. Check Monday: Sentry clean, DLQ empty, heartbeat green, approvals process in normal windows. Document outcome in a note.

4. **Provision Stripe in production.** Create production account. Create Pro product at €12/mo. Configure live webhook endpoint. Update prod env with the three Stripe vars. Pay the first real invoice as a test (use a personal card, refund later).

5. **Provision Plausible.** Create site at plausible.io for flareo.dev. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in prod env. Verify events show up for at least one of `SubmissionCreated`, `UpgradeClicked` (seed by doing each yourself once).

Week 1 ends with a short `week-1-verification-results.md` documenting what passed, what failed, what's open.

## Week 2 — Branching decision

Based on Week 1 outcomes, Q2 takes one of four shapes. **Commit to the shape at the start of Week 2; don't drift between them.**

### Shape A — "All green, accelerate"

*If:* red-team passed, five submissions landed cleanly, weekend survived, Stripe/Plausible provisioned.

*Then:* classic Q2 feature work. Weeks 2-13:
- Private module submission flow (schema is ready; endpoint needs a `visibility` field)
- DLQ dismissal UI (retry / give up, reasoning saved to audit log)
- VerifyToolUsed event wiring + CLI-sourced events
- Canary rebuild observability surface in admin
- One of: Firecracker sandbox (if red-team suggested it), or a second admin (to de-risk vacation coverage)
- Marketing cycle: one blog post per week, one HN/r/selfhosted post per month, two podcast or newsletter pitches

### Shape B — "Pipeline fragile, stabilize"

*If:* red-team or unattended weekend surfaced real problems, or the first five submissions failed in unexpected ways.

*Then:* Weeks 2-6 are hardening work (fix the specific findings, extend tests, add observability around the weak spots). Weeks 7-13 resume Shape-A feature work at reduced scope.

### Shape C — "Acquisition bottleneck, pivot outward"

*If:* pipeline is solid but no one signed up despite outreach.

*Then:* Q2 is marketing-dominant. Weeks 2-13:
- Conference talk submission (KubeCon, SREcon, FOSDEM)
- Three long-form blog posts on the supply-chain thesis
- Direct outreach to 50+ potential users (1-on-1)
- Product adjustments based on what the conversations surface (possibly: self-hosted enterprise story, or a free-for-small-teams tier, or something else entirely unforeseen)
- Feature work paused except for whatever individual conversations reveal as a blocker

### Shape D — "Something surprising"

*If:* Week 1 surfaces something none of A/B/C anticipates — a structural technical problem, a regulatory issue, a lost interest, a better-than-expected reception that demands different moves.

*Then:* write a fresh Week 2 plan at that point. The Q1 plan's own framing applies: *"This document is a starting position, not a contract."*

## Fixed items regardless of shape

These happen in Q2 independent of the branch:

- **Week 13 retro.** Same pattern as this one. Non-optional.
- **Monthly post-mortems for any outage or incident.** Published to `/docs/incidents/` so the trust story accumulates in public.
- **One unattended weekend per month** as ongoing validation. If a weekend fails, Shape B takes priority over whatever else was scheduled.
- **Known-loose-ends cleanup.** `VerifyToolUsed` event wiring, CLI analytics, private-module submission endpoint — these happen in background slots between larger items. No formal phase.

## Explicit non-goals

Things that are NOT in Q2:

- **A team.** Solo for at least Q2. Considering help only in Q3 if sustainable cadence proves otherwise.
- **Enterprise tier.** Pricing page cut Enterprise in Q1 deliberately; Q2 doesn't put it back until at least 20 paying Pro customers exist.
- **Multi-region or HA deploy.** One Hetzner box is enough until the pipeline regularly saturates.
- **Firecracker preview subsystem rebuild.** The existing shared-preview approach handles current load. Horizon 3 in the original multi-horizon plan; stays there.
- **API rate limits keyed on plan.** Seam exists, nothing reads it; can ship in Q3 when an actual Pro user complains about free-tier limits.
- **SSO / SAML.** Listed as roadmap on the pricing page; no demand signal yet to build it.

## Kill criteria

Q2 stops and becomes a replan if any of these happen:

- **End of Week 6 (halfway mark):** if zero paying customers and zero clear path to the first, the quarter pivots to whatever the replan decides. Don't grind through Weeks 7-13 hoping for a miracle.
- **Red-team finds a critical sandbox escape and it's not fixable within two weeks:** the pipeline is closed to public submissions until resolved. Code pauses; fix takes over.
- **Health signal on `/app/admin/worker` is red for more than 48h:** operational work takes priority over whatever feature is scheduled.

## How this document gets used

Q2 week 1 starts with a re-read of this doc (plus `q1-retro.md`). The branching decision at the start of Week 2 gets written into a new note: `q2-shape.md`, which says "we are doing Shape A/B/C/D because [reason]" and that decision persists for the quarter.

End of Q2 produces `q2-retro.md` on the same pattern as Q1's.

## Open questions I'll want answers to by Week 6

Not decisions, just things I want data on:

- What's the real median time from "user submits" to "user sees their module live"? (end-to-end)
- What % of submissions fail on each failure kind? User vs scan vs system?
- What % of the free-tier cap actually gets hit? Is €12 the right price?
- Which use-case page has the highest conversion to signup? Which has the lowest?
- Are there repeat submitters, or does each submission come from a different person?

Plausible + DB + Stripe between them will answer these by Week 6.
