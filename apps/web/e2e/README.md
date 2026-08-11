# End-to-end tests

Smoke-coverage of the conversion-relevant pages plus the verify tool. Catches the link-class bug the W1-8 retro flagged ("two link bugs found on launch day that a Playwright flow would have caught"). Not a substitute for unit tests or full integration tests — just a tripwire for things that should never break silently.

## Setup

```sh
npm install -D @playwright/test
npx playwright install chromium
```

That's it. Playwright pulls in its own browser binary; nothing system-level needed.

## Running

```sh
# Against a local dev server (auto-started by playwright.config.ts):
npm run test:e2e

# Against an already-running server (faster iteration):
npm run dev          # in one terminal
npm run test:e2e     # in another

# Against a deployed environment:
PLAYWRIGHT_BASE_URL=https://localhost:3000 npm run test:e2e

# Single test:
npx playwright test conversion-flow --grep "marketplace"

# UI mode (interactive runner with timeline + DOM snapshots):
npx playwright test --ui
```

## Test scope

What's covered today (`conversion-flow.spec.ts`):

- Landing page CTAs render
- Marketplace renders and module cards link to detail pages
- Module detail page shows the action buttons + receipts links
- Verify tool form is interactive
- Docs install page shows the curl-pipe snippet
- Pricing renders three tiers
- Signup form is interactive
- 404 returns 404
- Internal links from landing all resolve (cross-page link sweep)

What's NOT covered:

- Real Sigstore verification (slow + brittle; skipped on purpose)
- Full submission → build worker → publish loop (needs real worker)
- Stripe checkout end-to-end
- Authentication flows (NextAuth state across browser contexts)

## Adding tests

Don't pre-emptively. The discipline is: if a regression slips into production that an E2E test would have caught, **add the test then**. Speculative E2E coverage is the failure mode that makes test suites unmaintainable.

When you do add: prefer one focused test per regression class over multi-step happy-path tests. The latter become flaky at scale.

## CI integration

Not wired up yet. When you do:

```yaml
# .github/workflows/e2e.yml — sketch
- name: Install dependencies
  run: npm ci
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
- name: Run E2E tests
  run: npm run test:e2e
- name: Upload trace on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-trace
    path: playwright-report/
```

Add to `.github/workflows/` once you've run the suite locally and confirmed it's stable.

## Troubleshooting

**"webServer started but page didn't load":** the Next dev server can take 60+ seconds on a cold cache. The `timeout: 120_000` in `playwright.config.ts` should cover it; bump if you're on slow hardware.

**Tests are flaky on CI but stable locally:** check that `workers: 1` is set in CI config (it is in `playwright.config.ts` via `process.env.CI`). Parallel runs against a single dev server cause race conditions on first-render hydration.

**"Browser closed unexpectedly":** Linux CI environments sometimes need extra dependencies. Run `npx playwright install --with-deps chromium`.
