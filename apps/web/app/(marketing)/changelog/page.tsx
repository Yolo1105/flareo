import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { CHANGELOG } from "@/lib/data/changelog";
import type { ChangelogKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Every release of Flareo since public beta. Versions, dates, shipped changes, fixed bugs. No marketing posts.",
};

/**
 * Kind → color token. Matches the site's semantic palette:
 *   feature → orange accent
 *   fix → green good
 *   breaking → amber warn
 *   security → blue execution
 */
const KIND_STYLES: Record<ChangelogKind, { border: string; text: string; label: string }> = {
  feature: {
    border: "border-accent",
    text: "text-accent",
    label: "FEATURE",
  },
  fix: {
    border: "border-good",
    text: "text-good",
    label: "FIX",
  },
  breaking: {
    border: "border-warn",
    text: "text-warn",
    label: "BREAKING",
  },
  security: {
    border: "border-blue",
    text: "text-blue",
    label: "SECURITY",
  },
};

export default function ChangelogPage() {
  return (
    <>
      <PageHero
        eyebrow="CHANGELOG / PUBLIC BETA"
        prompt="flareo changelog --since=first-release"
        promptComment="# every shipped change, reverse chronological"
        title={
          <>
            WHAT SHIPPED.
            <br />
            AND WHEN.
          </>
        }
      >
        A public-beta product owes you a real changelog, not a blog full of
        thought pieces. Every version below links to the shipped change, the
        date it landed, and the pull request or incident that prompted it.
      </PageHero>

      <section className="border-b border-hairline px-8 py-14">
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="space-y-0 border-t border-hairline">
            {CHANGELOG.map((entry, i) => (
              <article
                key={entry.version}
                className={`grid grid-cols-[180px_1fr] gap-7 py-10 ${
                  i < CHANGELOG.length - 1 ? "border-b border-hairline" : ""
                }`}
              >
                {/* Version + date column */}
                <div>
                  <div className="font-display text-[38px] font-black leading-[0.95] tracking-[-0.03em] text-ink">
                    v{entry.version}
                  </div>
                  <div className="mt-2 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
                    {entry.date}
                  </div>
                </div>

                {/* Content column */}
                <div>
                  <h2 className="mb-3 font-display text-[24px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
                    {entry.title}
                  </h2>
                  <p className="mb-6 max-w-[640px] font-body text-[14.5px] leading-[1.65] text-ink-softer">
                    {entry.summary}
                  </p>

                  <ul className="space-y-2.5">
                    {entry.changes.map((change, ci) => {
                      const style = KIND_STYLES[change.kind];
                      return (
                        <li
                          key={ci}
                          className="grid grid-cols-[90px_1fr] items-baseline gap-4"
                        >
                          <span
                            className={`border ${style.border} ${style.text} inline-flex items-center justify-center px-2 py-0.5 font-mono text-[9.5px] font-medium tracking-[0.12em]`}
                          >
                            {style.label}
                          </span>
                          <span className="font-body text-[13.5px] leading-[1.6] text-ink-cream">
                            {change.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe strip */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-12 text-center">
        <div className="mx-auto max-w-[560px]">
          <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            § SUBSCRIBE
          </div>
          <h3 className="mb-3 font-display text-[28px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
            Get the next release in your inbox.
          </h3>
          <p className="mb-6 font-body text-[13.5px] leading-[1.65] text-ink-softer">
            One email per shipped version — never more. Or grab the RSS
            feed if you&apos;d rather not give us your address.
          </p>
          <div className="flex justify-center gap-2">
            <button className="btn-chamfer bg-accent px-5 py-3 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot">
              Subscribe by email
            </button>
            <button className="border border-hairline px-5 py-3 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost">
              RSS
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
