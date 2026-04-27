import type { Metadata } from "next";
import Link from "next/link";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { listReviewsForModeration } from "@/lib/db/reviews";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { ModerationActions } from "@/components/sections/app-admin/ModerationActions";

export const metadata: Metadata = {
  title: "Review moderation · admin",
};

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireAdminPage();

  const rows = await listReviewsForModeration(100);
  const flagged = rows.filter((r) => r.moderation === "flagged");
  const hidden = rows.filter((r) => r.moderation === "hidden");

  return (
    <>
      <ViewHeader
        eyebrow="ADMIN · REVIEW MODERATION"
        title="Flagged and hidden reviews"
        subtitle={`${flagged.length} flagged awaiting decision, ${hidden.length} currently hidden.`}
        actions={
          <Link
            href="/app/admin"
            className="border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink-softer hover:text-ink"
          >
            ← back to queue
          </Link>
        }
      />

      <div className="space-y-8 px-7 py-7">
        {flagged.length > 0 && (
          <section>
            <h2 className="mb-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-warn">
              FLAGGED · {flagged.length}
            </h2>
            <div className="space-y-3">
              {flagged.map((r) => (
                <ModerationCard key={r.id} review={r} />
              ))}
            </div>
          </section>
        )}

        {hidden.length > 0 && (
          <section>
            <h2 className="mb-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-faint">
              HIDDEN · {hidden.length}
            </h2>
            <div className="space-y-3">
              {hidden.map((r) => (
                <ModerationCard key={r.id} review={r} />
              ))}
            </div>
          </section>
        )}

        {flagged.length === 0 && hidden.length === 0 && (
          <div className="border border-dashed border-hairline bg-canvas-deep px-6 py-10 text-center font-body text-[13px] text-ink-ghost">
            No flagged or hidden reviews. Queue is clear.
          </div>
        )}
      </div>
    </>
  );
}

function ModerationCard({
  review,
}: {
  review: {
    id: string;
    moduleSlug: string;
    rating: number;
    title: string;
    body: string;
    moderation: string;
    flagReason: string | null;
    authorName: string | null;
    createdAt: string;
  };
}) {
  return (
    <article className="border border-hairline bg-canvas-deep p-5">
      <header className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="mb-1 font-mono text-[11px] text-ink-faint">
            <Link
              href={`/modules/${review.moduleSlug}`}
              className="text-accent hover:text-accent-hot"
            >
              {review.moduleSlug}
            </Link>
            {" · "}
            {review.rating}★ · by {review.authorName ?? "anonymous"}
          </div>
          <h3 className="font-display text-[15px] font-black text-ink">
            {review.title}
          </h3>
        </div>
        <time className="font-mono text-[10.5px] text-ink-ghost">
          {review.createdAt.slice(0, 10)}
        </time>
      </header>

      {review.flagReason && (
        <div className="mb-3 border-l-2 border-warn bg-warn/[0.06] px-3 py-2 font-body text-[12px] text-ink-softer">
          <span className="font-mono text-[10.5px] text-warn">FLAG REASON:</span>{" "}
          {review.flagReason}
        </div>
      )}

      <p className="mb-3 whitespace-pre-wrap font-body text-[13px] leading-[1.55] text-ink-softer">
        {review.body}
      </p>

      <ModerationActions
        reviewId={review.id}
        currentState={review.moderation}
      />
    </article>
  );
}
