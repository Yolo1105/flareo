import { defineConfig, devices } from "@playwright/test";

/**
 * Flareo end-to-end test config.
 *
 * Scope: smoke-coverage of the conversion-relevant pages plus the
 * verify tool. Not unit tests, not integration tests for the API —
 * just "does the page load, do the buttons go where they say, do
 * the cross-page links resolve." This catches the launch-day bug
 * class the W1-8 retro flagged ("two link bugs found on launch day
 * that a Playwright flow would have caught").
 *
 * Why bare-minimum: the cost of Playwright is real (test maintenance
 * scales worse than feature count). Starting with one essential flow
 * and growing only when something breaks twice is the discipline.
 *
 * Run locally:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *   npx playwright test
 *
 * Run in CI: see .github/workflows (TBD when CI is wired up).
 */

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Fail the test run if you left a `.only` in. Keeps CI honest.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    // Capture trace on first retry — easier debugging than wading
    // through screenshots when something flakes.
    trace: "on-first-retry",
    // Screenshot only on failure. Costs no time on green runs.
    screenshot: "only-on-failure",
  },

  projects: [
    // Single browser. Adding firefox/webkit triples test time and
    // catches almost nothing extra at this scope. Add later if a
    // browser-specific bug forces it.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Auto-start the Next.js dev server. Comment out and run
  // `npm run dev` separately if you want faster iteration on tests.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Don't fail the test run if the dev server prints to stderr —
    // Next.js sometimes emits warnings during boot.
    stderr: "pipe",
  },
});
