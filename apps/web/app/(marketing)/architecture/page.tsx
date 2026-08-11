import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "How Flareo is wired. Control plane, execution plane, Redis bridge, 10 ADRs, threat model.",
};

const ADRS = [
  {
    id: "ADR-001",
    q: "Split control and execution planes at the start.",
    decided: "2025-11-04",
    body: "Every submission runs arbitrary shell commands. Putting the sandbox on the same host as the database means a single container escape owns everything. Two VPSes separated by Redis costs €24/month and an hour of deployment complexity — cheaper than any other isolation mechanism.",
    tradeoff: "one extra hop, higher p99 latency (~40ms)",
  },
  {
    id: "ADR-002",
    q: "Use BullMQ instead of raw Redis pub/sub for the build queue.",
    decided: "2025-11-09",
    body: "We tried raw PUBLISH/SUBSCRIBE for a week. Lost jobs on worker crash, no retry semantics, no per-job state. BullMQ adds proper FIFO queues, retries with exponential backoff, delayed jobs, and a UI for inspecting stuck builds.",
    tradeoff: "a dependency on ioredis + redlock semantics",
  },
  {
    id: "ADR-003",
    q: "Docker-in-Docker, not Kubernetes jobs or rootless Podman.",
    decided: "2025-11-15",
    body: "K8s was overkill for a 5-worker pipeline. Rootless Podman couldn't run BuildKit reliably at the time. DinD with a carefully-scoped privileged flag and hardened seccomp profile was the pragmatic middle. Every worker is ephemeral and recycled after 50 builds.",
    tradeoff: "one --privileged flag we have to justify in audits",
  },
  {
    id: "ADR-004",
    q: "Cloudflare R2 for source uploads instead of S3.",
    decided: "2025-11-22",
    body: "Source tarballs are uploaded once and downloaded by the worker a few seconds later. S3 would charge twice — storage and egress. R2 has zero egress fees.",
    tradeoff: "vendor lock-in to Cloudflare, mitigated by S3-compatible API",
  },
  {
    id: "ADR-005",
    q: "AWS ECR for signed image storage instead of GHCR.",
    decided: "2025-12-01",
    body: "GHCR rate-limits anonymous pulls aggressively, and we need public modules to be pullable without auth. ECR Public has no pull limits for verified images.",
    tradeoff: "$0.10/GB storage · offset by not needing GitHub Pro",
  },
  {
    id: "ADR-006",
    q: "Caddy instead of Nginx.",
    decided: "2025-12-04",
    body: "Nginx requires a certbot sidecar and manual renewal cron. Caddy handles Let's Encrypt out of the box, supports HTTP/3, and its config reads like plain English. Our entire production config is 18 lines.",
    tradeoff: "smaller community, fewer stackoverflow answers for edge cases",
  },
  {
    id: "ADR-007",
    q: "Hetzner, not AWS or DigitalOcean.",
    decided: "2025-12-10",
    body: "A CPX41 on Hetzner is €24/month for 8 vCPU and 16 GB RAM. Equivalent AWS instance is ~$250/month. For a pre-revenue project running real workloads, the cost difference buys us a year of runway per box.",
    tradeoff: "no AWS-native services (Lambda, SQS, RDS) · we use OSS equivalents",
  },
  {
    id: "ADR-008",
    q: "Server-Sent Events for live pipeline progress, not WebSockets.",
    decided: "2026-01-08",
    body: "Pipeline progress is one-way — server → client. SSE is plain HTTP, works through Caddy without any special config, and reconnects automatically. We're sending ~5 events per build.",
    tradeoff: "max ~6 concurrent SSE streams per browser — not a problem at our scale",
  },
  {
    id: "ADR-009",
    q: "Postgres for everything, not SQLite or split stores.",
    decided: "2026-01-15",
    body: "SQLite would have been fine but we needed point-in-time restore and concurrent writes. Postgres 16 on the same host via UNIX socket gave us both without adding operational complexity.",
    tradeoff: "a dependency that has to be backed up and upgraded on a schedule",
  },
  {
    id: "ADR-010",
    q: "Publish under AGPLv3, not MIT or source-available.",
    decided: "2026-01-22",
    body: "MIT would let a hyperscaler fork Flareo, host it, and compete with us using our own code. AGPLv3 lets individuals self-host freely while preventing hosted-service forking.",
    tradeoff: "AGPL friction for some corp adopters · mitigated by separate commercial license",
  },
];

