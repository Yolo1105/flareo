import Script from "next/script";

/**
 * Plausible analytics script. Privacy-friendly page analytics — no
 * cookies, no PII, no cross-site tracking, GDPR/CCPA/PECR compliant
 * out of the box. That's why we picked it: it's the one analytics
 * provider whose operational story matches what our privacy page
 * already promised.
 *
 * Only renders when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set. This means:
 *
 *   - Local dev: unset → no script, no network calls to plausible.io
 *   - Preview deploys: unset → no tracking; don't pollute the real
 *     stats with Vercel preview-URL traffic
 *   - Production: set to "flareo.dev" (or whatever the live domain
 *     is) → script loads, page views ticked
 *
 * The "tagged-events" extension lets us fire custom events from
 * ordinary <button> / <a> elements without JS, via the className
 * `plausible-event-name=<EventName>` convention. See the Plausible
 * docs for the full syntax:
 *   https://plausible.io/docs/custom-event-goals
 *
 * For JS-triggered events (e.g. on API response), we call
 * window.plausible('EventName', { props: {...} }) from the components
 * that care. See lib/analytics/plausible.ts for the typed helper.
 */
export function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  // Script domain override — if the user is running Plausible
  // self-hosted somewhere, they set NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL
  // to their instance. Default is plausible.io (their hosted service).
  const scriptSrc =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL ??
    "https://plausible.io/js/script.tagged-events.js";

  return (
    <>
      <Script
        defer
        data-domain={domain}
        src={scriptSrc}
        strategy="afterInteractive"
      />
      {/* Bootstrap the queue function so calls to
          window.plausible(...) made before the script loads don't
          throw. The real script replaces this function entirely
          once loaded.
          
          Queue is capped at 50 entries as a defense against the
          ad-blocker case: if the real script never loads, events fired
          via trackEvent() or tagged-events still call through to this
          shim indefinitely. Without a cap, a long-lived tab (e.g. an
          admin keeping /app/admin/worker open all day) would
          accumulate unbounded objects. 50 is arbitrary but large
          enough that any legitimate pre-script-load backlog fits.
          Matches the snippet in Plausible's own setup docs, plus
          the length guard. */}
      <Script id="plausible-queue" strategy="afterInteractive">
        {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []); if (window.plausible.q.length < 50) { window.plausible.q.push(arguments); } };`}
      </Script>
    </>
  );
}
