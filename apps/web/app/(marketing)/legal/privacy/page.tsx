import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What data Flareo collects, what we do with it, and what we don't do.",
};

/**
 * Privacy Policy.
 *
 * Short, specific, honest. The goal is that someone reading this walks
 * away knowing what we collect and why; nothing weaselly, nothing
 * buried. Same caveat as the ToS: a privacy lawyer should review this
 * before any real revenue event, especially for GDPR nuances.
 */
export default function PrivacyPage() {
  const EFFECTIVE = "April 23, 2026";

  return (
    <>
      <PageHero
        eyebrow="LEGAL / PRIVACY POLICY"
        prompt="flareo legal --privacy"
        promptComment={`# effective ${EFFECTIVE}`}
        title={
          <>
            PRIVACY
            <br />
            POLICY.
          </>
        }
      >
        What we collect, what we do with it, what we don&apos;t do. Shorter
        than most privacy policies on the web, and we intend to keep it
        that way.
      </PageHero>

      <section className="border-b border-hairline px-8 py-14">
        <div className="mx-auto max-w-[760px] space-y-10 font-body text-[15px] leading-[1.65] text-ink-mute">

          <Section n="1" title="What we collect">
            <p>The specific data we store:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong className="text-ink">Account data.</strong> If
                you sign in via GitHub, we keep your GitHub username,
                email (if public), display name, and avatar URL. We also
                keep the SHA-256 hash of any API keys you generate.
              </li>
              <li>
                <strong className="text-ink">Waitlist signups.</strong>{" "}
                If you join the waitlist, we keep your email and the
                date of signup. That&apos;s it.
              </li>
              <li>
                <strong className="text-ink">Server logs.</strong> Every
                HTTP request gets a log line with IP, user-agent,
                timestamp, path, and status. We keep these for 30 days
                for debugging and abuse prevention, then delete them.
              </li>
              <li>
                <strong className="text-ink">
                  Verification requests.
                </strong>{" "}
                When you use the verify tool, we log only the image
                reference submitted (not tied to any account unless
                you&apos;re signed in). We delete these logs after 30 days.
              </li>
            </ul>
          </Section>

          <Section n="2" title="What we don't collect">
            <ul className="list-disc space-y-1 pl-6">
              <li>
                No analytics cookies. We use Plausible for first-party
                page analytics, which is cookieless and doesn&apos;t
                fingerprint visitors.
              </li>
              <li>
                No Google Analytics, Segment, Amplitude, Mixpanel, Heap,
                PostHog, Meta pixel, or similar cross-site trackers.
              </li>
              <li>No third-party ad trackers. Ever.</li>
              <li>
                No recording of the contents of images you verify
                beyond the image reference itself.
              </li>
              <li>
                No recording of the contents of modules you pull via{" "}
                <code className="bg-canvas-panel px-1.5 text-ink">
                  flareo pull
                </code>{" "}
                — the image comes directly from the public registry.
                We don&apos;t sit in that path.
              </li>
            </ul>
          </Section>

          <Section n="3" title="What we do with your data">
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong className="text-ink">Run the service.</strong>{" "}
                That&apos;s it. We don&apos;t sell, share, or license your data
                to third parties.
              </li>
              <li>
                <strong className="text-ink">
                  Send operational emails.
                </strong>{" "}
                Waitlist confirmation, security advisories, and policy
                changes. We use{" "}
                <a
                  href="https://resend.com"
                  className="text-accent underline"
                >
                  Resend
                </a>{" "}
                as our email provider.
              </li>
              <li>
                <strong className="text-ink">Display your identity</strong>{" "}
                on modules you publish (only after you submit one;
                during closed beta, we don&apos;t accept submissions yet).
              </li>
            </ul>
          </Section>

          <Section n="4" title="Sub-processors">
            <p>
              The third parties that process your data to help us run
              Flareo:
            </p>
            <div className="overflow-x-auto border border-hairline">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-hairline bg-canvas-panel">
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                      Provider
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                      What it does
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                      Region
                    </th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[12.5px]">
                  {[
                    ["Vercel", "App hosting + docs (/docs)", "Global edge"],
                    ["Neon", "Postgres database", "EU (Frankfurt)"],
                    ["Upstash", "Redis (rate-limit state)", "EU (Frankfurt)"],
                    ["Cloudflare R2", "SBOM + scan storage", "EU"],
                    ["AWS ECR Public", "Container registry", "Global"],
                    ["Resend", "Transactional email", "EU"],
                    ["GitHub", "OAuth + source", "US"],
                    ["Hetzner", "Preview demo host", "DE (Falkenstein)"],
                    ["Sigstore", "Public transparency log", "Global"],
                  ].map(([provider, purpose, region]) => (
                    <tr key={provider} className="border-b border-hairline">
                      <td className="px-4 py-2.5 text-ink">{provider}</td>
                      <td className="px-4 py-2.5 text-ink-mute">
                        {purpose}
                      </td>
                      <td className="px-4 py-2.5 text-ink-softer">
                        {region}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section n="5" title="Your rights">
            <p>
              You can request a copy of your data, ask us to delete it,
              or correct something we&apos;ve got wrong by opening an issue on{" "}
              <a
                href="https://github.com/Yolo1105/flareo/issues"
                className="text-accent underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              . We respond within 14 days and complete the action within
              30 days.
            </p>
            <p>
              If you&apos;re in the EU, you have specific rights under
              GDPR including the right to object to processing and the
              right to lodge a complaint with your local data protection
              authority. The same email works.
            </p>
          </Section>

          <Section n="6" title="Cookies">
            <p>
              We use one cookie: a session cookie for keeping you signed
              in. No tracking cookies, no analytics cookies, no third-
              party cookies. Decline all cookies and the signed-in parts
              of the site won&apos;t work; everything else is unaffected.
            </p>
          </Section>

          <Section n="7" title="Retention">
            <ul className="list-disc space-y-1 pl-6">
              <li>Server logs: 30 days, then deleted</li>
              <li>
                Verification request logs: 30 days, then deleted
              </li>
              <li>
                Account data: kept until you delete your account; we
                delete within 30 days of a delete request
              </li>
              <li>
                Waitlist emails: kept until you unsubscribe; one-click
                unsubscribe in every email we send
              </li>
              <li>
                Backups: 7 days for the database, then rolled off
              </li>
            </ul>
          </Section>

          <Section n="8" title="Children">
            <p>
              Flareo is not directed at children under 16. If we learn
              we&apos;ve collected data from a child, we delete it
              immediately.
            </p>
          </Section>

          <Section n="9" title="Changes to this policy">
            <p>
              Material changes to how we collect or use data get
              announced at{" "}
              <a
                href="/changelog"
                className="text-accent underline"
              >
                /changelog
              </a>{" "}
              and emailed to anyone with an account, 14 days before they
              take effect.
            </p>
          </Section>

          <Section n="10" title="Contact">
            <p>
              Privacy questions:{" "}
              <a
                href="https://github.com/Yolo1105/flareo/issues"
                className="text-accent underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
              </a>
              .
            </p>
          </Section>

          <div className="border-t border-hairline pt-8">
            <p className="font-mono text-[11.5px] text-ink-faint">
              Last updated: {EFFECTIVE}
              <br />
              See also:{" "}
              <a href="/legal/terms" className="text-accent underline">
                terms of service
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
        <span className="font-normal text-ink-ghost">{n.padStart(2, "0")}</span>
        {title.toUpperCase()}
      </div>
      <div className="space-y-3 text-ink-mute">{children}</div>
    </div>
  );
}
