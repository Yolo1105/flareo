# Weeks 17-18 — Docs that convert

This zip completes Q1 weeks-17-18 from `q1-plan.md`. The plan's goal was: rewrite the docs so a first-time visitor's path from `/docs` → "I actually used this" is measurably shorter, and remove stale "coming soon" copy that makes us look not-yet-shipped.

## What changed in this build

### Rewritten: `/docs/publishing`

The old version of this page was Horizon-1 framing — "we are not actively accepting third-party modules, open a GitHub issue and wait". That was accurate when it was written; it's stale now. Phase 2.5 shipped the real submission flow in `/app/publish`, Weeks 15-16 shipped paid-tier gating, and the pipeline builds submitted modules end-to-end.

The new page covers:

- What you need before starting (repo, Dockerfile, contact email)
- The web wizard's four steps (Source → Manifest → Dockerfile → Review & Publish)
- The CLI equivalent (`flareo publish ...`)
- What the reviewer is actually looking for — four criteria in priority order, phrased as operational decisions not marketing copy
- What the build pipeline does post-approval (seven steps, 5-12 min)
- Three failure modes with their retry behavior: user error (no auto-retry), scan rejection (no auto-retry), system error (three retries with exponential backoff, then DLQ)
- Post-publish CVE handling (status flip, republish, user-side pin invalidation)
- Plan limits (3 public for free, unlimited for pro)
- Review timeline SLAs (5 business days free, 2 business days pro)

The old closed-beta section is gone entirely — it was the single biggest stale copy lie on the marketing side.

### New: three use-case pages

Each is a concrete, step-by-step walkthrough written for a specific reader with a specific goal. None of them are product tours.

- `/docs/uses/vaultwarden` — **Deploy Vaultwarden in 5 minutes.** Walks from `flareo show vaultwarden` through compose-file generation, Caddy HTTPS, first-boot. Explicit security-story recap at the end so the reader sees what they've actually gained. Covers backups, updates, and rotation. Most concrete page on the site.
- `/docs/uses/replacing-docker-hub` — **Replacing Docker Hub in a homelab.** The positioning-level use case. Leads with the three real threats that motivate replacement (rug-pulls, typosquatting, hub policy changes), walks the one-service-at-a-time migration pattern, honestly calls out what you haven't done (infrastructure containers, admission enforcement, automatic updates).
- `/docs/uses/ci-cd` — **Verify images in CI/CD.** Covers GitHub Actions, GitLab CI, and Argo CD with copy-pasteable YAML for each. Includes a pre-commit hook variant for catching bad pins before CI ever sees them. Names the three failure modes explicitly so CI errors are actionable.

All three end with "Next steps" cross-links to related pages so the reader has a clear second click.

### Sidebar: new "Use cases" section

- `lib/docs/sidebar.ts` — added a fourth section between "Using Flareo" and "Publishing" containing the three use-case pages. Order chosen so the most concrete (Vaultwarden) comes first and the most abstract (CI/CD) comes last.
- The stale "closed beta" phrase removed from the `/docs/good-module` sidebar description.
- The `/docs/publishing` sidebar title changed from "Submission overview" to "Publishing a module" to match the rewritten page.

### "Coming soon" audit — all three instances resolved

The plan explicitly called for removing "coming soon" mentions. Three instances existed:

- **`app/docs/previews/content.mdx`** — line about preview coming soon for heavy modules. Replaced with honest copy: "Preview unavailable · local only" with a link to the pricing/roadmap context. This is truthful: those modules run in the catalog identically, only the shared-demo-VM is missing.
- **`components/sections/module-detail/ModuleHero.tsx`** — disabled button for non-previewable modules previously read "Preview coming soon". Changed to "Preview unavailable · local only". Same rationale as above — this is describing a deliberate architectural choice, not a missing feature.
- **`components/sections/app-settings/BillingCta.tsx`** — "Upgrade to Pro · coming soon" text. **Kept.** This is the correct copy when `STRIPE_SECRET_KEY` is unset at runtime (the billing page and CTA fall back gracefully). Once Stripe is configured server-side, the CTA renders as "Upgrade to Pro →" automatically. The "coming soon" label in the session-1 source is conditional behavior, not stale marketing filler.

## Deliberately NOT touched

- **`/docs/install`** — already solid. 76 lines covering curl-pipe install, manual download, shell PATH setup, verification. Not rewritten.
- **`/docs/first-verify`** — also already solid. 84 lines covering the five-minute verification walkthrough. Not rewritten.
- **All other existing `/docs/*` pages** (admission, compose, good-module, etc.) — still accurate for their scope. Not touched.
- **No new marketing pages** — the plan was docs-that-convert, not new marketing pages.
- **No analytics yet** — week 19 work, deferred.

## How to verify locally

```sh
cd apps/web
npm install
npm run dev
```

Walk:

1. `/docs` — sidebar now has four sections plus the old ones. "Use cases" is visible and has three entries.
2. `/docs/publishing` — new copy, no "closed beta" framing anywhere, mentions the web wizard and CLI paths.
3. `/docs/uses/vaultwarden` — renders cleanly. Code blocks display correctly.
4. `/docs/uses/replacing-docker-hub` — same.
5. `/docs/uses/ci-cd` — same, including the YAML code blocks.
6. Navigate to a module page where `previewable=false` (heavy modules like Jellyfin, Nextcloud) — the button now reads "Preview unavailable · local only".
7. `/docs/previews` — scroll down to the non-previewable list — copy reads cleanly.

## What's next in Q1

- **Week 19 — analytics.** Plausible or Simple Analytics snippet. One custom event for "module published". About 30 minutes of work.
- **Week 20 — review & replan.** Non-code. Pull numbers from Plausible + DB + Stripe, write a 2-page retro, carve up Q2.

And the Phase 2.5 real-world items that only you can do:

- Red-team day against the build worker on its dedicated host
- Non-maintainer smoke test (five real end-to-end submissions)
- One unattended weekend of the pipeline running live
- A Stripe account provisioned with a real Pro product and a public webhook endpoint
- The first paying customer
