# Q2 — Week 1 Schedule

Companion to `docs/q2-plan.md`. The plan describes *what* Week 1 is; this document describes *how* and *when*. Every item has a pass criterion, a time estimate, and an explicit dependency list. Draft artifacts for the external-facing items live in `q2-week-1-artifacts.md`.

Rule for this week: **no new features.** If you find yourself opening a Next.js file to "just add" something, close it. Write it in `known-loose-ends.md` and come back to it in Week 2.

## Summary

| Day | Primary | Secondary | Reason |
|-----|---------|-----------|--------|
| Mon | Red-team day (full day) | — | Must pass before inviting non-maintainers |
| Tue | Stripe + Plausible prov (AM) | Outreach batch 1 sent (PM) | Fast mechanical items cleared, then start the long-lead human process |
| Wed | Triage responses, answer questions | Review any early submissions | Calendar time, not execution time, is the bottleneck |
| Thu | Review submissions as they arrive | Shape B/C prep (see below) | Prepare for the branch decision |
| Fri | Submissions review | Prep weekend observation | Enter the unattended weekend with known state |
| Sat/Sun | **Unattended weekend** | — | Production pipeline runs on its own |
| Mon wk2 | Monday postmortem + branch decision | Write `q2-shape.md` | Commit to A/B/C/D |

Realistic calendar: Week 1 finishes Monday of what would otherwise be Week 2. Accept that.

## Item 1 — Red-team day (Monday)

**Duration:** Full calendar day. No other work.

**Pre-flight check** (30 min, can be Sunday evening):
- Build host reachable via SSH and separated from the preview host. If they're on the same machine, stop and fix that first — this is `phase2-runbook.md`'s one non-negotiable. "Separated" means: different virtual machines or at minimum different Docker networks with no inter-host routes, confirmed by `nc -zv` from one to the other failing.
- `docs/red-team-playbook.md` in front of you
- Blank `RED_TEAM_RESULTS_2026Q2.md` created with the template below
- Sentry + worker-heartbeat dashboard open in a tab
- Snack and water within reach

**Execution:**
Work through the 14 attacks in the playbook, in order. For each attack:
1. Record attempt in log
2. Execute the attack
3. Record outcome (escape / blocked / partial)
4. If escape: stop, triage severity, decide fix vs hold

**Pass criterion:** All 14 attacks blocked or not-applicable. Any "escape" or "partial escape" is an automatic block on Item 2. Any "blocked but noisy" outcome (e.g. worker crashed under attack but recovered) is a note-for-later, not a block.

**Fail modes:**
- **1 or more sandbox escapes** → Do NOT proceed to Item 2. Skip straight to Shape B. Fix the finding before re-running the attack, then re-run Item 2 when ready.
- **Red-team revealed the playbook is incomplete** → good outcome; extend the playbook, re-run what's new, keep going.

**Results log template** (copy into `RED_TEAM_RESULTS_2026Q2.md`):

```
# Red-team results — Q2 Week 1

Date: YYYY-MM-DD
Tester: (you)
Host: (hostname or fqdn)
Build worker version: (git sha)
Duration: (hours)

## Pre-flight
- [ ] Build host separated from preview host: verified by (command)
- [ ] red-team-playbook.md version: (sha or date)

## Attacks (from playbook)

### Attack 1 — (name)
Expected: blocked
Observed: blocked | partial | escape
Notes:
Follow-up:

### Attack 2 — (name)
...

## Summary
- Attacks attempted: N
- Blocked: N
- Partial: N  
- Escape: N
- Not applicable: N

## Decision
- [ ] Pipeline safe to accept non-maintainer submissions
- [ ] Findings require fixes before opening
- [ ] Findings logged but non-blocking

## Action items
1. ...
```

## Item 2 — Five non-maintainer submissions (Tue start, Mon wk2 finish)

**Duration:** Execution is 2-3 hours spread across the week. Calendar time is 1-3 weeks.

**Sub-tasks in order:**

### 2a. Outreach (Tuesday PM, 2 hours)

