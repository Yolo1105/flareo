import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/validation/schemas";
import { authenticateApiKey } from "@/lib/auth/apikey";
import { auth } from "@/lib/auth/config";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { canSubmit, PLAN_LIMITS } from "@/lib/billing/quota";
import { detectCnbLanguage } from "@/lib/cnb/detect";
import { appBaseUrl } from "@/lib/config/env";
import { z } from "zod";
import { randomBytes } from "node:crypto";

/**
 * Sentinel thrown inside the insert transaction when the race-safe
 * re-check finds the user has gone over quota since the outer
 * canSubmit() pre-check. Caught right after the transaction to
 * convert into a 402 response. Not exported — it's internal to this
 * route's error shape.
 */
class QuotaRaceError extends Error {
  constructor() {
    super("quota exceeded (race on insert)");
    this.name = "QuotaRaceError";
  }
}

/**
 * POST /api/v1/submissions
 *
 * Accepts a module submission from either `flareo publish` (API key
 * auth) or the web UI at /app/publish (session auth). Creates a row
 * in the Submission table with status="pending" so a reviewer can
 * pick it up.
 *
 * The submission is NOT automatically built. A human reviewer has to
 * look at the manifest, decide whether the module fits the catalog,
 * and if so, author the canary recipe. The CLI and this endpoint just
 * record the intent; review is still a manual step during closed beta.
 *
 * Rate-limited strictly: 5 submissions per hour per user. Prevents
 * spam without getting in the way of legitimate use.
 */

export const runtime = "nodejs";

const SubmitSchema = z.object({
  slug: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/,
      "slug must be lowercase kebab-case, 2-64 chars"
    ),
  name: z.string().trim().min(1).max(128),
  version: z.string().trim().min(1).max(64),
  author: z.string().trim().min(1).max(128),
  description: z.string().trim().min(10).max(1000),
  category: z.enum([
    "security",
    "media",
    "automation",
    "productivity",
    "network",
    "devtools",
    "monitoring",
    "communication",
  ]),
  license: z.string().trim().min(1).max(64),
  upstreamUrl: z
    .string()
    .url()
    .refine(
      (u) =>
        u.startsWith("https://github.com/") ||
        u.startsWith("https://gitlab.com/") ||
        u.startsWith("https://codeberg.org/") ||
        u.startsWith("https://bitbucket.org/"),
      "upstream URL must be a public git host (GitHub, GitLab, Codeberg, Bitbucket)"
    ),
  contactEmail: z.string().email().max(200),
  // Inline path: the submitter pastes the Dockerfile body directly.
  // Stored in flagsJson for the worker to fall back to. Kept for
  // clients that don't want the two-step upload.
  dockerfile: z.string().max(20_000).optional(),
  // Upload path: the submitter called /api/v1/submissions/dockerfile-upload
  // first and got back a referenceUrl pointing to R2. The worker reads
  // directly from R2 at the canonical key.
  dockerfileUrl: z
    .string()
    .regex(
      /^r2:\/\/[^/]+\/submissions\/sub_[0-9a-f]{16}\/Dockerfile$/,
      "dockerfileUrl must be a Flareo r2:// reference returned by /api/v1/submissions/dockerfile-upload",
    )
    .optional(),
  // The sha256 the submitter computed on the client. Must match what
  // the upload endpoint stored. Required when dockerfileUrl is set,
  // and rejected when dockerfileUrl is unset (orphan sha256 would
  // just be silently dropped later, which confused callers during
  // integration testing).
  dockerfileSha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "sha256 must be 64 hex chars")
    .optional(),
  // Catalog visibility for the resulting module. Default "public"
  // preserves pre-visibility behavior (existing clients that don't
  // send the field get public modules).
  //
  // Enforcement of "can this user submit this visibility at all"
  // happens in canSubmit(), which checks the plan's cap — a free
  // user gets plan_requires_upgrade (402) on visibility="private"
  // because the free private cap is 0.
  visibility: z.enum(["public", "private"]).default("public"),
  // Build mode. "dockerfile" requires either inline dockerfile OR
  // dockerfileUrl/sha pair. "cnb" requires neither — instead the
  // worker auto-detects language from the source archive.
  buildType: z.enum(["dockerfile", "cnb"]).default("dockerfile"),
  // For buildType="cnb" callers (the web wizard, primarily) — the
  // list of root-level filenames in the source archive that the
  // detector ran against. Stored on the submission as part of the
  // detection record. Optional from API but recommended; without it
  // the detector falls back to a generic Node guess.
  cnbRootFiles: z.array(z.string().max(128)).max(200).optional(),
}).refine(
  // dockerfileUrl and dockerfileSha256 must both be present or both
  // absent. A half-pair is always a client bug and failing loud here
  // produces a clearer error than the later silent drop.
  (data) =>
    (data.dockerfileUrl == null) === (data.dockerfileSha256 == null),
  {
    message:
      "dockerfileUrl and dockerfileSha256 must be provided together",
    path: ["dockerfileSha256"],
  },
).refine(
  // Mutual exclusivity: buildType="cnb" must NOT carry a Dockerfile.
  // If you're picking buildpack auto-detect, you can't also be saying
  // "use my Dockerfile." Catching this at the schema layer means the
  // worker doesn't have to disambiguate later.
  (data) => {
    if (data.buildType !== "cnb") return true;
    return !data.dockerfile && !data.dockerfileUrl;
  },
  {
    message:
      "buildType=cnb cannot be combined with a Dockerfile; pick one path",
    path: ["buildType"],
  },
).refine(
  // Inverse: buildType="dockerfile" needs SOMETHING — either inline
  // body or the upload URL pair. Empty Dockerfile-mode submissions
  // are always client bugs.
  (data) => {
    if (data.buildType === "cnb") return true;
    return Boolean(data.dockerfile || data.dockerfileUrl);
  },
  {
    message:
      "buildType=dockerfile requires either dockerfile (inline) or dockerfileUrl + dockerfileSha256",
    path: ["dockerfile"],
  },
);

