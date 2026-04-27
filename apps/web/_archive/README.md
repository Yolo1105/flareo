# `_archive/`

Historical documentation that's no longer load-bearing for current work, kept here for context. **Don't follow these as instructions** — they describe past states of the system, not the current one.

## What's archived here

**Week-by-week MVP runbooks** (`week2-runbook.md`, `week6-runbook.md`, `week8-runbook.md`) — the original 8-week buildout plans. Useful for understanding why certain decisions were made; not useful for deploying today. Use `docs/deploy-runbook.md` for deploy.

**Phase notes from earlier iterations** (`phase-2-5-notes.md`, `phase-3-audit.md`) — phase-specific plans that have either shipped or been superseded. Active phase plans live at the repo root (`phase-e-per-org-plan.md`, etc.).

**Code-review and bug-fix session notes** (`bug-fix-pass-notes.md`, `code-review.md`, `code-review-cleanup-notes.md`) — descriptions of past one-time cleanup passes. The fixes themselves are in the codebase; these are the journals of how they got there.

**Demo seed coverage notes** (`demo-seed-coverage-notes.md`) — what got included in the demo seed during MVP. The current seed is in `prisma/seed.ts`; this file is the design rationale.

**8-week MVP retrospective** (`retrospective-w1-8.md`) — what worked and didn't during the original buildout. Useful as historical reference; the live discipline lives in `docs/session-protocol.md` and `docs/decisions.md`.

**Q1 plan and retro** (`q1-plan.md`, `q1-retro.md`) — the original Q1 roadmap and what came of it. Active planning doc is `docs/q2-plan.md` at the root.

## How to use this directory

- **Looking for "why does X work this way?"** — start with `_archive/retrospective-w1-8.md`, then the relevant week or phase note.
- **Need to deploy?** Use `../deploy-runbook.md` at the root, not anything here.
- **Wondering if a doc here is current?** It isn't. If it were current it'd be at the root.

## What does NOT go here

- Active operational docs (`docs/deploy-runbook.md`, `full-runbook.md`, `account-system-runbook.md`)
- Active strategy docs (`docs/q2-plan.md`, `docs/horizon-2-plan.md`, `docs/decisions.md`)
- Reference specs that the code currently follows (`build-worker-spec.md`, `admin-review-ui-spec.md`)
- Anything used by `docs/index.md` for navigation

When promoting a file from here back to active status (rare), update `../index.md` to reference it from the new location.
