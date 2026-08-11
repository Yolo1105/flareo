import { PageHero } from "@/components/ui/PageHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Honest positioning. Where Flareo fits in the landscape and where other tools fit better.",
};

interface Competitor {
  num: string;
  name: string;
  role: string;
  users: string;
  verdict: "different layer" | "adjacent · audience differs" | "same audience · different guarantees" | "opposite trade-off" | "do-it-yourself option";
  verdictTone: "good" | "warn";
  good: string[];
  bad: string[];
  us: string[];
}

const COMPETITORS: readonly Competitor[] = [
  {
    num: "01",
    name: "Docker Hub & GHCR",
    role: "default registries",
    users: "everyone",
    verdict: "different layer",
    verdictTone: "good",
    good: [
      "Massive catalog. Millions of images, every project has an official image, every base language is represented.",
      "Free public hosting, great CDN, works with every container runtime.",
      "De-facto universal. Every docker pull tutorial assumes Docker Hub or GHCR.",
    ],
    bad: [
      "No verification. Anyone can push anything, the :latest tag can change under you, and publisher identity isn't cryptographically bound.",
      "No SBOM, no provenance attestation. You can't answer \"what's inside this image\" without scanning it yourself.",
      "Docker Content Trust exists but is rarely used and doesn't cover provenance.",
    ],
    us: [
      "Flareo doesn't replace these — we publish to GHCR. We add the verification layer on top.",
      "Use Flareo when you need supply-chain guarantees. Use Docker Hub for ephemeral build bases.",
    ],
  },
  {
    num: "02",
    name: "Chainguard Images",
    role: "hardened enterprise images",
    users: "security teams at mid+ companies",
    verdict: "adjacent · audience differs",
    verdictTone: "warn",
    good: [
      "Industry-leading hardening. Distroless images, minimal attack surface, FIPS-validated builds.",
      "Full supply-chain coverage: SBOM, signed provenance, upstream digest recorded, signatures, continuous CVE patching by a dedicated team.",
      "Enterprise-grade support, compliance attestations, audit-ready documentation.",
    ],
    bad: [
      "Priced for enterprise. Free tier is intentionally limited; full catalog starts in the four-to-six-figure annual range.",
      "Focused on base images and language runtimes. Won't build you a ready-to-run Vaultwarden.",
      "Not optimized for self-hosters. Their customer is a Fortune-500 security team.",
    ],
    us: [
      "Different audience. Flareo is for individual operators and small teams. Chainguard is for enterprises.",
      "If you're paying Chainguard pricing, they're probably a better fit. If you want verified containers for a Hetzner box, Flareo.",
    ],
  },
  {
    num: "03",
    name: "Wolfi & base distributions",
    role: "container-first Linux distro",
    users: "image builders",
    verdict: "different layer",
    verdictTone: "good",
    good: [
      "Excellent building blocks. Minimal, CVE-free base images you can build your own application images on.",
      "Every package signed, every release reproducible, SBOMs everywhere. The distribution is the verification story.",
    ],
    bad: [
      "Not application distribution. Wolfi hands you a bag of LEGO bricks; you still have to build the castle.",
      "Requires you to author the Dockerfile and own the build pipeline yourself.",
    ],
    us: [
      "Complementary. Publishers can build on Wolfi bases, then submit to Flareo. Wolfi is a supplier; Flareo is a distributor.",
    ],
  },
  {
    num: "04",
    name: "Linuxserver.io",
    role: "community self-hosting catalog",
    users: "homelab operators",
    verdict: "same audience · different guarantees",
    verdictTone: "warn",
    good: [
      "Enormous catalog. Hundreds of images, every popular self-hosted app covered, opinionated packaging.",
      "Community maintained, generally high quality. Strong documentation, predictable env-var schema.",
    ],
    bad: [
      "No formal verification. No SBOMs, no signatures, no provenance. Trust is community reputation, not cryptography.",
      "Mutable tags. The image behind linuxserver/gitea:latest today is not the same one you pulled last week.",
    ],
    us: [
      "Same self-hoster audience. Choose Flareo when cryptographic verification matters — compliance, teams, production.",
      "Choose LSIO when you need the widest possible catalog today and you're comfortable trusting community reputation.",
    ],
  },
  {
    num: "05",
    name: "Railway · Render · Fly.io",
    role: "deploy-for-you PaaS",
    users: "developers who don't want to ops",
    verdict: "opposite trade-off",
    verdictTone: "good",
    good: [
      "Zero-ops deployment. Push code, get a URL. No Docker knowledge needed, no compose file, no infrastructure.",
      "Managed scaling, integrated observability, automatic TLS, one-click database provisioning.",
    ],
    bad: [
      "Tenancy. You run on their infrastructure, pay their egress, are subject to their pricing.",
      "No supply-chain transparency. Runtime opacity is the product — you don't see how images are built.",
    ],
    us: [
      "Opposite trade-off. Flareo gives you the compose file and walks away. Your infrastructure, your bill, your control.",
      "Pick Railway when the convenience is worth the lock-in. Pick Flareo when you're done with tenancy.",
    ],
  },
  {
    num: "06",
    name: "Your own pipeline",
    role: "home-grown CI setup",
    users: "platform teams with capacity",
    verdict: "do-it-yourself option",
    verdictTone: "warn",
    good: [
      "Total control. Your CI, your policies, your trust decisions. Every tool chosen deliberately for your threat model.",
      "Integrates with whatever else you run. If you already use Renovate, Backstage, Artifactory — it slots in cleanly.",
    ],
    bad: [
      "Zero catalog leverage. You're only building images for your apps. No network effect of a shared verified catalog.",
      "Cost of operation. Running your own cosign + Trivy + SLSA pipeline takes a platform engineer at least a quarter.",
    ],
    us: [
      "Use Flareo for third-party applications. Use your own pipeline for internal services. They coexist.",
      "Every Flareo module ships with the full SLSA/SBOM/cosign stack your own pipeline was going to generate anyway.",
    ],
  },
];

