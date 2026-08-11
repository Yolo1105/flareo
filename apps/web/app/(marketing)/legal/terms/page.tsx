import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The short version of the rules for using Flareo.",
};

/**
 * Terms of Service.
 *
 * Written plainly for the closed beta. Before any serious revenue event
 * or enterprise contract, a lawyer should review and likely rewrite this.
 *
 * Our goals for this doc:
 *   - be honest about what we provide and what we don't
 *   - set expectations for the AGPL'd open-source posture
 *   - cover the basics: account termination, indemnity, no warranty
 */
export default function TermsPage() {
  const EFFECTIVE = "April 23, 2026";

  return (
    <>
      <PageHero
        eyebrow="LEGAL / TERMS OF SERVICE"
        prompt="flareo legal --terms"
        promptComment={`# effective ${EFFECTIVE}`}
        title={
          <>
            TERMS OF
            <br />
            SERVICE.
          </>
        }
      >
        The plain-language version. If you find something confusing or
        disagreeable, open an issue on{" "}
        <a
          href="https://github.com/Yolo1105/flareo/issues"
          className="text-accent underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>{" "}
        and we&apos;ll clarify or rewrite it.
      </PageHero>

      <section className="border-b border-hairline px-8 py-14">
        <div className="mx-auto max-w-[760px] space-y-10 font-body text-[15px] leading-[1.65] text-ink-mute">
          <Section n="1" title="Who these terms are between">
            <p>
              These terms are between you and Flareo (&quot;we&quot;, &quot;us&quot;). &quot;You&quot;
              means any person or organization using the Flareo website,
              the command-line tool, the API, or any signed container
              images we publish.
            </p>
            <p>
              Accepting these terms happens automatically when you use
              the service. If you don&apos;t accept them, don&apos;t use the
              service. Simple as that.
            </p>
          </Section>

          <Section n="2" title="What we provide">
            <p>
              Flareo publishes rebuilt and cryptographically signed
              container images. We also provide a web catalog, a CLI,
              and an API for browsing and verifying those images.
            </p>
            <p>
              Every signed image comes with an SBOM and a vulnerability
              scan at the time it was built. We don&apos;t warrant that a
              given image is safe to run, only that the signature really
              belongs to our build pipeline and the scan we ran found
              what it says it found.
            </p>
          </Section>

          <Section n="3" title="Accounts and API keys">
            <p>
              You can browse the catalog and verify images without an
              account. For higher API rate limits and for submitting
              your own modules (Horizon 2+), you sign in via GitHub.
            </p>
            <p>
              You are responsible for keeping your API keys private. If
              a key leaks, revoke it immediately at{" "}
              <code className="bg-canvas-panel px-1.5 text-ink">
                /app/settings/api-keys
              </code>
              . We&apos;ll also revoke it on request if you email us.
            </p>
          </Section>

          <Section n="4" title="Acceptable use">
            <p>
              Don&apos;t abuse the service. Specifically, don&apos;t try to:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                automate requests past our rate limits (60/hour anon,
                600/hour authenticated on verify; 300/hour on catalog
                reads)
              </li>
              <li>
                probe for vulnerabilities without filing a report via{" "}
                <a
                  href="https://github.com/Yolo1105/flareo/security/advisories/new"
                  className="text-accent underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Security Advisories
                </a>{" "}
                first
              </li>
              <li>
                use Flareo as a general-purpose container distribution
                service (that&apos;s Docker Hub&apos;s job)
              </li>
              <li>
                misrepresent yourself or your organization when submitting
                modules
              </li>
            </ul>
            <p>
              If you do any of the above we may throttle, suspend, or
              terminate your access without warning.
            </p>
          </Section>

          <Section n="5" title="Open source and the AGPL">
            <p>
              Most of Flareo&apos;s own code — the web app, the CLI, the
              canary pipeline — is licensed under AGPL-3.0-or-later.
              Source is at{" "}
              <a
                href="https://github.com/Yolo1105/flareo"
                className="text-accent underline"
              >
                github.com/Yolo1105/flareo
              </a>
              . The images we publish inherit whatever license the
              upstream project uses; check each module page for the
              specific license.
            </p>
            <p>
              If you deploy a modified version of Flareo as a service,
              the AGPL requires you to publish your modifications. That&apos;s
              the point.
            </p>
          </Section>

          <Section n="6" title="No warranty">
            <p>
              Flareo is provided &quot;as is,&quot; without warranty of any
              kind. We try to operate a reliable service, but we make
              no guarantees of uptime, accuracy, or fitness for any
              particular purpose.
            </p>
            <p>
              In particular, a Flareo signature does not guarantee a
              container is free of security vulnerabilities, malicious
              code, or bugs. It guarantees only that the image was built
              by our pipeline from the upstream source we claim.
            </p>
          </Section>

          <Section n="7" title="Liability">
            <p>
              To the maximum extent allowed by law, Flareo is not liable
              for any indirect, consequential, or incidental damages
              arising from your use of the service. Our total liability
              in any dispute is capped at what you&apos;ve paid us in the 12
              months preceding the claim, or €100, whichever is greater.
            </p>
            <p>
              During closed beta, the service is free, so in practice
              this cap is €100. That&apos;s the honest version.
            </p>
          </Section>

          <Section n="8" title="Changes to these terms">
            <p>
              We may update these terms. If the change is material —
              anything that affects how you use Flareo or what we do
              with your data — we&apos;ll email anyone with a registered
              account and post a notice at{" "}
              <a
                href="/changelog"
                className="text-accent underline"
              >
                /changelog
              </a>{" "}
              at least 14 days before the change takes effect.
            </p>
          </Section>

          <Section n="9" title="Termination">
            <p>
              You can stop using Flareo at any time. We&apos;ll delete your
              account data within 30 days if you open an issue on{" "}
              <a
                href="https://github.com/Yolo1105/flareo/issues"
                className="text-accent underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>{" "}
              to request it.
            </p>
            <p>
              We may terminate accounts that violate section 4, or for
              other good-faith reasons. If that happens we&apos;ll tell you
              what went wrong.
            </p>
          </Section>

          <Section n="10" title="Governing law">
            <p>
              These terms are governed by the laws of the jurisdiction
              where Flareo is incorporated. Disputes go to the courts
              of that jurisdiction unless both sides prefer arbitration.
            </p>
          </Section>

          <Section n="11" title="Contact">
            <p>
              For terms questions:{" "}
              <a
                href="https://github.com/Yolo1105/flareo/issues"
                className="text-accent underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
              </a>
              . For security reports:{" "}
              <a
                href="https://github.com/Yolo1105/flareo/security/advisories/new"
                className="text-accent underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Security Advisories
              </a>
              . For everything else:{" "}
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
              <a
                href="/legal/privacy"
                className="text-accent underline"
              >
                privacy policy
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
