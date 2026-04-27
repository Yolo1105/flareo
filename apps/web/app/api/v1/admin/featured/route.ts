import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { apiError, slugSchema } from "@/lib/validation/schemas";
import { upsertFeatured, removeFeatured } from "@/lib/db/curation";

/**
 * Admin curator endpoints for the Featured strip.
 *
 * POST   /api/v1/admin/featured
 *   body: { moduleSlug, position: 1..6, blurb?, expiresAt? }
 *   → upsert (one row per moduleSlug)
 *
 * DELETE /api/v1/admin/featured?slug=<moduleSlug>
 *   → remove
 *
 * POSITIONS aren't globally unique — two admin features at position 3
 * render in insertion order. Deliberate: the ordering is editorial,
 * not a strict array. Admin can always re-save to fix.
 *
 * EXPIRES_AT is accepted as ISO string. Null / absent means no
 * expiration (indefinite feature).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpsertSchema = z.object({
  moduleSlug: slugSchema,
  position: z.number().int().min(1).max(6),
  blurb: z.string().trim().max(200).nullable().optional(),
  // Accept ISO string OR null. Past dates are allowed (admin can
  // retire an existing feature by setting expiresAt in the past).
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
    });
  }

  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        "bad_request",
        "featured validation failed",
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      ),
      { status: 400 },
    );
  }

  const d = parsed.data;
  const result = await upsertFeatured({
    moduleSlug: d.moduleSlug,
    position: d.position,
    blurb: d.blurb ?? null,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    curatorId: gate.userId,
  });

  if (!result.ok) {
    const status = result.reason === "module_not_found" ? 404 : 409;
    const message =
      result.reason === "module_not_found"
        ? "module not found"
        : "private modules can't be featured publicly";
    return NextResponse.json(apiError(result.reason, message), { status });
  }

  return NextResponse.json(
    { ok: true, created: result.created },
    { status: result.created ? 201 : 200 },
  );
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json(
      apiError("bad_request", "slug query param required"),
      { status: 400 },
    );
  }
  const slugParsed = slugSchema.safeParse(slug);
  if (!slugParsed.success) {
    return NextResponse.json(apiError("bad_slug", "invalid slug"), {
      status: 400,
    });
  }

  const removed = await removeFeatured(slugParsed.data);
  if (!removed) {
    return NextResponse.json(apiError("not_found", "not featured"), {
      status: 404,
    });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
