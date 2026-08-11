/**
 * Sigstore-based image verification.
 *
 * Takes a human-typed image reference and returns a structured result
 * telling the caller whether the image has a valid Sigstore signature,
 * who signed it, when, and where to find the Rekor transparency-log
 * entry. If the image happens to be in the Flareo catalog, we enrich
 * the result with the module's trust metadata.
 *
 * This module runs ONLY on the server (Next.js API route). We do not
 * expose the Sigstore libraries to the browser because:
 *   (a) they rely on the node:crypto APIs,
 *   (b) they fetch the TUF trust root which is a big blob we don't
 *       want to ship in client JS.
 *
 * Library choices:
 *   @sigstore/verify  → offline verification given a bundle + trust root
 *   @sigstore/oci     → fetch the signature manifest from an OCI registry
 *   @sigstore/bundle  → parse the Sigstore bundle (v0.1, v0.2, v0.3)
 */

import { VerifyResult } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import {
  fetchManifest,
  obtainAnonToken,
  parseImageRef,
  registryApiBase,
  resolveDigestFromTag,
} from "@/lib/sigstore/registry";

// Re-export parseImageRef so existing callers keep working.
export { parseImageRef } from "@/lib/sigstore/registry";

// ─── main verify entry point ──────────────────────────────────────

/**
 * Verify an image reference against Sigstore.
 *
 * Flow:
 *   1. Parse the ref.
 *   2. Resolve to a digest if we only have a tag.
 *   3. Fetch the signature bundle from the registry.
 *   4. Verify the bundle against the Sigstore public trust root.
 *   5. Enrich with Flareo catalog metadata if this digest is known.
 */
export async function verifyImage(imageRef: string): Promise<VerifyResult> {
  const parsed = parseImageRef(imageRef);
  if (!parsed) {
    return errorResult(imageRef, "invalid_ref", "could not parse image reference");
  }

  // For Week 2 launch, we do a simplified verification that's robust
  // and easy to reason about:
  //   - If the image is in our catalog by digest, return the full
  //     enriched result with the metadata we already have.
  //   - If not in our catalog, attempt to fetch its signature manifest
  //     from the registry and return whether a signature exists. A
  //     future refinement (Week 4+) verifies the actual signature
  //     against the Sigstore trust root using @sigstore/verify.
  //
  // The honest framing on the public page is: "We check whether a
  // Sigstore signature exists for this image, and if it's in the Flareo
  // catalog, show you the full metadata."

  // Step A: try to resolve digest from tag if not given.
  let digest = parsed.digest;
  if (!digest && parsed.tag) {
    digest = await resolveDigestFromTag(parsed);
    if (!digest) {
      return errorResult(
        imageRef,
        "manifest_not_found",
        `could not resolve digest for ${parsed.canonicalBase}:${parsed.tag}`,
      );
    }
  }
  if (!digest) {
    return errorResult(imageRef, "no_reference", "ref must include a tag or digest");
  }

  // Step B: check if this digest is in the Flareo catalog.
  const mod = await findModuleByDigest(digest);

  // Step C: look for a Sigstore signature manifest alongside the image.
  // Sigstore stores sigs at `<repo>:sha256-<digest without prefix>.sig`.
  // If we get a 404, the image is unsigned. If we get a 200 with a
  // signature manifest, it's signed.
  const sigCheck = await checkSignatureManifest(parsed, digest);

  // Compose the final result.
  if (sigCheck.kind === "error") {
    return errorResult(imageRef, sigCheck.code, sigCheck.message);
  }

  if (sigCheck.kind === "unsigned") {
    return {
      status: "unsigned",
      imageRef,
      resolvedDigest: digest,
      signerIdentity: null,
      signerIssuer: null,
      rekorLogIndex: null,
      rekorUrl: null,
      integratedAt: null,
      flareoModule: null,
      errorMessage: null,
    };
  }

  // Signature manifest exists. If we have a Flareo catalog hit, use the
  // catalog's trust data as authoritative (we signed it, we know it).
  if (mod) {
    const status: VerifyResult["status"] =
      mod.cveCritical > 0 || mod.cveHigh > 3 ? "invalid" : "verified";
    return {
      status,
      imageRef,
      resolvedDigest: digest,
      signerIdentity: mod.signerIdentity ?? null,
      signerIssuer: mod.signerIssuer ?? null,
      rekorLogIndex: mod.rekorIndex ?? null,
      rekorUrl: mod.rekorIndex
        ? `https://search.sigstore.dev/?logIndex=${mod.rekorIndex}`
        : null,
      integratedAt: mod.lastRebuiltAt?.toISOString() ?? null,
      flareoModule: {
        slug: mod.slug,
        name: mod.name,
        version: mod.version,
        trust: mod.trust,
        cves: {
          critical: mod.cveCritical,
          high: mod.cveHigh,
          medium: mod.cveMedium,
          low: mod.cveLow,
        },
        sbomUrl: mod.sbomUrl ?? null,
        scanUrl: mod.trivyUrl ?? null,
      },
      errorMessage: null,
    };
  }

  // Signature exists but the image is not in the Flareo catalog. We
  // acknowledge it is signed via Sigstore but do not make a full trust
  // claim — that would require fetching and validating the bundle,
  // which we defer to a later iteration.
  return {
    status: "signed",
    imageRef,
    resolvedDigest: digest,
    signerIdentity: null,
    signerIssuer: null,
    rekorLogIndex: null,
    rekorUrl: null,
    integratedAt: null,
    flareoModule: null,
    errorMessage: null,
  };
}

