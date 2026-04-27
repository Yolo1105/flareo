import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SandboxCountdown } from "@/components/interactive/SandboxCountdown";
import { getPreviewableModules } from "@/lib/data/modules";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sandbox",
  description:
    "Live-preview any verified module in a disposable sandbox VM. 30 minutes. Auto-destroy.",
};

const FLOW_STEPS = [
  {
    num: "01 PICK",
    title: "Choose a module.",
    desc: "Any module marked · previewable in the catalog can spin up instantly.",
  },
  {
    num: "02 SPIN UP",
    title: "Wait ~6 seconds.",
    desc: "A disposable VM boots, runs the signed image, exposes it behind a unique subdomain.",
  },
  {
    num: "03 POKE",
    title: "Click around.",
    desc: "It's a real container. Log in, create test data, hit the admin panel, break things.",
  },
  {
    num: "04 TAKE HOME",
    title: "Export and leave.",
    desc: "One click downloads the compose file pinned to the same digest. The sandbox evaporates.",
  },
];

const HOOD_CELLS = [
  {
    label: "01 ISOLATION",
    h: "Fresh VM per session.",
    p: "Each sandbox spins up in a dedicated Firecracker microVM. No shared filesystem, no shared network namespace, no cross-session bleed.",
    tech: "firecracker · 512 MB · 1 vCPU",
  },
  {
    label: "02 ROUTING",
    h: "Caddy reverse proxy.",
    p: "Each session gets a unique subdomain with automatic TLS. Caddy terminates HTTPS and proxies into the VM over a Tailscale mesh.",
    tech: "caddy 2.7 · auto-TLS · wildcard cert",
  },
  {
    label: "03 LIFECYCLE",
    h: "30-minute hard TTL.",
    p: "A cron sweeps the pool every minute. Sessions past 30 min are SIGTERMed, filesystem wiped, VM destroyed.",
    tech: "ttl=1800s · cron · atomic teardown",
  },
  {
    label: "04 SAFETY",
    h: "No outbound network.",
    p: "Sandboxes can receive traffic but can't initiate outbound connections. A malicious module can't phone home.",
    tech: "egress: deny-all · ingress: 443 only",
  },
];

const LIMITS = [
  {
    num: "01",
    tag: "NOT PERSISTENT",
    h: "Everything vaporizes after 30 minutes.",
    p: (
      <>
        Data you create during preview is{" "}
        <span className="text-ink">deliberately ephemeral</span>. The
        filesystem is wiped, the VM destroyed, the subdomain released.
        Sandbox is for evaluation, not for long-running trials.
      </>
    ),
  },
  {
    num: "02",
    tag: "NOT PRIVATE",
    h: "Anyone with the link can visit.",
    p: (
      <>
        Session URLs are unguessable but not authenticated. If you share
        the link, whoever clicks it lands in your session.{" "}
        <span className="text-ink">
          Don&apos;t put real credentials into a sandbox
        </span>
        , even as a test.
      </>
    ),
  },
  {
    num: "03",
    tag: "NOT A DEPLOY TARGET",
    h: "We don't host your production.",
    p: (
      <>
        Once the session ends, there&apos;s no &quot;promote to production&quot;
        button. The exported compose file runs on{" "}
        <span className="text-ink">your own infrastructure</span>.
      </>
    ),
  },
  {
    num: "04",
    tag: "NOT FOR EVERY MODULE",
    h: "Some modules need state Flareo can't spin up.",
    p: (
      <>
        Modules that require{" "}
        <span className="text-ink">
          paired databases, external secrets, or multi-service compose files
        </span>{" "}
        can&apos;t run in a single-VM sandbox.
      </>
    ),
  },
];

