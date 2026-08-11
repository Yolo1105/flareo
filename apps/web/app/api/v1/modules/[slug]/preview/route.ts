/**
 * SPECULATIVE — see decisions.md G-1.
 *
 * POST /api/v1/modules/[slug]/preview
 *
 * Allocate a per-user preview instance for the given module. Auth-
 * required. One ready instance per (user, module) — a second
 * allocation request returns the existing instance.
 *
 * The current allocator is a stub that returns mock URLs. F2 swaps
 * the real substrate in.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { allocator } from "@/lib/preview/allocator";
import { apiError } from "@/lib/validation/schemas";
import { requireFeature } from "@/lib/speculative/flags";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export const runtime = "nodejs";

export async function POST(_req: NextRequest, ctx: Ctx) {
  // Speculative-feature gate. When FLAREO_FEATURE_PREVIEWS_PER_USER
  // is unset (default), this endpoint returns 404 — looks like the
  // feature doesn't exist. Flip the env var on once F0 data supports
  // building F1 per decisions.md G-1.
  if (!requireFeature("previewsPerUser")) {
    return NextResponse.json(
      apiError("not_found", "endpoint not found"),
      { status: 404 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in to launch a preview"),
      { status: 401 },
    );
  }
  const userId = session.user.id;
  const { slug } = await ctx.params;

  // Look up the module — allocator needs digest + previewable flag.
  const mod = (await prisma.module.findUnique({
    where: { slug } as never,
    select: {
      slug: true,
      digest: true,
      previewable: true,
      status: true,
    } as never,
  })) as {
    slug: string;
    digest: string;
    previewable: boolean;
    status: string;
  } | null;

  if (!mod) {
    return NextResponse.json(apiError("not_found", "module not found"), {
      status: 404,
    });
  }
  if (!mod.previewable) {
    return NextResponse.json(
      apiError(
        "not_previewable",
        "this module isn't available for per-user previews",
      ),
      { status: 400 },
    );
  }
  if (mod.status !== "verified") {
    return NextResponse.json(
      apiError(
        "not_verified",
        "module isn't in verified state; refusing preview",
      ),
      { status: 400 },
    );
  }

  // Check for an existing ready instance.
  const existing = (await prisma.previewInstance.findUnique({
    where: {
      userId_moduleSlug_status: {
        userId,
        moduleSlug: slug,
        status: "ready",
      },
    } as never,
  })) as { id: string; subdomain: string | null; expiresAt: Date } | null;
  if (existing && existing.expiresAt > new Date()) {
    return NextResponse.json({
      id: existing.id,
      status: "ready",
      url: existing.subdomain
        ? `https://${existing.subdomain}`
        : null,
      expiresAt: existing.expiresAt.toISOString(),
    });
  }

  // Create the row in `allocating` state, call the allocator,
  // update the row with the result. Ordering matters: row first
  // means the user's quota is reserved before we call out.
  const placeholder = (await prisma.previewInstance.create({
    data: {
      userId,
      moduleSlug: slug,
      status: "allocating",
      // Default 1-hour TTL. Configurable per-call later if needed.
      expiresAt: new Date(Date.now() + 3600 * 1000),
    } as never,
  })) as { id: string };

  const result = await allocator.allocate({
    userId,
    moduleSlug: slug,
    digest: mod.digest,
    containerPort: 8080, // TODO derive from module compose template
  });

  if (!result.ok) {
    await prisma.previewInstance.update({
      where: { id: placeholder.id } as never,
      data: {
        status: "failed",
        errorMessage: `${result.reason}: ${result.message}`,
      } as never,
    });
    return NextResponse.json(
      apiError("allocation_failed", result.message),
      { status: 502 },
    );
  }

  const updated = (await prisma.previewInstance.update({
    where: { id: placeholder.id } as never,
    data: {
      status: "ready",
      hostId: result.allocation.hostId,
      subdomain: result.allocation.subdomain,
      expiresAt: new Date(Date.now() + result.allocation.ttlSeconds * 1000),
    } as never,
  })) as { id: string; subdomain: string; expiresAt: Date };

  return NextResponse.json({
    id: updated.id,
    status: "ready",
    url: `https://${updated.subdomain}`,
    expiresAt: updated.expiresAt.toISOString(),
  });
}
