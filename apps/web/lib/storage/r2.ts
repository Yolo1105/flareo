/**
 * Cloudflare R2 access for the main app.
 *
 * Scope is intentionally narrow: the main app ONLY writes user-submitted
 * Dockerfiles to the submissions bucket. Reads (by the build worker)
 * and artifact writes (SBOMs, Trivy reports, build logs) live in
 * flareo-worker/ and in scripts/canary/.
 *
 * If we ever need to read a Dockerfile back from the main app (e.g. to
 * re-render it in the admin detail page instead of letting the admin
 * page fetch R2 directly), add a `fetchDockerfile()` here at that time
 * — don't preemptively widen the surface.
 *
 * R2 exposes an S3-compatible API, so we use the AWS S3 SDK and point
 * it at R2's endpoint.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_SUBMISSIONS  (defaults to "flareo-submissions")
 *
 * When any of the first three are unset, helpers throw with a clear
 * message rather than silently no-op'ing. This surfaces config
 * problems in dev before a real user hits them.
 */

import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";

// ─── client construction ────────────────────────────────────────────

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new R2ConfigError(
      "R2 credentials missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and " +
        "R2_SECRET_ACCESS_KEY. See .env.example.",
    );
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

/**
 * Server-side config problem: R2 credentials are not available.
 * Distinct from a client-side bug so the API layer can map this to
 * 503 instead of 400.
 */
export class R2ConfigError extends Error {
  readonly kind = "r2_config" as const;
  constructor(message: string) {
    super(message);
    this.name = "R2ConfigError";
  }
}

/**
 * Client-side bug: the Dockerfile body doesn't match the client-
 * declared SHA-256. Either client-side hashing broke or an attacker
 * is fuzzing the endpoint. 400 in the API layer.
 */
export class DockerfileChecksumMismatch extends Error {
  readonly kind = "checksum_mismatch" as const;
  constructor(message: string) {
    super(message);
    this.name = "DockerfileChecksumMismatch";
  }
}

/**
 * Name of the submissions bucket. Separate from the artifacts bucket
 * (R2_BUCKET_NAME) so submitter-uploaded content lives on a different
 * key namespace than pipeline outputs.
 */
export function getSubmissionsBucket(): string {
  return process.env.R2_BUCKET_SUBMISSIONS ?? "flareo-submissions";
}

// ─── operations ─────────────────────────────────────────────────────

/**
 * Canonical key for a submission's Dockerfile. The build worker reads
 * from this exact path (see flareo-worker/src/r2.ts::fetchDockerfile).
 * Changing this key format requires a matching worker change.
 */
export function dockerfileKey(submissionId: string): string {
  return `submissions/${submissionId}/Dockerfile`;
}

/**
 * Reference URL used in the `Submission.dockerfileUrl` column. The
 * `r2://` scheme is non-standard but unambiguous — we never resolve
 * it as a URL, only parse it back out to `{ bucket, key }` in the
 * worker.
 */
export function buildDockerfileReferenceUrl(submissionId: string): string {
  return `r2://${getSubmissionsBucket()}/${dockerfileKey(submissionId)}`;
}

/**
 * Upload a Dockerfile on behalf of the submitter. Verifies the declared
 * SHA-256 matches the actual content before writing — this both
 * protects against tamper-in-transit and lets us store the hash on the
 * Submission row for the reviewer to corroborate against what they see.
 *
 * Returns the reference URL the caller should attach to the subsequent
 * /api/v1/submissions POST.
 *
 * Throws on:
 *   - sha256 mismatch
 *   - content >= 100 KB (extra safety over the 20 KB Zod ceiling —
 *     we don't want a middleware bug to let giant files through)
 *   - R2 errors (propagates the underlying AWS SDK error)
 */
export async function uploadDockerfile(args: {
  submissionId: string;
  content: string;
  declaredSha256: string;
}): Promise<{ referenceUrl: string; verifiedSha256: string }> {
  const { submissionId, content, declaredSha256 } = args;

  // Defense-in-depth upper bound matching the Zod schema at the
  // endpoint. Kept as a constant here so a future bump (say, to
  // accommodate a larger multi-stage Dockerfile) only needs to
  // change this file and the schema atomically.
  const byteLength = Buffer.byteLength(content, "utf8");
  const MAX_DOCKERFILE_BYTES = 20_000;
  if (byteLength > MAX_DOCKERFILE_BYTES) {
    throw new Error(
      `Dockerfile too large: ${byteLength} bytes (limit ${MAX_DOCKERFILE_BYTES}).`,
    );
  }

  // Verify the hash matches. Mismatch means either a bug in the
  // client-side hashing or tampering in transit; either way, refuse.
  const actual = createHash("sha256").update(content, "utf8").digest("hex");
  if (actual !== declaredSha256.toLowerCase()) {
    throw new DockerfileChecksumMismatch(
      "Dockerfile SHA-256 mismatch between client-declared and server-computed.",
    );
  }

  const key = dockerfileKey(submissionId);
  const input: PutObjectCommandInput = {
    Bucket: getSubmissionsBucket(),
    Key: key,
    Body: content,
    ContentType: "text/plain; charset=utf-8",
    // Custom metadata rides along with the object. Useful for audit.
    Metadata: {
      "flareo-submission-id": submissionId,
      "flareo-sha256": actual,
    },
  };

  await getClient().send(new PutObjectCommand(input));

  return {
    referenceUrl: buildDockerfileReferenceUrl(submissionId),
    verifiedSha256: actual,
  };
}

/**
 * Parse a reference URL back out to its components. Used by the
 * submission-commit endpoint to verify the key pattern matches the
 * expected submissions/<id>/Dockerfile shape.
 */
export function parseDockerfileReferenceUrl(
  url: string,
): { bucket: string; key: string } | null {
  const match = url.match(/^r2:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], key: match[2] };
}
