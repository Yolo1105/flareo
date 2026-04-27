"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Module } from "@/lib/types";

interface Review {
  id: string;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  rating: number;
  title: string;
  body: string;
  moderation: string;
  createdAt: string;
  updatedAt: string;
}

interface Aggregate {
  count: number;
  average: number | null;
  histogram: [number, number, number, number, number];
}

interface Props {
  module: Module;
  reviews: Review[];
  aggregate: Aggregate;
  currentUserId: string | null;
  /** Non-null when the viewing user has already reviewed this module. */
  myReview: Review | null;
  /** When true, viewer is the publisher; hides the write form. */
  isPublisher: boolean;
}

/**
 * User-reviews section on the public module detail page.
 *
 * Three distinct regions:
 *   1. Aggregate banner — big average, count, 5-bar histogram
 *   2. Write-a-review form (or "edit your review" if one exists)
 *   3. List of reviews, newest first
 *
 * Write form is hidden when:
 *   - Viewer isn't signed in (shown as "sign in to review" prompt)
 *   - Viewer is the module's publisher (hidden entirely)
 */
export function ReviewsSection({
  module,
  reviews,
  aggregate,
  currentUserId,
  myReview,
  isPublisher,
}: Props) {
  return (
    <section className="border-b border-hairline px-8 py-12">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-display text-[28px] font-black tracking-[-0.02em] text-ink">
          Community reviews
        </h2>
        <div className="font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
          FROM OPERATORS WHO USED IT
        </div>
      </div>

      <AggregateBanner aggregate={aggregate} />

      <div className="mt-8">
        {isPublisher ? (
          <div className="border border-hairline bg-canvas-deep px-5 py-4 font-body text-[12.5px] text-ink-softer">
            You&apos;re the publisher of this module. Reviews here come
            from the operators running it.
          </div>
        ) : !currentUserId ? (
          <div className="border border-hairline bg-canvas-deep px-5 py-4 font-body text-[13px] text-ink-softer">
            <a href="/login" className="text-accent hover:text-accent-hot">
              Sign in
            </a>{" "}
            to share how this module has worked for you.
          </div>
        ) : (
          <WriteReviewForm
            moduleSlug={module.slug}
            existing={myReview}
          />
        )}
      </div>

      {/* List */}
      <div className="mt-8 space-y-4">
        {reviews.length === 0 ? (
          <div className="border border-dashed border-hairline bg-canvas-deep px-6 py-10 text-center font-body text-[13px] text-ink-ghost">
            No reviews yet. Be the first to share how this module has
            worked for you.
          </div>
        ) : (
          reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              canFlag={!!currentUserId && r.authorId !== currentUserId}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AggregateBanner({ aggregate }: { aggregate: Aggregate }) {
  if (aggregate.count === 0) {
    return (
      <div className="border border-hairline bg-canvas-deep px-5 py-6 font-body text-[13px] text-ink-softer">
        No ratings yet. When operators leave reviews, the average appears
        here alongside a histogram of the scores.
      </div>
    );
  }
  const avg = aggregate.average ?? 0;
  const maxBar = Math.max(1, ...aggregate.histogram);
  return (
    <div className="grid grid-cols-[220px_1fr] gap-5 border border-hairline bg-canvas-deep px-5 py-5">
      {/* Left: big number */}
      <div className="border-r border-hairline pr-5">
        <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
          AVERAGE
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[44px] font-black leading-none tracking-[-0.03em] text-ink">
            {avg.toFixed(1)}
          </span>
          <span className="font-mono text-[12px] text-ink-faint">/ 5</span>
        </div>
        <div className="mt-2 font-mono text-[10.5px] text-ink-ghost">
          {aggregate.count} review{aggregate.count === 1 ? "" : "s"}
        </div>
        <Stars value={Math.round(avg)} size={14} className="mt-2" />
      </div>

      {/* Right: histogram */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const n = aggregate.histogram[star - 1];
          const pct = (n / maxBar) * 100;
          return (
            <>
              <span
                key={`${star}-label`}
                className="font-mono text-[11px] text-ink-softer"
              >
                {star}★
              </span>
              <div
                key={`${star}-bar`}
                className="h-1.5 bg-canvas relative overflow-hidden"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-accent/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                key={`${star}-n`}
                className="w-10 text-right font-mono text-[11px] text-ink-faint"
              >
                {n}
              </span>
            </>
          );
        })}
      </div>
    </div>
  );
}

function Stars({
  value,
  size = 16,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`inline-flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= value} size={size} />
      ))}
    </div>
  );
}

function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={filled ? "text-accent" : "text-ink-ghost"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="M8 1.5l2 4.5 5 .5-3.8 3.4 1.1 5L8 12.2l-4.3 2.7 1.1-5L1 6.5l5-.5 2-4.5z" />
    </svg>
  );
}

function WriteReviewForm({
  moduleSlug,
  existing,
}: {
  moduleSlug: string;
  existing: Review | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(!!existing);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(`/api/v1/modules/${moduleSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, body }),
      });
      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(err.error?.message ?? "Couldn't submit review");
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error; try again");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-hairline bg-canvas-deep px-4 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
      >
        Write a review
      </button>
    );
  }

  const canSubmit = title.trim().length >= 5 && body.trim().length >= 20 && !submitting;

  return (
    <div className="border border-hairline bg-canvas-deep p-5">
      <div className="mb-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
        {existing ? "EDIT YOUR REVIEW" : "WRITE A REVIEW"}
      </div>

      <label className="mb-4 block">
        <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
          RATING
        </span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`p-1 transition-colors ${
                n <= rating ? "text-accent" : "text-ink-ghost hover:text-ink-mute"
              }`}
              aria-label={`Rate ${n} stars`}
            >
              <Star filled={n <= rating} size={22} />
            </button>
          ))}
        </div>
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
          TITLE
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full border border-hairline bg-canvas px-3 py-2 font-body text-[13px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
          placeholder="Rock solid replacement for the upstream image"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
          DETAIL
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={4000}
          className="w-full border border-hairline bg-canvas px-3 py-2 font-body text-[13px] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
          placeholder="How long have you been running it, what setup, any gotchas. Avoid leaking secrets or IP addresses."
        />
        <span className="mt-1 block text-right font-mono text-[10.5px] text-ink-ghost">
          {body.length} / 4000
        </span>
      </label>

      {error && (
        <div className="mb-3 border border-bad bg-bad/[0.08] px-3 py-2 font-body text-[12px] text-bad">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="bg-accent px-4 py-2 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
        >
          {submitting ? "Posting…" : existing ? "Update review" : "Post review"}
        </button>
        {!existing && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="border border-hairline px-4 py-2 font-body text-[13px] text-ink-softer hover:border-ink-ghost"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  canFlag,
}: {
  review: Review;
  canFlag: boolean;
}) {
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(review.moderation === "flagged");

  async function flag() {
    if (flagReason.trim().length < 5) return;
    setFlagging(true);
    try {
      const resp = await fetch(`/api/v1/reviews/${review.id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: flagReason }),
      });
      if (resp.ok) {
        setFlagged(true);
        setFlagOpen(false);
      }
    } finally {
      setFlagging(false);
    }
  }

  return (
    <article className="border border-hairline bg-canvas-deep p-5">
      <header className="mb-2 flex items-baseline justify-between">
        <div className="flex items-center gap-3">
          <Stars value={review.rating} size={14} />
          <h3 className="font-display text-[16px] font-black text-ink">
            {review.title}
          </h3>
        </div>
        <time className="font-mono text-[10.5px] text-ink-ghost">
          {new Date(review.createdAt).toISOString().slice(0, 10)}
        </time>
      </header>
      <div className="mb-3 font-mono text-[11px] text-ink-softer">
        by {review.authorName ?? "anonymous"}
      </div>
      <p className="whitespace-pre-wrap font-body text-[13px] leading-[1.6] text-ink-softer">
        {review.body}
      </p>
      {canFlag && (
        <div className="mt-3 border-t border-hairline pt-3">
          {flagged ? (
            <span className="font-mono text-[10.5px] text-warn">
              flagged for moderation review
            </span>
          ) : !flagOpen ? (
            <button
              type="button"
              onClick={() => setFlagOpen(true)}
              className="font-mono text-[10.5px] text-ink-ghost hover:text-warn"
            >
              Report this review
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={2}
                placeholder="What's wrong with this review? (spam, harassment, inaccurate, etc.)"
                className="w-full border border-hairline bg-canvas px-2 py-1.5 font-body text-[12px] text-ink placeholder:text-ink-ghost focus:border-warn focus:outline-none"
                maxLength={500}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={flagReason.trim().length < 5 || flagging}
                  onClick={flag}
                  className="border border-warn px-3 py-1 font-mono text-[11px] text-warn hover:bg-warn hover:text-canvas disabled:opacity-50"
                >
                  {flagging ? "Flagging…" : "Submit flag"}
                </button>
                <button
                  type="button"
                  onClick={() => setFlagOpen(false)}
                  className="font-mono text-[11px] text-ink-ghost hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
