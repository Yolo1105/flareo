import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { slugSchema, apiError } from "@/lib/validation/schemas";
import { checkLimit, keyForRequest, rateLimitHeaders } from "@/lib/ratelimit";
import { auth } from "@/lib/auth/config";
import { getUserPlan } from "@/lib/billing/quota";

interface Ctx {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/v1/modules/[slug]
 *
 * Returns the full detail for one module, including the Rekor log
 * index, signer identity, issuer, and URLs to the SBOM and scan
 * artifacts in R2.
 */
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  const key = keyForRequest(userId, req.headers);
  const plan = userId ? await getUserPlan(userId) : "free";
  const limit = await checkLimit("modules-list", key, plan);
  const headers = rateLimitHeaders(limit);

  if (!limit.success) {
    return NextResponse.json(apiError("rate_limited", "too many requests"), {
      status: 429,
      headers,
    });
  }

  const { slug: slugParam } = await ctx.params;
  const parsed = slugSchema.safeParse(slugParam);
  if (!parsed.success) {
    return NextResponse.json(apiError("bad_slug", "invalid slug"), {
      status: 400,
      headers,
    });
  }

  const m = (await prisma.module.findUnique({
    where: { slug: parsed.data },
  })) as Record<string, unknown> | null;

  // Access control:
  //   - public modules: anyone (including anonymous)
  //   - private modules: the owner (publisherId) or an admin
  // Returning 404 for the "not allowed to see" case is intentional —
  // don't leak the existence of private modules to non-owners via a
  // 403. Same shape of response as "truly doesn't exist."
  if (!m) {
    return NextResponse.json(apiError("not_found", "module not found"), {
      status: 404,
      headers,
    });
  }
  if (m.visibility !== "public") {
    const isOwner =
      session?.user?.id != null && session.user.id === m.publisherId;
    const isAdmin = session?.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(apiError("not_found", "module not found"), {
        status: 404,
        headers,
      });
    }
  }

  return NextResponse.json(
    {
      slug: m.slug,
      name: m.name,
      version: m.version,
      author: m.author,
      description: m.description,
      tags: m.tags,
      category: m.category,
      status: m.status,
      slsa: m.slsa,
      trust: m.trust,
      trustBreakdown: {
        vulns: m.trustVulns,
        slsa: m.trustSlsa,
        signature: m.trustSignature,
        sbom: m.trustSbom,
      },
      cves: {
        critical: m.cveCritical,
        high: m.cveHigh,
        medium: m.cveMedium,
        low: m.cveLow,
      },
      deploys: m.deploys,
      size: m.size,
      digest: m.digest,
      imageRef: m.imageRef ?? null,
      upstreamRef: m.upstreamRef ?? null,
      upstreamDigest: m.upstreamDigest ?? null,
      sbomUrl: m.sbomUrl ?? null,
      scanUrl: m.trivyUrl ?? null,
      rekorIndex: m.rekorIndex ?? null,
      rekorUrl: m.rekorIndex
        ? `https://search.sigstore.dev/?logIndex=${m.rekorIndex}`
        : null,
      signerIdentity: m.signerIdentity ?? null,
      signerIssuer: m.signerIssuer ?? null,
      lastRebuiltAt: m.lastRebuiltAt ?? null,
      previewable: m.previewable,
      visibility: m.visibility,
    },
    { status: 200, headers }
  );
}
