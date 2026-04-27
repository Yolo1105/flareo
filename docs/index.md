# Doc index

Documentation across the monorepo. Three locations:

- **`docs/`** (this directory) — cross-cutting docs that span the whole project
- **`apps/web/`** — operational docs specific to the Next.js main app
- **`apps/web/_archive/`** — historical docs, kept for context, not load-bearing for current work

This file is the entry point. When something is missing here, add it.

---

## Cross-cutting (`docs/`)

Read first. These describe the whole project, not any single app.

| File | Purpose |
|------|---------|
| **`docs/deploy-runbook.md`** | Top-to-bottom: zip → production. Single source of deploy truth. |
| **`docs/decisions.md`** | Pre-committed decision gates with trigger criteria. Read before relitigating any gated work. |
| **`docs/session-protocol.md`** | Collaboration protocol with Claude — validation cadence, push-back rules, when to stop. |
| **`docs/red-team-playbook.md`** | Adversarial testing checklist — review before declaring a release "secure". |
| **`docs/horizon-2-plan.md`** | The "three bets" doc covering review UI / Firecracker previews / paid tier. |
| **`docs/q2-plan.md`** | Active Q2 roadmap. |
| **`docs/q2-week-1-schedule.md`** | Q2 first-week calendar. |
| **`docs/index.md`** | This file. |

---

## Web app operational (`apps/web/`)

| File | Purpose |
|------|---------|
| **`apps/web/README.md`** | Web-app dev notes |
| **`apps/web/full-runbook.md`** | Web-app deploy + on-call playbook |
| **`apps/web/phase2-runbook.md`** | Phase 2 deployment specifics |
| **`apps/web/account-system-runbook.md`** | Auth/account operational notes |
| **`apps/web/canary-observability-notes.md`** | Canary rebuild script |
| **`apps/web/dlq-dismissal-notes.md`** | DLQ handling |
| **`apps/web/demo-walkthrough.md`** | Sales walkthrough |
| **`apps/web/build-worker-spec.md`** | Worker behavior reference spec |
| **`apps/web/admin-review-ui-spec.md`** | Reviewer admin UI spec |
| **`apps/web/cli-release-ci-decision.md`** | CLI release CI decision |
| `apps/web/MARKETPLACE_*` | Marketplace feature notes |
| `apps/web/PHASE_*` | Phase-specific notes (A, C, D, E, F0) |

---

## Worker (`apps/worker/`)

| File | Purpose |
|------|---------|
| **`apps/worker/deployment-runbook.md`** | Hetzner deploy |
| **`apps/worker/README.md`** | Local dev |

---

## CLI (`packages/cli/`)

| File | Purpose |
|------|---------|
| **`packages/cli/README.md`** | CLI usage |
| `packages/cli/week3-runbook.md` | Historical |
| `packages/cli/week7-runbook.md` | Historical |

---

## Deploy

| Path | Contents |
|------|----------|
| `deploy/kubernetes/` | Admission controller manifests |
| `deploy/preview/` | Preview-box ops |

---

## Archived (`apps/web/_archive/`)

Don't follow as instructions. Past states only.

- `week2-runbook.md`, `week6-runbook.md`, `week8-runbook.md` — MVP weekly runbooks
- `phase-2-5-notes.md`, `phase-3-audit.md` — superseded
- `bug-fix-pass-notes.md`, `code-review.md`, `code-review-cleanup-notes.md` — cleanup journals
- `demo-seed-coverage-notes.md`, `retrospective-w1-8.md`, `q1-plan.md`, `q1-retro.md`

---

## Common questions

- **"Where do I deploy from?"** → `docs/deploy-runbook.md`
- **"What's gated behind a feature flag?"** → grep `FLAREO_FEATURE_` in `apps/web/lib/speculative/flags.ts`
- **"What are the next decisions to make?"** → `docs/decisions.md`
- **"Why does X work this way?"** → `apps/web/_archive/retrospective-w1-8.md`, then the relevant phase note
