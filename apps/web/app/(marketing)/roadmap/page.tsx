/* eslint-disable react/no-unescaped-entities -- marketing copy; avoid rewriting large prose */
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "What's shipped, what's in progress, what's planned, and what's deliberately not on the path. Public and updated.",
};

type Phase = "shipped" | "in-progress" | "planned" | "considered" | "parked";

interface RoadmapItem {
  title: string;
  phase: Phase;
  eta?: string;
  body: string;
  link?: { href: string; label: string };
}

const ITEMS: RoadmapItem[] = [
  // ─── shipped (most recent first) ──────────────────────────────
  {
    title: "Marketplace + Pipeline pages",
    phase: "shipped",
    eta: "2026 Q2",
    body: "Distinct discovery surface (/marketplace) with editorial picks, trending modules, and inline reviews. Authenticated /pipeline page that walks every stage with real artifacts (BuildKit log, Trivy report, CycloneDX SBOM, SLSA in-toto, cosign + Rekor, ECR publish receipt).",
    link: { href: "/marketplace", label: "open marketplace" },
  },
  {
    title: "Demo-mode login bypass",
    phase: "shipped",
    eta: "2026 Q2",
    body: "Env-gated demo signin lets dev environments bypass OAuth for testing. Hard-locked behind NODE_ENV != production AND DEMO_MODE=1; route returns 410 in prod regardless.",
  },
  {
    title: "Reviews + reports + featured curation + publisher profiles",
    phase: "shipped",
    eta: "2026 Q1",
    body: "Full marketplace social fabric: per-module reviews with moderation, /@username profile pages, admin-curated featured strip, public report inbox for module problems.",
  },
  {
    title: "Build worker + Stripe billing",
    phase: "shipped",
    eta: "2026 Q1",
    body: "Real submission build-worker (BullMQ-coordinated, BuildKit + Trivy in DinD, deterministic job claiming), live build log streaming via SSE, plan-aware quotas, Stripe billing for Pro / Enterprise tiers.",
  },
  {
    title: "Public catalog of 12 verified modules",
    phase: "shipped",
    eta: "2025 Q4",
    body: "First launch cohort: vaultwarden, uptime-kuma, authentik, nginx-proxy-manager, gitea, immich, caddy, grafana, crowdsec, keycloak, forgejo, jellyfin. Each with republish receipts and a visible lastRebuiltAt timestamp.",
  },
  {
    title: "Audit-any-image — verify any registry",
    phase: "shipped",
    eta: "2026 Q2",
    body: "/verify accepts any public OCI image — Docker Hub, GHCR, Quay, public.ecr.aws, anywhere. For Flareo-cataloged digests you get the full receipt chain; for external signed images, you get signer identity, OIDC issuer, and the Rekor log entry. Pre-auth, no Flareo trust required to use.",
    link: { href: "/verify", label: "audit an image" },
  },
  {
    title: "Takeaway bundle endpoint",
    phase: "shipped",
    eta: "2026 Q2",
    body: "/api/v1/modules/<slug>/takeaway returns a single markdown file with all four deployment artifacts (compose, Helm values, .env, docker run) plus a README explaining how to verify before deploying. Cacheable with the module's digest as ETag, so cache invalidates exactly when the module rebuilds.",
  },

  // ─── in progress ──────────────────────────────────────────────
  // (none currently — most recent in-progress items shipped this iteration)

  // ─── planned (committed, scheduled) ───────────────────────────
  {
    title: "Cloud Native Buildpacks (CNB) auto-detect",
    phase: "shipped",
    eta: "2026 Q2",
    body: "Publish wizard adds a build-mode picker — &quot;I have a Dockerfile&quot; or &quot;Auto-detect with buildpacks.&quot; CNB path detects language from root markers (package.json, go.mod, Cargo.toml, etc.) and pins a specific Paketo builder. Detection runs server-side at submission time so reviewers see the language we&apos;ll build before they decide. Pipeline downstream is identical to the Dockerfile path — same Trivy, same SBOM, same signature.",
    link: { href: "/pipeline", label: "see pipeline stage 01" },
  },
  {
    title: "VEX annotation surface",
    phase: "shipped",
    eta: "2026 Q2",
    body: "Reviewer admin surface at /app/admin/vex lets the team annotate Trivy findings with not_affected / under_investigation / fixed / affected. Annotations roll up into an OpenVEX 0.2.0 document downloadable at /api/v1/modules/<slug>/vex, included on every module detail page receipts panel, surfaced in pipeline stage 04. Publisher-side annotation surface remains a follow-up.",
    link: { href: "/pipeline#stage-vex", label: "see pipeline stage 04" },
  },
  {
    title: "Policy-as-code admission gate",
    phase: "shipped",
    eta: "2026 Q2",
    body: "Active admission policy at /app/admin/policy with full revision history (every save creates a new revision; older ones stay in the audit trail). Pure-TypeScript evaluator runs against every module's signals (CVE counts after VEX, SLSA level, signature/SBOM/Rekor presence, trust score). Verdict cached per module, downloadable at /api/v1/modules/<slug>/policy. Honest framing: OPA-shaped JSON policy today; Rego runtime is a future swap behind the same input/output contract.",
    link: { href: "/pipeline#stage-policy", label: "see pipeline stage 07" },
  },
  {
    title: "Self-host bundle (Enterprise tier)",
    phase: "planned",
    eta: "2026 Q4",
    body: "A Docker Compose bundle that lets a team run their own Flareo on their own hardware. The architecture supports it (control-plane + execution-plane separation, standard OSS dependencies). What's missing is the packaging, license decision, and support story — committed to make those calls in Q4.",
  },
  {
    title: "Module comparison UI",
    phase: "planned",
    eta: "2026 Q4",
    body: "Pick two modules in the same category, see side-by-side Trust Scores, CVE counts, SBOM size, last update, deploy count, signature recency. Turns the marketplace from browsing into decision-making.",
  },

  // ─── considered (likely, not committed) ──────────────────────
  {
    title: "Live unauthenticated preview from landing page",
    phase: "considered",
    body: "The proposal called this 'the single highest-value content element' — one button on the landing that spins up a real running module in a real sandbox in 10 seconds. Real engineering: Caddy dynamic reverse proxy, wildcard TLS, isolated subdomain per session, abuse mitigation. Significant work; we want to commit to a date only when we know we can deliver.",
  },
  {
    title: "Submitter revenue share for top-deploy modules",
    phase: "considered",
    body: "Today, Flareo is exposure-only for submitters. Revenue share for the most-deployed modules on the Pro tier is a possibility we're not yet committing to. The reason for the hold: it changes supply-side incentives in ways we'd rather understand from data than from speculation. If we move, we publish the model in detail before activating.",
  },
  {
    title: "User-tunable Trust Score weights",
    phase: "considered",
    body: "Three positions in tension: keep weights fixed (canonical comparison), tunable for organizations (Enterprise tier), or tunable for everyone with the canonical still visible. Holding the question open until we see whether the demand is there.",
    link: { href: "/docs/trust-score", label: "open methodology page" },
  },
  {
    title: "Public RSS / weekly digest of new modules",
    phase: "considered",
    body: "A 'new verified modules this week' feed that compounds over time and pulls in return traffic. Cheap to build; valuable only once the catalog is large enough that it's worth subscribing.",
  },

  // ─── parked ───────────────────────────────────────────────────
  {
    title: "Mobile app",
    phase: "parked",
    body: "The product is a developer tool. Developers verify, deploy, and operate from terminals and laptops. A mobile app is the wrong investment unless and until the audience materially shifts.",
  },
  {
    title: "Marketplace search by image hash",
    phase: "parked",
    body: "Initially planned, then realized the use case (paste a digest, see if Flareo built it) is already covered by /verify — and a search-by-hash UI duplicates that flow without adding value. Parked indefinitely.",
  },
];

