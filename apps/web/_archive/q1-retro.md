# Q1 Retrospective

Written at the end of Q1 2026 / start of Q2, reviewing Phase 2.5 through Week 19. This document's job is to be honest, not to be flattering. Its readers are (a) future-you in Q2 when planning, (b) future-you in Q4 when asking "why did we pick that direction", (c) anyone else who joins and needs context.

## TL;DR

Q1 delivered every code item in the plan — Phase 2.5, paid tier, docs rewrite, analytics. Zero were cut. Roughly on schedule, though Phase 2.5 took about 1 extra week of calendar time because its four real-world ship criteria (red-team day, non-maintainer smoke test, unattended weekend, five real submissions) all remain unverified at the moment of writing this retro.

The headline: **code is ahead of reality**. The plan's own ship criteria for Phase 2.5 are not yet met; Q2 week 1 is the window to verify them before committing to more feature work.

## Predict / actual / delta

### Phase 2.5 — Close and Harden (weeks 11-14 planned, 11-15 actual)

**Predicted:** 3-4 weeks. Close the submission-to-publish loop. Upload UI (11a) + build worker (11b, done pre-session) + admin review UI (11c, done pre-session) + red-team day (W13) + reliability (W14). Ship criterion: five end-to-end submissions.

**Actual:** 11a Dockerfile upload UI shipped. W14 reliability shipped (heartbeat, worker health dashboard, retries with backoff, DLQ, Sentry wiring). Ship criteria not yet verified — the five real submissions, red-team, weekend survival are all external-to-code.

**Delta:** Code-complete, but "Phase 2.5 complete" and "code-complete" aren't the same thing. The retro framing the plan originally used ("we ship when the criteria are met") got blurred because the sessions kept landing features and I kept saying "Phase 2.5 done" to mean "code for Phase 2.5 done". The honest framing is that **Phase 2.5 code shipped in about 5 sessions; Phase 2.5 verification is still open**.

Lesson for Q2 planning: when the plan says "ship criterion," hold the line. Don't declare phases complete until criteria are externally observed.

### Weeks 15-16 — Paid tier (predicted 8 days, actual 2 sessions)

**Predicted:** Stripe checkout + webhook + portal + quota enforcement + billing page + pricing rewrite + dunning. "One paying customer by end of Week 16."

**Actual:** All seven code items landed across two sessions, with session 1 doing foundations (schema + quota + enforcement + billing page with disabled CTA) and session 2 doing Stripe proper (checkout + portal + webhook + dunning email + pricing rewrite). No paying customer yet — Stripe isn't provisioned in production.

**Delta:** Clean split into foundations vs integration made session 2 shippable even without live Stripe keys in the sandbox. The "one paying customer by end of Week 16" target was always a two-part metric — code done + marketing done + reaching a customer — and only the code part was in this plan. Q2 needs to distinguish "code ready for X" from "X achieved" much more clearly.

Lesson: **code milestones and business milestones are different things**. Don't collapse them.

### Weeks 17-18 — Docs that convert (predicted 2 weeks, actual 1 session)

**Predicted:** Rewrite `/docs/install`, `/docs/first-verify`, `/docs/publishing`, 3 use-case pages, remove all "coming soon" mentions.

**Actual:** `/docs/install` and `/docs/first-verify` were already good; left them alone. `/docs/publishing` rewritten (the closed-beta framing was stale). Three use-case pages written (Vaultwarden deploy, replacing Docker Hub, CI/CD verification). Sidebar updated. Two "coming soon" instances rephrased to honest copy; third (billing CTA) deliberately kept because it's correct conditional behavior.

**Delta:** Came in at 1 session not 2 because half the target pages already existed and were good. Worth flagging: "plan said X, reality was half done already" happened because Q1 planning didn't audit the current state deeply enough. Next plan should start with a repo walk.

Lesson: **audit before you plan**. The plan assumed `/docs/publishing` needed "rewriting" — it did, but `/docs/install` didn't, and that's a 40% scope delta that an audit would have caught.

### Week 19 — Analytics (predicted 30-45 min, actual 1 session)

**Predicted:** Plausible snippet + one custom event.

**Actual:** Plausible snippet + 4 custom events (declared) + admin product-health dashboard reading DB aggregates + privacy-page alignment in two places + env gating + typed wrapper.

**Delta:** Session went ~2-3x the predicted scope because the "one event" didn't earn its place without the infrastructure around it (typed wrapper, env gate, admin dashboard to correlate DB signal with page-view signal). This is fine for this session but is a pattern worth noticing — scope inflates when "just ship the minimum" conflicts with "ship something coherent".