export default function SandboxPage() {
  const previewable = getPreviewableModules();

  return (
    <>
      <PageHero
        eyebrow="SANDBOX / LIVE PREVIEW"
        prompt="flareo preview vaultwarden"
        promptComment="# 30 min, auto-destroy, your browser"
        title={
          <>
            POKE IT BEFORE
            <br />
            YOU DEPLOY IT.
          </>
        }
      >
        Every verified module gets a{" "}
        <span className="text-accent">live, isolated sandbox</span> — a
        real container, running in a real VM, served to your browser
        through a reverse proxy.{" "}
        <span className="text-ink">Thirty minutes to explore.</span>{" "}
        Auto-destroys afterward. No signup. If you like what you see,
        take the compose file home.
      </PageHero>

      {/* Flow */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-7">
        <div className="mb-4 flex items-center gap-2.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-ink-faint">
          <span className="text-ink-ghost">§</span> HOW IT WORKS
          <div className="ml-2.5 h-px max-w-[240px] flex-1 bg-hairline" />
        </div>
        <div className="grid grid-cols-1 border border-hairline md:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`relative bg-canvas-deep p-5 ${
                i < FLOW_STEPS.length - 1 ? "border-b border-hairline md:border-b-0 md:border-r md:border-hairline" : ""
              }`}
            >
              <div className="mb-1.5 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                {s.num}
              </div>
              <h4 className="mb-1.5 font-display text-[17px] font-black leading-[1.15] tracking-[-0.02em] text-ink">
                {s.title}
              </h4>
              <p className="font-body text-[12.5px] leading-[1.5] text-ink-softer">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Session panel */}
      <section className="border-b border-hairline px-8 py-14">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
            <span className="font-normal text-ink-ghost">01</span>
            ACTIVE SESSION / LIVE
          </div>
          <h2 className="mb-2 font-display text-[38px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            vaultwarden@1.30.5
          </h2>
          <p className="max-w-[580px] font-body text-[14px] leading-[1.6] text-ink-softer">
            A real container, running on{" "}
            <span className="text-ink">isolated-vm-a4f2k1</span> in our
            sandbox pool. Everything you see below is proxied through
            Caddy on a unique subdomain.{" "}
            <span className="text-ink">Session vaporizes automatically</span>{" "}
            when the countdown hits zero.
          </p>
        </div>

        <div className="overflow-hidden border border-hairline bg-canvas-deep">
          {/* Telemetry strip */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] border-b border-hairline bg-canvas-panel">
            {[
              { k: "SESSION ID", v: "s-a4f2k1-b8c9" },
              { k: "DIGEST", v: "sha256:9a8b7c…" },
              { k: "REGION", v: "fra1 · eu-central" },
            ].map((c) => (
              <div key={c.k} className="border-r border-hairline px-5 py-3 font-mono">
                <span className="mb-1 block font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
                  {c.k}
                </span>
                <span className="font-mono text-[12px] tracking-[0.02em] text-ink">
                  {c.v}
                </span>
              </div>
            ))}
            <div className="border-r border-hairline px-5 py-3 font-mono">
              <span className="mb-1 block font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
                STATE
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[12px] tracking-[0.02em] text-good">
                <span className="block h-1.5 w-1.5 rounded-full bg-good meta-pulse" />
                HEALTHY
              </span>
            </div>
            <div className="border-l border-accent bg-accent/[0.08] px-5 py-3 font-mono">
              <span className="mb-1 block font-mono text-[9.5px] tracking-[0.14em] text-accent">
                DESTROYS IN
              </span>
              <span className="font-mono text-[16px] font-medium text-accent">
                <SandboxCountdown />
              </span>
            </div>
          </div>

          {/* Browser chrome */}
          <div>
            <div className="flex items-center gap-3 border-b border-hairline bg-canvas-deep px-3.5 py-2.5">
              <div className="flex gap-[5px]">
                <span className="block h-2.5 w-2.5 rounded-full bg-accent" />
                <span className="block h-2.5 w-2.5 rounded-full bg-hairline-soft" />
                <span className="block h-2.5 w-2.5 rounded-full bg-hairline-soft" />
              </div>
              <div className="flex flex-1 items-center gap-2 border border-hairline bg-canvas px-3 py-1.5 font-mono text-[11.5px] tracking-[0.02em]">
                <span className="text-[10px] text-good">▲</span>
                <span className="text-ink-ghost">https://</span>
                <span className="text-accent">
                  s-a4f2k1-b8c9.preview.flareo.sh
                </span>
                <span className="text-ink-mute">/</span>
              </div>
              <div className="flex items-center gap-1.5 border border-good px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-good">
                <span className="block h-1 w-1 rounded-full bg-good meta-pulse" />
                LIVE
              </div>
            </div>

            {/* Preview body — Vaultwarden mock */}
            <div className="relative bg-[#111] px-10 py-16">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 40%, rgba(58,90,250,0.08), transparent 55%)",
                }}
              />
              <div className="relative z-10 mx-auto max-w-[400px] text-center">
                <div className="mb-6 inline-flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center bg-[#3A5AFA] text-white"
                    style={{ clipPath: "polygon(50% 0, 100% 20%, 100% 65%, 50% 100%, 0 65%, 0 20%)" }}
                  >
                    <span style={{ fontFamily: "system-ui", fontWeight: "bold", fontSize: "18px" }}>V</span>
                  </div>
                  <span style={{ fontFamily: "system-ui", fontWeight: 700, fontSize: "22px", color: "#EAEAEA", letterSpacing: "-0.02em" }}>
                    Vaultwarden
                  </span>
                </div>
                <div style={{ fontFamily: "system-ui", fontSize: "15px", color: "#B8B8B8" }} className="mb-7">
                  Log in to your vault
                </div>
                <div className="mb-3.5 text-left">
                  <label style={{ fontFamily: "system-ui", fontSize: "11px", color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }} className="mb-1 block">
                    Email address
                  </label>
                  <input
                    readOnly
                    defaultValue="demo@preview.flareo.sh"
                    style={{ fontFamily: "system-ui", fontSize: "13.5px", background: "#222", border: "1px solid #333", color: "#EAEAEA" }}
                    className="w-full px-3 py-2.5"
                  />
                </div>
                <div className="mb-5 text-left">
                  <label style={{ fontFamily: "system-ui", fontSize: "11px", color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }} className="mb-1 block">
                    Master password
                  </label>
                  <input
                    readOnly
                    type="password"
                    defaultValue="••••••••••••"
                    style={{ fontFamily: "system-ui", fontSize: "13.5px", background: "#222", border: "1px solid #333", color: "#EAEAEA" }}
                    className="w-full px-3 py-2.5"
                  />
                </div>
                <button
                  style={{ fontFamily: "system-ui", background: "#3A5AFA", color: "white", fontSize: "14px", fontWeight: 500 }}
                  className="w-full px-3 py-2.5"
                >
                  Log in
                </button>
              </div>
            </div>

            {/* Action footer */}
            <div className="flex items-center justify-between border-t border-hairline bg-canvas-panel px-4.5 py-3.5">
              <div className="flex gap-3.5 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
                {[
                  ["cpu", "4.2%"],
                  ["mem", "82 / 512 MB"],
                  ["egress", "isolated"],
                  ["image", "verified ✓"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="text-ink-ghost">{k}</span>
                    <span className="text-ink-mute">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="border border-hairline bg-transparent px-3.5 py-2 font-body text-[12.5px] font-medium text-ink-mute transition-colors hover:border-ink-ghost hover:text-ink">
                  Open admin panel
                </button>
                <button className="border border-hairline bg-transparent px-3.5 py-2 font-body text-[12.5px] font-medium text-warn transition-colors hover:border-warn hover:bg-warn/[0.06]">
                  End session
                </button>
                <button className="btn-chamfer bg-accent px-3.5 py-2 font-body text-[12.5px] font-medium text-canvas transition-colors hover:bg-accent-hot">
                  Export compose &amp; leave
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Under the hood */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
        <div className="mb-7">
          <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
            <span className="text-ink-ghost">02</span> UNDER THE HOOD
          </div>
          <h2 className="mb-2 font-display text-[32px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            What&apos;s actually running.
          </h2>
          <p className="max-w-[640px] font-body text-[14px] leading-[1.65] text-ink-softer">
            Four components make sandbox work. All isolated, all ephemeral,
            all <span className="text-ink">paying for themselves in about 6 seconds</span>{" "}
            from click to running container.
          </p>
        </div>
        <div className="grid grid-cols-1 border border-hairline bg-canvas-deep md:grid-cols-2 lg:grid-cols-4">
          {HOOD_CELLS.map((c, i) => (
            <div
              key={c.label}
              className={`p-5 ${
                i < HOOD_CELLS.length - 1 ? "border-b border-hairline lg:border-b-0 lg:border-r" : ""
              }`}
            >
              <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                {c.label}
              </div>
              <h4 className="mb-1.5 font-display text-[15px] font-black leading-[1.2] tracking-[-0.02em] text-ink">
                {c.h}
              </h4>
              <p className="mb-2.5 font-body text-[12.5px] leading-[1.55] text-ink-softer">
                {c.p}
              </p>
              <div className="border-t border-dashed border-hairline pt-2.5 font-mono text-[10.5px] tracking-[0.02em] text-ink-faint">
                {c.tech}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Limits */}
      <section className="border-b border-hairline px-8 py-14">
        <div className="mb-6">
          <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-warn">
            <span className="text-ink-ghost">03</span> WHAT SANDBOX IS NOT
          </div>
          <h2 className="mb-2 font-display text-[32px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
            Honest disqualifiers.
          </h2>
          <p className="max-w-[640px] font-body text-[14px] leading-[1.65] text-ink-softer">
            Sandbox is a try-before-you-deploy experience, not a hosting
            platform. Four things it explicitly does not do.{" "}
            <span className="text-ink">
              If you need any of these, skip sandbox and deploy directly.
            </span>
          </p>
        </div>
        <div className="grid grid-cols-1 border-t border-hairline md:grid-cols-2">
          {LIMITS.map((l, i) => (
            <div
              key={l.num}
              className={`relative py-6 ${
                i % 2 === 0 ? "border-r border-hairline pr-6" : "pl-6"
              } ${i < 2 ? "border-b border-hairline" : ""}`}
            >
              <span className="absolute right-4 top-6 font-mono text-[10px] tracking-[0.1em] text-ink-ghost">
                {l.num}
              </span>
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.14em] text-warn">
                <span className="text-[12px]">×</span>
                {l.tag}
              </div>
              <h4 className="mb-2 max-w-[90%] font-display text-[17px] font-black leading-[1.3] tracking-[-0.02em] text-ink">
                {l.h}
              </h4>
              <p className="font-body text-[12.5px] leading-[1.6] text-ink-softer">
                {l.p}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pick a module */}
      <section className="border-b border-hairline bg-canvas-panel px-8 py-14">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <div className="mb-3 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
              <span className="text-ink-ghost">§</span> PREVIEW-ELIGIBLE MODULES
            </div>
            <h2 className="mb-2 font-display text-[32px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
              Try one right now.
            </h2>
            <p className="max-w-[600px] font-body text-[13.5px] leading-[1.6] text-ink-softer">
              Modules below spin up cleanly in a single-VM sandbox. Click
              any one to end the current session and launch a new preview.
            </p>
          </div>
          <div className="font-mono text-[11px] tracking-[0.06em] text-ink-faint">
            <span className="mr-1.5 text-ink-ghost">showing</span>
            {previewable.length} preview-eligible
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {previewable.map((m) => (
            <Link
              key={m.slug}
              href={`/modules/${m.slug}`}
              className="flex flex-col gap-2.5 border border-hairline bg-canvas-deep p-4.5 transition-colors hover:border-accent"
            >
              <div className="font-mono text-[10px] tracking-[0.1em] text-ink-faint">
                {m.id}
              </div>
              <div className="font-display text-[18px] font-black leading-[1.1] tracking-[-0.025em] text-ink transition-colors">
                {m.name}
              </div>
              <div className="min-h-[36px] font-body text-[12px] leading-[1.5] text-ink-softer">
                {m.description}
              </div>
              <div className="flex items-center justify-between border-t border-hairline pt-2.5 font-mono text-[10px] tracking-[0.04em] text-ink-faint">
                <span>{m.version}</span>
                <span className="flex items-center gap-1.5 text-good">
                  <span className="block h-1 w-1 rounded-full bg-good" />
                  READY
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
