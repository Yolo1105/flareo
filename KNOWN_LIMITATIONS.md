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
    `npm audit fix`, the public lockfile still reports **35**
    vulnerabilities (**4 critical**, 7 high, 23 moderate, 1 low) —
    reproduce with `npm audit --package-lock-only`. Deferred majors
    remain:
    - `next` / `sharp` (libvips) → would force `next@16`
    - `tar` via `cacache` / `@sigstore/oci` → breaking Sigstore dep bump
    - `uuid` via `@sentry/webpack-plugin` → would force `@sentry/nextjs@10`

    The four criticals, individually:

    **`@sigstore/oci` (GHSA-pf56-329r-95rw) — credential confusion.**
    Can leak registry credentials to an attacker-controlled registry
    when the library is given stored credentials and an attacker-chosen
    reference. `POST /api/v1/verify` accepts an arbitrary registry
    reference from an unauthenticated caller, which looks alarming next
    to this advisory. **Exposure here:** the live verify path in
    `apps/web/lib/sigstore/verify.ts` does not import or call
    `@sigstore/oci`. Registry access uses `fetch` plus
    `obtainAnonToken()` — the anonymous Docker token flow — and never
    attaches stored credentials to a registry request. AWS credentials
    exist in the web environment for ECR republish operations but are
    not passed on the verify path. The package remains a declared
    dependency (and pulls in the vulnerable `tar` tree below); the
    credential-confusion bug is not reachable through the verify
    endpoint as written. Upgrading is deferred because the Sigstore
    major that clears it is a breaking change and this path does not
    actually use the library today.

    **`@auth/core` (GHSA-xmf8-cvqr-rfgj and related) — uncaught
    exception on malformed `Bearer` headers (plus other Auth.js
    criticals in the same range).** Reached through
    `next-auth@5.0.0-beta.25` (pinned) and `@auth/prisma-adapter`.
    **Exposure here:** Auth.js middleware/session handling can throw on
    a malformed Authorization header rather than returning a clean
    401. That is an availability / error-handling issue on
    authenticated surfaces, not credential theft. The pin to
    `5.0.0-beta.25` is deliberate; moving to a fixed beta is a
    deliberate deferral (Auth.js majors have historically reshaped
    session/edge contracts), not an overlooked `npm update`.

    **`next-auth` — inherits `@auth/core`.** Same pin, same exposure
    and same deferral reason as above.

    **`tar` (several GHSA, including hardlink path traversal /
    overwrite).** **Exposure here:** `tar@6.2.1` is a **transitive
    runtime** dependency of the web app via
    `@sigstore/oci` → `make-fetch-happen` → `cacache` → `tar` (confirmed
    with `npm ls tar`). It is not a direct dependency and is not used
    by application code to extract attacker-supplied archives on the
    verify or request path. Residual risk is limited to whatever
    `cacache`/`make-fetch-happen` do when `@sigstore/oci` (or any
    future caller) fetches and caches registry content — which the
    live verify path does not invoke. Upgrade is deferred with the
    `@sigstore/oci` major.

    These four are known, analysed against this codebase, and deferred.
    The lockfile is public; any reader can reproduce
    `npm audit --package-lock-only` themselves. Unrelated dependency
    upgrades remain intentionally out of scope.

11. **Single-host deployment.** Deliberate for a single maintainer.
    Scaling means a larger machine, not a rewrite.

12. **No SLA.** Reference implementation and portfolio artifact, not a
    hosted service with uptime promises.

13. **Status.** Intentionally frozen. Not seeking contributors, feature
    requests or a roadmap. See [`CONTRIBUTING.md`](CONTRIBUTING.md).
