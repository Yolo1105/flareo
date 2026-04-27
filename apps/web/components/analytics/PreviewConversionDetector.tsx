"use client";

import { useEffect } from "react";
import { trackEvent, type PlausibleEventProps } from "@/lib/analytics/plausible";

/**
 * Client-only component that detects whether the current page-view
 * arrived from a preview subdomain, and if so fires a PreviewConversion
 * Plausible event. Drop one instance of this on each conversion-
 * relevant page (signup, verify, docs/install, pricing, marketplace).
 *
 * Detection is via document.referrer. Preview subdomains follow the
 * pattern `s-<slug>-demo.preview.flareo.dev`. The `<slug>` between
 * `s-` and `-demo` becomes the sourceModule prop on the event.
 *
 * The component renders nothing. It fires once on mount, in a
 * useEffect, after Plausible has had a chance to load. If Plausible
 * isn't loaded (dev, ad-blocker, no-JS), trackEvent silently no-ops.
 *
 * Edge cases handled:
 *   - referrer empty (direct navigation, signup link from email,
 *     CLI install instructions copy-pasted) → fire nothing
 *   - referrer is the main flareo.dev site → fire nothing (this
 *     event is specifically for preview→main conversion)
 *   - referrer is a non-flareo external site → fire nothing
 *   - referrer matches the catch-all `s-*-demo` pattern but the slug
 *     section is empty (e.g. `s--demo.preview.flareo.dev`) → fire nothing
 *
 * One firing per page-load. The component remounts on navigation
 * (Next.js client routing) so cross-page conversions in a single
 * visit each get their own event — that's the right behavior because
 * "user came from preview AND visited /signup AND visited /pricing"
 * is two distinct conversion signals.
 */
interface Props {
  /** Which page this detector lives on. Maps to PreviewConversion.target. */
  target: PlausibleEventProps["PreviewConversion"]["target"];
}

export function PreviewConversionDetector({ target }: Props) {
  useEffect(() => {
    // Read the referrer once at mount. document.referrer is a
    // synchronous read; safe to do without an event handler.
    const ref = typeof document !== "undefined" ? document.referrer : "";
    if (!ref) return;

    let url: URL;
    try {
      url = new URL(ref);
    } catch {
      // Malformed referrer (rare, but theoretically possible from
      // some embedded contexts). Treat as no-referrer.
      return;
    }

    // Must be a preview subdomain.
    const host = url.hostname.toLowerCase();
    const match = host.match(/^s-([a-z0-9-]+)-demo\.preview\.flareo\.dev$/);
    if (!match) return;

    const slug = match[1];
    if (!slug) return;

    trackEvent("PreviewConversion", {
      sourceModule: slug,
      target,
    });
  }, [target]);

  return null;
}