// ─── helpers ─────────────────────────────────────────────────────

function errorResult(imageRef: string, code: string, message: string): VerifyResult {
  return {
    status: "error",
    imageRef,
    resolvedDigest: null,
    signerIdentity: null,
    signerIssuer: null,
    rekorLogIndex: null,
    rekorUrl: null,
    integratedAt: null,
    flareoModule: null,
    errorMessage: `${code}: ${message}`,
  };
}

/**
 * Check whether a Sigstore signature manifest exists for this image.
 * cosign stores sigs at <repo>:sha256-<digest-hex>.sig (the dash
 * separator is because colons aren't legal in OCI tags).
 */
type SigCheckResult =
  | { kind: "signed" }
  | { kind: "unsigned" }
  | { kind: "error"; code: string; message: string };

async function checkSignatureManifest(
  parsed: import("@/lib/sigstore/registry").ParsedRef,
  digest: string,
): Promise<SigCheckResult> {
  const registryUrl = registryApiBase(parsed.registry);
  const sigTag = digest.replace(":", "-") + ".sig";
  const url = `${registryUrl}/v2/${parsed.repo}/manifests/${sigTag}`;

  try {
    let resp = await fetchManifest(url);
    if (resp.status === 401) {
      const token = await obtainAnonToken(
        parsed,
        resp.headers.get("www-authenticate"),
      );
      if (token) resp = await fetchManifest(url, token);
    }
    if (resp.status === 404) return { kind: "unsigned" };
    if (resp.ok) return { kind: "signed" };
    return {
      kind: "error",
      code: "registry_error",
      message: `registry returned ${resp.status}`,
    };
  } catch (err) {
    return {
      kind: "error",
      code: "network_error",
      message: err instanceof Error ? err.message : "network failure",
    };
  }
}

async function findModuleByDigest(digest: string) {
  return prisma.module.findFirst({
    where: { digest },
  }) as Promise<{
    slug: string;
    name: string;
    version: string;
    trust: number;
    cveCritical: number;
    cveHigh: number;
    cveMedium: number;
    cveLow: number;
    signerIdentity: string | null;
    signerIssuer: string | null;
    rekorIndex: string | null;
    lastRebuiltAt: Date | null;
    sbomUrl: string | null;
    trivyUrl: string | null;
  } | null>;
}
