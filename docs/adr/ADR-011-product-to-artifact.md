# ADR-011: Product to engineering artifact

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Flareo was built through 2025 and early 2026 as a marketplace product:
an eight-week MVP, a launch plan, Horizon-2 bets (review UI, Firecracker
previews, paid tier), a pricing page, Stripe wiring, and demo personas
meant to make the site look inhabited.

That framing consumed attention that belonged elsewhere (a separate
research project on agentic inference serving) and invited the wrong
success metrics — users, customers, revenue — for what the code
actually demonstrated well: a careful verify-and-republish pipeline and
an honest threat model.

## Decision

In mid-2026 the project was reframed as an **engineering credibility
artifact**. Credibility comes from public, readable, runnable,
checkable code — not from adoption metrics. Pursuing users would
consume time budgeted for other work.

## Consequences

- Billing remains implemented but gated off.
- Pricing is retained as a surface but not pursued as a growth loop.
- Demo personas moved out of the production seed.
- `docs/horizon-2-plan.md` and related roadmaps are archived.
- Feature work that only makes sense for a startup (SSO, org tenancy,
  on-demand scanning) stays behind gates or out of scope.

## Alternatives considered

- **Keep shipping as a product.** Rejected: the build path's risk and
  the operational cost of an open marketplace do not match a solo
  portfolio timeline.
- **Delete the marketplace UI entirely.** Rejected: the catalog and
  verify surfaces are still the right demo of the pipeline; deleting
  them would hide the work.
