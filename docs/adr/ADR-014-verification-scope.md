# ADR-014: Verification scope

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

`POST /api/v1/verify` and `flareo verify` accept any image reference.
It is tempting to enrich every response with a Trivy scan and a trust
score. That would conflate Track A (catalog) with Track B (neutral
verification client).

## Decision

For images **outside the catalog**, verification returns **signature
status only**: resolved digest, signer identity, issuer, Rekor index
(all taken from the verified Sigstore bundle). For catalog images, the
response may include scan/SBOM/trust metadata already produced by the
republish pipeline.

Flareo does **not** scan arbitrary user-supplied images on demand.

## Consequences

- Status `"signed"` means: signature verified; image is not in the
  catalog so Flareo cannot make a full trust statement
  (`apps/web/lib/validation/schemas.ts`).
- Abuse surface from on-demand pull-and-scan stays closed.
- VEX remains authored only for catalog modules.

## Alternatives considered

- **On-demand scan of arbitrary images.** Rejected: reintroduces the
  compute-abuse surface the project removed; VEX has no author for
  external images; a trust score for an unsigned third-party image
  would be meaningless.

This ADR exists so the Track A / Track B boundary does not erode later.
