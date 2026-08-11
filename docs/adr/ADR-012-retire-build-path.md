# ADR-012: Retire the Dockerfile build path

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Flareo used to accept an arbitrary Dockerfile from an untrusted user and
build it in a sandbox on infrastructure that also held a signing
identity. That path is the largest attack surface in a system whose
premise is "don't trust us, verify yourself."

## Decision

Retire the public input. Preserve the implementation under
`apps/worker/src/legacy/build.ts` as a record of how isolation was
designed. `POST /api/v1/submissions` returns **410 Gone**.

Reasons, in order of severity:

1. **Signing-identity compromise is catastrophic.** A sandbox escape
   that reaches the signing identity lets an attacker obtain a
   Flareo-verified signature on a malicious image.
2. **An open build service is an abuse magnet** — cryptomining, free
   compute, DDoS staging — a permanent operational cost for a
   portfolio artifact.
3. **"Arbitrary Dockerfile" and "reproducible build" are
   contradictory.** A user Dockerfile can `curl … | sh`.

The Track A republish pipeline already does everything valuable without
building anything.

## Consequences

- Publish UI becomes an explanation of the closure.
- Worker `processSubmission` no longer calls `dockerBuild`.
- Red-team attacks aimed at the build path lose their live target —
  intentional.

## Alternatives considered

- **Keyless signing plus hermetic builds.** Keyless was already in use.
  Hermetic SLSA L2/L3 isolation from scratch for a path that is no
  longer the product is the wrong investment.
- **Operate the build service with tighter abuse controls.** Permanent
  ops cost for a portfolio artifact; rejected.
