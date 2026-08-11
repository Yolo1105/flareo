/**
 * Environment validation. Crash on boot if required variables are
 * missing — a half-configured worker is worse than one that refuses
 * to start.
 */

interface Config {
  // Postgres — same DATABASE_URL the main app uses. The worker should
  // be pointed at prod (or a read-replica isn't enough — we write).
  databaseUrl: string;

  // R2 credentials for reading user Dockerfiles and writing build
  // logs + SBOMs. The worker needs S3-compatible GetObject on the
  // submissions/ prefix and PutObject on the logs/ and sboms/ prefixes.
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketSubmissions: string;
  r2BucketArtifacts: string;

  // AWS credentials for ECR Public push. Separate from R2 so each
  // service's blast radius is minimal.
  ecrRegion: string;
  ecrRepositoryPrefix: string; // e.g. "public.ecr.aws/flareo/"

  // How often to poll the DB for new approved submissions.
  pollIntervalMs: number;

  // Build timeout — if a build exceeds this, we SIGKILL it.
  buildTimeoutMs: number;

  // Where to stage builds on the host. Each build gets a fresh
  // subdirectory; the parent is cleaned on worker start.
  buildRoot: string;

  // Path to the Dockerfile-submission docs URL (goes into failure
  // emails so we don't hardcode it).
  docsUrl: string;

  // Optional: Sentry DSN for reporting worker crashes.
  sentryDsn: string | null;

  // How the worker identifies itself in audit logs / metrics.
  workerId: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var: ${name}. See README for the full list.`
    );
  }
  return v;
}

function envOrDefault(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export function loadConfig(): Config {
  return {
    databaseUrl: requireEnv("DATABASE_URL"),
    r2AccountId: requireEnv("R2_ACCOUNT_ID"),
    r2AccessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    r2SecretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    r2BucketSubmissions: envOrDefault("R2_BUCKET_SUBMISSIONS", "flareo-submissions"),
    r2BucketArtifacts: envOrDefault("R2_BUCKET_ARTIFACTS", "flareo-artifacts"),
    ecrRegion: envOrDefault("ECR_REGION", "us-east-1"),
    ecrRepositoryPrefix: envOrDefault(
      "ECR_REPOSITORY_PREFIX",
      "public.ecr.aws/flareo/"
    ),
    pollIntervalMs: Number(envOrDefault("POLL_INTERVAL_MS", "30000")),
    buildTimeoutMs: Number(envOrDefault("BUILD_TIMEOUT_MS", "600000")), // 10min
    buildRoot: envOrDefault("BUILD_ROOT", "/var/lib/flareo-worker/builds"),
    docsUrl: envOrDefault(
      "DOCS_URL",
      "https://flareo.app/docs/submitting-dockerfiles"
    ),
    sentryDsn: process.env.SENTRY_DSN ?? null,
    workerId: envOrDefault("WORKER_ID", `worker-${process.pid}`),
  };
}
