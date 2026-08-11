/**
 * Sigstore-based image verification.
 *
 * Takes a human-typed image reference and returns a structured result
 * telling the caller whether the image has a valid Sigstore signature,
 * who signed it, when, and where to find the Rekor transparency-log
 * entry. If the image happens to be in the Flareo catalog, we enrich
 * the result with the module's trust metadata (CVE counts, SBOM URLs)
 * — but signer identity, issuer, and Rekor index always come from the
 * verified bundle, never from Postgres.
 *
 * This module runs ONLY on the server (Next.js API route). We do not
 * expose the Sigstore libraries to the browser because:
 *   (a) they rely on the node:crypto APIs,
 *   (b) they fetch the TUF trust root which is a big blob we don't
 *       want to ship in client JS.
 *
 * What this path verifies:
 *   - Cosign signature manifests at `<repo>:sha256-<hex>.sig`
 *   - Bundle layouts: Sigstore bundle layer (v0.1–v0.3 media types) and
 *     the older simplesigning layer with cosign annotations
 *   - Signature and Fulcio certificate chain against the Sigstore
 *     public-good trust root (via TUF), including the Rekor SET
 *
 * What it deliberately does not do:
 *   - No keyless identity policy. The public endpoint verifies
 *     arbitrary third-party images; requiring a particular signer
 *     would defeat that.
 *
 * Registries exercised against the anonymous Docker token flow:
 *   Docker Hub (registry-1.docker.io), GHCR, ECR Public, and other
 *   OCI-distribution registries (e.g. cgr.dev) that speak the same API.
 *
 * Library choices:
 *   @sigstore/verify  → verify a bundle against the trust root
 *   @sigstore/bundle  → parse / assemble Sigstore bundles
 *   @sigstore/tuf     → fetch and cache the public-good TrustedRoot
 */

import { getTrustedRoot } from "@sigstore/tuf";
import {
  Verifier,
  toSignedEntity,
  toTrustMaterial,
  type TrustMaterial,
} from "@sigstore/verify";
import { VerifyResult } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import { extractBundleFromSigManifest } from "@/lib/sigstore/bundle";
import {
  fetchManifestJson,
  parseImageRef,
  resolveDigestFromTag,
  type ParsedRef,
} from "@/lib/sigstore/registry";

// Re-export parseImageRef so existing callers keep working.
export { parseImageRef } from "@/lib/sigstore/registry";

/** Cache the TUF trust root in module scope — never fetch per request. */
const TRUST_ROOT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let trustRootCache: { material: TrustMaterial; fetchedAt: number } | null =
  null;

async function getCachedTrustMaterial(): Promise<TrustMaterial> {
  const now = Date.now();
  if (trustRootCache && now - trustRootCache.fetchedAt < TRUST_ROOT_TTL_MS) {
    return trustRootCache.material;
  }
  const root = await getTrustedRoot();
  const material = toTrustMaterial(root);
  trustRootCache = { material, fetchedAt: now };
  return material;
}

// ─── main verify entry point ──────────────────────────────────────

/**
 * Verify an image reference against Sigstore.
 *
 * Flow:
 *   1. Parse the ref.
 *   2. Resolve to a digest if we only have a tag.
 *   3. Fetch the signature manifest and locate a Sigstore bundle.
 *   4. Verify the bundle against the Sigstore public trust root.
 *   5. Enrich with Flareo catalog metadata if this digest is known.
 */
