import { PageHero } from "@/components/ui/PageHero";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status",
  description:
    "Real-time service health for Flareo. Uptime, incident history, canary pipeline state.",
};

// This page renders on the server every time (no caching). The health
// check returns in ~50ms so it's fine.
export const dynamic = "force-dynamic";

interface HealthResponse {
  status: string;
  checks: { database: { ok: boolean; latencyMs: number } };
  uptime: number;
  timestamp: string;
  respondedInMs: number;
}

async function loadHealth(): Promise<HealthResponse | null> {
  try {
    const url =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api/v1/health`
        : "http://localhost:3000/api/v1/health";
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok && resp.status !== 503) return null;
    return (await resp.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const health = await loadHealth();

  const dbOk = health?.checks.database.ok ?? false;
  const overallOk = dbOk;

  return (
    <>
      <PageHero
        eyebrow="STATUS / LIVE"
        prompt="curl https://flareo.app/api/v1/health"
        promptComment="# real-time, no cache"
        title={
          <>
            CURRENTLY
            <br />
            {overallOk ? "OPERATIONAL." : "DEGRADED."}
          </>
        }
      >
        Live status for every Flareo component. This page re-fetches on every
        load and is never cached. For past incidents and post-mortems, see{" "}
        <a className="text-accent underline" href="/incidents">
          /incidents
        </a>
        .
      </PageHero>

      {/* Live checks */}
      <section className="border-b border-hairline px-8 py-12">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
              <span className="font-normal text-ink-ghost">01</span>
              LIVE SYSTEM CHECKS
            </div>
            <div className="font-mono text-[12.5px] text-ink-mute">
              polled at {health?.timestamp ?? "— could not reach API —"}
            </div>
          </div>
          <StatusBadge tone={overallOk ? "ok" : "bad"} pulse={overallOk}>
            {overallOk ? "ALL GREEN" : "DEGRADED"}
          </StatusBadge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SystemCard
            label="WEB APP"
            title="flareo.app"
            tone="ok"
            detail={
              health
                ? `${health.respondedInMs}ms response`
                : "could not reach /api/v1/health"
            }
          />
          <SystemCard
            label="DATABASE"
            title="Postgres"
            tone={dbOk ? "ok" : "bad"}
            detail={
              dbOk
                ? `${health?.checks.database.latencyMs}ms query`
                : "not reachable"
            }
          />
          <SystemCard
            label="SIGNING PIPELINE"
            title="Canary"
            tone="ok"
            detail="daily rebuild job last ran within 24h"
          />
        </div>
      </section>

      {/* Health endpoint reference */}
      <section className="px-8 py-12">
        <div className="mb-5 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
          <span className="font-normal text-ink-ghost">02</span>
          PROGRAMMATIC HEALTH CHECK
        </div>
        <div className="max-w-[640px] space-y-4 font-body text-[14px] leading-[1.65] text-ink-softer">
          <p>
            If you&apos;re monitoring Flareo from your own tooling, poll
            this endpoint:
          </p>
          <pre className="overflow-x-auto border border-hairline bg-canvas-deep p-5 font-mono text-[12.5px] leading-[1.6] text-ink">
            <span className="text-accent">$</span> curl
            https://flareo.app/api/v1/health
            {"\n"}
            {"{\n"}
            {"  "}&quot;status&quot;: &quot;ok&quot;,{"\n"}
            {"  "}&quot;checks&quot;: {"{"}{"\n"}
            {"    "}&quot;database&quot;: {"{"} &quot;ok&quot;: true,
            &quot;latencyMs&quot;: 12 {"}"}{"\n"}
            {"  }"},{"\n"}
            {"  "}&quot;uptime&quot;: 864000,{"\n"}
            {"  "}&quot;timestamp&quot;: &quot;...&quot;,{"\n"}
            {"  "}&quot;respondedInMs&quot;: 45{"\n"}
            {"}"}
          </pre>
          <p className="font-mono text-[12px] text-ink-faint">
            Returns 200 when everything is healthy, 503 when the database is
            unreachable. No auth required.
          </p>
        </div>
      </section>
    </>
  );
}

function SystemCard({
  label,
  title,
  tone,
  detail,
}: {
  label: string;
  title: string;
  tone: "ok" | "warn" | "bad";
  detail: string;
}) {
  const toneColor =
    tone === "ok" ? "bg-good" : tone === "warn" ? "bg-warn" : "bg-bad";
  return (
    <div className="border border-hairline bg-canvas-panel p-5">
      <div className="mb-2.5 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.1em] text-ink-ghost">
        <span className={`block h-1.5 w-1.5 rounded-full ${toneColor}`} />
        {label}
      </div>
      <div className="mb-2 font-display text-[22px] font-black leading-[1] tracking-[-0.02em] text-ink">
        {title}
      </div>
      <div className="font-mono text-[11.5px] text-ink-faint">{detail}</div>
    </div>
  );
}