Target: 10 candidates. Aim for 5 completed submissions. Expected response rate is 30-50%; of responders, 50-80% will actually follow through. So 10 candidates → 3-5 completed.

Candidate sources (ranked by signal):
1. **People who emailed during Q1.** Highest-signal — they've already expressed interest. Start here.
2. **Small homelab Discords.** r/selfhosted's Discord, Homelab Discord, Self-Hosted podcast Discord. Direct-message the 2-3 most active module-authors on each.
3. **r/selfhosted thread.** Last resort — noisy, low response quality, but cheap and fast.

Send outreach Tuesday PM so Wednesday morning is when responses land in EU timezones.

Draft message template in `q2-week-1-artifacts.md`.

### 2b. Triage + answer (Wed–Fri, 30-60 min/day)

Expected flow per candidate:
- Question about what's wrong with their Dockerfile — answer with links to `/docs/submitting-dockerfiles`
- Question about license compatibility — answer case-by-case
- "Can I just submit a fork?" — redirect to the right upstream repo

Track per-candidate state in a spreadsheet. Columns: Name, Channel, Date contacted, Responded?, Submitted?, Decision, Decision time (hours), Pain points.

### 2c. Review submissions as they arrive (rolling)

The review SLA is 5 business days on free tier, but be faster than that for these five — they're the calibration set. Turn around each submission within 24 hours, even if the turnaround is "here's what's wrong, please fix and resubmit."

**Pass criterion:** 5 submissions completed end-to-end (reviewer made a decision — approved / rejected / changes-requested). Build success rate among approved: ≥ 60%.

**Fail modes:**
- **Zero responses by end of Week 1.** Move to Shape C immediately. Don't wait 6 weeks.
- **Responses but no follow-through submissions.** Probably a docs problem. Analyze where in the flow people dropped — landing page? Install? Docs? Wizard?
- **Submissions landing but all failing.** Scan the failure kinds. All `user` errors = docs/UX problem. Mixed `system` errors = Shape B.
- **5 submissions land, all approved, no issues.** Suspicious. Were you too lenient? Re-read each approval with a skeptical eye.

## Item 3 — Unattended weekend (Fri evening → Mon morning)

**Duration:** Wall clock 60 hours. Active observation ~30 minutes Monday morning.

**Pre-flight (Friday 5pm):**
- Worker health dashboard shows all-green
- Sentry dashboard has no unresolved issues
- DLQ is empty (or has rows that are explicitly known-and-logged)
- At least one real submission in progress (ideally 2-3, from Item 2) so the pipeline has actual work to process
- `/app/admin/worker` open in a tab that you'll check Monday
- No scheduled deploys Saturday or Sunday

**Execution:** Nothing. Do not touch the server. Do not deploy. Treat it like vacation.

**Pass criterion:** Monday morning check reveals:
- Sentry: 0 unresolved issues in the past 60 hours
- Worker health: green signal
- DLQ: same count as Friday (or lower, if a human retried something legitimately)
- Any queued submissions made progress (none stuck in `building` state for >1h)
- Heartbeat shows continuous operation

**Fail modes:**
- **Sentry fired a paging-worthy event.** Triage, fix, re-run the weekend in 2 weeks with the fix.
- **Worker wedged at some point.** Look at the last heartbeat time vs Monday morning. If it stopped Saturday night, something specific broke; worth investigating.
- **DLQ grew.** Read each DLQ row. If all same root cause, you've found a real bug. Fix it and re-run the weekend.
- **Submissions stuck in `building`.** Likely the retry logic's off-by-one crept back somehow, or the host rebooted and lost the claim. Investigate before re-running.

**Document outcome in a note:** `WEEKEND_OBS_2026Q2_WK1.md` — pass/fail, what you saw, follow-ups.

## Item 4 — Stripe in production (Tuesday AM, 90 min)

**Duration:** 60-90 minutes.

**Checklist:**
1. Create Stripe account (if not already). Switch to production mode (the "Viewing test data" toggle in the top nav).
2. Products → Create product:
   - Name: "Flareo Pro"
   - Pricing: €12.00 per month, recurring
   - Tax behavior: your choice based on your VAT registration status
   - Copy the resulting `price_...` id
