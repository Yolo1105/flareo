import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for the web app's pure-logic tests.
 *
 * Why we need a config at all:
 * apps/web resolves `@/*` via tsconfig paths. Vitest needs the same
 * alias so tests can import the same modules the app uses.
 *
 * What's NOT here:
 *   - No coverage reporter — we're not chasing a percentage,
 *     we're testing specific decision logic
 *   - No browser / jsdom environment — these tests are node-side only
 *   - No global setup — pure functions, no DB, no network fixtures
 */

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    testTimeout: 5_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
    extensions: [".ts", ".tsx", ".js"],
  },
});
