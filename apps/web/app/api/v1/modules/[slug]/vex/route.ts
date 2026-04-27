import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { listForModule, buildOpenVexDocument } from "@/lib/db/vex";
import { apiError } from "@/lib/validation/schemas";

/**
 * GET /api/v1/modules/[slug]/vex
 *
 * Returns the OpenVEX 0.2.0 document for a module. Spec at
 * https://openvex.dev/ns/v0.2.0
 *
 * The document is rendered live from VexStatement rows on every
 * request. We don't materialize it because it's small (1KB-50KB
 * typical) and the queries are cheap; we'd rather always reflect
 * the current annotation state than risk serving stale.
 *
 * The Cache-Control is short (60s) so an annotation update propagates
 * to consumers within a minute even when the response is being
 * fetched repeatedly. ETag is the digest + statement count, so a
 * cached response invalidates exactly when annotations change OR
 * the module is rebuilt to a new digest.
 *
 * Returns an empty-statements document for modules with no VEX
 * annotations rather than a 404 — consumers chaining this into
 * their own pipelines benefit from a stable response shape.
 *
 * Public endpoint, no auth. Private modules return 403 (the document
 * could leak internal CVE-handling decisions).
 */
export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;

  if (!slug || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
    return NextResponse.json(
      apiError("invalid_slug", "module slug must be lowercase alphanumeric with hyphens"),
      { status: 400 },
    );
  }

  let mod: { slug: string; digest: string; visibility: string } | null;
  try {
    mod = (await prisma.module.findUnique({
      where: { slug } as never,
      select: { slug: true, digest: true, visibility: true } as never,
    })) as { slug: string; digest: string; visibility: string } | null;
  } catch {
    return NextResponse.json(
      apiError("db_error", "could not look up module"),
      { status: 503 },
    );
  }

  if (!mod) {
    return NextResponse.json(
      apiError("not_found", `no module found with slug "${slug}"`),
      { status: 404 },
    );
  }

  if (mod.visibility !== "public") {
    return NextResponse.json(
      apiError("forbidden", "VEX documents for private modules are only available to the publisher"),
      { status: 403 },
    );
  }

  const statements = await listForModule(slug);
  const document = buildOpenVexDocument(slug, mod.digest, statements);

  // ETag = module digest + statement count + latest update time. Cheap
  // to compute, invalidates exactly when something relevant changes.
  const latestUpdate =
    statements.length > 0
      ? Math.max(...statements.map((s) => s.updatedAt.getTime()))
      : 0;
  const etag = `"${mod.digest.slice(0, 12)}-${statements.length}-${latestUpdate}"`;

  return NextResponse.json(document, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      ETag: etag,
    },
  });
}