export default function ComparePage() {
  return (
    <>
      <PageHero
        eyebrow="DOCS / COMPARE"
        prompt="flareo position --honest"
        promptComment="# where we fit, where we don't"
        title={
          <>
            NOT THE ONLY
            <br />
            CONTAINER PLATFORM.
          </>
        }
      >
        Flareo isn&apos;t trying to replace Docker Hub, out-harden
        Chainguard, or compete with Railway. It fills a specific gap:{" "}
        <span className="text-accent">verified self-hosting</span> — the only
        category where supply-chain rigor meets &quot;run it on your own
        box&quot; freedom. Here&apos;s the full landscape, honestly.
      </PageHero>

      {/* Positioning map */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-12">
        <div className="mb-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
          <span className="font-normal text-ink-ghost">§</span> LANDSCAPE MAP
        </div>
        <h2 className="mb-2.5 font-display text-[32px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
          Two axes. Seven players.
        </h2>
        <p className="mb-7 max-w-[620px] font-body text-[14px] leading-[1.6] text-ink-softer">
          Vertical axis:{" "}
          <span className="text-ink">verification rigor</span>. Horizontal axis:{" "}
          <span className="text-ink">self-host freedom</span>.
        </p>

        <div className="grid grid-cols-[1fr_220px] items-start gap-8">
          <div className="relative aspect-[1.55/1] border border-hairline bg-canvas-deep">
            <svg
              viewBox="0 0 800 520"
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2E2621" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="800" height="520" fill="url(#grid)" opacity="0.5"/>

              <line x1="60" y1="460" x2="760" y2="460" stroke="#544A43" strokeWidth="1"/>
              <line x1="60" y1="460" x2="60" y2="40" stroke="#544A43" strokeWidth="1"/>

              <line x1="410" y1="460" x2="410" y2="40" stroke="#2E2621" strokeWidth="1" strokeDasharray="4,4"/>
              <line x1="60" y1="250" x2="760" y2="250" stroke="#2E2621" strokeWidth="1" strokeDasharray="4,4"/>

              <text x="410" y="497" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fill="#7A7268" letterSpacing="1.5">SELF-HOST FREEDOM →</text>
              <text x="28" y="250" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fill="#7A7268" letterSpacing="1.5" transform="rotate(-90 28 250)">VERIFICATION RIGOR →</text>

              <g>
                <circle cx="610" cy="390" r="8" fill="transparent" stroke="#BCB4A8" strokeWidth="1.5"/>
                <text x="625" y="386" fontFamily="JetBrains Mono" fontSize="11" fill="#BCB4A8">Docker Hub</text>
                <text x="625" y="400" fontFamily="JetBrains Mono" fontSize="9" fill="#7A7268">GHCR, ECR</text>
              </g>
              <g>
                <circle cx="690" cy="350" r="8" fill="transparent" stroke="#BCB4A8" strokeWidth="1.5"/>
                <text x="685" y="330" fontFamily="JetBrains Mono" fontSize="11" fill="#BCB4A8" textAnchor="middle">Linuxserver.io</text>
                <text x="685" y="344" fontFamily="JetBrains Mono" fontSize="9" fill="#7A7268" textAnchor="middle">community</text>
              </g>
              <g>
                <circle cx="310" cy="100" r="8" fill="transparent" stroke="#BCB4A8" strokeWidth="1.5"/>
                <text x="325" y="96" fontFamily="JetBrains Mono" fontSize="11" fill="#BCB4A8">Chainguard</text>
                <text x="325" y="110" fontFamily="JetBrains Mono" fontSize="9" fill="#7A7268">enterprise</text>
              </g>
              <g>
                <circle cx="510" cy="170" r="8" fill="transparent" stroke="#BCB4A8" strokeWidth="1.5"/>
                <text x="525" y="166" fontFamily="JetBrains Mono" fontSize="11" fill="#BCB4A8">Wolfi</text>
                <text x="525" y="180" fontFamily="JetBrains Mono" fontSize="9" fill="#7A7268">base images only</text>
              </g>
              <g>
                <circle cx="180" cy="400" r="8" fill="transparent" stroke="#BCB4A8" strokeWidth="1.5"/>
                <text x="195" y="396" fontFamily="JetBrains Mono" fontSize="11" fill="#BCB4A8">Railway</text>
                <text x="195" y="410" fontFamily="JetBrains Mono" fontSize="9" fill="#7A7268">Render · Fly</text>
              </g>
              <g>
                <circle cx="630" cy="280" r="8" fill="transparent" stroke="#BCB4A8" strokeWidth="1.5"/>
                <text x="645" y="276" fontFamily="JetBrains Mono" fontSize="11" fill="#BCB4A8">home-grown</text>
                <text x="645" y="290" fontFamily="JetBrains Mono" fontSize="9" fill="#7A7268">bash + actions</text>
              </g>
              <g>
                <circle cx="640" cy="140" r="14" fill="#EA442A" opacity="0.15"/>
                <circle cx="640" cy="140" r="10" fill="#EA442A" stroke="#EA442A" strokeWidth="2"/>
                <text x="660" y="136" fontFamily="Archivo Black, sans-serif" fontWeight="900" fontSize="15" fill="#EA442A">FLAREO</text>
                <text x="660" y="152" fontFamily="JetBrains Mono" fontSize="9" fill="#EA442A">verified + portable</text>
              </g>
            </svg>
          </div>
          <div className="border border-hairline bg-canvas-deep p-5">
            <div className="mb-2.5 border-b border-hairline pb-2.5 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-faint">
              LEGEND
            </div>
            <div className="space-y-2 font-mono text-[11px] tracking-[0.02em]">
              <div className="flex items-center gap-2.5 font-medium text-accent">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-accent bg-accent" />
                FLAREO
              </div>
              {["Docker Hub / GHCR", "Chainguard Images", "Wolfi / base distros", "Linuxserver.io", "Railway / PaaS", "home-grown pipelines"].map(
                (l) => (
                  <div key={l} className="flex items-center gap-2.5 text-ink-mute">
                    <span className="h-2.5 w-2.5 rounded-full border border-ink-mute" />
                    {l}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Competitor sections */}
      {COMPETITORS.map((c) => (
        <section key={c.num} className="border-b border-hairline px-8 py-14">
          <div className="mb-8 grid grid-cols-[140px_1fr_180px] items-baseline gap-7">
            <div className="pt-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
              <span className="mr-1.5 font-normal text-ink-ghost">{c.num}</span>
              FLAREO vs.
            </div>
            <div>
              <h3 className="mb-1.5 font-display text-[40px] font-black leading-[1.02] tracking-[-0.03em] text-ink">
                {c.name}
              </h3>
              <div className="font-mono text-[11px] tracking-[0.06em] text-ink-faint">
                <span className="mr-1.5 text-ink-ghost">role</span>
                {c.role}
                <span className="ml-4 mr-1.5 text-ink-ghost">users</span>
                {c.users}
              </div>
            </div>
            <div className="pt-2 text-right font-mono text-[11px] tracking-[0.08em]">
              <span className="mb-1 block text-[10px] tracking-[0.14em] text-ink-ghost">
                CATEGORY
              </span>
              <span className={`font-medium ${c.verdictTone === "good" ? "text-good" : "text-warn"}`}>
                {c.verdict}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-7">
            <div />
            <div>
              <div className="mb-3.5 flex items-center gap-2 border-b border-hairline pb-2.5 font-mono text-[10px] font-medium tracking-[0.14em] text-good">
                <span className="block h-1.5 w-1.5 rounded-full bg-good" />
                THEY&apos;RE GOOD AT
              </div>
              <div className="flex flex-col gap-2.5">
                {c.good.map((item, i) => (
                  <div key={i} className="grid grid-cols-[12px_1fr] items-baseline gap-2 font-body text-[13px] leading-[1.6] text-ink-softer">
                    <span className="font-mono text-[11px] text-ink-ghost">+</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3.5 flex items-center gap-2 border-b border-hairline pb-2.5 font-mono text-[10px] font-medium tracking-[0.14em] text-warn">
                <span className="block h-1.5 w-1.5 rounded-full bg-warn" />
                WHAT THEY&apos;RE NOT
              </div>
              <div className="flex flex-col gap-2.5">
                {c.bad.map((item, i) => (
                  <div key={i} className="grid grid-cols-[12px_1fr] items-baseline gap-2 font-body text-[13px] leading-[1.6] text-ink-softer">
                    <span className="font-mono text-[11px] text-ink-ghost">−</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3.5 flex items-center gap-2 border-b border-hairline pb-2.5 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                <span className="block h-1.5 w-1.5 rounded-full bg-accent" />
                WHEN FLAREO FITS
              </div>
              <div className="flex flex-col gap-2.5">
                {c.us.map((item, i) => (
                  <div key={i} className="grid grid-cols-[12px_1fr] items-baseline gap-2 font-body text-[13px] leading-[1.6] text-ink-softer">
                    <span className="font-mono text-[11px] text-ink-ghost">→</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* When NOT to use */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
        <div className="mb-7">
          <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            <span className="text-ink-ghost">§</span> WHEN NOT TO USE FLAREO
          </div>
          <h2 className="mb-2.5 font-display text-[36px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            Honest disqualifiers.
          </h2>
          <p className="max-w-[640px] font-body text-[14px] leading-[1.65] text-ink-softer">
            Four scenarios where{" "}
            <span className="text-ink">Flareo is genuinely the wrong choice</span>. Use the alternative we point to.
          </p>
        </div>
        <div className="grid grid-cols-1 border-t border-hairline md:grid-cols-2">
          {[
            {
              num: "01",
              scenario: "You need a FIPS-validated cryptographic runtime.",
              reco: "We don't ship FIPS-140-2 validated crypto modules. If that's a hard compliance requirement, Chainguard ships FIPS images.",
              alt: "chainguard.dev · enterprise",
            },
            {
              num: "02",
              scenario: "You want zero-ops, push-to-deploy, don't care about infrastructure.",
              reco: "Flareo hands you a compose file and leaves. If you want to git-push and get a live URL, a PaaS will be dramatically less friction.",
              alt: "railway.com · render.com · fly.io",
            },
            {
              num: "03",
              scenario: "You need the biggest possible catalog today.",
              reco: "We're at 12 verified modules. We won't match Linuxserver.io's catalog breadth for a while. If you need Plex, Sonarr, Radarr this week, LSIO has them.",
              alt: "linuxserver.io · community",
            },
            {
              num: "04",
              scenario: "You're distributing images only inside your own company.",
              reco: "Flareo is a public registry. For internal-only images use your own CI with cosign + SLSA, or a private registry.",
              alt: "harbor.goharbor.io · artifactory",
            },
          ].map((item, i) => (
            <div
              key={item.num}
              className={`relative py-6 ${i % 2 === 0 ? "border-r border-hairline pr-6" : "pl-6"} ${i < 2 ? "border-b border-hairline" : ""}`}
            >
              <span className="absolute right-4 top-6 font-mono text-[10px] tracking-[0.1em] text-ink-ghost">
                {item.num}
              </span>
              <h4 className="mb-2 max-w-[90%] font-display text-[18px] font-black leading-[1.25] tracking-[-0.02em] text-ink">
                {item.scenario}
              </h4>
              <p className="mb-3 font-body text-[13px] leading-[1.65] text-ink-softer">
                {item.reco}
              </p>
              <div className="border-t border-dashed border-hairline pt-2.5 font-mono text-[11px] tracking-[0.04em] text-accent">
                alternative{" "}
                <span className="mx-1.5 text-ink-ghost">→</span>
                {item.alt}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verdict */}
      <section className="px-8 py-16 text-center">
        <div className="mb-[18px] inline-flex items-center gap-2 border border-accent px-[11px] py-[5px] font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          <span className="block h-1 w-1 bg-accent" />
          THE ONE-LINE VERSION
        </div>
        <h2 className="mx-auto mb-6 max-w-[780px] font-display text-[42px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
          Flareo is the only place where{" "}
          <span className="text-accent">cryptographically verified containers</span>{" "}
          meet <span className="text-accent">bring your own box</span>.
        </h2>
        <p className="mx-auto mb-7 max-w-[560px] font-body text-[14.5px] leading-[1.65] text-ink-softer">
          Everyone else either gives you verification but takes your
          infrastructure, or gives you freedom but not verification. We sit
          in the overlap.
        </p>
      </section>
    </>
  );
}
