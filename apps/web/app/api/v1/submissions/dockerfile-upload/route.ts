import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth/config";
import { authenticateApiKey } from "@/lib/auth/apikey";
import { apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { uploadDockerfile, R2ConfigError, DockerfileChecksumMismatch } from "@/lib/storage/r2";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/v1/submissions/dockerfile-upload
 *
 * One-shot Dockerfile upload. Client sends the Dockerfile body inline
 * (capped at 20 KB, matching the main submission schema ceiling), and
 * the server writes it to R2 under the canonical key
 *   submissions/<submissionId>/Dockerfile
 * then returns { submissionId, referenceUrl }. The referenceUrl is
 * what the caller attaches to the subsequent POST /api/v1/submissions
 * as the `dockerfileUrl` field.
 *
 * We take the simpler server-side-PUT route rather than presigned PUT
 * because:
 *   - 20 KB fits well under Vercel's 4.5 MB body limit
 *   - one round-trip instead of three (prepare + PUT + commit)
 *   - no presigner dependency, no CORS config needed on R2
 *   - the server can verify the declared SHA-256 against actual
 *     content before storing, which a presigned flow can't do without
 *     a HEAD pass afterward
 *
 * When a 100 KB or 500 KB ceiling becomes interesting later (e.g. to
 * accept small supplementary build-context tarballs alongside the
 * Dockerfile), we'd switch to presigned at that point. Not yet.
 *
 * Authentication: session cookie OR API key, same as
 * /api/v1/submissions. Anonymous upload isn't allowed — we need the
 * userId to rate-limit per-user and to audit the upload.
 *
 * Idempotency: pass the same `submissionId` to overwrite the same
 * Dockerfile (e.g. the user amends and re-uploads before committing
 * the submission). Omit it to mint a fresh id.
 */

export const runtime = "nodejs";

const UploadSchema = z.object({
  // The Dockerfile content itself. 20 KB matches the /api/v1/submissions
  // inline schema and the real-world size of almost every Dockerfile
  // that doesn't have a bug.
  dockerfile: z
    .string()
    .min(1, "dockerfile is empty")
    .max(20_000, "dockerfile exceeds 20 KB limit"),
  // Declared SHA-256, hex. Server re-verifies before storing.
  sha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "sha256 must be 64 lowercase hex chars"),
  // Optional submission id. When set, overwrite that id's upload
  // (idempotent retry). When omitted, the server mints a fresh one.
  // The id format matches /api/v1/submissions so the downstream commit
  // can accept it as-is.
  submissionId: z
    .string()
    .regex(
      /^sub_[0-9a-f]{16}$/,
      "submissionId must match the pattern sub_<16 hex chars>",
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  // ─── auth ─────────────────────────────────────────────────────────
  const session = await auth();
  let userId: string | null = session?.user?.id ?? null;

  if (!userId) {
    const keyAuth = await authenticateApiKey(req.headers.get("authorization"));
    if (keyAuth) userId = keyAuth.userId;
  }

  if (!userId) {
    return NextResponse.json(
      apiError(
        "unauthenticated",
        "Dockerfile upload requires an account. Sign in via `flareo login` or at flareo.dev/signin.",
      ),
      { status: 401 },
    );
  }

  // ─── rate limit ───────────────────────────────────────────────────
  // Reuse the auth-signin bucket (10 requests / 10 minutes). A legitimate
  // submitter uploads 1-3 times for any given submission; an attacker
  // spamming uploads gets cut off fast.
  const limitKey = keyForRequest(userId, req.headers);
  const limit = await checkLimit("auth-signin", limitKey);
  const headers = rateLimitHeaders(limit);

  if (!limit.success) {
    return NextResponse.json(
      apiError(
        "rate_limited",
        "too many uploads; try again in a few minutes",
      ),
      { status: 429, headers },
    );
  }

  // ─── body validation ──────────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }

  const parsed = UploadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        "bad_request",
        "upload failed validation",
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      ),
      { status: 400, headers },
    );
  }

  const data = parsed.data;
  const submissionId =
    data.submissionId ?? `sub_${randomBytes(8).toString("hex")}`;

  // ─── upload ──────────────────────────────────────────────────────
  try {
    const result = await uploadDockerfile({
      submissionId,
      content: data.dockerfile,
      declaredSha256: data.sha256,
    });

    // Persist the ownership record. Written AFTER the R2 upload
    // succeeds so a failed R2 write doesn't leave a dangling DB row.
    // Uses upsert keyed on submissionId so a legitimate retry of the
    // same upload (same id, same content) is idempotent. A retry
    // with a DIFFERENT userId would overwrite — but that requires
    // guessing the submissionId, which is what the DockerfileUpload
    // table is designed to prevent from being exploitable at commit
    // time anyway.
    await prisma.dockerfileUpload.upsert({
      where: { submissionId } as never,
      create: {
        submissionId,
        userId,
        sha256: result.verifiedSha256,
        sizeBytes: Buffer.byteLength(data.dockerfile, "utf8"),
      } as never,
      update: {
        // Same-user re-upload of the same content lands here.
        sha256: result.verifiedSha256,
        sizeBytes: Buffer.byteLength(data.dockerfile, "utf8"),
      } as never,
    });

    return NextResponse.json(
      {
        status: "uploaded",
        submissionId,
        referenceUrl: result.referenceUrl,
        sha256: result.verifiedSha256,
        message:
          "Dockerfile staged. Pass referenceUrl as dockerfileUrl on POST /api/v1/submissions to commit.",
      },
      { status: 201, headers },
    );
  } catch (err) {
    // Typed-error classification: named classes thrown from r2.ts
    // distinguish client-bug (400) from server-config problem (503)
    // from generic upstream hiccup (502). String-matching on
    // err.message was brittle — any copy change to the message body
    // silently broke the status-code mapping.
    if (err instanceof DockerfileChecksumMismatch) {
      return NextResponse.json(
        apiError("bad_request", err.message),
        { status: 400, headers },
      );
    }
    if (err instanceof R2ConfigError) {
      return NextResponse.json(
        apiError(
          "misconfigured",
          "Dockerfile upload is temporarily unavailable (server-side config).",
        ),
        { status: 503, headers },
      );
    }
    return NextResponse.json(
      apiError(
        "upstream_error",
        "Couldn't store the Dockerfile. Please retry in a few seconds.",
      ),
      { status: 502, headers },
    );
  }
}

export async function GET() {
  return NextResponse.json(apiError("method_not_allowed", "POST only"), {
    status: 405,
    headers: { Allow: "POST" },
  });
}