const THREATS_IN = [
  {
    title: "Image tampering post-publish.",
    p: "An attacker replaces the image bytes in the registry after we sign it.",
    mit: "cosign verification fails · digest mismatch detectable with one command",
  },
  {
    title: "Malicious build injection.",
    p: "An attacker compromises the build pipeline and injects payloads into the final image.",
    mit: "hermetic builds · signed provenance, upstream digest recorded · visible in attestation",
  },
  {
    title: "Identity spoofing at signing time.",
    p: "An attacker tries to sign an image pretending to be Flareo's build pipeline.",
    mit: "keyless OIDC · Fulcio certificate binds GitHub Actions identity · Rekor append-only",
  },
  {
    title: "Registry impersonation or MITM.",
    p: "An attacker serves a different image than the real ECR endpoint returns.",
    mit: "digest pinning in compose files · signature verification before image load",
  },
];

const THREATS_OUT = [
  {
    title: "Malicious source code in the upstream repo.",
    p: "If Vaultwarden's maintainers ship a backdoored release, we'll sign it faithfully.",
    mit: "not ours · code review + upstream trust lives with you",
  },
  {
    title: "Zero-day CVEs in published images.",
    p: "A CVE disclosed after publication can't be retroactively scanned by our pipeline.",
    mit: "SBOMs stay queryable · subscribe to module changelogs · rebuild on CVE disclosure",
  },
  {
    title: "Runtime compromise of your deployment.",
    p: "After you deploy, an attacker exploits a bug in the running container.",
    mit: "not ours · runtime security lives in your cluster · use AppArmor, seccomp, network policies",
  },
  {
    title: "Compromise of Sigstore infrastructure.",
    p: "If Fulcio or Rekor is compromised, our signatures become meaningless.",
    mit: "not ours · OpenSSF operates Sigstore · Rekor's transparency log makes compromises detectable",
  },
];

const STACK = [
  { name: "Next.js", ver: "14.2.3", desc: "control-plane framework · app router · server actions", lic: "MIT" },
  { name: "NextAuth", ver: "5.0.0-beta", desc: "OAuth session handling · GitHub identity provider", lic: "ISC" },
  { name: "Prisma", ver: "5.14.0", desc: "ORM + migrations · Postgres client", lic: "Apache 2.0" },
  { name: "Postgres", ver: "16.2", desc: "persistent store · modules, users, build records", lic: "PostgreSQL" },
  { name: "Redis", ver: "7.2.4", desc: "job queue + pub/sub bridge between planes", lic: "BSD-3" },
  { name: "BullMQ", ver: "5.4.3", desc: "Redis-backed job queue · retries · FIFO", lic: "MIT" },
  { name: "Caddy", ver: "2.7.6", desc: "reverse proxy · auto-TLS · HTTP/3", lic: "Apache 2.0" },
  { name: "PM2", ver: "5.3.1", desc: "Node process supervision · log rotation", lic: "AGPL-3.0" },
  { name: "Sentry", ver: "8.0.0", desc: "error tracking · performance metrics", lic: "BSL 1.1" },
  { name: "Docker", ver: "25.0.5", desc: "execution-plane runtime · DinD worker isolation", lic: "Apache 2.0" },
  { name: "BuildKit", ver: "0.13.1", desc: "hermetic image compilation · rootless mode", lic: "Apache 2.0" },
  { name: "Trivy", ver: "0.54.1", desc: "CVE scanner · NVD + GHSA + OS feeds", lic: "Apache 2.0" },
  { name: "Syft", ver: "1.5.0", desc: "SBOM generator · CycloneDX 1.4 output", lic: "Apache 2.0" },
  { name: "cosign", ver: "2.2.4", desc: "keyless image signing · Sigstore client", lic: "Apache 2.0" },
  { name: "slsa-generator", ver: "2.0.0", desc: "signed provenance · upstream digest recorded", lic: "Apache 2.0" },
  { name: "AWS ECR Public", ver: "—", desc: "signed image registry · unlimited public pulls", lic: "commercial" },
  { name: "Cloudflare R2", ver: "—", desc: "source upload storage · zero egress cost", lic: "commercial" },
  { name: "Hetzner Cloud", ver: "—", desc: "2 VPSes · CAX11 control + CPX41 execution", lic: "commercial" },
];