Lesson: **minimum plans often demand non-minimum implementation**. Either bigger plans, or accept that tiny items will drift bigger.

## Ship criteria status — Phase 2.5

The five explicit criteria from `q1-plan.md`:

1. **Five real submissions, not from the maintainer, pass end-to-end without manual intervention.** — UNMET. The upload UI, worker, admin review, and decision emails all exist in code; no non-maintainer has exercised the flow yet.

2. **Zero sandbox escapes during red-team testing.** — UNTESTED. Red-team playbook is written (`docs/red-team-playbook.md`, in the repo). Day not yet scheduled or executed.

3. **Build time p95 under 15 minutes for reasonable Dockerfiles.** — PARTIALLY CAPTURABLE. The `/app/admin/worker` dashboard surfaces median build duration for the last 20 builds. p95 is computable from the same table but not rendered. Real workload volume to measure against is absent.

4. **Failed builds produce a useful error in the submitter's dashboard.** — SHIPPED IN CODE. Worker classifies failures by kind (user/scan/system), each routes to a specific email template, dashboard shows the last 10 terminal submissions with their error messages. Not yet verified against a real failure case, only synthetic.

5. **Pipeline survives an unattended Friday-evening-to-Monday-morning.** — UNTESTED.

Honest reading: 0 of 5 verified, 1 shipped-in-code-but-unobserved. Q2 week 1 should be "execute these five" before anything else.

## What didn't get built that maybe should have

Known loose ends, in rough priority order:

- **VerifyToolUsed event** declared in `lib/analytics/plausible.ts` but not fired from the verify page. 4-line follow-up.
- **CLI-sourced analytics events.** `source: "cli"` is in the event enum but the CLI doesn't fire anything. Needs CLI work.
- **Build host separation from preview host.** `phase2-runbook.md` explicitly says they must not share. Whether they're actually separate in the current deploy is unknown from the repo alone.
- **Private-module submission path.** Schema supports `visibility="private"` but `/api/v1/submissions` doesn't accept a visibility field yet. Pro-tier users can have private modules per the plan table, but can't actually submit them.
- **DLQ dismissal UI.** The admin queue shows DLQ submissions but there's no dedicated "retry from DLQ" or "give up and reject" action. The existing `retry-build` admin endpoint works for it, but there's no UI affordance.
- **Webhook event deduplication.** Stripe can deliver the same event twice; our handlers are idempotent on the relevant writes so duplicates are benign today, but if we add non-idempotent side effects later we'll need a `ProcessedWebhookEvents` table.
- **Plan-aware rate limits.** `PLAN_LIMITS[pro].rateLimitMultiplier` exists as a field, nothing reads it.
- **Canary rebuild observability.** The daily rebuild script exists in `scripts/canary/` but the main-app UI doesn't show "when did we last rebuild this?" or "has the canary rebuild been failing?"

## Sustainability check

- **Coding pace:** Q1 was 6-7 focused sessions spread across the quarter. Pace was sustainable. No session felt crunched.
- **Scope pace:** Session-over-session, I drifted from "ship the minimum" toward "ship the coherent minimum", which kept quality high and momentum steady but means future estimates should be ~2x the plan's line-item time, not 1x.
- **Context switching:** Each session started with a significant re-onboarding tax because conversations are isolated. The zip + notes pattern worked; the `phase-2-5-notes.md`, `weeks-15-16-notes.md`, `weeks-17-18-notes.md`, `week-19-notes.md` series is the thing that made continuity possible.
- **External dependencies deferred:** Stripe account, Plausible account, Hetzner build host, real Dockerfile submissions — none of these are coding tasks and all got deferred. This is correct but means "ship" and "launch" are now different dates.

## What to take into Q2

Based on what Q1 surfaced:

1. **Start every plan with an audit.** The `/docs/install` overshoot shows that planning without auditing current state produces ~40% wasted scope predictions.
2. **Distinguish code-complete from criterion-met.** Always spell out the external observation that counts as "done". Phase 2.5 got blurred because this wasn't enforced.
3. **External-dependency tasks belong in their own list.** Stripe provisioning, Hetzner hosts, and third-party accounts shouldn't be mixed into coding phases. Q2 should have an explicit "external readiness" track.
4. **Scope inflates by ~1.5-2x.** Estimate accordingly, especially for "minimum" tasks that want coherent implementation.
5. **Retros force honesty** — this document wouldn't exist otherwise. Q2 should end with one too.

Continue to `docs/q2-plan.md`.
