import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getPublicProfile,
  getPublicModulesForUser,
  getReviewsByUser,
} from "@/lib/db/profiles";
import { formatLastRebuiltAt } from "@/lib/utils/time";

interface Props {
  params: Promise<{ username: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const res = await getPublicProfile(username);
    if (!res) return { title: "Profile not found" };
    const name = res.profile.displayName ?? `@${res.profile.username}`;
    return {
      title: `@${res.profile.username}`,
      description: `${name} on Flareo — ${res.profile.moduleCount} published module${res.profile.moduleCount === 1 ? "" : "s"}, ${res.profile.reviewCount} review${res.profile.reviewCount === 1 ? "" : "s"}.`,
    };
  } catch {
    return { title: "Profile" };
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const res = await getPublicProfile(username);
  if (!res) notFound();
  const { profile, userId } = res!;

  const [modules, reviews] = await Promise.all([
    getPublicModulesForUser(userId),
    getReviewsByUser(userId, 20),
  ]);

  const isPublisher = modules.length > 0;
  const joinYear = new Date(profile.joinedAt).getFullYear();

  return (
    <>
      {/* Hero */}
      <section className="border-b border-hairline bg-canvas-panel px-8 pb-10 pt-12">
        <div className="mb-6 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
          <Link href="/catalog" className="hover:text-ink">
            catalog
          </Link>
          <span className="mx-2 text-ink-ghost">/</span>
          <span className="text-ink">@{profile.username}</span>
        </div>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt=""
              className="h-20 w-20 border border-hairline object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center border border-hairline bg-canvas-deep font-display text-[28px] font-black text-ink-mute">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline gap-3">
              <h1 className="font-display text-[44px] font-black leading-[1] tracking-[-0.025em] text-ink">
                @{profile.username}
              </h1>
              {isPublisher && (
                <span className="border border-accent bg-accent/[0.08] px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.12em] text-accent">
                  PUBLISHER
                </span>
              )}
            </div>
            {profile.displayName && (
              <div className="mb-3 font-body text-[15px] text-ink-softer">
                {profile.displayName}
              </div>
            )}
            {profile.bio && (
              <p className="mb-4 max-w-[640px] whitespace-pre-wrap font-body text-[13.5px] leading-[1.6] text-ink-softer">
                {profile.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-faint">
              <span>joined {joinYear}</span>
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-accent hover:text-accent-hot"
                >
                  {profile.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-px border border-hairline bg-hairline">
            <Stat label="MODULES" value={profile.moduleCount} />
            <Stat label="REVIEWS" value={profile.reviewCount} />
            <Stat
              label="PULLS·30D"
              value={profile.totalPulls30d.toLocaleString()}
            />
          </div>
        </div>
      </section>

      {/* Published modules */}
      <section className="border-b border-hairline px-8 py-10">
        <h2 className="mb-6 font-display text-[22px] font-black tracking-[-0.02em] text-ink">
          Published modules
        </h2>
        {modules.length === 0 ? (
          <div className="border border-dashed border-hairline bg-canvas-deep px-6 py-8 text-center font-body text-[13px] text-ink-ghost">
            @{profile.username} hasn&apos;t published any public modules yet.
          </div>
        ) : (
          <div className="border border-hairline">
            <div className="grid grid-cols-[1fr_80px_100px_100px] gap-0 border-b border-hairline bg-canvas-deep px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              <div>MODULE</div>
              <div className="text-right">TRUST</div>
              <div className="text-right">PULLS·30D</div>
              <div className="text-right">UPDATED</div>
            </div>
            {modules.map((m) => (
              <Link
                key={m.slug}
                href={`/modules/${m.slug}`}
                className="grid grid-cols-[1fr_80px_100px_100px] gap-0 border-b border-hairline px-5 py-3 transition-colors hover:bg-accent/[0.025] last:border-0"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate font-display text-[14.5px] font-black leading-[1.1] tracking-[-0.015em] text-ink">
                      {m.name}
                    </span>
                    <span className="font-mono text-[10px] text-ink-mute">
                      v{m.version}
                    </span>
                  </div>
                  <div className="truncate font-body text-[12px] text-ink-softer">
                    {m.description}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-display text-[18px] font-black tracking-[-0.02em] ${
                      m.trust >= 90
                        ? "text-good"
                        : m.trust >= 70
                          ? "text-warn"
                          : "text-bad"
                    }`}
                  >
                    {m.trust}
                  </span>
                </div>
                <div className="text-right font-mono text-[11.5px] text-ink-softer">
                  {m.pulls30d.toLocaleString()}
                </div>
                <div className="text-right font-mono text-[11px] text-ink-faint">
                  {formatLastRebuiltAt(m.lastRebuiltAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Reviews authored */}
      <section className="px-8 py-10">
        <h2 className="mb-6 font-display text-[22px] font-black tracking-[-0.02em] text-ink">
          Reviews written
        </h2>
        {reviews.length === 0 ? (
          <div className="border border-dashed border-hairline bg-canvas-deep px-6 py-8 text-center font-body text-[13px] text-ink-ghost">
            @{profile.username} hasn&apos;t written any reviews yet.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="border border-hairline bg-canvas-deep p-5"
              >
                <header className="mb-2 flex items-baseline justify-between">
                  <div className="flex items-center gap-3">
                    <ReviewStars value={r.rating} />
                    <h3 className="font-display text-[15px] font-black text-ink">
                      {r.title}
                    </h3>
                  </div>
                  <time className="font-mono text-[10.5px] text-ink-ghost">
                    {r.createdAt.slice(0, 10)}
                  </time>
                </header>
                <div className="mb-2 font-mono text-[11px] text-ink-faint">
                  on{" "}
                  <Link
                    href={`/modules/${r.moduleSlug}`}
                    className="text-accent hover:text-accent-hot"
                  >
                    {r.moduleSlug}
                  </Link>
                </div>
                <p className="whitespace-pre-wrap font-body text-[12.5px] leading-[1.6] text-ink-softer">
                  {r.body.length > 280 ? r.body.slice(0, 280) + "…" : r.body}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-canvas-deep px-4 py-3">
      <div className="mb-1 font-mono text-[9.5px] tracking-[0.14em] text-ink-faint">
        {label}
      </div>
      <div className="font-display text-[22px] font-black leading-none tracking-[-0.02em] text-ink">
        {value}
      </div>
    </div>
  );
}

function ReviewStars({ value }: { value: number }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={12}
          height={12}
          viewBox="0 0 16 16"
          className={n <= value ? "text-accent" : "text-ink-ghost"}
          fill={n <= value ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path d="M8 1.5l2 4.5 5 .5-3.8 3.4 1.1 5L8 12.2l-4.3 2.7 1.1-5L1 6.5l5-.5 2-4.5z" />
        </svg>
      ))}
    </div>
  );
}
