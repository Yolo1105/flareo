import { z } from "zod";

/**
 * Zod schemas for every v1 API endpoint's input and output.
 *
 * Every public-facing route validates its body with one of these schemas
 * before touching business logic. Invalid inputs return 400 with a
 * helpful error message. Schemas are also the source of truth for the
 * TypeScript types exported from this file.
 *
 * The OpenAPI spec at public/openapi.json is hand-written and must stay
 * in sync with these schemas.
 */

// ─── shared primitives ─────────────────────────────────────────────

/**
 * An OCI image reference, as typed by a human. We accept:
 *   - `<registry>/<repo>:<tag>`
 *   - `<registry>/<repo>@sha256:<64 hex>`
 *   - `<repo>:<tag>` (defaults registry to docker.io)
 *   - `<repo>` alone (defaults :latest)
 *
 * We do basic length and character validation here; the actual parse
 * into (registry, repo, tag, digest) happens in lib/sigstore/verify.ts
 * where we can give richer errors.
 */
export const imageRefSchema = z
  .string()
  .trim()
  .min(1, "image ref cannot be empty")
  .max(512, "image ref is unreasonably long")
  .regex(
    // Loose: registry.tld/path/subpath:tag-or-digest
    // Stricter parsing happens in the sigstore module.
    /^[a-zA-Z0-9][\w./:@\-]*$/,
    "image ref contains invalid characters"
  );

/** sha256:<64 hex> digest. */
export const digestSchema = z
  .string()
  .regex(/^sha256:[a-f0-9]{64}$/i, "must be sha256:<64 hex>");

/** URL-safe kebab-case slug. */
export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/,
    "slug must be lowercase kebab-case, 2-64 chars"
  );

// ─── /api/v1/verify ────────────────────────────────────────────────

export const verifyRequestSchema = z.object({
  imageRef: imageRefSchema,
});

export type VerifyRequest = z.infer<typeof verifyRequestSchema>;

/**
 * What the verify endpoint returns. `status` is the headline:
 *   - "verified": passed signature check AND no critical/high CVEs (if in catalog)
 *   - "signed":   signature verified, image is not in Flareo catalog so
 *                 we can't make a full trust statement
 *   - "unsigned": no signature found for this image
 *   - "invalid":  signature present but failed verification
 *   - "error":    a non-verification failure (registry down, parse error, etc)
 */
export const verifyResultSchema = z.object({
  status: z.enum(["verified", "signed", "unsigned", "invalid", "error"]),
  imageRef: z.string(),
  resolvedDigest: z.string().nullable(),
  signerIdentity: z.string().nullable(),
  signerIssuer: z.string().nullable(),
  rekorLogIndex: z.string().nullable(),
  rekorUrl: z.string().nullable(),
  integratedAt: z.string().nullable(), // ISO timestamp from Rekor
  flareoModule: z
    .object({
      slug: z.string(),
      name: z.string(),
      version: z.string(),
      trust: z.number(),
      cves: z.object({
        critical: z.number(),
        high: z.number(),
        medium: z.number(),
        low: z.number(),
      }),
      sbomUrl: z.string().nullable(),
      scanUrl: z.string().nullable(),
    })
    .nullable(),
  errorMessage: z.string().nullable(),
});

export type VerifyResult = z.infer<typeof verifyResultSchema>;

// ─── /api/v1/modules ──────────────────────────────────────────────

export const modulesListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  category: z
    .enum(["security", "media", "automation", "productivity", "network", "devtools", "monitoring", "communication"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().max(100).optional(),
});

export type ModulesListQuery = z.infer<typeof modulesListQuerySchema>;

// ─── error envelope ───────────────────────────────────────────────

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Helper to build consistent error responses.
 */
export function apiError(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } };
}
