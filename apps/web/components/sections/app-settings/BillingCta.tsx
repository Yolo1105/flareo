"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/plausible";

/**
 * CTA button for the billing page. Two modes:
 *
 *   - kind="upgrade": POSTs to /api/v1/billing/create-checkout-session,
 *     reads { url }, window.location.href = url (jumps to the Stripe
 *     hosted checkout).
 *   - kind="portal":  POSTs to /api/v1/billing/portal, reads { url },
 *     same redirect pattern.
 *
 * When Stripe isn't configured server-side (the endpoint returns 503
 * "misconfigured"), the button surfaces the reason via an inline error
 * rather than silently doing nothing. If Stripe IS configured but a
 * specific error comes back, the error.message is displayed verbatim
 * because the API layer has already phrased it for humans.
 *
 * `stripeConfigured` is the SSR hint — when false, render the button
 * as disabled with the "coming soon" tooltip to match the pre-Stripe
 * UX. We don't gate on this server-side-only, though, because we still
 * want the endpoint-level 503 to be the source of truth.
 */

interface Props {
  kind: "upgrade" | "portal";
  stripeConfigured: boolean;
}

export function BillingCta({ kind, stripeConfigured }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint =
    kind === "upgrade"
      ? "/api/v1/billing/create-checkout-session"
      : "/api/v1/billing/portal";
  const label =
    kind === "upgrade" ? "Upgrade to Pro →" : "Manage billing →";
  const loadingLabel =
    kind === "upgrade" ? "Opening checkout..." : "Opening portal...";

  async function handleClick() {
    // Fire the event before the fetch so we capture clicks even if
    // the subsequent POST errors out; otherwise we'd under-count
    // intent during Stripe outages.
    if (kind === "upgrade") {
      trackEvent("UpgradeClicked", { origin: "billing_page" });
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(
          body.error?.message ??
            `Couldn't ${kind === "upgrade" ? "start checkout" : "open portal"} (${res.status}).`,
        );
        setBusy(false);
        return;
      }
      const body = (await res.json()) as { url?: string };
      if (!body.url) {
        setError("Server returned no redirect URL. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = body.url;
      // Don't clear busy — we're navigating away.
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  if (!stripeConfigured) {
    return (
      <button
        type="button"
        disabled
        className="cursor-not-allowed border border-hairline bg-canvas px-5 py-2 font-body text-[13px] font-medium text-ink-ghost"
        title="Stripe isn't wired yet — coming in the next deploy."
      >
        {kind === "upgrade"
          ? "Upgrade to Pro · coming soon"
          : "Manage billing · coming soon"}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex items-center gap-2 bg-accent px-5 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
      >
        {busy ? (
          <>
            <span className="block h-2 w-2 rounded-full bg-canvas meta-pulse" />
            {loadingLabel}
          </>
        ) : (
          <>{label}</>
        )}
      </button>
      {error && (
        <div className="max-w-[260px] border border-bad/40 bg-bad/[0.06] px-3 py-1.5 text-right font-mono text-[11px] text-bad">
          {error}
        </div>
      )}
    </div>
  );
}
