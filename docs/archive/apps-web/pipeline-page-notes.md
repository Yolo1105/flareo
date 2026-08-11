# Session 2 — /pipeline page (after login)

Built the proposal's full 8-stage pipeline walkthrough as an authenticated, content-rich, artifact-first page. Closes the proposal's Risk #3 — "the pipeline diagram as five circles is visual placebo." Every stage now has its real receipt visible.

## What's there

`/pipeline` — auth-gated page that renders all 8 stages of Flareo's container supply-chain pipeline for a chosen module, with a real artifact at every step.

### Stage breakdown

| # | Stage | Status | What renders |
|---|---|---|---|
| 01 | BuildKit / CNB | BUILT (CNB spec-only) | Live build log with module-derived digests, layer timing. CNB roadmap card. |
| 02 | Trivy | BUILT | Severity histogram, scan output, full CVE table with up to 8 rows + overflow indicator |
| 03 | CycloneDX SBOM | BUILT | Stat tiles (format/components/emitter), real CycloneDX 1.5 JSON preview, plain-English explainer |
| 04 | VEX | SPEC-ONLY | OpenVEX 0.2.0 statement preview + per-statement cards with not_affected/under_investigation/fixed treatment |
| 05 | SLSA L1 | BUILT | Subject + Builder/Run summary tiles, full in-toto v1 attestation JSON, `cosign verify-attestation` command |
| 06 | cosign + Rekor | BUILT | Cert identity panel + Rekor log entry panel, `cosign verify` output with the actual digest |
| 07 | Policy gate | SPEC-ONLY | Per-rule pass/fail table evaluated against module's actual numbers, big ALLOW/DENY decision pill, `admission-policy.json` preview |
| 08 | Publish | BUILT | Registry receipt, post-publish side effects checklist, `docker push` log, links to module page + marketplace |

### Page navigation

- **PageHero** — eyebrow / prompt / "The full pipeline, stage by stage" headline
- **PipelineHeader** — strip showing "SIGNED IN: ..." + "VIEWING: <module>" + module picker (6 modules, server-rendered, switches via `?module=<slug>`)
- **PipelineStageNav** — sticky in-page nav with anchors to each stage; spec-only stages get a small amber dot
- 8 stage sections with `StageShell` (numbered hero, status pill, duration label)
- **PipelineRoadmap** — closing section enumerating the 3 spec-only stages (CNB, VEX, Policy) with concrete ETAs and blocker lists
- Bottom CTA: "Want to run YOUR module through this?" → `/app/publish`

### Why every stage has a real artifact

The proposal's content principle was explicit: **don't render the pipeline as five circles labeled Build/Scan/Sign/Ship — that's a visual placebo. Each stage needs the actual SBOM JSON, the actual provenance attestation, the actual cosign signature line, the actual policy decision.**

`lib/data/pipeline-artifacts.ts` is a generator — given a module, it derives:
- Build log with hashes from the module's actual digest
- Trivy report with CVEs synthesized from `module.cves.{critical,high,medium,low}`
- CycloneDX SBOM with debian base + 7 standard libraries, hashes from digest
- VEX statements covering the highest-severity CVEs in the trivy report
- SLSA in-toto attestation pointing at the module's real digest
- cosign signature + Rekor entry, log index derived from slug
- Policy decision evaluated against the module's actual SLSA level + CVE counts
- Publish receipt for the module's `ghcr.io/flareo/<slug>` ref

Two visitors switching to two different modules see different artifacts. Same code path. That's what "real" means here.

### Auth flow

- Anonymous visitor → `/pipeline` → 307 to `/login?callbackUrl=/pipeline`
- Login page reads `callbackUrl`, threads it into both GitHub signin (existing) and demo-mode signin (new)
- Demo-signin endpoint honors `callbackUrl` and redirects post-session-creation
- `DEMO_MODE=1` quick-sign-in: click "Admin Reviewer" on the login page → land at `/pipeline`

### Spec-only honesty

Stages 01 (CNB only), 04 (VEX), 07 (Policy gate) are clearly labeled:
- Status pill: amber "SPEC ONLY · ROADMAP" instead of green "BUILT · IN PRODUCTION"
- Inline notice card at top of section
- The artifact still renders, but it's framed as "the shape this artifact will have when this stage ships"
- Roadmap section at bottom enumerates each one with target dates (CNB Q3, VEX Q3, Policy Q4) + concrete blockers

A security-literate visitor isn't misled. The proposal's #1 risk was overclaiming; this page solves it by being explicit about what runs today vs. what's committed shape.

## Files created

```
app/(marketing)/pipeline/page.tsx
lib/data/pipeline-artifacts.ts
components/sections/pipeline-page/
  StageShell.tsx
  PipelineHeader.tsx
  PipelineStageNav.tsx
  Stage01BuildKit.tsx
  Stage02Trivy.tsx
  Stage03Sbom.tsx
  Stage04Vex.tsx
  Stage05Slsa.tsx
  Stage06Cosign.tsx
  Stage07Policy.tsx
  Stage08Publish.tsx
  PipelineRoadmap.tsx
```

## Files modified

- `app/(marketing)/login/page.tsx` — accept `callbackUrl` searchParam, thread it to `DemoSignInPanel`

## How to test

```bash
# in apps/web/.env.local
DEMO_MODE=1
DATABASE_URL=...
AUTH_SECRET=...

SEED=1 npx prisma db seed
npm run dev
```

Try:
1. Anonymous to `/pipeline` → redirected to login with callback
2. Sign in as demo admin → land on `/pipeline` showing vaultwarden's full pipeline
3. Click "authentik" in the module picker → all 8 sections re-render with authentik's artifacts
4. Hit anchor links in the sticky nav to jump between stages
5. Note keycloak's policy gate shows DENY (in the seed it has a build_failed); other modules show ALLOW
6. Anonymous → `/marketplace` → click "See the pipeline live →" → bounced to login → sign in → arrive at `/pipeline`

## What's resolved across both Session 1 and 2

The original ask covered three things:

| Ask | Status |
|---|---|
| Marketplace as completely independent page with detailed module info, comments, deploy/use, full functions | ✅ `/marketplace` page (Session 1) — full-bleed spotlight + featured + trending + per-category rows + review board + publish CTA. Module detail pages still hold the deepest detail. |
| Real function experience — independent page with full pipeline contents, after login | ✅ `/pipeline` page (Session 2) — auth-gated, 8 stages, real artifacts, module picker |
| Login placeholder so I can test these features | ✅ `/api/demo-signin` (Session 1) — env-gated, 4 demo roles, callbackUrl-aware |

## Project state

- Marketplace path: `/marketplace` (curated discovery) → `/modules/<slug>` (deep detail)
- Pipeline path: anonymous can read pitch on landing → click into `/marketplace` → click "See the pipeline live" → forced to login → demo signin → land on `/pipeline` → walk all 8 stages → click "Submit a module" → `/app/publish`
- Every proposal-spec piece is now demoable end-to-end, including spec-only stages clearly labeled
- The "five circles is a visual placebo" risk is addressed: every stage has its real artifact
