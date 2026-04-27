/**
 * SPECULATIVE — see decisions.md G-1.
 *
 * GET    /api/v1/preview/[id]  → status + URL (for polling)
 * DELETE /api/v1/preview/[id]  → tear down the instance early
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { allocator } from "@/lib/preview/allocator";
import { apiError } from "@/lib/validation/schemas";
import { requireFeature } from "@/lib/speculative/flags";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";

async function loadOwned(
  id: string,
  userId: string,
): Promise<
  | {
      id: string;
      userId: string;
      moduleSlug: string;
      status: string;
      hostId: string | null;
      subdomain: string | null;
      expiresAt: Date;
    }
  | null
> {
  const row = (await prisma.previewInstance.findUnique({
    where: { id } as never,
  })) as {
    id: string;
    userId: string;
    moduleSlug: string;
    status: string;
    hostId: string | null;
    subdomain: string | null;
    expiresAt: Date;
  } | null;
  if (!row) return null;
  if (row.userId !== userId) return null; // 404 not 403; don't leak existence
  return row;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!requireFeature("previewsPerUser")) {
    return NextResponse.json(
      apiError("not_found", "endpoint not found"),
      { status: 404 },
    );
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in to view your preview"),
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const row = await loadOwned(id, session.user.id);
  if (!row) {
    return NextResponse.json(
      apiError("not_found", "preview instance not found"),
      { status: 404 },
    );
  }
  return NextResponse.json({
    id: row.id,
    status: row.status,
    url: row.subdomain ? `https://${row.subdomain}` : null,
    expiresAt: row.expiresAt.toISOString(),
    moduleSlug: row.moduleSlug,
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!requireFeature("previewsPerUser")) {
    return NextResponse.json(
      apiError("not_found", "endpoint not found"),
      { status: 404 },
    );
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      apiError("unauthenticated", "sign in to tear down a preview"),
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const row = await loadOwned(id, session.user.id);
  if (!row) {
    return NextResponse.json(
      apiError("not_found", "preview instance not found"),
      { status: 404 },
    );
  }

  if (row.status === "ready" && row.hostId) {
    // Best-effort substrate teardown. If it fails, we still mark
    // the row as expired in the DB — the substrate's own GC will
    // clean orphans eventually.
    const r = await allocator.destroy(row.hostId);
    if (!r.ok) {
      console.warn(
        `[preview/destroy] substrate teardown failed for ${row.hostId}: ${r.error}`,
      );
    }
  }

  await prisma.previewInstance.update({
    where: { id: row.id } as never,
    data: {
      status: "expired",
      expiresAt: new Date(),
    } as never,
  });

  return NextResponse.json({ ok: true });
}
