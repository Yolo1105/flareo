# 8-week MVP retrospective

Written at the end of Week 8 of the Flareo MVP. Honest version for my own future reference; not for publication.

## What we set out to do

Ship a closed-beta version of Flareo that:
1. Rebuilds 12 popular self-hosted containers daily from source
2. Signs each with Sigstore keyless
3. Publishes verifiable results at flareo.dev
4. Gives users a CLI and docs to actually use the thing

Target: 8 weeks, ~€24/month infrastructure, no paid staff, no paid legal review. Open-beta announcement at the end.

## What shipped

By end of Week 8, all of these are live:

- **flareo.dev**: catalog page, verify tool (real Sigstore-backed), pricing, about, signup, legal, status page link
- **docs.flareo.dev**: 18 pages across 5 sections, Cloudflare Pages static export
- **Canary pipeline**: 12 modules rebuilt daily on GitHub Actions, cosign-signed, published to ECR Public
- **API v1**: 7 endpoints (verify, modules list/detail/by-digest, whoami, stats, health, waitlist, submissions)
- **CLI v0.3.0**: 9 real commands (login, logout, whoami, search, verify, pull, compose, publish, init)
- **Preview demos**: 7 live instances at s-*.preview.flareo.dev on a single Hetzner CX41
- **Admission policies**: 3 ready-to-apply policy files at github.com/flareo/flareo-admission
- **Status page**: status.flareo.dev on Instatus free tier
- **Observability**: Sentry for server and client errors
- **Security headers**: HSTS, X-Frame-Options, Permissions-Policy via next.config.ts

Total lines of code authored (roughly): 6k TS/TSX in the main app, 2.5k Rust in the CLI, 1.5k YAML/shell in preview infrastructure, 20k+ words of docs.

Infrastructure cost: €24/month (Hetzner) + free tiers for Vercel, Neon, Upstash, Cloudflare, Instatus, Sentry, Resend. Under budget.

## What went better than expected

1. **Sigstore keyless signing.** Dropped in with almost no friction. The GitHub Actions OIDC → Fulcio → Rekor chain worked on first try. Every Flareo signature is still verifiable if our domain disappears tomorrow. This is the single feature I'm most proud of.

2. **The Rust CLI.** Started nervous about Rust-in-8-weeks but the experience was great. clap + reqwest + serde is a genuinely pleasant way to build a tool. The keyless device-flow login worked on the first real end-to-end test.

3. **"Don't trust us, verify yourself" as a positioning statement.** Turned out to be load-bearing in the docs and the blog post. Forcing ourselves to back it up for every feature ("but how would a skeptic verify this?") kept us honest. Whenever a design temptation pulled toward "Flareo servers sit in the trust path," the slogan pushed back.

4. **AGPL from day one.** Made legal section of the ToS short. Made the blog post punchier. Opened the door to contribution from the self-hosted community without needing a CLA story.

5. **Docs as a separate Cloudflare Pages deploy.** Zero-coupling between the main app's deploy cadence and the docs' deploy cadence. Cost nothing. Kept the main app's bundle small.

## What went worse than expected

1. **Preview demos.** Getting 7 containers to behave under memory limits on a CX41 was more work than planned. Paperless-ngx is out of the default profile permanently. Jellyfin saturates the uplink on video streaming. The per-user Firecracker preview is real Horizon 3 work and we should stop half-promising it.

2. **CLI cross-compilation.** Building for `aarch64-unknown-linux-musl` from a `x86_64-apple-darwin` dev machine works only via cross/Docker, which is noisy. The release workflow ships GH Actions matrix jobs per target; that's correct but it tripled CI minutes.

3. **The canary recipes.** Writing Dockerfiles that rebuild 12 upstream projects from source, pinned and reproducible, was harder than I thought. Home Assistant's wheel-dependency graph is gnarly. Immich's ML stack wants a GPU and we don't give it one. Nextcloud's first-boot time is 2+ minutes. We shipped workarounds for each; the recipes are fragile and need more hours.

4. **Rate limiting.** Got it right on the server but the CLI didn't respect Retry-After. A polite CLI would retry with backoff. Not a launch-blocker but noticeable. **[Resolved post-launch — see `packages/cli/src/api.rs` `send_with_retry()` and `fetch()`. Retry-After integer-seconds form is honored, exponential backoff is the fallback, capped at 3 retries / 60s per sleep / 5min total.]**

5. **No real end-to-end test.** Every week I tested manually. That's OK for Week 1 but by Week 6 the test burden was sizable and I skipped some checks I should have done. A Playwright flow that hits signup → verify → API → docs link would have caught two link bugs I only found on launch day.