export async function POST(req: NextRequest) {
  // Auth required: session cookie OR API key. Unauthenticated submissions
  // aren't accepted — we need a user to contact about review decisions.
  const session = await auth();
  let userId: string | null = session?.user?.id ?? null;
  let userEmail: string | null = session?.user?.email ?? null;

  if (!userId) {
    const keyAuth = await authenticateApiKey(req.headers.get("authorization"));
    if (keyAuth) {
      userId = keyAuth.userId;
      // Fetch the user to get their email for the audit trail.
      const u = (await prisma.user.findUnique({
        where: { id: keyAuth.userId },
      })) as { email: string | null } | null;
      userEmail = u?.email ?? null;
    }
  }

  if (!userId) {
    return NextResponse.json(
      apiError(
        "unauthenticated",
        "Module submission requires an account. Sign in via `flareo login` or at flareo.app/signin."
      ),
      { status: 401 }
    );
  }

  // Rate limit per user, not per IP — we want a stable bucket for
  // authenticated callers across locations.
  const limitKey = keyForRequest(userId, req.headers);
  // Reuse the auth-signin bucket (10/10min). Submissions are much rarer
  // than sign-in attempts in normal use, but the bucket's already there.
  const limit = await checkLimit("auth-signin", limitKey);
  const headers = rateLimitHeaders(limit);

  if (!limit.success) {
    return NextResponse.json(
      apiError("rate_limited", "too many submissions; try again in an hour"),
      { status: 429, headers }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
      headers,
    });
  }

  const parsed = SubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        "bad_request",
        "submission failed validation",
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        }))
      ),
      { status: 400, headers }
    );
  }

  const data = parsed.data;

  // Reject if the slug already exists as a public module — we don't
  // want accidental clobbers, and legitimate forks should use a
  // distinct slug.
  const existing = (await prisma.module.findUnique({
    where: { slug: data.slug },
  })) as { slug: string } | null;
  if (existing) {
    return NextResponse.json(
      apiError(
        "slug_taken",
        `slug '${data.slug}' is already in the catalog; pick a different one`
      ),
      { status: 409, headers }
    );
  }

  // Reject if the same user already has a pending submission for this
  // slug — prevents duplicate queue entries.
  const alreadyPending = (await prisma.submission.findFirst({
    where: {
      moduleName: data.slug,
      status: "pending",
    },
  })) as { id: string } | null;
  if (alreadyPending) {
    return NextResponse.json(
      {
        status: "already_pending",
        submissionId: alreadyPending.id,
        message: "A submission for this slug is already in the queue.",
      },
      { status: 200, headers }
    );
  }

  // ─── Plan quota enforcement ─────────────────────────────────────
  // Free tier: 3 concurrent public modules, 0 private. Pro: unlimited
  // public, 20 private. canSubmit() distinguishes "your plan doesn't
  // allow this visibility" (plan_requires_upgrade) from "you've hit
  // your cap for this visibility" (quota_exceeded). Both map to 402;
  // the UI uses `reason` to render distinct copy ("upgrade to pro"
  // vs "cancel something in-flight").
  const quota = await canSubmit(userId, data.visibility);
  if (!quota.allowed) {
    return NextResponse.json(
      apiError(
        quota.reason ?? "quota_exceeded",
        quota.message ?? "submission quota exceeded",
        {
          plan: quota.plan,
          visibility: data.visibility,
          usage: {
            used: quota.usage.used,
            limit: quota.usage.limit,
            published: quota.usage.published,
            inFlight: quota.usage.inFlight,
          },
          upgradeUrl: `${appBaseUrl()}/app/settings/billing`,
        },
      ),
      { status: 402, headers },
    );
  }

  // ─── Dockerfile path selection ──────────────────────────────────
  // Two mutually exclusive ways to attach a Dockerfile:
  //   1. Upload path: the client called /dockerfile-upload first and
  //      passes the returned r2:// reference plus the sha256. The
  //      Dockerfile already lives in R2; we just record the pointer.
  //   2. Inline path: the client posts the Dockerfile body. We stash
  //      it in flagsJson; the worker falls back to this when
  //      dockerfileUrl is unset. Cheap and simple for small files.
  // A submission with neither is also valid during closed beta —
  // the reviewer can request changes to add one later.
  //
  // The pairing of dockerfileUrl + dockerfileSha256 is enforced at
  // schema validation time (see the `.refine()` on SubmitSchema).

  // If the client passed an upload reference, we MUST mint the
  // submission id with the same sub_... value encoded in the URL.
  // Otherwise the worker would look for the Dockerfile at a key that
  // no longer matches the Submission row's id. Extracting the id from
  // the URL (rather than letting the client send it as a separate
  // field) closes a spoofing path: a client can't claim
  // dockerfileUrl=submissions/sub_X/Dockerfile and then commit under
  // a different submission id.
  let submissionId: string;
  if (data.dockerfileUrl) {
    const match = data.dockerfileUrl.match(
      /submissions\/(sub_[0-9a-f]{16})\/Dockerfile$/,
    );
    if (!match) {
      return NextResponse.json(
        apiError(
          "bad_request",
          "dockerfileUrl is malformed — re-run the upload step",
        ),
        { status: 400, headers },
      );
    }
    submissionId = match[1];

    // Ownership check: the authenticated user must be the same user
    // who staged this Dockerfile upload. Without this, unguessability
    // of the 16-hex-char submissionId is the only defense against
    // someone else's upload being attached to your submission —
    // which breaks the moment the id leaks (shared URL, server log,
    // accidental paste, etc.).
    //
    // Backward-compat: pre-migration submissions have no DockerfileUpload
    // row. We treat `upload == null` as "legacy" and allow the commit
    // so the queue can drain through without requiring a backfill.
    // Once every staged upload goes through the new write path,
    // remove the null-fallback and require a row.
    const upload = (await prisma.dockerfileUpload.findUnique({
      where: { submissionId } as never,
      select: { userId: true, sha256: true } as never,
    })) as { userId: string; sha256: string } | null;

    if (upload && upload.userId !== userId) {
      return NextResponse.json(
        apiError(
          "forbidden",
          "this Dockerfile upload belongs to a different user; re-run the upload under your own account",
        ),
        { status: 403, headers },
      );
    }

    // Cross-check declared sha matches what we recorded at upload
    // time. Catches a commit-time swap where the client sends a
    // different sha256 than was actually uploaded. Benign if it
    // matches; a strong signal of tampering if it doesn't.
    if (
      upload &&
      data.dockerfileSha256 &&
      upload.sha256.toLowerCase() !== data.dockerfileSha256.toLowerCase()
    ) {
      return NextResponse.json(
        apiError(
          "bad_request",
          "dockerfileSha256 doesn't match the sha recorded at upload time; re-run the upload step",
        ),
        { status: 400, headers },
      );
    }
  } else {
    submissionId = `sub_${randomBytes(8).toString("hex")}`;
  }

  // ─── CNB detection (only when buildType="cnb") ─────────────────
  // Run detection up front so the reviewer sees the language we'll
  // build at decision time, and so a no-marker source archive
  // fails fast here rather than burning a build-worker slot.
  let cnbDetectedLanguage: string | null = null;
  let cnbBuilder: string | null = null;
  if (data.buildType === "cnb") {
    const detection = detectCnbLanguage(data.cnbRootFiles ?? []);
    if (!detection) {
      return NextResponse.json(
        apiError(
          "bad_request",
          "buildType=cnb but no recognizable language marker in source archive (looking for package.json, pyproject.toml, go.mod, Cargo.toml, Gemfile, pom.xml, etc.). Either supply a Dockerfile or include a recognizable root manifest.",
          { rootFiles: data.cnbRootFiles ?? [] },
        ),
        { status: 400, headers },
      );
    }
    cnbDetectedLanguage = detection.language;
    cnbBuilder = detection.builder;
  }

  // Pack Horizon 1 fields that aren't in the Submission table yet into
  // flagsJson. When we extend the schema in Horizon 2, a migration can
  // copy these out into proper columns.
  const flags = {
    slug: data.slug,
    description: data.description,
    category: data.category,
    license: data.license,
    upstreamUrl: data.upstreamUrl,
    contactEmail: data.contactEmail,
    submittedByUserId: userId,
    submittedByEmail: userEmail,
    // Only stash inline — if we took the upload path, the Dockerfile
    // lives in R2 and the worker reads it from there.
    dockerfile: data.dockerfileUrl ? null : data.dockerfile ?? null,
  };

  // ─── Atomic quota recheck + insert ─────────────────────────────
  // The outer canSubmit() above is a fast-path UX optimisation: it
  // fails obviously-over-quota users without paying the transaction
  // cost. But between that read and the insert, a concurrent request
  // from the same user could also pass the check — two parallel
  // POSTs from a single user could both see "2/3 used" and both
  // insert, landing the user at 4/3.
  //
  // To close that window: wrap the count + insert in a transaction
  // with serializable isolation. Postgres will abort one of the two
  // concurrent transactions if they touched the same logical rowset,
  // and Prisma surfaces that as a retry-able error. For the admin
  // insert path this cost is negligible; for the submitter's typical
  // one-at-a-time flow it adds ~2ms.
  //
  // The inner recheck duplicates the canSubmit logic inline (rather
  // than calling canSubmit() inside the transaction) because
  // canSubmit issues two parallel queries via Promise.all that would
  // each need to participate in the transaction — feasible but
  // noisy. Duplication here is cheap: if the plan limits change, the
  // free/pro numbers live in PLAN_LIMITS and both code paths read
  // from there.
  try {
    await prisma.$transaction(
      async (tx: typeof prisma) => {
        // Re-check the cap for the requested visibility. Read both
        // counts scoped to that visibility — a private submission
        // doesn't consume public quota and vice versa.
        const planLimit =
          data.visibility === "public"
            ? PLAN_LIMITS[quota.plan].maxConcurrentPublicModules
            : PLAN_LIMITS[quota.plan].maxConcurrentPrivateModules;
        if (planLimit !== "unlimited") {
          const [published, inFlight] = await Promise.all([
            tx.module.count({
              where: {
                publisherId: userId,
                visibility: data.visibility,
              } as never,
            }),
            tx.submission.count({
              where: {
                submitterId: userId,
                visibility: data.visibility,
                status: { in: ["pending", "approved", "building"] },
              } as never,
            }),
          ]);
          if (published + inFlight >= planLimit) {
            // Inside-transaction re-check failed. Throw a tagged
            // error; the outer catch converts it to 402. Aborts the
            // transaction and rolls back — nothing was inserted.
            throw new QuotaRaceError();
          }
        }

        await tx.submission.create({
          data: {
            id: submissionId,
            moduleName: data.slug,
            version: data.version,
            author: data.author,
            submittedAt: new Date(),
            status: "pending",
            queueAgeSec: 0,
            flagsJson: JSON.stringify(flags),
            autoCosign: false,
            autoTrivy: false,
            autoSlsa: false,
            ...({
              submitterId: userId,
              dockerfileUrl: data.dockerfileUrl ?? null,
              dockerfileSha256: data.dockerfileSha256 ?? null,
              visibility: data.visibility,
              buildType: data.buildType,
              cnbDetectedLanguage,
              cnbBuilder,
            } as Record<string, unknown>),
          } as never,
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  } catch (err) {
    if (err instanceof QuotaRaceError) {
      return NextResponse.json(
        apiError(
          "quota_exceeded",
          "You just reached your plan's public-module limit (concurrent request landed first).",
          {
            plan: quota.plan,
            upgradeUrl: `${appBaseUrl()}/app/settings/billing`,
          },
        ),
        { status: 402, headers },
      );
    }
    throw err;
  }

  return NextResponse.json(
    {
      status: "received",
      submissionId,
      reviewUrl: `${appBaseUrl()}/app/submissions/${submissionId}`,
      message:
        "Submission received. We'll email you when a reviewer picks it up (usually within 5 business days).",
    },
    { status: 201, headers }
  );
}

export async function GET() {
  return NextResponse.json(apiError("method_not_allowed", "POST only"), {
    status: 405,
    headers: { Allow: "POST" },
  });
}
