"use client";

import { useState } from "react";

/**
 * Waitlist signup form. Posts to /api/waitlist.
 *
 * UX:
 *   - Single email field + optional "where did you hear about us"
 *   - Success state swaps the form for a confirmation block
 *   - Errors render inline under the input
 *   - Honeypot "company" field to deter low-effort bots
 *
 * Design language matches the verify tool's terminal-inspired blocks.
 */
export function SignupForm() {
  const [email, setEmail] = useState("");
  const [referrer, setReferrer] = useState("");
  // Honeypot: real users never fill this; bots that scrape fields do.
  const [honey, setHoney] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Honeypot short-circuit. Pretend success; don't tell the bot it lost.
    if (honey.length > 0) {
      setSubmitted(true);
      return;
    }

    if (!email.trim()) {
      setError("email required");
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          referrer: referrer.trim() || undefined,
          source: "signup-page",
        }),
      });
      if (resp.status === 429) {
        setError("Too many signups from your network. Try again in a few minutes.");
        return;
      }
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(body.error?.message ?? "Could not sign up. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Try again?");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="border-b border-hairline bg-canvas-panel px-8 py-16">
        <div className="max-w-[600px]">
          <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-good">
            <span className="block h-1.5 w-1.5 rounded-full bg-good" />
            SIGNED UP
          </div>
          <h2 className="mb-5 font-display text-[44px] font-black leading-[1] tracking-[-0.025em] text-ink">
            You&apos;re on the list.
          </h2>
          <p className="mb-6 font-body text-[15px] leading-[1.6] text-ink-softer">
            We&apos;ll email you when your seat opens. That&apos;s the only
            email you&apos;ll get from us until then.
          </p>
          <p className="font-mono text-[12px] leading-[1.7] text-ink-faint">
            In the meantime, you can verify any signed container at{" "}
            <a href="/verify" className="text-accent underline">
              flareo.dev/verify
            </a>
            , browse the catalog at{" "}
            <a href="/catalog" className="text-accent underline">
              flareo.dev/catalog
            </a>
            , or read the docs at{" "}
            <a
              href="https://docs.flareo.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              docs.flareo.dev
            </a>
            . All of that works today, no signup required.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-hairline bg-canvas-panel px-8 py-12">
      <form onSubmit={onSubmit} className="max-w-[600px]">
        <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
          <span className="font-normal text-ink-ghost">01</span>
          YOUR EMAIL
        </div>
        <div className="mb-6 flex border border-hairline bg-canvas-deep focus-within:border-accent">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 bg-transparent px-5 py-4 font-mono text-[14px] text-ink placeholder:text-ink-ghost focus:outline-none"
            autoComplete="email"
            required
            spellCheck={false}
          />
        </div>

        <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
          <span className="font-normal text-ink-ghost">02</span>
          HOW DID YOU HEAR ABOUT US?
          <span className="font-normal tracking-normal text-ink-ghost">
            (optional)
          </span>
        </div>
        <div className="mb-8 flex border border-hairline bg-canvas-deep focus-within:border-accent">
          <input
            type="text"
            value={referrer}
            onChange={(e) => setReferrer(e.target.value)}
            placeholder="hacker news, a friend, somewhere else..."
            maxLength={280}
            className="flex-1 bg-transparent px-5 py-4 font-mono text-[13px] text-ink placeholder:text-ink-ghost focus:outline-none"
            spellCheck={true}
          />
        </div>

        {/* Honeypot — hidden from humans, visible to form-scraping bots */}
        <label
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-10000px",
            height: 0,
            width: 0,
            overflow: "hidden",
          }}
        >
          Do not fill this field:
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
          />
        </label>

        <div className="flex items-center gap-5">
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="flex items-center gap-2.5 bg-accent px-8 py-3.5 font-body text-[14px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
          >
            {submitting ? "Saving..." : "Join the waitlist →"}
          </button>
          {error && (
            <span className="font-mono text-[12px] text-bad">{error}</span>
          )}
        </div>

        <p className="mt-8 max-w-[520px] font-mono text-[11px] leading-[1.7] text-ink-faint">
          We store your email and nothing else. No tracking pixels, no analytics
          on this form. We email you once — when your seat opens. See the{" "}
          <a href="/legal/privacy" className="text-accent underline">
            privacy page
          </a>{" "}
          for the detail.
        </p>
      </form>
    </section>
  );
}