export async function verifyImage(imageRef: string): Promise<VerifyResult> {
  const parsed = parseImageRef(imageRef);
  if (!parsed) {
    return errorResult(imageRef, "invalid_ref", "could not parse image reference");
  }

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

  const mod = await findModuleByDigest(digest);
  const crypto = await verifyDigestSignature(parsed, digest);

  if (crypto.kind === "error") {
    return errorResult(imageRef, crypto.code, crypto.message);
  }

  if (crypto.kind === "unsigned") {
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

  if (crypto.kind === "invalid") {
    return {
      status: "invalid",
      imageRef,
      resolvedDigest: digest,
      signerIdentity: null,
      signerIssuer: null,
      rekorLogIndex: null,
      rekorUrl: null,
      integratedAt: null,
      flareoModule: mod
        ? {
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
          }
        : null,
      errorMessage: crypto.message,
    };
  }

  // crypto.kind === "verified"
  return mapVerifiedOutcome({
    imageRef,
    digest,
    signerIdentity: crypto.signerIdentity,
    signerIssuer: crypto.signerIssuer,
    rekorLogIndex: crypto.rekorLogIndex,
    integratedAt: crypto.integratedAt,
    catalog: mod,
  });
}

/**
 * Map a successful cryptographic verification plus optional catalog row
 * to a VerifyResult. Bundle values always win over catalog fields; a
 * stored value that diverges from the artifact is surfaced in
 * errorMessage. Exported for unit tests.
 */
export function mapVerifiedOutcome(input: {
  imageRef: string;
  digest: string;
  signerIdentity: string | null;
  signerIssuer: string | null;
  rekorLogIndex: string | null;
  integratedAt: string | null;
  catalog: CatalogModule | null;
}): VerifyResult {
  const {
    imageRef,
    digest,
    catalog,
    signerIdentity,
    signerIssuer,
    rekorLogIndex,
    integratedAt,
  } = input;

  const mismatches: string[] = [];
  if (catalog) {
    if (
      catalog.signerIdentity &&
      signerIdentity &&
      catalog.signerIdentity !== signerIdentity
    ) {
      mismatches.push(
        `signerIdentity catalog=${catalog.signerIdentity} bundle=${signerIdentity}`,
      );
    }
    if (
      catalog.signerIssuer &&
      signerIssuer &&
      catalog.signerIssuer !== signerIssuer
    ) {
      mismatches.push(
        `signerIssuer catalog=${catalog.signerIssuer} bundle=${signerIssuer}`,
      );
    }
    if (
      catalog.rekorIndex &&
      rekorLogIndex &&
      catalog.rekorIndex !== rekorLogIndex
    ) {
      mismatches.push(
        `rekorLogIndex catalog=${catalog.rekorIndex} bundle=${rekorLogIndex}`,
      );
    }
  }

  const mismatchNote =
    mismatches.length > 0
      ? `catalog mismatch: ${mismatches.join("; ")}`
      : null;

  if (!catalog) {
    return {
      status: "signed",
      imageRef,
      resolvedDigest: digest,
      signerIdentity,
      signerIssuer,
      rekorLogIndex,
      rekorUrl: rekorLogIndex
        ? `https://search.sigstore.dev/?logIndex=${rekorLogIndex}`
        : null,
      integratedAt,
      flareoModule: null,
      errorMessage: mismatchNote,
    };
  }

  const status: VerifyResult["status"] =
    catalog.cveCritical > 0 || catalog.cveHigh > 3 ? "invalid" : "verified";

  return {
    status,
    imageRef,
    resolvedDigest: digest,
    signerIdentity,
    signerIssuer,
    rekorLogIndex,
    rekorUrl: rekorLogIndex
      ? `https://search.sigstore.dev/?logIndex=${rekorLogIndex}`
      : null,
    integratedAt,
    flareoModule: {
      slug: catalog.slug,
      name: catalog.name,
      version: catalog.version,
      trust: catalog.trust,
      cves: {
        critical: catalog.cveCritical,
        high: catalog.cveHigh,
        medium: catalog.cveMedium,
        low: catalog.cveLow,
      },
      sbomUrl: catalog.sbomUrl ?? null,
      scanUrl: catalog.trivyUrl ?? null,
    },
    errorMessage: mismatchNote,
  };
}

// ─── cryptographic verification ──────────────────────────────────

type CryptoOutcome =
  | {
      kind: "verified";
      signerIdentity: string | null;
      signerIssuer: string | null;
      rekorLogIndex: string | null;
      integratedAt: string | null;
    }
  | { kind: "unsigned" }
  | { kind: "invalid"; message: string }
  | { kind: "error"; code: string; message: string };

async function verifyDigestSignature(
  parsed: ParsedRef,
  digest: string,
): Promise<CryptoOutcome> {
  const sigTag = digest.replace(":", "-") + ".sig";
  const manifest = await fetchManifestJson(parsed, sigTag);

  if (!manifest.ok) {
    if (manifest.error.kind === "not_found") return { kind: "unsigned" };
    if (manifest.error.kind === "timeout") {
      return {
        kind: "error",
        code: "timeout",
        message: "registry request timed out",
      };
    }
    if (manifest.error.kind === "http") {
      return {
        kind: "error",
        code: "registry_error",
        message: `registry returned ${manifest.error.status}`,
      };
    }
    return {
      kind: "error",
      code: "network_error",
      message: manifest.error.message,
    };
  }

  const extracted = await extractBundleFromSigManifest(parsed, manifest.body);
  if (extracted.kind === "unrecognized") {
    return {
      kind: "invalid",
      message:
        "signature manifest present but no recognised Sigstore bundle layout",
    };
  }
  if (extracted.kind === "error") {
    // Registry/network failures stay as error; malformed bundles are invalid.
    if (
      extracted.code === "timeout" ||
      extracted.code === "network_error" ||
      extracted.code === "registry_error"
    ) {
      return {
        kind: "error",
        code: extracted.code,
        message: extracted.message,
      };
    }
    return { kind: "invalid", message: extracted.message };
  }

  try {
    const material = await getCachedTrustMaterial();
    const verifier = new Verifier(material);
    const signer = verifier.verify(
      toSignedEntity(extracted.bundle, extracted.artifact),
    );

    const entry = extracted.bundle.verificationMaterial.tlogEntries[0];
    const rekorLogIndex =
      entry && entry.logIndex !== undefined && entry.logIndex !== null
        ? String(entry.logIndex)
        : null;
    const integratedAt =
      entry && entry.integratedTime !== undefined && entry.integratedTime !== null
        ? new Date(Number(entry.integratedTime) * 1000).toISOString()
        : null;

    return {
      kind: "verified",
      signerIdentity: signer.identity?.subjectAlternativeName ?? null,
      signerIssuer: signer.identity?.extensions?.issuer ?? null,
      rekorLogIndex,
      integratedAt,
    };
  } catch (err) {
    return {
      kind: "invalid",
      message: err instanceof Error ? err.message : "signature verification failed",
    };
  }
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

export type CatalogModule = {
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
};

async function findModuleByDigest(digest: string): Promise<CatalogModule | null> {
  return prisma.module.findFirst({
    where: { digest },
  }) as Promise<CatalogModule | null>;
}
