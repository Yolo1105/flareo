# Horizon 2 plan

Written at the end of the 8-week MVP. Covers the 6-9 months after public launch.

The three candidate bets:

1. **Submission review UI** — unblock third-party module publishing fully
2. **Per-user Firecracker previews** — the differentiated technical feature
3. **Paid tier** — revenue

This document picks an order, estimates effort honestly, and notes the decision points that should make us revisit the plan.

---

## The honest starting position

End of Week 8. Public beta is live. What we know:

- 12 modules in the catalog, all signed, all verifiable
- CLI v0.3.0 with 9 real commands
- Infrastructure cost: ~€24/mo (Hetzner only, rest is free tiers)
- One person building, operating, doing support
- No revenue. No paying customers. No pressure from investors.
- Waitlist count: unknown at time of writing; will matter for prioritization

What we **don't** know yet, which will shape the first 30 days:

- Which features do real users ask about? (We'll find out.)
- How many people are willing to submit a module once we open submissions? (5? 50? 500?)
- Is the "don't trust us, verify yourself" pitch resonating with the target audience or falling flat?
- Does the preview demo model feel like a feature or a limitation?
- What's the actual infra load once real traffic starts?

**The plan below is not final.** It's a starting position. Week 2 after launch, I should revisit and replace half of it with what's actually loud.

---

## The three bets, in detail

### Bet 1: Submission review UI

**The product shape.** Third-party contributors can propose a module via `flareo publish` (already shipped in Week 8 as the endpoint). What's missing: the reviewer side. An admin UI at `/app/admin/submissions` where a reviewer (me, initially) can:

- See the queue of pending submissions
- Read the submitted manifest + Dockerfile
- Check the upstream repo's activity, license, popularity heuristics
- Approve or reject with a note back to the submitter
- On approval, kick off the canary pipeline's ingestion of the new recipe
- On rejection, email the submitter with the reason

**Effort estimate.** 3-4 weeks of full-time work, or 6-8 weeks part-time.

Breakdown:
- Admin UI pages (queue list, detail view, action form): 1 week
- Review workflow backend (state transitions, audit log, email notifications via Resend): 1 week
- Canary recipe authoring helper (scaffold a recipe from a submission's manifest + Dockerfile): 1 week
- Feedback loop with real submitters (we'll discover unknowns): 1 week of reactive work

**Why it matters.** Without a review UI, submissions pile up in a DB table and I process them from `psql`. That works for 1-2 per week, not for 20-50. Once we're advertising third-party publishing on the marketing site, someone has to actually turn those submissions into modules, and doing it by hand bottlenecks at me.

**Why it's risky.** This is the classic "build a product I'm the only user of" trap. Until we have real submitters, I'm building admin UI for myself. If the first 30 days of launch show submissions are <5/week, this feature's ROI is negative vs. just doing it from the terminal.

**Kill criterion.** If we're below 3 submissions/week 30 days after launch, defer this indefinitely. The psql workflow is fine.

**Ship criterion.** If we're at 10+/week, this is the #1 priority. Above 20/week, panic and ship it in 2 weeks by cutting features ruthlessly.

### Bet 2: Per-user Firecracker previews

**The product shape.** Instead of one shared preview per module, give each signed-in user a private, isolated instance. They can push real test data without it being visible to anyone else. Runs in a Firecracker microVM (not a Docker container) for strong isolation. Auto-destroys after 2 hours of inactivity.

**Why Firecracker, not Docker.** Docker containers share a kernel; a malicious container can potentially escape to the host. That's fine for our own canary builds (we trust our Dockerfiles) but not fine for letting arbitrary users run arbitrary workloads. Firecracker gives us kernel-level isolation at ~125ms startup, 5MB overhead per VM — it's what AWS Lambda uses.

**Effort estimate.** 6-8 weeks of full-time work. The biggest single feature we'd ship.

Breakdown:
- Firecracker host infrastructure: configure Debian bare-metal or dedicated Hetzner, build rootfs images per module, API for create/destroy/attach — 2 weeks
- Networking: each VM gets a unique subdomain `u-<userid>-<slug>-<nonce>.preview.flareo.dev`, Caddy or direct-to-VM routing — 1 week
- Lifecycle management: idle timeout, resource limits, concurrent-VM-per-user cap, abuse prevention — 1 week
- Web UI integration: "Launch a preview" button on the module page, status tracking, "your active preview" panel in the dashboard — 1 week
- Billing gate (only if paid tier ships first): enforce quotas, bill for overage — 1 week
- Operational hardening: per-VM resource monitoring, log collection, the incident response story for "a user runs something abusive" — 1-2 weeks

**Why it matters.** The shared demos are a weak artifact today. They're fine for "click around and see what the UI looks like" but they don't let a prospective user test-drive with their real config. A per-user preview turns the demo into a trial. That's a 10x product improvement for anyone seriously evaluating self-hosted alternatives.

**Why it's risky.** This is a huge amount of infrastructure work for a feature that's mostly a marketing moat. A sophisticated user can just `docker run` the signed image on their laptop and get a better trial experience than any hosted preview. The value is for the non-sophisticated user who wants to evaluate without touching Docker — and that audience may not exist at the scale that justifies 6-8 weeks of work.

**Kill criterion.** If analytics at day 30 show <5% of shared-demo visitors do anything beyond "click around and leave," per-user previews don't solve a real problem. Defer.

**Ship criterion.** If we're seeing >15% of demo visitors go on to install the CLI or sign up for the waitlist, there's real evaluation demand and per-user previews compound that.

### Bet 3: Paid tier

**The product shape.** A paid plan that includes things the free plan can't sustainably give away:

- Higher API rate limits (5k verify/hour, 30k modules/hour)
- Per-user preview quota (say, 5 concurrent previews, 24-hour TTL) — if Bet 2 ships
- Priority review queue for submissions — if Bet 1 ships
- Private module catalog — modules published by the customer's org, visible only to their team
- Support SLA: 24h response time on email, vs. best-effort

Pricing hypothesis: **€12/mo for individual, €120/mo for small team (up to 10 seats), custom for enterprise.** No free trial; just "upgrade any time, cancel any time." Stripe-based billing.

**Effort estimate.** 3-4 weeks full-time, or 6 weeks part-time.

Breakdown:
- Stripe integration: checkout, subscription management, webhook handlers, invoice generation — 1 week
- Billing-aware rate limits and quotas — 1 week
- Self-service upgrade/downgrade/cancel UI in `/app/billing` — 1 week
- Dunning emails, failed-payment handling — 0.5 week
- Tax handling: VAT ID collection in EU, US sales tax decisions, receipts — 0.5 week
- Customer support email infrastructure (already have `hello@flareo.dev`; need a triage setup) — 0.5 week

**Why it matters.** It's how the project survives past the "personal project" phase. €24/mo infra costs are fine for me to eat today, but the first time we need paid Postgres, paid Redis, paid email sending at volume, or paid observability, we want already-established revenue to cover it.

**Why it's risky.** Premature paid tiers kill momentum. If the free tier isn't compelling enough for widespread adoption, a paid tier on top is just a gate keeping users out. Every self-hosted user I've ever talked to would rather run the software themselves than pay for a hosted version of it.

**Kill criterion.** If month-1 engagement metrics are flat (say <200 active CLI installs), a paid tier is premature. Keep running on infra generosity until there's actual pull.

**Ship criterion.** If we're hitting free-tier abuse patterns (someone scraping our API at 60k req/day) AND we have >500 active users by month 3, the paid tier is both needed and ready.

---

## Sequencing

The three bets aren't independent. Here's the logic:

**Bet 3 (Paid tier) has prerequisites from Bet 1 and Bet 2.** "Priority review queue" only makes sense if review is a real queue (Bet 1). "Higher preview quota" only makes sense if per-user previews exist (Bet 2). So Bet 3 should follow at least one of the other two.

**Bet 1 (Review UI) has a weak prerequisite on usage data.** Until we know whether submissions are actually coming in, building the review UI is speculative. 30 days of post-launch data tells us.

**Bet 2 (Firecracker previews) has no prerequisites but the highest cost.** It's also the only one that's a big infrastructure project — the other two are mostly web UI and business logic. 6-8 weeks of infrastructure work without intermediate shippable value is a big risk for a one-person team.

**My recommendation for sequencing, assuming the launch goes well:**

```
Week 1-4 post-launch:
  Nothing structural. Triage, bug fixes, operational work.
  Measure: signups, CLI installs, API calls, demo visits, submissions.

Week 5-8:
  Small features driven by what broke or what users asked for repeatedly.
  Build what the month-1 data said was loud, not what the plan said.

Week 9-12:
  Decision point. Look at the kill/ship criteria above.
  Pick ONE of the three bets — the one with the clearest evidence.
  Build it.

Week 13-20:
  Ship it. Keep triage work going in parallel.
  If paid tier was picked first, Bet 1 and Bet 2 slide to later.
  If Bet 1 or Bet 2 was picked, revisit paid tier at week 20.

Week 21+:
  Second bet, chosen based on what shipping the first bet revealed.
```

**If I had to commit today to an order without post-launch data, the order would be:**

1. **Bet 1 (Review UI)** — because it unblocks the product promise ("submit your own module") without a big infrastructure gamble. 3-4 weeks. Minimum viable review flow is small.

2. **Bet 3 (Paid tier)** — because it tests whether anyone will actually pay, and the first paid customer is a much stronger signal than any vanity metric. 3-4 weeks. If nobody converts, we learn something important.

3. **Bet 2 (Firecracker previews)** — because it's the biggest gamble and should only happen after we have revenue supporting it. 6-8 weeks. Would probably need Horizon 3 / hiring before this is realistic.

The reasoning: small-to-medium bets first. Keep the big bet (Firecracker) for when we have either (a) a team, (b) revenue, or (c) extremely strong demand signal. Today we have none of those.

---

## What I'd drop from the plan entirely

The features that feel important but probably aren't:

- **Custom domain support for Flareo instances.** Some people will ask. Nobody actually needs it at current scale.
- **OIDC / SAML / SSO.** Hard to build, small audience, zero revenue until enterprise.
- **Windows native binary for the CLI.** WSL2 works. Not worth the cross-compile complexity.
- **Helm chart for deploying Flareo modules.** We give Compose files; if someone wants Helm they can convert, or use kompose.
- **Multi-registry support (GHCR, Docker Hub pushes alongside ECR).** ECR Public is free and works. Multi-registry complicates the signing story without benefit.
- **Real-time collaboration features.** (What does this even mean for Flareo? People ask sometimes. The answer is nothing.)
- **AI-assisted module authoring.** Tempting to build, ~100% certain to be a distraction.

Each of these could be a month of work. None of them move the needle on "is Flareo a good product for its target users."

---

## The operational load question

One thing the 8-week MVP plan didn't account for: running a live service takes real hours. Post-launch reality looks roughly like:

- **Week 1-4**: 10-15 hours/week on support, incident triage, small fixes
- **Week 5-12**: 5-8 hours/week once things settle
- **Ongoing**: 3-5 hours/week in steady state

If I'm working on Flareo full-time, these hours are absorbed. If I'm working on it nights and weekends, they compete directly with feature work. The plan above assumes ~20 hours/week of feature work capacity; less than that and it all slides.

**Decision for Horizon 2:** if I don't have at least 20 feature-hours/week available after triage, I pick ONE bet and go slow, rather than trying to juggle multiple tracks.

---

## Infrastructure cost projections

Today: ~€24/mo (Hetzner preview box only).

Horizon 2 cost scenarios:

**If Bet 1 ships only (Review UI, no infrastructure change):**
- Vercel: still free tier until we hit serverless function quotas
- Neon: still free tier until 500MB DB
- Upstash: still free tier
- Resend: moves from free (100/day) to first paid tier (€20/mo for 50k/mo) once we start sending submission-decision emails
- **Total: ~€44/mo**

**If Bet 2 ships (Firecracker previews):**
- Dedicated server: Hetzner EX44 (AMD Ryzen 5, 64GB RAM, NVMe) at €39/mo, or AX41-NVMe at €50/mo for more headroom
- Additional Cloudflare costs if we need Cloudflare Workers for routing: marginal
- **Total: ~€70-85/mo**

**If Bet 3 ships (paid tier):**
- Stripe: 1.5% + €0.25 per EU card transaction. At 50 subs × €12, that's ~€12.50/mo in fees on €600 revenue — negligible
- No direct infrastructure cost
- **Offset: revenue. Assume 2% of active users convert at €12/mo. At 500 users, that's €120/mo revenue, netting against costs.**

**Breakeven scenarios:**

| Active users | Paid conversion rate | Monthly revenue | Monthly cost | Net       |
|-------------|----------------------|-----------------|--------------|-----------|
| 500         | 2%                   | €120            | €70          | +€50      |
| 1000        | 2%                   | €240            | €85          | +€155     |
| 1000        | 5%                   | €600            | €85          | +€515     |
| 500         | 0.5%                 | €30             | €70          | -€40      |

The breakeven isn't catastrophic in any realistic scenario. Even a failed paid tier just resets to "I'm losing €50/mo on a side project" which is manageable.

---

## What success looks like at end of Horizon 2

Measurable outcomes, in order of importance:

1. **20+ third-party modules in the catalog**, published via the submission flow (not hand-added by me). Proves the publishing story works.
2. **500+ active CLI installs**, measured by weekly unique API-key callers. Proves the product is actually used.
3. **>95% uptime on the public API** over 6 months. Operational maturity.
4. **10+ paying customers** on the paid tier, totaling >€100/mo. Proves anyone will pay at all.
5. **No catastrophic security incidents.** Not a checkbox; a requirement.

What's specifically NOT on this list:

- "X Twitter followers" — vanity
- "Mentioned in Y podcast" — nice but orthogonal
- "Added feature Z" — features aren't outcomes
- "Onboarded enterprise customer A" — premature for Horizon 2; that's Horizon 3

---

## What I'd revisit every 30 days

These are the questions to ask myself at the end of each month during Horizon 2. Write down the answers. If the pattern of answers drifts from the plan for two consecutive months, rewrite the plan.

1. **Where's the actual usage coming from?** Homelab enthusiasts, security pros, DevSecOps teams, someone unexpected?
2. **What did users ask for that isn't in the roadmap?** The most important answer usually is.
3. **What's the single biggest thing that's broken?** Fix it before building anything new.
4. **Am I still enjoying this?** (Motivation is a feature of one-person projects. Track it.)
5. **Is there a person I should talk to** who's evaluated Flareo and decided not to use it? Their reason is worth more than 10 positive reviews.
6. **What's the cash position?** Infra costs vs. revenue, trend line. Not dramatic but worth a glance.

---

## If the launch goes badly

Every plan assumes the launch goes well. Briefly, what to do if it doesn't:

**"Badly" defined as:** <100 CLI installs in first 30 days, <50 waitlist signups, <200 visitors on launch day.

In that scenario, all three Horizon 2 bets are premature. Instead:

1. Stop building for 2 weeks. Talk to the 20 people who did sign up — ask them why, what they want, what would make Flareo essential.
2. Decide whether the core thesis (signed containers for self-hosters) is the right problem to solve, or whether we're looking at the wrong customer.
3. Either pivot the positioning (same technology, different audience — maybe enterprise DevSecOps?) or accept that this is a small niche project and plan for that instead.

This is the "restart" branch. It's OK to hit it. It means we learned the positioning was off in 8 weeks of building rather than 18 months of building. That's cheap.

---

## Closing

This plan is a starting position. In 30 days, some of it will be wrong. The right move is to use it as a scaffold and revise ruthlessly.

The three-bet framing is useful regardless of outcome: it forces me to name the tradeoffs, estimate the cost honestly, and commit to kill criteria before I've fallen in love with any of the features.

The default order (Bet 1 → Bet 3 → Bet 2) reflects the current one-person-team constraint. If the team grows or revenue changes the calculation, the ordering should be revisited.
