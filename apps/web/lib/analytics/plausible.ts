/**
 * Typed wrapper around window.plausible() for firing custom events
 * from client-side code.
 *
 * Why a wrapper and not direct window.plausible() calls:
 *   - The event-name set is closed: every event and every prop key
 *     lives in this file, which means typo'd event names get caught
 *     at typecheck time instead of silently landing in Plausible
 *     under "NotRealEvent" / "ModulePublised" / etc.
 *   - When Plausible isn't loaded (dev, preview deploys, or a user
 *     with a tracker blocker), calls still work — they silently
 *     no-op instead of throwing on undefined.
 *   - One place to adjust if we ever switch providers.
 *
 * Pattern for tagged-events (no JS): put the className
 * `plausible-event-name=EventName` on a <button> or <a>. Use this
 * helper only when the event fires based on a runtime condition
 * (API response status, form-validation outcome) that can't be
 * expressed in a className.
 */

// Closed set of event names we can fire. Adding an event means
// adding it here first — this is the compiler-checked whitelist.
export type PlausibleEvent =
  | "SubmissionCreated"
  | "SubmissionQuotaBlocked"
  | "UpgradeClicked"
  | "VerifyToolUsed";

/**
 * Custom props per event. Plausible's free plan allows up to 30
 * distinct custom prop values per property; don't cardinality-bomb
 * these with unbounded strings (user ids, emails, arbitrary slugs —
 * leave those in the DB). Good props are small closed sets:
 * "free" vs "pro", "inline" vs "upload", "cli" vs "web".
 */
export interface PlausibleEventProps {
  SubmissionCreated: {
    source: "cli" | "web";
    uploadMode: "inline" | "r2-upload" | "none";
    plan: "free" | "pro";
  };
  SubmissionQuotaBlocked: {
    plan: "free" | "pro";
    // How close the user was to the limit — useful to see whether
    // quota_exceeded hits fire at "hit the limit" or "way over it"
    // (the latter would suggest a client-side bug).
    used: "at_limit" | "near_limit" | "above_limit";
  };
  UpgradeClicked: {
    // Where on the site the user clicked — the billing page upgrade
    // button, the quota-exceeded toast, the pricing page, etc.
    origin: "billing_page" | "quota_toast" | "pricing_page";
  };
  VerifyToolUsed: {
    result: "ok" | "signature_mismatch" | "scan_failed" | "unknown_image";
  };
}

type WindowWithPlausible = Window & {
  plausible?: (
    eventName: string,
    options?: { props?: Record<string, string | number | boolean> },
  ) => void;
};

/**
 * Fire a custom Plausible event. Safe to call even when Plausible
 * isn't loaded or has been blocked — the call is a no-op in that
 * case, and never throws.
 *
 * Example:
 *   trackEvent("SubmissionCreated", {
 *     source: "web",
 *     uploadMode: "r2-upload",
 *     plan: "free",
 *   });
 */
export function trackEvent<E extends PlausibleEvent>(
  event: E,
  props: PlausibleEventProps[E],
): void {
  if (typeof window === "undefined") return;
  const w = window as WindowWithPlausible;
  if (typeof w.plausible !== "function") return;
  try {
    w.plausible(event, { props: props as Record<string, string | number | boolean> });
  } catch {
    // Never let an analytics bug break the page.
  }
}