const PHASE_LABELS: Record<Phase, { label: string; tone: string; sub: string }> = {
  shipped: {
    label: "SHIPPED",
    tone: "text-good border-good/40 bg-good/[0.05]",
    sub: "in production today",
  },
  "in-progress": {
    label: "IN PROGRESS",
    tone: "text-accent border-accent/40 bg-accent/[0.05]",
    sub: "actively being built",
  },
  planned: {
    label: "PLANNED",
    tone: "text-warn border-warn/40 bg-warn/[0.05]",
    sub: "committed with target date",
  },
  considered: {
    label: "CONSIDERED",
    tone: "text-ink-mute border-hairline bg-canvas-panel",
    sub: "thinking about it, not committed",
  },
  parked: {
    label: "PARKED",
    tone: "text-ink-faint border-hairline bg-canvas-panel",
    sub: "deliberately not on the path",
  },
};

const PHASE_ORDER: Phase[] = [
  "shipped",
  "in-progress",
  "planned",
  "considered",
  "parked",
];

export default function RoadmapPage() {
  const grouped: Record<Phase, RoadmapItem[]> = {
    shipped: [],
    "in-progress": [],
    planned: [],
    considered: [],
    parked: [],
  };
  for (const it of ITEMS) {
    grouped[it.phase].push(it);
  }

  return (
    <>
      <PageHero
        eyebrow="ROADMAP"
        prompt="cat /roadmap.txt"
        promptComment="# what we're building, and what we're deliberately not"
        title={
          <>
            Public roadmap.
            <br />
            Honest categories.
          </>
        }
      >
        <p className="max-w-[680px] font-body text-[15px] leading-[1.55] text-ink-softer">
          Five categories: shipped, in progress, planned (committed with a
          date), considered (we're thinking about it, not promising it), and
          parked (deliberately not on the path). Items move between categories
          as reality changes — this page is the record.
        </p>
      </PageHero>

      <div className="px-8 py-12">
        <div className="mx-auto max-w-[960px] space-y-12">
          {PHASE_ORDER.map((phase) => {
            const items = grouped[phase];
            if (items.length === 0) return null;
            const meta = PHASE_LABELS[phase];
            return (
              <section key={phase}>
                <header className="mb-5 flex items-baseline gap-4 border-b border-hairline pb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${meta.tone}`}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-ink-ghost">
                    {meta.sub}
                  </span>
                  <span className="ml-auto font-mono text-[10.5px] text-ink-faint">
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </span>
                </header>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {items.map((it, i) => (
                    <article
                      key={i}
                      className="border border-hairline bg-canvas-deep p-5"
                    >
                      <header className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="font-display text-[16px] font-black leading-[1.25] tracking-[-0.02em] text-ink">
                          {it.title}
                        </h3>
                        {it.eta && (
                          <span className="shrink-0 font-mono text-[10.5px] text-accent">
                            {it.eta}
                          </span>
                        )}
                      </header>
                      <p className="font-body text-[12.5px] leading-[1.6] text-ink-softer">
                        {it.body}
                      </p>
                      {it.link && (
                        <Link
                          href={it.link.href}
                          className="mt-3 inline-block font-mono text-[10.5px] text-accent hover:text-accent-hot"
                        >
                          {it.link.label} →
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mx-auto mt-14 max-w-[960px] border border-dashed border-hairline bg-canvas-deep p-6">
          <h2 className="mb-2 font-display text-[18px] font-black tracking-[-0.02em] text-ink">
            How items move between categories
          </h2>
          <ul className="space-y-2 font-body text-[12.5px] leading-[1.65] text-ink-softer">
            <li>
              <strong className="text-ink">Considered → planned:</strong> we
              commit to a target quarter when (a) we have capacity, (b) the
              dependencies are unblocked, and (c) the scope is small enough to
              ship cleanly.
            </li>
            <li>
              <strong className="text-ink">Planned → in progress:</strong>{" "}
              moves at the start of the quarter the work begins. Progress
              becomes visible in the changelog.
            </li>
            <li>
              <strong className="text-ink">Considered → parked:</strong>{" "}
              happens when an item turns out to duplicate something we already
              do, or when its premise gets invalidated by user data.
              Parked items get an explanation, not silence.
            </li>
            <li>
              <strong className="text-ink">Planned → considered:</strong>{" "}
              happens when a date slips past its target. We move it back to
              considered rather than rolling the date silently — slipping
              dates is the trust-killer; honesty about slippage is not.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
