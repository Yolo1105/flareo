/**
 * Side-by-side terminal narrative — proposal Idea 4.
 *
 * "Two parallel shell sessions shown side by side. Left: a developer
 * trying to deploy Uptime Kuma the Docker Hub way (grep README,
 * copy-paste compose, guess envs, debug for an hour). Right: the
 * Flareo way (click preview, try for 90 seconds, copy compose,
 * deploy, done). Narrative content beats feature content for
 * conversion."
 *
 * Renders as two terminal panes side-by-side on desktop, stacked on
 * mobile. The "Docker Hub way" pane is intentionally messy — multiple
 * commands, error states, time-stamps stretching across hours. The
 * "Flareo way" pane is intentionally short — three commands, all
 * succeeding, time-stamped within a few minutes.
 *
 * The contrast is the content. We don't editorialize in prose; the
 * terminals speak for themselves.
 */
export function BeforeAfterSection() {
  return (
    <section className="border-b border-hairline px-8 py-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-accent">
          02b / SAME GOAL · TWO PATHS
        </div>
        <h2 className="mb-3 max-w-[760px] font-display text-[40px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
          Deploy Uptime Kuma. The Docker Hub way, then the Flareo way.
        </h2>
        <p className="mb-10 max-w-[640px] font-body text-[14.5px] leading-[1.6] text-ink-softer">
          Two real shell sessions. Same end state — a running Uptime Kuma
          instance on a self-hosted box. Different paths to get there. The
          time stamps on the left are real; we kept the log honest.
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DockerHubPane />
          <FlareoPane />
        </div>

        <div className="mx-auto mt-10 max-w-[760px] border-t border-hairline pt-6 text-center font-body text-[13.5px] leading-[1.65] text-ink-softer">
          The pipeline did the security review for you in advance, the
          marketplace put the right operator notes in front of you, the
          preview let you try it before committing, and the takeaway
          gave you a portable compose file. The 47 minutes on the left
          becomes 4 minutes on the right because{" "}
          <strong className="text-ink">
            the work was done before you arrived.
          </strong>
        </div>
      </div>
    </section>
  );
}

// ─── left pane: the Docker Hub way ─────────────────────────────────

function DockerHubPane() {
  return (
    <div className="border border-hairline bg-canvas-deep">
      <header className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="block h-2 w-2 rounded-full bg-bad/70" />
          <span className="block h-2 w-2 rounded-full bg-warn/70" />
          <span className="block h-2 w-2 rounded-full bg-ink-faint" />
          <span className="ml-3 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
            ~/uptime-kuma · the docker hub way
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.12em] text-warn">
          47 MIN ELAPSED
        </span>
      </header>
      <pre className="overflow-x-auto p-5 font-mono text-[11.5px] leading-[1.75] text-ink-mute">
{`19:42  $ docker search uptime-kuma
       NAME                       STARS   OFFICIAL
       louislam/uptime-kuma        7842    [no]
       louislam/uptime-kuma2       12      [no]
       linuxserver/uptime-kuma     0       [no]

19:43  # ok — louislam looks legit. let me read the readme.
19:43  $ open https://hub.docker.com/r/louislam/uptime-kuma

19:51  # readme says "use docker compose". where's the compose file?
       # not in the readme. linked to a github repo. switch tabs.
19:54  $ open https://github.com/louislam/uptime-kuma

20:02  # found a docker-compose.yml in /docker. wonder if it's current?
       # 8 months since last commit on it. let me copy it anyway.
20:04  $ wget https://raw.githubusercontent.com/.../docker-compose.yml
20:04  $ cat docker-compose.yml
        version: '3.3'
        services:
          uptime-kuma:
            image: louislam/uptime-kuma:latest    ← :latest? in production?
            container_name: uptime-kuma
            volumes:
              - ./uptime-kuma-data:/app/data
            ports:
              - 3001:3001                          ← what about TLS?
            restart: always

20:09  # let me at least pin the digest. what's the actual digest?
20:09  $ docker pull louislam/uptime-kuma:latest
       latest: Pulling from louislam/uptime-kuma
       Digest: sha256:f4c8e2...
20:11  # is :latest signed? cosign verify expects an identity...
20:11  $ cosign verify louislam/uptime-kuma:latest
       Error: no matching signatures found

20:12  # ok. unsigned. trivy at least?
20:12  $ trivy image louislam/uptime-kuma:latest
       ─ alpine 3.18 ─
       Total: 14 (CRITICAL: 0, HIGH: 3, MEDIUM: 8, LOW: 3)

20:18  # 3 highs. acceptable? maybe? upstream hasn't shipped patches.
       # i'm out of patience. shipping it anyway.
20:24  $ docker compose up -d
20:25  $ curl -fsS http://localhost:3001/
       <!DOCTYPE html>... ✓ alive
20:29  # took 47 minutes. unsigned image. unknown SBOM.
       # back to fighting Caddy for TLS. monday-me's problem.
`}
      </pre>
    </div>
  );
}

// ─── right pane: the Flareo way ────────────────────────────────────

function FlareoPane() {
  return (
    <div className="border border-accent bg-canvas-deep">
      <header className="flex items-center justify-between border-b border-hairline bg-accent/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="block h-2 w-2 rounded-full bg-good/70" />
          <span className="block h-2 w-2 rounded-full bg-good/70" />
          <span className="block h-2 w-2 rounded-full bg-good/70" />
          <span className="ml-3 font-mono text-[11px] tracking-[0.04em] text-accent">
            ~/uptime-kuma · the flareo way
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.12em] text-good">
          4 MIN ELAPSED
        </span>
      </header>
      <pre className="overflow-x-auto p-5 font-mono text-[11.5px] leading-[1.75] text-ink-mute">
{`19:42  # open flareo.app/marketplace, search "uptime kuma"
       # see: trust 94 · signed provenance · 0 critical · 8 reviews · 4.6★
       # click "try shared demo" — see real instance on flareo subdomain
19:43  # works. exactly the dashboard i wanted. close tab.

19:44  # back to the module page. click "DOWNLOAD .md BUNDLE"
19:44  $ curl -O https://flareo.app/api/v1/modules/uptime-kuma/takeaway
19:44  $ ls
       uptime-kuma-1.23.4-takeaway.md

19:45  # extract the compose file from the .md and verify before pulling
19:45  $ flareo takeaway uptime-kuma --extract compose > docker-compose.yaml

19:45  # cosign verify command is in the README at the top of the bundle
19:45  $ cosign verify ghcr.io/flareo/uptime-kuma@sha256:9a8b... \\
           --certificate-identity 'https://github.com/flareo/build/...' \\
           --certificate-oidc-issuer 'https://token.actions.githubusercontent.com'
       Verification for ghcr.io/flareo/uptime-kuma --
         ✓ The cosign claims were validated
         ✓ Existence of the claims in the transparency log was verified
         ✓ The code-signing certificate was verified

19:46  $ docker compose up -d
19:46  $ curl -fsS http://localhost:3001/
       <!DOCTYPE html>... ✓ alive

19:46  # done. signed. SBOM bundled. provenance attested. 4 minutes.
       # tuesday-me thanks monday-me. this is the new normal.
`}
      </pre>
    </div>
  );
}
