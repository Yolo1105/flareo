/**
 * Worker unit tests.
 *
 * Scope: pure logic only. The worker has many side effects (Docker,
 * Prisma, R2, Sigstore, fetch to the main app) and end-to-end testing
 * those is integration-test territory that needs a real running stack.
 * What we test here is the pure decision logic — the parts that
 * decide IF something should happen, not the parts that DO it.
 *
 * Why these specifically: each one is logic that, if wrong, causes a
 * subtle production bug that's hard to debug after the fact.
 *
 * Run with:
 *   npm install -D vitest
 *   npm run test
 */

import { describe, it, expect } from "vitest";
import {
  countBySeverity,
  shouldRetry,
  backoffMs,
  MAX_TOTAL_ATTEMPTS,
} from "../src/lib.js";

describe("countBySeverity", () => {
  it("returns all-zero for empty input", () => {
    expect(countBySeverity([])).toEqual({
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    });
  });

  it("counts each severity bucket correctly", () => {
    const cves = [
      { severity: "CRITICAL" },
      { severity: "HIGH" },
      { severity: "HIGH" },
      { severity: "MEDIUM" },
      { severity: "LOW" },
    ];
    expect(countBySeverity(cves)).toEqual({
      critical: 1,
      high: 2,
      medium: 1,
      low: 1,
    });
  });

  it("treats UNKNOWN as LOW (matches Trivy --severity default tier)", () => {
    const cves = [
      { severity: "UNKNOWN" },
      { severity: "UNKNOWN" },
      { severity: "LOW" },
    ];
    expect(countBySeverity(cves)).toEqual({
      critical: 0,
      high: 0,
      medium: 0,
      low: 3,
    });
  });

  it("handles mixed-case severity strings (defensive)", () => {
    const cves = [
      { severity: "critical" },
      { severity: "Critical" },
      { severity: "CRITICAL" },
    ];
    expect(countBySeverity(cves)).toEqual({
      critical: 3,
      high: 0,
      medium: 0,
      low: 0,
    });
  });

  it("ignores unrecognized severity strings (does not throw)", () => {
    // If Trivy ever emits a new severity bucket we don't know about,
    // the worker shouldn't crash — it should drop the unknown CVE
    // and continue. The downstream effect is an undercount; that's
    // safer than a crash.
    const cves = [
      { severity: "CRITICAL" },
      { severity: "EXTREME-DANGER" }, // not a real Trivy severity
      { severity: "HIGH" },
    ];
    expect(countBySeverity(cves)).toEqual({
      critical: 1,
      high: 1,
      medium: 0,
      low: 0,
    });
  });
});

describe("shouldRetry", () => {
  // Default MAX_TOTAL_ATTEMPTS=3 means: first failure → retry,
  // second failure → retry, third failure → dead-letter.

  it("retries on first failure (attemptCount=0)", () => {
    expect(shouldRetry(0)).toBe("retry");
  });

  it("retries on second failure (attemptCount=1)", () => {
    expect(shouldRetry(1)).toBe("retry");
  });

  it("dead-letters on third failure (attemptCount=2)", () => {
    // attemptCount=2 means we've already failed twice. This third
    // failure brings us to MAX_TOTAL_ATTEMPTS — dead-letter.
    expect(shouldRetry(2)).toBe("dead-letter");
  });

  it("dead-letters when attemptCount exceeds MAX (defensive)", () => {
    // Belt-and-suspenders: shouldn't happen in practice but the
    // boundary is well-defined.
    expect(shouldRetry(5)).toBe("dead-letter");
  });

  it("respects custom maxAttempts argument", () => {
    // With maxAttempts=2 you get exactly 1 retry: first failure
    // retries (nextAttempt=1, < 2), second failure dead-letters
    // (nextAttempt=2, >= 2).
    expect(shouldRetry(0, 2)).toBe("retry");
    expect(shouldRetry(1, 2)).toBe("dead-letter");
  });

  it("dead-letters with maxAttempts=1 (one attempt only, no retries)", () => {
    // maxAttempts=1 means "first failure dead-letters" — no retries.
    // attemptCount=0 → nextAttempt=1 → 1 >= 1 → dead-letter.
    expect(shouldRetry(0, 1)).toBe("dead-letter");
  });

  it("uses MAX_TOTAL_ATTEMPTS=3 as the documented default", () => {
    // Sanity: this is the constant that production runs with.
    // If it changes, this test breaks loudly so we update both
    // the constant and any docstrings that depend on it.
    expect(MAX_TOTAL_ATTEMPTS).toBe(3);
  });
});

describe("backoffMs", () => {
  it("returns 1 minute for the first failure", () => {
    expect(backoffMs(1)).toBe(60_000);
  });

  it("returns 5 minutes for the second failure", () => {
    expect(backoffMs(2)).toBe(300_000);
  });

  it("returns 15 minutes for the (unreachable) fallback", () => {
    // Under MAX_TOTAL_ATTEMPTS=3 this branch never fires because
    // the caller dead-letters first. Test it anyway because a future
    // configuration with MAX_TOTAL_ATTEMPTS=4+ would reach it.
    expect(backoffMs(3)).toBe(900_000);
    expect(backoffMs(10)).toBe(900_000);
  });

  it("treats accumulatedFailures<=1 as the 1-minute tier", () => {
    // Defensive: a caller passing 0 by mistake gets the same 1-minute
    // backoff rather than crashing or falling through to NaN.
    expect(backoffMs(0)).toBe(60_000);
  });

  it("monotonically non-decreasing", () => {
    // Property: backoff should never go DOWN as failures grow.
    // Catches off-by-one or signed-comparison bugs.
    let prev = backoffMs(0);
    for (let i = 1; i < 10; i++) {
      const current = backoffMs(i);
      expect(current).toBeGreaterThanOrEqual(prev);
      prev = current;
    }
  });
});
