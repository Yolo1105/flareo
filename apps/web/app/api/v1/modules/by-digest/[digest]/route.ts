import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { digestSchema, apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { auth } from "@/lib/auth/config";

interface Ctx {
  params: Promise<{ digest: string }>;
}

/**
 * GET /api/v1/modules/by-digest/[digest]
 *
 * Reverse lookup: given a sha256:<hex> digest, return the matching
 * Flareo module if any. Used by `flareo verify <image>` on the CLI to
 * enrich verification output with catalog metadata when the image is
 * one of ours.
 *
 * Returns 200 with the module summary if found, 404 if not. The CLI
 * gracefully handles 404 by just showing Sigstore-only info.
 */
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const key = keyForRequest(session?.user?.id, req.headers);
  const limit = await checkLimit("modules-list", key);
  const headers = rateLimitHeaders(limit);

  if (!limit.success) {
    return NextResponse.json(apiError("rate_limited", "too many requests"), {
      status: 429,
      headers,
    });
  }

  const { digest: digestParam } = await ctx.params;
  // URL-decode and normalize. CLI callers typically send the colon as %3A.
  const normalized = decodeURIComponent(digestParam).toLowerCase();
  const parsed = digestSchema.safeParse(normalized);
  if (!parsed.success) {
    return NextResponse.json(apiError("bad_digest", "digest must be sha256:<hex>"), {
      status: 400,
      headers,
    });
  }

  const m = (await prisma.module.findFirst({
    where: { digest: parsed.data },
  })) as Record<string, unknown> | null;

  if (!m) {
    return NextResponse.json(apiError("not_found", "digest not in catalog"), {
      status: 404,
      headers,
    });
  }

  return NextResponse.json(
    {
      slug: m.slug,
      name: m.name,
      version: m.version,
      author: m.author,
      digest: m.digest,
      imageRef: m.imageRef ?? null,
      trust: m.trust,
      cves: {
        critical: m.cveCritical,
        high: m.cveHigh,
        medium: m.cveMedium,
        low: m.cveLow,
      },
      rekorIndex: m.rekorIndex ?? null,
      signerIdentity: m.signerIdentity ?? null,
      signerIssuer: m.signerIssuer ?? null,
      sbomUrl: m.sbomUrl ?? null,
      scanUrl: m.trivyUrl ?? null,
    },
    { status: 200, headers }
  );
}