export default function ArchitecturePage() {
  return (
    <>
      <PageHero
        eyebrow="DOCS / ARCHITECTURE"
        prompt="flareo inspect --plane=all"
        promptComment="# system schematic, honest"
        title={
          <>
            HOW FLAREO
            <br />
            IS WIRED.
          </>
        }
      >
        One diagram, ten decisions, one threat model. The core idea:{" "}
        <span className="text-accent">
          split the control plane from the execution plane
        </span>
        , glue them with Redis, and pin everything by digest. Everything
        else is implementation detail.
      </PageHero>

      {/* System map */}
      <section className="border-b border-hairline bg-canvas-panel px-0 pb-16 pt-14">
        <div className="px-8">
          <SectionHeader num="01" label="SYSTEM MAP" title="The whole thing, on one page.">
            Two isolated planes. The{" "}
            <span className="text-ink">control plane</span> (left, orange)
            handles requests, auth, persistence. The{" "}
            <span className="text-ink">execution plane</span> (right, blue)
            runs untrusted code. They don&apos;t share memory, database
            access, or network paths. Redis pub/sub is the only bridge.
          </SectionHeader>
        </div>
        <div className="px-8">
          <div className="overflow-hidden border border-hairline bg-canvas-deep">
            <div className="flex items-center justify-between border-b border-hairline bg-canvas px-4 py-3 font-mono text-[11px] tracking-[0.06em] text-ink-faint">
              <div className="flex gap-5">
                <span>
                  <span className="mr-1.5 text-ink-ghost">plane</span>
                  <span className="text-ink-mute">control + execution</span>
                </span>
                <span>
                  <span className="mr-1.5 text-ink-ghost">boundary</span>
                  <span className="text-ink-mute">redis pub/sub</span>
                </span>
              </div>
              <div className="text-ink-ghost">rev 0.4.2 · 2026-04-19</div>
            </div>
            <div className="overflow-x-auto p-6">
              <svg viewBox="0 0 1100 620" className="w-full min-w-[960px]">
                <defs>
                  <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#7A7268"/>
                  </marker>
                  <marker id="arr-o" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#EA442A"/>
                  </marker>
                  <marker id="arr-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#8CB4E0"/>
                  </marker>
                </defs>

                {/* USER */}
                <rect x="20" y="270" width="110" height="60" fill="#1E1A17" stroke="#544A43" strokeWidth="1"/>
                <text x="75" y="295" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="13" fill="#EAE4DA" textAnchor="middle">USER</text>
                <text x="75" y="312" fontFamily="JetBrains Mono" fontSize="9" fill="#7A7268" textAnchor="middle">browser · CLI</text>

                <path d="M 130 300 L 180 300" stroke="#7A7268" strokeWidth="1.2" fill="none" markerEnd="url(#arr)"/>
                <text x="155" y="293" fontFamily="JetBrains Mono" fontSize="8" fill="#7A7268" textAnchor="middle">https</text>

                {/* Control plane */}
                <rect x="180" y="70" width="330" height="480" fill="rgba(234,68,42,0.03)" stroke="#EA442A" strokeWidth="1" strokeDasharray="3,3"/>
                <text x="195" y="58" fontFamily="JetBrains Mono" fontSize="10" fill="#EA442A" letterSpacing="2" fontWeight="500">CONTROL PLANE</text>
                <text x="195" y="88" fontFamily="JetBrains Mono" fontSize="8" fill="#7A7268">trusted / user-facing · hetzner cax11</text>

                <rect x="200" y="100" width="130" height="54" fill="#0F0B09" stroke="#EA442A" strokeWidth="1"/>
                <text x="265" y="121" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="12" fill="#EAE4DA" textAnchor="middle">CADDY</text>
                <text x="265" y="137" fontFamily="JetBrains Mono" fontSize="8" fill="#8CB4E0" textAnchor="middle">reverse proxy</text>

                <rect x="200" y="168" width="280" height="78" fill="#0F0B09" stroke="#EA442A" strokeWidth="1.5"/>
                <text x="340" y="194" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="16" fill="#EAE4DA" textAnchor="middle">NEXT.JS 14</text>
                <text x="340" y="212" fontFamily="JetBrains Mono" fontSize="9" fill="#8CB4E0" textAnchor="middle">app router · server actions</text>
                <text x="340" y="229" fontFamily="JetBrains Mono" fontSize="8" fill="#7A7268" textAnchor="middle">NextAuth v5 · Github OAuth · SSE</text>

                <rect x="200" y="268" width="130" height="48" fill="#0F0B09" stroke="#EA442A" strokeWidth="1"/>
                <text x="265" y="286" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="12" fill="#EAE4DA" textAnchor="middle">PRISMA</text>

                <rect x="350" y="268" width="130" height="48" fill="#0F0B09" stroke="#EA442A" strokeWidth="1"/>
                <text x="415" y="286" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="12" fill="#EAE4DA" textAnchor="middle">POSTGRES 16</text>

                <line x1="265" y1="154" x2="265" y2="168" stroke="#EA442A" strokeWidth="1" markerEnd="url(#arr-o)"/>
                <line x1="265" y1="246" x2="265" y2="268" stroke="#EA442A" strokeWidth="1" markerEnd="url(#arr-o)"/>
                <line x1="330" y1="292" x2="350" y2="292" stroke="#7A7268" strokeWidth="1" markerEnd="url(#arr)"/>

                {/* Redis bridge */}
                <rect x="520" y="230" width="90" height="160" fill="rgba(234,68,42,0.08)" stroke="#EA442A" strokeWidth="2" strokeDasharray="5,3"/>
                <text x="565" y="260" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="14" fill="#EA442A" textAnchor="middle">REDIS</text>
                <text x="565" y="276" fontFamily="JetBrains Mono" fontSize="9" fill="#EA442A" textAnchor="middle">pub/sub</text>
                <text x="565" y="295" fontFamily="JetBrains Mono" fontSize="8" fill="#BCB4A8" textAnchor="middle">build:queue</text>
                <text x="565" y="307" fontFamily="JetBrains Mono" fontSize="8" fill="#BCB4A8" textAnchor="middle">build:progress</text>
                <text x="565" y="319" fontFamily="JetBrains Mono" fontSize="8" fill="#BCB4A8" textAnchor="middle">build:done</text>
                <text x="565" y="331" fontFamily="JetBrains Mono" fontSize="8" fill="#BCB4A8" textAnchor="middle">build:failed</text>

                <path d="M 480 246 L 508 260 L 520 260" stroke="#EA442A" strokeWidth="1.2" fill="none" markerEnd="url(#arr-o)"/>
                <path d="M 520 360 L 508 370 L 480 360" stroke="#EA442A" strokeWidth="1" fill="none" markerEnd="url(#arr-o)"/>

                {/* Execution plane */}
                <rect x="620" y="70" width="460" height="480" fill="rgba(140,180,224,0.03)" stroke="#8CB4E0" strokeWidth="1" strokeDasharray="3,3"/>
                <text x="635" y="58" fontFamily="JetBrains Mono" fontSize="10" fill="#8CB4E0" letterSpacing="2" fontWeight="500">EXECUTION PLANE</text>
                <text x="635" y="88" fontFamily="JetBrains Mono" fontSize="8" fill="#7A7268">isolated / untrusted-code · hetzner cpx41</text>

                <rect x="640" y="108" width="200" height="54" fill="#0F0B09" stroke="#8CB4E0" strokeWidth="1.5"/>
                <text x="740" y="130" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="13" fill="#EAE4DA" textAnchor="middle">BULLMQ WORKER</text>
                <text x="740" y="146" fontFamily="JetBrains Mono" fontSize="8" fill="#8CB4E0" textAnchor="middle">pipeline orchestrator</text>

                <line x1="610" y1="310" x2="640" y2="135" stroke="#8CB4E0" strokeWidth="1" strokeDasharray="2,2" markerEnd="url(#arr-b)"/>

                <rect x="640" y="180" width="130" height="48" fill="#0F0B09" stroke="#8CB4E0" strokeWidth="1"/>
                <text x="705" y="198" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="11" fill="#EAE4DA" textAnchor="middle">DinD</text>

                <rect x="790" y="180" width="130" height="48" fill="#0F0B09" stroke="#8CB4E0" strokeWidth="1"/>
                <text x="855" y="198" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="11" fill="#EAE4DA" textAnchor="middle">BUILDKIT</text>

                <rect x="940" y="180" width="130" height="48" fill="#0F0B09" stroke="#8CB4E0" strokeWidth="1"/>
                <text x="1005" y="198" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="11" fill="#EAE4DA" textAnchor="middle">TRIVY</text>

                <rect x="640" y="244" width="130" height="42" fill="#0F0B09" stroke="#2E2621" strokeWidth="1"/>
                <text x="705" y="260" fontFamily="JetBrains Mono" fontSize="10" fill="#BCB4A8" textAnchor="middle">SYFT</text>

                <rect x="790" y="244" width="130" height="42" fill="#0F0B09" stroke="#2E2621" strokeWidth="1"/>
                <text x="855" y="260" fontFamily="JetBrains Mono" fontSize="10" fill="#BCB4A8" textAnchor="middle">COSIGN</text>

                <rect x="940" y="244" width="130" height="42" fill="#0F0B09" stroke="#2E2621" strokeWidth="1"/>
                <text x="1005" y="260" fontFamily="JetBrains Mono" fontSize="9" fill="#BCB4A8" textAnchor="middle">SLSA-GEN</text>

                <text x="565" y="590" fontFamily="JetBrains Mono" fontSize="9" fill="#7A7268" textAnchor="middle" letterSpacing="1.5">TRUST BOUNDARY · NO SHARED FILESYSTEM · NO SHARED NETWORK · NO SHARED DB</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Plane split */}
      <section className="border-b border-hairline px-8 py-14">
        <SectionHeader num="02" label="THE SPLIT" title="Why two planes, and what it costs.">
          Flareo runs untrusted code. Every submitted Dockerfile contains
          arbitrary RUN instructions. That separation is the whole reason
          this architecture exists.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr_1fr] gap-7">
          <div />
          <div className="border border-hairline bg-canvas-panel p-6">
            <div className="mb-3 flex items-center gap-2 border-b border-hairline pb-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
              <span className="block h-1.5 w-1.5 rounded-full bg-accent" />
              CONTROL PLANE
            </div>
            <h3 className="mb-2.5 font-display text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-ink">
              What handles the user.
            </h3>
            <p className="mb-3 font-body text-[13.5px] leading-[1.7] text-ink-softer">
              Takes HTTP requests, authenticates via GitHub OAuth, reads and
              writes the catalog in Postgres, streams build progress over SSE.{" "}
              <span className="text-ink">Never runs untrusted code.</span>
            </p>
            <ul className="list-none space-y-0 p-0 font-mono text-[11.5px] tracking-[0.02em] text-ink-mute">
              {[
                ["runtime", "Next.js 14 · Node 20"],
                ["db", "Postgres 16 · Prisma ORM"],
                ["auth", "NextAuth v5 · GitHub OAuth"],
                ["host", "Hetzner CAX11 · €4/mo"],
                ["trusts", "the user, the DB, itself"],
              ].map(([k, v], i) => (
                <li key={i} className={`grid grid-cols-[90px_1fr] gap-3 py-1.5 ${i > 0 ? "border-t border-hairline" : ""}`}>
                  <span className="text-ink-faint">{k}</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-hairline bg-canvas-panel p-6">
            <div className="mb-3 flex items-center gap-2 border-b border-hairline pb-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-blue">
              <span className="block h-1.5 w-1.5 rounded-full bg-blue" />
              EXECUTION PLANE
            </div>
            <h3 className="mb-2.5 font-display text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-ink">
              What runs the pipeline.
            </h3>
            <p className="mb-3 font-body text-[13.5px] leading-[1.7] text-ink-softer">
              Dequeues build jobs from Redis, runs the six-stage pipeline
              inside docker-in-docker.{" "}
              <span className="text-ink">Assumes every input might be hostile.</span>
            </p>
            <ul className="list-none space-y-0 p-0 font-mono text-[11.5px] tracking-[0.02em] text-ink-mute">
              {[
                ["runtime", "BullMQ worker · Node 20"],
                ["sandbox", "DinD rootless · BuildKit"],
                ["db", "none · read-only Redis"],
                ["host", "Hetzner CPX41 · €24/mo"],
                ["trusts", "nothing (by design)"],
              ].map(([k, v], i) => (
                <li key={i} className={`grid grid-cols-[90px_1fr] gap-3 py-1.5 ${i > 0 ? "border-t border-hairline" : ""}`}>
                  <span className="text-ink-faint">{k}</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ADRs */}
      <section className="border-b border-hairline px-8 py-14">
        <SectionHeader num="03" label="DECISION LOG" title="Ten decisions, each with a cost.">
          These are the architectural decisions that actually shape
          Flareo&apos;s behavior. Each one gets a clear decision, the
          reasoning, and the trade-off that was accepted.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="flex flex-col border-t border-hairline">
            {ADRS.map((adr, i) => (
              <div
                key={adr.id}
                className={`grid grid-cols-[60px_1fr_2fr] items-baseline gap-6 py-6 transition-colors hover:bg-accent/[0.02] ${
                  i < ADRS.length - 1 ? "border-b border-hairline" : ""
                }`}
              >
                <div className="pt-0.5 font-mono text-[10.5px] font-medium tracking-[0.1em] text-accent">
                  {adr.id}
                </div>
                <div>
                  <h3 className="font-display text-[17px] font-black leading-[1.3] tracking-[-0.02em] text-ink">
                    {adr.q}
                  </h3>
                  <div className="mt-2 font-mono text-[11px] font-medium tracking-[0.08em] text-good">
                    DECIDED · {adr.decided}
                  </div>
                </div>
                <div className="font-body text-[13px] leading-[1.7] text-ink-softer">
                  {adr.body}
                  <div className="mt-2 font-mono text-[10.5px] tracking-[0.06em] text-warn">
                    <span className="mr-1.5 text-ink-faint">trade-off:</span>
                    {adr.tradeoff}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Threat model */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
        <SectionHeader num="04" label="THREAT MODEL" title="What we protect against, and what we don't.">
          Honest scoping matters more than complete coverage. Four attack
          classes that are <span className="text-ink">in scope</span>. Four
          that are <span className="text-ink">explicitly out of scope</span>.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="grid grid-cols-2 border border-hairline">
            {[...THREATS_IN.map((t) => ({ ...t, tone: "in" as const })), ...THREATS_OUT.map((t) => ({ ...t, tone: "out" as const }))].map(
              (t, i, arr) => (
                <div
                  key={i}
                  className={`bg-canvas-deep p-6 ${i % 2 === 0 ? "border-r border-hairline" : ""} ${i < arr.length - 2 ? "border-b border-hairline" : ""}`}
                >
                  <div className={`mb-3.5 flex items-center gap-2 border-b border-hairline pb-2 font-mono text-[10.5px] font-medium tracking-[0.14em] ${t.tone === "in" ? "text-good" : "text-warn"}`}>
                    <span className={`block h-1.5 w-1.5 rounded-full ${t.tone === "in" ? "bg-good" : "bg-warn"}`} />
                    {t.tone === "in" ? "IN SCOPE" : "OUT OF SCOPE"}
                  </div>
                  <h3 className="mb-2.5 font-display text-[18px] font-black leading-[1.25] tracking-[-0.02em] text-ink">
                    {t.title}
                  </h3>
                  <p className="mb-2.5 font-body text-[13px] leading-[1.7] text-ink-softer">
                    {t.p}
                  </p>
                  <div className="border-t border-dashed border-hairline pt-2.5 font-mono text-[10.5px] leading-[1.6] text-ink-mute">
                    <span className={`mr-1.5 ${t.tone === "in" ? "text-accent" : "text-warn"}`}>
                      mitigation:
                    </span>
                    {t.mit}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Stack inventory */}
      <section className="px-8 py-14">
        <SectionHeader num="06" label="STACK INVENTORY" title="Every dependency, named.">
          The full list of services, tools, and libraries in production. No
          hidden frameworks, no secret SaaS.
        </SectionHeader>
        <div className="grid grid-cols-[140px_1fr] gap-7">
          <div />
          <div className="border border-hairline bg-canvas-deep font-mono text-[11.5px]">
            <div className="grid grid-cols-[200px_90px_1fr_130px] gap-4 border-b border-hairline bg-canvas-panel px-4 py-3 text-[10px] font-medium tracking-[0.14em] text-ink-faint">
              <div>COMPONENT</div>
              <div>VERSION</div>
              <div>PURPOSE</div>
              <div>LICENSE</div>
            </div>
            {STACK.map((s, i) => (
              <div
                key={s.name}
                className={`grid grid-cols-[200px_90px_1fr_130px] items-baseline gap-4 px-4 py-2.5 leading-[1.55] transition-colors hover:bg-accent/[0.025] ${
                  i < STACK.length - 1 ? "border-b border-hairline" : ""
                }`}
              >
                <div className="text-ink">{s.name}</div>
                <div className="text-blue">{s.ver}</div>
                <div className="font-body text-[12.5px] text-ink-mute">
                  {s.desc}
                </div>
                <div className="text-[10.5px] tracking-[0.06em] text-ink-ghost">
                  {s.lic}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
