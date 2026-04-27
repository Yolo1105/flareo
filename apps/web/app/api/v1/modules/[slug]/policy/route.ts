import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import { getVerdict, evaluateAndPersist } from "@/lib/db/policy";
import { apiError } from "@/lib/validation/schemas";

/**
 * GET /api/v1/modules/[slug]/policy
 *
 * Returns the cached policy verdict for a module. If no verdict
 * row exists yet (newly published module before the worker / cron
 * sweep evaluated it), we evaluate inline and persist before
 * returning.
 *
 * Response shape mirrors the OpenVEX endpoint pattern: a top-level
 * decision plus per-rule breakdown plus the input snapshot the
 * evaluator saw. Consumers can chain this into their own admission
 * pipelines.
 *
 * Public, no auth. Private modules return 403 (a verdict could leak
 * the module's CVE count + signature status without exposing the
 * module itself).
 */
export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;

  if (!slug || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
    return NextResponse.json(
      apiError(
        "invalid_slug",
        "module slug must be lowercase alphanumeric with hyphens",
      ),
      { status: 400 },
    );
  }

  let row: ModuleShape | null;
  try {
    row = (await prisma.module.findUnique({
      where: { slug } as never,
    })) as ModuleShape | null;
  } catch {
    return NextResponse.json(apiError("db_error", "lookup failed"), {
      status: 503,
    });
  }
  if (!row) {
    return NextResponse.json(
      apiError("not_found", `no module found with slug "${slug}"`),
      { status: 404 },
    );
  }
  const module = shapeToModule(row);
  if (module.visibility !== "public") {
    return NextResponse.json(
      apiError(
        "forbidden",
        "policy verdicts for private modules are only available to the publisher",
      ),
      { status: 403 },
    );
  }

  // Lazy-evaluate: if no cached verdict, compute and persist now.
  let result = await getVerdict(slug);
  if (!result) {
    const fresh = await evaluateAndPersist(module);
    result = fresh;
  }

  // ETag = verdict + policy revision + evaluation time. Invalidates
  // when policy revision changes OR module re-evaluation produces a
  // different verdict.
  const etag = `"${result.verdict}-r${result.policyRevision}-${result.evaluatedAt.getTime()}"`;

  return NextResponse.json(
    {
      moduleSlug: result.moduleSlug,
      verdict: result.verdict,
      policyRevision: result.policyRevision,
      evaluatedAt: result.evaluatedAt.toISOString(),
      summary: result.detail.summary,
      results: result.detail.results,
      input: result.detail.input,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        ETag: etag,
      },
    },
  );
}
