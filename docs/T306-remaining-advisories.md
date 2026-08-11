# T-306 remaining advisories (scratch for T-502)

After `npm audit fix` (non-breaking): **35** vulnerabilities remain
(1 low, 23 moderate, 7 high, 4 critical). Was 45.

Deferred — require `npm audit fix --force` / major bumps:

| Area | Why deferred |
|------|----------------|
| `next` / `sharp` (libvips CVEs) | Force installs `next@16` — major, out of scope for a frozen artifact without a dedicated upgrade pass |
| `tar` via `cacache` / `make-fetch-happen` / `@sigstore/oci` | Force installs `@sigstore/oci@0.7.2` — breaking; transitive via Sigstore tooling |
| `uuid` via `@sentry/webpack-plugin` | Force installs `@sentry/nextjs@10` — major Sentry bump |
| Remaining transitive moderates | Same force path as above |

Not applied: no unrelated dependency bumps. Worker vitest (17) still passes;
`npm run build:worker` still hits pre-existing Prisma `$transaction` typing
errors in `apps/worker/src/db.ts` unrelated to this lockfile change.
