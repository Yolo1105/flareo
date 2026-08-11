/* eslint-disable react/no-unescaped-entities -- marketing copy; avoid rewriting large prose */
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Incidents",
  description:
    "Public log of security and supply-chain incidents affecting Flareo and the modules we publish. We post every one — fixed or open.",
};

type IncidentStatus = "resolved" | "monitoring" | "investigating";
type IncidentKind =
  | "platform"
  | "module-cve"
  | "delisting"
  | "supply-chain"
  | "operational";

interface Incident {
  id: string;
  date: string;
  status: IncidentStatus;
  kind: IncidentKind;
  title: string;
  summary: string;
  affected: string;
  resolution: string;
  reporter?: string;
}

// Nothing seeded today. Empty list is the design — it means there's
// no incident to publish, not that we forgot to make this page.
// When the first real incident lands it gets added here, ordered
// by date desc.
const INCIDENTS: Incident[] = [];

const KIND_LABELS: Record<IncidentKind, string> = {
  platform: "PLATFORM",
  "module-cve": "MODULE CVE",
  delisting: "DELISTING",
  "supply-chain": "SUPPLY CHAIN",
  operational: "OPERATIONAL",
};

const STATUS_LABELS: Record<
  IncidentStatus,
  { label: string; tone: string }
> = {
  resolved: { label: "RESOLVED", tone: "text-good border-good/40" },
  monitoring: { label: "MONITORING", tone: "text-warn border-warn/40" },
  investigating: { label: "INVESTIGATING", tone: "text-bad border-bad/40" },
};

export default function IncidentsPage() {
  return (
    <>
      <PageHero
        eyebrow="INCIDENTS"
        prompt="cat /incidents.log"
        promptComment="# every named issue, every supply-chain event, every delisting"
        title={
          <>
            We publish every
            <br />
            incident.
          </>
        }
      >
        <p className="max-w-[680px] font-body text-[15px] leading-[1.55] text-ink-softer">
          Most marketplaces hide their incidents. We publish ours — including
          the ones that look bad — because the alternative is the kind of
          silent drift that destroys trust over years. When something goes
          wrong here, you find out about it on this page.
        </p>
      </PageHero>

      <section className="border-b border-hairline px-8 py-10">
        <div className="mx-auto max-w-[840px]">
          <h2 className="mb-4 font-display text-[22px] font-black tracking-[-0.025em] text-ink">
            What goes here
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <KindCard
              code={KIND_LABELS["platform"]}
              title="Platform vulnerabilities"
              body="Security issues found in flareo.app itself or our API. Reported through /security, fixed, then disclosed here."
            />
            <KindCard
              code={KIND_LABELS["module-cve"]}
              title="Module CVEs discovered post-listing"
              body="A CVE drops affecting a module that's already in the catalog. We rebuild, scan, post the timeline here, and (if needed) recommend remediation for active deployments."
            />
            <KindCard
              code={KIND_LABELS["delisting"]}
              title="Modules taken down"
              body="Modules removed from the catalog — abandoned upstream past the threshold, malicious activity, takedown request, etc. With reason category."
            />
            <KindCard
              code={KIND_LABELS["supply-chain"]}
              title="Supply-chain events"
              body="Compromise of an upstream we depend on, a Sigstore outage that affected signing, a registry incident at GHCR. The dependency chain is ours; its incidents are too."
            />
            <KindCard
              code={KIND_LABELS["operational"]}
              title="Operational incidents"
              body="Major service disruptions — pipeline outages > 1 hour, sandbox provisioner failures, billing system outages. Smaller blips go to /status, not here."
            />
            <KindCard
              code="POSTMORTEM"
              title="Postmortems"
              body="For every P0/P1 incident, a written postmortem follows within 14 days: what happened, what we did, what we'll change, what we won't change."
            />
          </div>
        </div>
      </section>

      <section className="px-8 py-12">
        <div className="mx-auto max-w-[840px]">
          <header className="mb-6 flex items-end justify-between gap-4 border-b border-hairline pb-3">
            <h2 className="font-display text-[22px] font-black tracking-[-0.025em] text-ink">
              Incident log
            </h2>
            <span className="font-mono text-[10.5px] text-ink-faint">
              {INCIDENTS.length} entries · ordered by date desc
            </span>
          </header>

          {INCIDENTS.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-4">
              {INCIDENTS.map((it) => (
                <IncidentItem key={it.id} incident={it} />
              ))}
            </ul>
          )}

          <p className="mt-8 border-t border-hairline pt-4 font-body text-[12.5px] leading-[1.6] text-ink-softer">
            See something we should publish?{" "}
            <Link
              href="/security"
              className="text-accent hover:text-accent-hot"
            >
              Report it →
            </Link>{" "}
            We treat unreported incidents we discover ourselves the same as
            externally reported ones — they all land here.
          </p>
        </div>
      </section>
    </>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-hairline bg-canvas-deep p-8 text-center">
      <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
        ◆ NO INCIDENTS LOGGED
      </div>
      <h3 className="mb-3 font-display text-[18px] font-black leading-[1.2] tracking-[-0.02em] text-ink">
        Empty is honest. Empty is also temporary.
      </h3>
      <p className="mx-auto max-w-[520px] font-body text-[13px] leading-[1.65] text-ink-softer">
        At launch this page reads as "nothing happened." That's accurate; it
        won't stay that way forever. When the first incident lands, it
        appears here with timeline, scope, mitigation, and reporter credit
        — within hours of resolution for P0/P1, within 14 days with a full
        postmortem for everything that warrants one.
      </p>
      <p className="mx-auto mt-3 max-w-[520px] font-body text-[12.5px] leading-[1.6] text-ink-faint">
        We've kept this page visible from launch (rather than waiting until
        we have something to put on it) because the commitment to publish
        is the part you can verify before any incident exists.
      </p>
    </div>
  );
}

function KindCard({
  code,
  title,
  body,
}: {
  code: string;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-hairline bg-canvas-deep p-4">
      <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-accent">
        {code}
      </div>
      <h3 className="mb-1.5 font-display text-[14px] font-black tracking-[-0.015em] text-ink">
        {title}
      </h3>
      <p className="font-body text-[12px] leading-[1.55] text-ink-softer">
        {body}
      </p>
    </div>
  );
}

function IncidentItem({ incident }: { incident: Incident }) {
  const status = STATUS_LABELS[incident.status];
  return (
    <li className="border border-hairline bg-canvas-deep p-5">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
            {KIND_LABELS[incident.kind]}
          </span>
          <span className="font-mono text-[10.5px] text-ink-faint">
            {incident.date}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] ${status.tone}`}
        >
          {status.label}
        </span>
      </header>
      <h3 className="mb-2 font-display text-[16px] font-black leading-[1.25] tracking-[-0.02em] text-ink">
        {incident.title}
      </h3>
      <p className="mb-3 font-body text-[12.5px] leading-[1.6] text-ink-softer">
        {incident.summary}
      </p>
      <dl className="grid grid-cols-1 gap-2 border-t border-hairline pt-3 font-mono text-[11px] md:grid-cols-[100px_1fr]">
        <dt className="text-ink-faint">AFFECTED</dt>
        <dd className="text-ink-mute">{incident.affected}</dd>
        <dt className="text-ink-faint">RESOLUTION</dt>
        <dd className="text-ink-mute">{incident.resolution}</dd>
        {incident.reporter && (
          <>
            <dt className="text-ink-faint">REPORTED BY</dt>
            <dd className="text-ink-mute">{incident.reporter}</dd>
          </>
        )}
      </dl>
    </li>
  );
}
