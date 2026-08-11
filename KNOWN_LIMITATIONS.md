# Known limitations

Stated plainly. Gaps a careful reader would find anyway — written down
so they do not have to.

1. **Scope.** Flareo verifies and re-publishes images that already
   exist. It does not build from arbitrary source or Dockerfiles
   ([ADR-012](docs/adr/ADR-012-retire-build-path.md)).

2. **Trust score weights are a judgment call**, not an empirical
   result. Documented in `/docs/trust-score` so a reader can disagree
   explicitly. A high score means the signals are present and valid; it
   does not mean the image is safe to run.

3. **The worker's submission path used constants.** It passed a fixed
   `trustScore: 72` and `slsaLevel: 2` to the policy evaluator. That
   path is retired. The republish pipeline computes all four sub-scores
   from real output ([T-307](apps/web/scripts/republish/update-module-metadata.ts)).

4. **No in-toto attestation is generated or verified.** `cosign sign`
   is called; `cosign attest` is not. SLSA levels are not claimed
   anywhere.

5. **The policy evaluator is deliberately small** — a zod-validated
   JSON rule engine with threshold and presence rules, scoped to this
   project. It is not a general policy language and does not replace
   OPA/Rego or Kyverno. Use the shipped Kyverno templates for
   production enforcement.

6. **No distributed tracing.** Sentry errors and structured logs only.

7. **Previews were retired.** Per-user allocation is a stub behind a
   disabled flag; the shared demo instances are gone
   ([ADR-013](docs/adr/ADR-013-preview-disposition.md)).

8. **Billing is implemented but disabled.** Stripe checkout, portal,
   webhook and quota enforcement exist and are gated off. Retained as
   an engineering record.

9. **Test coverage and the reasoning.** 17 worker unit tests, Playwright
   E2E specs, and CLI smoke coverage exist. CI runs typecheck and lint
   for web but there are no web unit tests. Pure logic and the critical
   path are covered; React components are not, because the
   cost-to-value ratio is poor for a frozen artifact. The file that
   most deserves unit tests and does not have them is
   `apps/web/lib/sigstore/verify.ts`.

10. **Outstanding dependency advisories.** After non-breaking
    `npm audit fix`, ~35 vulnerabilities remain in the public lockfile
    (was 45). Deferred because fixes require major bumps:
    - `next` / `sharp` (libvips) → would force `next@16`
    - `tar` via `cacache` / `@sigstore/oci` → breaking Sigstore dep
    - `uuid` via `@sentry/webpack-plugin` → would force `@sentry/nextjs@10`
    Unrelated dependency upgrades are intentionally out of scope.

11. **Single-host deployment.** Deliberate for a single maintainer.
    Scaling means a larger machine, not a rewrite.

12. **No SLA.** Reference implementation and portfolio artifact, not a
    hosted service with uptime promises.

13. **Status.** Intentionally frozen. Not seeking contributors, feature
    requests or a roadmap. See [`CONTRIBUTING.md`](CONTRIBUTING.md).
