import { defineConfig } from "vitest/config";

/**
 * Vitest config for the worker's pure-logic tests.
 *
 * Why we need a config at all:
 * The worker's tsconfig uses module=NodeNext, which means relative
 * imports must include the `.js` extension (even though the source
 * is `.ts`). Vitest understands this via the standard
 * `tsconfig.json` resolution, but we set `resolve.extensions` here
 * explicitly so a future vitest version doesn't break the contract.
 *
 * What's NOT here:
 *   - No coverage reporter — we're not chasing a percentage,
 *     we're testing specific decision logic
 *   - No browser environment — these tests are node-side only
 *   - No global setup — pure functions, no DB, no fixtures
 */

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Match the speed of the actual worker logic — most tests are
    // microseconds. Anything timing out at 5s is likely a real bug.
    testTimeout: 5_000,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
});