## What I'd do differently next time

1. **Set up Sentry in Week 1, not Week 6.** I didn't feel the pain of "something broke and I don't know what" until Week 6. By that point I'd been debugging from log tails for weeks. Would have been 30 minutes to add it up front.

2. **Write the blog post in Week 1.** Not to publish, but to serve as a north star. "Would I want to write this in the current product?" forces tough priority calls.

3. **Write the threat model doc before the marketing copy.** I did it the other way around and had to walk back a few claims when I actually wrote the threat model in Week 5. The threat model is the hardest document in the site; writing it early would have exposed design holes while they were cheap to fix.

4. **Delay the preview demos until Horizon 3.** The shared demos are cute but they took 2+ weeks of calendar time and produced a weak artifact (nobody will put real data in a shared demo; the click-to-try value is modest). For Horizon 1, a 3-minute screencast per module would have been better.

5. **One CI/CD pipeline, not four.** We have GitHub Actions for the main app, the CLI release, the canary rebuild, and the docs. They're all subtly different workflows that I re-learn every time I need to modify one. A shared `.github/actions/*` library would have paid off after the third one.

6. **Stop calling it a "buffer week."** Week 7 was supposed to be buffer; I used it to ship two major CLI commands because "while we have the time." The real lesson: every buffer week becomes a de-facto scope-expansion week unless someone actively protects it. Next time I'll call it "cleanup only" and mean it.

## Things that scare me about the launch

1. **Nobody has tested the full flow on a fresh machine except me.** The runbooks are thorough but runbooks are written by the person who knows the answer. First external user who installs will find a step I forgot.

2. **Legal.** The ToS and Privacy policy are beta-quality drafts. Fine for closed beta, but the first person who sends a GDPR data subject access request will exercise a path I haven't rehearsed.

3. **Key rotation.** There's no story yet for rotating the GitHub OAuth client ID for the CLI, or for revoking the whole set of API keys if our DB is leaked. Neither is catastrophic but both are visible gaps.

4. **One person.** If I'm in a car accident tomorrow, there's no documented handoff. The runbooks help but somebody would need to walk from zero to operating the service, and that's a lot of context to reconstruct.

## The honest numbers

| Metric                                | Value                           |
|---------------------------------------|---------------------------------|
| Weeks elapsed                         | 8                               |
| Cumulative infra cost (Weeks 1-8)     | ~€50 total (Hetzner prorated)   |
| Modules in catalog at launch          | 12                              |
| API endpoints at launch               | 9                               |
| CLI commands at launch                | 9 (7 real, 2 stub-to-real in W7-8) |
| Docs pages at launch                  | 18                              |
| Waitlist signups at Week 8 end        | (pending launch day)            |
| Sentry errors per day (pre-launch)    | <5, mostly my own testing       |
| Uptime (Instatus, 30 days pre-launch) | 99.87%                          |

## If someone asks for advice on shipping a 1-person MVP

- **Ship behind a waitlist before you ship without one.** Lets you control the rate of real-user problems; avoids the "HN front page + broken signup flow" nightmare.
- **Use managed services for everything that isn't your core bet.** Neon for Postgres, Upstash for Redis, Vercel for hosting, Cloudflare for DNS and static. None of these are a differentiator; all of them absorb operational work you can't afford.
- **AGPL is a feature, not a bug.** Filters out the worst commercial customers (who would drain you with support questions) and signals the most loyal ones (who want to own their stack).
- **Write the runbook while doing the task.** Not after. The context you had while doing it is the context you need in the runbook.
- **One week per track, and be ruthless.** Features you deferred to Horizon 2 will still be there in Horizon 2. Features you half-shipped in Horizon 1 will embarrass you until you finish them.

## What's next

In descending order of importance for the first 30 days post-launch:

1. Respond to every user issue within a business day. The early adopters are the ones who tell others about you or don't.
2. Ship `flareo publish` / `flareo init` review flow to completion (Horizon 2 begins).
3. Reproducibility-verified rebuilds (same source → same digest across two different builds). Would upgrade SLSA claim from L2 toward L3.
4. Per-user Firecracker previews. The big Horizon 3 piece.
5. Paid tier. Only after ~100 active users — earlier is premature.
6. Proper lawyer review of ToS and Privacy. Before any enterprise conversation; doesn't have to be day one.

## Closing

The product at end-of-Week-8 is shippable. Not polished; shippable. There's a real, useful thing at flareo.dev that I'd be willing to point a skeptical friend at. That's not nothing for €50 and 8 weeks.

The next 30 days will tell whether the positioning holds up against real users. I'll revisit this doc at Week 12.
