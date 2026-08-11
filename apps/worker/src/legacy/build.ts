/**
 * LEGACY — retained as a record of the sandbox design (ADR-012).
 *
 * Not reachable from any active code path. Changing this file no
 * longer requires re-running the red-team playbook because it no
 * longer runs.
 *
 * See: docs/adr/ADR-012-retire-build-path.md
 */

/**
 * docker build wrapper.
 *
 * This is the most security-sensitive file in the worker. The flags
 * below are what enforce the sandbox. Changing any of them requires
 * re-running RED_TEAM_PLAYBOOK.md.
 *
 * Invariants:
 *   - --network=none by default (opt-in only via requiresNetwork)
 *   - 4 GB RAM, 2 CPUs, 20 GB layer ceiling, 1024 pids, 10 min timeout
 *   - userns-remap handled at the Docker daemon level (daemon.json)
 *   - No --privileged, ever
 */

import { spawn } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

export interface BuildArgs {
  submissionId: string;
  slug: string;
  dockerfile: string;
  buildRoot: string;
  timeoutMs: number;
  requiresNetwork: boolean;
  /**
   * Called with each raw chunk emitted by the docker child process.
   * Invoked synchronously from the child's stdio 'data' handler; the
   * callback is expected to be non-blocking (e.g. enqueue an async
   * DB write and return immediately). Errors are swallowed so a
   * streaming failure never affects the build outcome. Omit entirely
   * to skip streaming.
   */
  onChunk?: (chunk: { text: string; stream: "stdout" | "stderr" }) => void;
}

export interface BuildResult {
  success: boolean;
  imageTag: string;   // Local-only tag, pre-push
  logText: string;    // Full stdout+stderr
  durationMs: number;
  // Set when success=false. "user" = bad Dockerfile; "system" = worker
  // infra broke; the runner determines which.
  errorSummary: string | null;
}

/**
 * Run docker build in a scoped context directory. Returns the full
 * log and exit status. Does NOT throw on non-zero exit — the caller
 * classifies the failure.
 */
export async function dockerBuild(args: BuildArgs): Promise<BuildResult> {
  const workDir = join(args.buildRoot, args.submissionId);
  await mkdir(workDir, { recursive: true });
  await writeFile(join(workDir, "Dockerfile"), args.dockerfile);

  const imageTag = `flareo-build-${args.submissionId}:staged`;
  const started = Date.now();

  // Order matters here. The most security-critical flags go first so
  // they're obvious in the command line during incident review.
  const buildArgs = [
    "build",
    "--memory",
    "4g",
    "--memory-swap",
    "4g",
    "--cpu-quota",
    "200000",
    "--pids-limit",
    "1024",
    "--storage-opt",
    "size=20G",
    args.requiresNetwork ? "--network=default" : "--network=none",
    "--tag",
    imageTag,
    "--file",
    join(workDir, "Dockerfile"),
    workDir,
  ];

  return await new Promise<BuildResult>((resolve) => {
    const child = spawn("docker", buildArgs, {
      cwd: workDir,
      env: {
        // Deny BuildKit's "RUN --mount=type=secret" and similar;
        // defense in depth. The userns-remap in daemon.json covers
        // the container side, but clearing these envs makes intent
        // explicit.
        PATH: process.env.PATH ?? "/usr/bin:/bin",
        DOCKER_BUILDKIT: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (c: Buffer) => {
      stdoutChunks.push(c);
      if (args.onChunk) {
        try {
          args.onChunk({ text: c.toString("utf8"), stream: "stdout" });
        } catch {
          // Streaming must never affect the build. Swallow.
        }
      }
    });
    child.stderr.on("data", (c: Buffer) => {
      stderrChunks.push(c);
      if (args.onChunk) {
        try {
          args.onChunk({ text: c.toString("utf8"), stream: "stderr" });
        } catch {
          // Same: streaming errors are non-fatal.
        }
      }
    });

    // Hard kill at timeout.
    const killTimer = setTimeout(() => {
      // Escalating signals: TERM, wait 5s, KILL.
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000);
    }, args.timeoutMs);

    child.on("close", (code, signal) => {
      clearTimeout(killTimer);
      const logText =
        Buffer.concat(stdoutChunks).toString("utf8") +
        "\n--- stderr ---\n" +
        Buffer.concat(stderrChunks).toString("utf8");
      const duration = Date.now() - started;

      if (signal === "SIGTERM" || signal === "SIGKILL") {
        resolve({
          success: false,
          imageTag,
          logText,
          durationMs: duration,
          errorSummary: `Build exceeded ${Math.round(
            args.timeoutMs / 1000
          )}s timeout and was killed.`,
        });
        return;
      }

      resolve({
        success: code === 0,
        imageTag,
        logText,
        durationMs: duration,
        errorSummary:
          code === 0
            ? null
            : extractUserFacingError(
                Buffer.concat(stderrChunks).toString("utf8")
              ),
      });
    });

    child.on("error", (err) => {
      clearTimeout(killTimer);
      resolve({
        success: false,
        imageTag,
        logText: `spawn failed: ${err.message}`,
        durationMs: Date.now() - started,
        errorSummary: `Worker couldn't start docker: ${err.message}`,
      });
    });
  });
}

/**
 * Pull a human-usable error line out of a docker build stderr. Works
 * for the common failure modes; for weird ones we fall back to the
 * last non-empty line.
 */
function extractUserFacingError(stderr: string): string {
  const lines = stderr.split("\n").map((l) => l.trim()).filter(Boolean);

  // Common patterns worth pulling out explicitly.
  const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [
      /failed to fetch oauth token/i,
      () =>
        "Base image not accessible. Check the FROM line references a public image.",
    ],
    [
      /pull access denied|repository does not exist/i,
      () =>
        "The base image in FROM doesn't exist or isn't public. Pin it by digest and use an approved registry.",
    ],
    [
      /network is unreachable|connection refused|no route to host|dns resolution failed|could not resolve/i,
      () =>
        "Build tried to use the network (apt-get, npm install, curl, etc.). Flareo builds are network-isolated by default. See docs/submitting-dockerfiles for the multi-stage pattern.",
    ],
    [
      /no space left on device/i,
      () =>
        "Build exceeded the 20 GB layer ceiling. Use a slimmer base image or multi-stage build.",
    ],
    [
      /dockerfile parse error|unknown instruction/i,
      () => "Dockerfile has a syntax error.",
    ],
  ];

  for (const [pat, fmt] of patterns) {
    const m = stderr.match(pat);
    if (m) return fmt(m);
  }

  return lines.slice(-1)[0] ?? "Build failed without a usable error message.";
}

/**
 * Clean up the per-submission build directory. Called regardless of
 * success so we don't leak disk across submissions.
 */
export async function cleanupBuildDir(
  buildRoot: string,
  submissionId: string
): Promise<void> {
  const workDir = join(buildRoot, submissionId);
  await rm(workDir, { recursive: true, force: true });
}

/**
 * Remove the local image after push. Otherwise the build host fills
 * up over time with layers we'll never look at again.
 */
export async function removeLocalImage(imageTag: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const child = spawn("docker", ["rmi", "-f", imageTag], {
      stdio: "ignore",
    });
    child.on("close", () => resolve());
    child.on("error", () => resolve()); // non-critical
  });
}
