"use client";

/**
 * SPECULATIVE — see decisions.md G-1.
 *
 * Per-user preview launch button. Posts to /api/v1/modules/<slug>/preview,
 * gets back a status + URL, opens the URL in a new tab.
 *
 * The button is rendered conditionally based on `userSignedIn` —
 * sign-in is required for per-user previews. Public visitors get the
 * shared-demo button instead (rendered by ModuleHero).
 *
 * Failure modes:
 *   - 401 → user signed out between page load and click. Redirect to
 *     /login with callbackUrl back to this module.
 *   - 502 (allocation_failed) → substrate is down or quota hit. Show
 *     inline error.
 *   - Existing instance → endpoint returns it; we open the URL.
 *
 * Visible loading state during allocation (mock allocator returns in
 * 200ms; real substrate could be 30-60s).
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  slug: string;
  /** Disabled when module is not previewable. */
  disabled?: boolean;
}

interface AllocateResponse {
  id: string;
  status: "ready" | "allocating" | "failed";
  url: string | null;
  expiresAt: string;
}

interface ApiError {
  error?: { code?: string; message?: string };
}

export function LaunchPrivatePreviewButton({ slug, disabled = false }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (pending) return;
    setError(null);
    setPending(true);

    try {
      const r = await fetch(`/api/v1/modules/${slug}/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });

      if (r.status === 401) {
        // Redirect to login with callback URL — user goes through
        // login and lands back here on the module page.
        const callback = `/modules/${slug}`;
        window.location.href = `/login?callbackUrl=${encodeURIComponent(callback)}`;
        return;
      }

      if (!r.ok) {
        let detail = `request failed (${r.status})`;
        try {
          const body = (await r.json()) as ApiError;
          detail = body.error?.message ?? detail;
        } catch {
          // ignore parse failures
        }
        setError(detail);
        return;
      }

      const body = (await r.json()) as AllocateResponse;
      if (body.status === "ready" && body.url) {
        window.open(body.url, "_blank", "noopener,noreferrer");
      } else if (body.status === "allocating") {
        // Theoretically the endpoint waits for ready before returning
        // but if a future variant doesn't, surface that gracefully.
        setError("instance still allocating — try again in a few seconds");
      } else {
        setError("preview allocation failed");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "network error",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="ghost"
        onClick={onClick}
        disabled={disabled || pending}
      >
        {pending
          ? "Launching..."
          : "Launch private preview →"}
      </Button>
      {error && (
        <p
          className="font-mono text-[10px] text-bad"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
