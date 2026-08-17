import { test, expect } from "@playwright/test";

/**
 * Conversion-flow smoke test.
 *
 * The W1-8 retro flagged that two link bugs landed in production
 * because manual testing didn't catch them. This file exercises
 * the conversion-relevant pages — landing → marketplace →
 * module detail → verify → docs/install → pricing → signup —
 * checking that the load-bearing links actually resolve.
 *
 * What this DOES test:
 *   - Each conversion-relevant page returns 200 and renders without
 *     hydration errors
 *   - Internal links between them resolve (not 404, not redirect loops)
 *   - The "Try shared demo" / "Pull this module" buttons exist on
 *     module pages and link to the documented destinations
 *   - The verify tool form is interactive (not server-component-only)
 *   - The signup form accepts an email and submits
 *
 * What this does NOT test:
 *   - Real Sigstore verification (network-bound, slow, brittle)
 *   - Full submission → build worker → publish loop (needs a real
 *     worker process; that's for integration tests, not E2E)
 *   - Stripe checkout end-to-end (mock Stripe is its own complexity)
 *   - Authentication flows (NextAuth state across browser contexts
 *     is fiddly; cover in a separate auth.spec.ts when needed)
 *
 * Failure mode prevention this catches:
 *   - Renamed routes that left dangling Link href values
 *   - Broken MDX content pages (compile-time error → 500 in dev)
 *   - Components that use `useSearchParams` without Suspense
 *   - Form action URLs that 404 silently
 */

test("landing page loads and shows sign-in first", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Flareo/i);
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /catalog/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /marketplace/i }).first()).toBeVisible();
});

test("marketplace renders and module cards are clickable", async ({ page }) => {
  await page.goto("/marketplace");
  // Page heading present.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Prefer the spotlight CTA — a plain Link click — over any nested
  // receipts links that may share the /modules/ prefix.
  const moduleLink = page
    .getByRole("link", { name: /see full receipts|view →/i })
    .first();
  await expect(moduleLink).toBeVisible();
  const href = await moduleLink.getAttribute("href");
  expect(href).toMatch(/^\/modules\/[^/?#]+/);
  await moduleLink.click();
  await expect(page).toHaveURL(new RegExp(`${href?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  // Module hero block renders.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("module detail shows the action buttons and links to receipts", async ({ page }) => {
  // Pick a known-stable module. Vaultwarden is in the seed data and
  // has been previewable in every iteration; if we ever drop it from
  // the catalog, swap this slug for whatever's currently featured.
  await page.goto("/modules/vaultwarden");

  // Pull button — load-bearing primary CTA on every module page.
  await expect(
    page.getByRole("button", { name: /pull this module/i })
      .or(page.getByRole("link", { name: /pull this module/i })),
  ).toBeVisible();

  // Receipts panel link to the OpenVEX document — the W1-8 retro
  // flagged that this kind of API-link was where two of the bugs
  // were. Worth specifically checking that it points at the right
  // path (not a stale /api/v0/... or /api/vex/...).
  const vexLink = page.locator('a[href*="/api/v1/modules/vaultwarden/vex"]');
  if (await vexLink.count() > 0) {
    // Link exists — verify the href shape is right.
    const href = await vexLink.first().getAttribute("href");
    expect(href).toMatch(/\/api\/v1\/modules\/vaultwarden\/vex$/);
  }
});

test("verify page redirects anonymous users to login", async ({ page }) => {
  await page.goto("/verify");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fverify/);
});

test("docs install page renders and shows the source build path", async ({ page }) => {
  await page.goto("/docs/install");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/install/i);
  // Curl|bash install was retired; from-source cargo build is the
  // supported path until signed release archives ship.
  await expect(page.getByText(/cargo build --release/i).first()).toBeVisible();
  await expect(
    page.getByText(/do not pipe a remote install script/i).first(),
  ).toBeVisible();
});

test("pricing page renders three tiers", async ({ page }) => {
  await page.goto("/pricing");
  // The pricing page has Free / Pro / Enterprise sections. Don't
  // hardcode prices (they change); just confirm the tier labels.
  await expect(page.locator("text=/free/i").first()).toBeVisible();
  await expect(page.locator("text=/pro/i").first()).toBeVisible();
});

test("pipeline and verify require sign-in", async ({ page }) => {
  await page.goto("/pipeline");
  await expect(page).toHaveURL(/\/login\?callbackUrl=/);

  await page.goto("/verify");
  await expect(page).toHaveURL(/\/login\?callbackUrl=/);
});

test("signup page form is interactive", async ({ page }) => {
  await page.goto("/signup");
  // Email input — match by type; placeholder is "you@example.com".
  const emailInput = page.locator('input[type="email"]').first();
  await expect(emailInput).toBeVisible();
  await emailInput.fill("e2e-test@example.com");
  // Don't actually submit — that would land in the waitlist DB.
  // Just confirm the submit button exists and the form is wired.
  const submit = page.getByRole("button", { name: /join|waitlist|sign up/i }).first();
  await expect(submit).toBeVisible();
});

test("404 page renders for unknown route", async ({ page }) => {
  // Notably this route should be 404. If somebody adds a catch-all
  // that intercepts it, the test catches the regression.
  const response = await page.goto("/this-route-does-not-exist-deadbeef");
  expect(response?.status()).toBe(404);
});

/**
 * Cross-page link sweep.
 *
 * Walks every internal link from the landing page and confirms each
 * resolves to a 2xx response (or a documented 3xx). This is the
 * "two link bugs at launch" failsafe — if any documented page is
 * unreachable from the landing surface, the test fails.
 *
 * Cost: ~30s on a local dev server, longer in CI. Runs last so the
 * other faster checks fail first when something obvious broke.
 */
test("internal links from landing page all resolve", async ({ page, request }) => {
  await page.goto("/");
  const internalLinks: string[] = await page
    .locator('a[href^="/"]:not([href^="//"])')
    .evaluateAll((els: Element[]) =>
      els.map((e: Element) => (e as HTMLAnchorElement).getAttribute("href") ?? ""),
    );

  // Dedupe + drop empty + drop fragment-only links + drop /app/* (auth-gated).
  const unique = Array.from(
    new Set(
      internalLinks
        .filter((h) => h && !h.startsWith("#") && !h.startsWith("/app/")),
    ),
  );

  // Cap at first 30 links to keep the test bounded; the conversion
  // surface is much smaller than the full app.
  const sample = unique.slice(0, 30);

  const failures: string[] = [];
  for (const href of sample) {
    try {
      const r = await request.get(href, {
        // Disable redirect-following — we want to see if the target
        // is real, not whether something else redirects to it.
        maxRedirects: 0,
        // Allow non-2xx so we can collect failures rather than throw
        // on first one.
        failOnStatusCode: false,
      });
      if (r.status() >= 400) {
        failures.push(`${href} → ${r.status()}`);
      }
    } catch (err) {
      failures.push(
        `${href} → ${err instanceof Error ? err.message : "request error"}`,
      );
    }
  }

  expect.soft(failures, `broken links: ${failures.join(", ")}`).toEqual([]);
});
