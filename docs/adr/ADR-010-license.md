# ADR-010: Repository license (Apache-2.0)

- **Status:** Accepted
- **Date:** 2026-08-10
- **Reverses:** earlier AGPL-3.0-or-later choice for `packages/cli`

## Context

The repository is public and presented as open source, but had no root
`LICENSE`. Under copyright law that means all rights reserved — readers
could not rely on a grant to use, modify, or redistribute the code.

Separately, `packages/cli` declared `AGPL-3.0-or-later`. AGPL was chosen
to signal that the project could not be "rug-pulled" into a closed
product: network use of a modified CLI would require source disclosure.
That positioning matched an earlier product framing (marketplace,
paid tier, self-host distribution).

The project has since been reframed as an engineering credibility
artifact rather than a product seeking adoption. The AGPL friction
(copyleft for network use, unfamiliarity for many company evaluators)
no longer serves that goal, and it would conflict with a single
Apache-2.0 license covering the monorepo.

## Decision

1. Add the standard Apache License 2.0 text at the repository root as
   `LICENSE`, with a short `NOTICE` naming the project and copyright
   holder.
2. Relicense `packages/cli` from AGPL-3.0-or-later to Apache-2.0,
   updating both `LICENSE` and `Cargo.toml`.
3. **This reverses the earlier AGPL decision for the CLI.** The
   original intent (prevent rug-pull) is superseded by the artifact
   goal: let people read and run the code without friction.

Apache-2.0 is the norm across the Sigstore, Kubernetes, and Trivy
ecosystems this project integrates with, and its explicit patent grant
makes the code easier to evaluate inside a company.

## Consequences

- The whole monorepo is under one permissive license.
- Downstream users and companies can fork or extract code without
  AGPL network-copyleft obligations.
- Anyone who received an earlier AGPL-licensed CLI build retains those
  rights for that build; new releases are Apache-2.0.

## Alternatives considered

- **Keep AGPL for the CLI, Apache-2.0 for the rest.** Rejected: mixed
  licensing confuses evaluators and fights the "read and run without
  friction" goal.
- **MIT / BSD.** Rejected: Apache-2.0's patent grant is a better fit
  for supply-chain / security tooling reviewed by legal teams.
