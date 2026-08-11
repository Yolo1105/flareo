# Doc index

Active documentation. Historical notes live under [`docs/archive/`](archive/).

---

## Root

| File | Purpose |
|------|---------|
| [`README.md`](../README.md) | What the project is now |
| [`KNOWN_LIMITATIONS.md`](../KNOWN_LIMITATIONS.md) | Gaps stated plainly |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Frozen; how to report issues |
| [`LICENSE`](../LICENSE) / [`NOTICE`](../NOTICE) | Apache-2.0 |

## Cross-cutting (`docs/`)

| File | Purpose |
|------|---------|
| [`deploy-runbook.md`](deploy-runbook.md) | Deploy from zero |
| [`decisions.md`](decisions.md) | Forward-looking gates G-1..G-5 |
| [`red-team-playbook.md`](red-team-playbook.md) | Adversarial checklist (mostly against retired build path) |
| [`session-protocol.md`](session-protocol.md) | Collaboration protocol |
| [`adr/`](adr/) | ADRs 010–014 (decisions already taken) |
| [`archive/`](archive/) | Historical notes |

## Apps

| Path | Purpose |
|------|---------|
| [`apps/web/README.md`](../apps/web/README.md) | Web app local notes |
| [`apps/web/scripts/republish/README.md`](../apps/web/scripts/republish/README.md) | Catalog republish pipeline |
| [`apps/worker/README.md`](../apps/worker/README.md) | Worker local notes |
| [`apps/worker/deployment-runbook.md`](../apps/worker/deployment-runbook.md) | Worker host deploy (build steps historical) |
| [`packages/cli/README.md`](../packages/cli/README.md) | CLI usage |
| [`deploy/kubernetes/README.md`](../deploy/kubernetes/README.md) | Admission policies |
| [`selfhost/README.md`](../selfhost/README.md) | Self-host placeholder |

## Common questions

- **"Where do I deploy from?"** → `docs/deploy-runbook.md`
- **"What's gated?"** → `docs/decisions.md` and `apps/web/lib/speculative/flags.ts`
- **"Why no Dockerfile builds?"** → `docs/adr/ADR-012-retire-build-path.md`
- **"What are the known gaps?"** → `KNOWN_LIMITATIONS.md`
