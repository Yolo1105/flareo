/**
 * ECR Public push and cosign signature.
 *
 * The push gives us the final sha256 digest; the signature is
 * keyless (GitHub Actions OIDC identity) and lands on the Rekor
 * public transparency log.
 *
 * We deliberately don't use cosign's long-lived key mode because
 * keeping a private key on a build host that runs user Dockerfiles
 * is an obvious footgun. Keyless means the worker signs as itself
 * via short-lived OIDC tokens — compromise of the build host doesn't
 * leak a signing identity.
 */

import { spawn } from "node:child_process";

export interface PushResult {
  imageRef: string; // e.g. "public.ecr.aws/flareo/my-app"
  digest: string;   // "sha256:..."
  size: string;     // Human-readable, e.g. "62 MB"
}

/**
 * Push a local image to ECR Public. Requires that AWS creds are
 * already available in the environment and that `aws ecr-public
 * get-login-password` has been run recently enough that the Docker
 * daemon has valid credentials.
 */
export async function pushToEcr(
  imageTag: string,
  slug: string,
  version: string,
  ecrRepositoryPrefix: string
): Promise<PushResult> {
  const imageRef = `${ecrRepositoryPrefix}${slug}`;
  const versionTag = `${imageRef}:${version}`;
  const latestTag = `${imageRef}:latest`;

  // Re-tag the local image with both the version and :latest.
  await runChecked("docker", ["tag", imageTag, versionTag]);
  await runChecked("docker", ["tag", imageTag, latestTag]);

  // Push both tags.
  await runChecked("docker", ["push", versionTag]);
  await runChecked("docker", ["push", latestTag]);

  // Resolve the digest. `docker inspect` after push gives the remote
  // digest under RepoDigests.
  const inspect = await runCapture("docker", [
    "inspect",
    "--format={{json .RepoDigests}}",
    versionTag,
  ]);
  const repoDigests = JSON.parse(inspect.trim()) as string[];
  const match = repoDigests
    .map((d) => d.split("@")[1])
    .find((d) => d?.startsWith("sha256:"));

  if (!match) {
    throw new Error("push succeeded but couldn't extract sha256 digest");
  }

  // Image size, best-effort.
  let size = "unknown";
  try {
    const sizeOut = await runCapture("docker", [
      "inspect",
      "--format={{.Size}}",
      imageTag,
    ]);
    const bytes = Number(sizeOut.trim());
    if (Number.isFinite(bytes) && bytes > 0) {
      size = formatBytes(bytes);
    }
  } catch {
    // Non-critical.
  }

  return { imageRef, digest: match, size };
}

export interface SignResult {
  rekorIndex: string;
  signerIdentity: string;
  signerIssuer: string;
}

/**
 * Sign the pushed image with cosign (keyless).
 */
export async function signImage(
  imageRef: string,
  digest: string
): Promise<SignResult> {
  const target = `${imageRef}@${digest}`;

  // `cosign sign` with --yes skips the interactive confirmation and
  // --tlog-upload forces Rekor logging (it's the default but we're
  // explicit because the transparency log is the point).
  const out = await runCapture("cosign", [
    "sign",
    "--yes",
    "--tlog-upload=true",
    target,
  ]);

  // Cosign prints the Rekor entry URL to stderr, which runCapture
  // swallows. The simpler path is to immediately query the signature:
  const verifyOut = await runCapture("cosign", [
    "verify",
    "--certificate-identity-regexp=.*",
    "--certificate-oidc-issuer-regexp=.*",
    target,
  ]);
  void out;

  // Parse the first certificate identity + issuer from the verify
  // output. Format is JSON lines with { critical: {...}, optional: { Subject, Issuer, ... } }.
  let signerIdentity = "";
  let signerIssuer = "";
  let rekorIndex = "";

  const jsonMatches = verifyOut.match(/\{[\s\S]*\}/g) ?? [];
  for (const m of jsonMatches) {
    try {
      const parsed = JSON.parse(m) as {
        optional?: {
          Subject?: string;
          Issuer?: string;
          Bundle?: { Payload?: { logIndex?: number } };
        };
      };
      if (parsed.optional?.Subject) {
        signerIdentity = parsed.optional.Subject;
        signerIssuer = parsed.optional.Issuer ?? "";
        rekorIndex = String(parsed.optional.Bundle?.Payload?.logIndex ?? "");
        break;
      }
    } catch {
      continue;
    }
  }

  if (!signerIdentity) {
    throw new Error("cosign verify didn't return a signer identity");
  }

  return { rekorIndex, signerIdentity, signerIssuer };
}

// ─── helpers ─────────────────────────────────────────────────────────

function runChecked(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
    child.on("error", reject);
  });
}

function runCapture(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (c: Buffer) => out.push(c));
    child.stderr.on("data", (c: Buffer) => err.push(c));
    child.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(out).toString("utf8"));
      else
        reject(
          new Error(
            `${cmd} ${args.join(" ")} exited ${code}: ${Buffer.concat(err).toString("utf8").slice(0, 500)}`
          )
        );
    });
    child.on("error", reject);
  });
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}
