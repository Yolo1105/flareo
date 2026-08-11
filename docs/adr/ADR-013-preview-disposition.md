# ADR-013: Preview disposition

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Readers encountering `PreviewInstance`, `previewsPerUser`, or old
module-page Preview buttons might infer dynamic per-user sandboxes.
That is not what the system was.

## Decision

Record what preview actually was, and that it has been retired:

1. **Shared demos:** seven fixed services on one Hetzner box behind
   `*.preview.flareo.dev`. Domain lapsed; box unused. Ops scripts
   archived under `docs/archive/deploy-preview`.
2. **Per-user allocation:** a `StubAllocator` that launches nothing,
   behind `requireFeature("previewsPerUser")`, 404 by default. Left in
   place as speculative scaffolding (decisions.md G-1); not a live
   feature.

Product UI no longer advertises shared previews.

## Consequences

- Module pages no longer show a shared Preview button.
- `/sandbox` and `/docs/previews` explain discontinuation.
- Schema and stub allocator remain for history; do not infer capability
  from their presence.

## Alternatives considered

- **Delete PreviewInstance and the stub entirely.** Rejected: the
  speculative gate in decisions.md still references them; deleting
  would erase the record of what was considered and deferred.
- **Rebuild previews on a new domain.** Rejected: not needed for the
  artifact goal; operational cost returns.