3. Developers → Webhooks → Add endpoint:
   - URL: `https://flareo.dev/api/v1/billing/webhook`
   - Events to send: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the signing secret `whsec_...`
4. Developers → API keys → Copy the live secret key `sk_live_...`
5. Update prod env:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PRICE_ID_PRO=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
6. Deploy (if env changes require redeploy on your host).
7. **Smoke test:** sign in to your own Flareo account, click Upgrade, pay with a real card. Confirm:
   - Stripe dashboard shows the customer
   - Your Flareo account shows plan=pro
   - Webhook logs in Stripe show `checkout.session.completed` delivered with 200 response
8. **Refund test:** in Stripe dashboard, refund the payment and cancel the subscription. Confirm:
   - `customer.subscription.deleted` fires
   - Your Flareo account reverts to plan=free
   - Webhook logs show 200 response

**Pass criterion:** the roundtrip above completed with no manual intervention on either side.

**Fail modes:**
- **Webhook delivery shows 400/500.** Probably signature secret mismatch or URL wrong.
- **Webhook delivery shows 200 but plan didn't change.** Handler bug; check server logs.
- **Test card accepted but no webhook fired.** Most likely you forgot to add the event types in step 3.

## Item 5 — Plausible in production (Tuesday AM, 20 min)

**Duration:** 15-20 minutes.

**Checklist:**
1. plausible.io → Add site → domain: `flareo.dev`
2. Set prod env: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=flareo.dev`
3. Deploy
4. Open `flareo.dev/` in a browser, check Plausible dashboard — page view should appear within 10 seconds
5. Sign in, walk the upgrade click path. `UpgradeClicked` custom event should fire. (You'll cancel in Stripe at the checkout page; the event fires on click, not on successful payment.)
6. From a different browser/IP, hit `flareo.dev/pricing` — another page view lands. Confirm the dashboard differentiates the two sources.
7. In plausible.io → site settings → Goals, confirm `SubmissionCreated`, `SubmissionQuotaBlocked`, `UpgradeClicked`, `VerifyToolUsed` appear once they've each fired once.

**Pass criterion:** page views flowing, at least one custom event visible in the Goals tab.

**Fail modes:**
- **Events not firing.** `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` not in the actual runtime env. Double-check by viewing page source and confirming the `<script>` tag is there.
- **Events firing but not appearing in Plausible.** Check the domain setting matches exactly — trailing slash, www vs root, protocol.

## Branch decision (Monday Week 2)

Write `q2-shape.md`. Structure:

```
# Q2 shape — (A / B / C / D)

## Verification results
- Red team: pass / fail / findings
- Five submissions: 5/5, or (N landed, M approved)
- Unattended weekend: pass / fail
- Stripe: live / not live
- Plausible: live / not live

## Decision
We are doing Shape __ because [reason].

## What this means for the next 12 weeks
- Week 2-6: ...
- Week 7-13: ...

## Kill criteria (from q2-plan.md)
- [ ] End of Week 6: at least 1 paying customer or clear path
- [ ] No red-team critical findings unresolved > 2 weeks
- [ ] Worker health never red > 48h

## First concrete task Monday wk2
(the very first feature/marketing task — one thing, starting that morning)
```

Keep it under 2 pages. The purpose is to commit, not to document exhaustively.

## What to do if Week 1 slips

Realistic Week 1 takes 8-12 calendar days, not 5. That's fine. What's not fine is sliding any of the five items into Week 2 "we'll do it later" territory. If you don't finish item 2 (submissions) in Week 1, don't start Shape A feature work — stay on item 2. The verification is the point.

## What not to do this week

- Don't fix code-review findings. `code-review.md` items stay parked.
- Don't write a blog post. Marketing is Shape A/C work, not Week 1.
- Don't add telemetry. If Plausible + DB + Stripe don't cover a question you find yourself asking, write it in `open-questions.md` and answer it in Week 6.
- Don't refactor anything. Even if you spot a smell while writing the outreach, don't touch the code. Note it, move on.
