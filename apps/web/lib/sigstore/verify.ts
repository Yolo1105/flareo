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

// ─── image reference parsing ──────────────────────────────────────

interface ParsedRef {
  registry: string;
  repo: string;
  tag: string | null;
  digest: string | null;
  /** Reconstructed canonical form without the tag/digest. */
  canonicalBase: string;
}

/**
 * Parse an OCI image ref into its components. Handles:
 *   alpine:3.20                          → docker.io/library/alpine:3.20
 *   library/alpine:3.20                  → docker.io/library/alpine:3.20
 *   docker.io/library/alpine@sha256:...  → as-is
 *   ghcr.io/owner/name:tag               → as-is
 *   public.ecr.aws/alias/name:tag        → as-is
 *
 * If both tag and digest are given (e.g. `foo:1.0@sha256:...`), tag wins
 * for display but the digest is authoritative for resolution.
 */
export function parseImageRef(ref: string): ParsedRef | null {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  // Split on @ first — everything after is a digest if it matches sha256:...
  let digest: string | null = null;
  let remainder = trimmed;
  const atIdx = trimmed.lastIndexOf("@");
  if (atIdx >= 0) {
    const maybeDigest = trimmed.slice(atIdx + 1);
    if (/^sha256:[a-f0-9]{64}$/i.test(maybeDigest)) {
      digest = maybeDigest.toLowerCase();
      remainder = trimmed.slice(0, atIdx);
    }
  }

  // Then split on the last colon that's after any slash → tag
  let tag: string | null = null;
  const lastSlash = remainder.lastIndexOf("/");
  const lastColon = remainder.lastIndexOf(":");
  if (lastColon > lastSlash && lastColon !== -1) {
    tag = remainder.slice(lastColon + 1);
    remainder = remainder.slice(0, lastColon);
  }

  // Now `remainder` is <registry>/<repo>, or just <repo>, or <user>/<repo>.
  // If the first segment before the first slash contains a dot or colon or
  // equals "localhost", it's a registry. Otherwise default to docker.io.
  let registry = "docker.io";
  let repo = remainder;
  const firstSlash = remainder.indexOf("/");
  if (firstSlash > 0) {
    const firstSeg = remainder.slice(0, firstSlash);
    if (
      firstSeg.includes(".") ||
      firstSeg.includes(":") ||
      firstSeg === "localhost"
    ) {
      registry = firstSeg;
      repo = remainder.slice(firstSlash + 1);
    }
  }

  // On Docker Hub, bare repos get the `library/` prefix.
  if (registry === "docker.io" && !repo.includes("/")) {
    repo = `library/${repo}`;
  }

  if (!repo) return null;

  return {
    registry,
    repo,
    tag: tag ?? (digest ? null : "latest"),
    digest,
    canonicalBase: `${registry}/${repo}`,
  };
}

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
        `could not resolve digest for ${parsed.canonicalBase}:${parsed.tag}`
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
 * Resolve a (registry, repo, tag) to its pinned digest by HEAD-requesting
 * the image's manifest URL. Works for any registry that speaks the
 * standard OCI distribution API.
 */
async function resolveDigestFromTag(parsed: ParsedRef): Promise<string | null> {
  if (!parsed.tag) return null;

  const registryUrl = registryApiBase(parsed.registry);
  const manifestUrl = `${registryUrl}/v2/${parsed.repo}/manifests/${parsed.tag}`;

  try {
    // First try an anonymous request. Many public registries (GHCR,
    // public.ecr.aws) return a WWW-Authenticate challenge; we follow
    // the token flow if so.
    let resp = await fetchManifest(manifestUrl);
    if (resp.status === 401) {
      const token = await obtainAnonToken(parsed, resp.headers.get("www-authenticate"));
      if (token) {
        resp = await fetchManifest(manifestUrl, token);
      }
    }
    if (!resp.ok) return null;
    // The digest is in the Docker-Content-Digest header.
    const dig = resp.headers.get("docker-content-digest");
    if (dig && /^sha256:[a-f0-9]{64}$/i.test(dig)) return dig.toLowerCase();
    return null;
  } catch {
    return null;
  }
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
  parsed: ParsedRef,
  digest: string
): Promise<SigCheckResult> {
  const registryUrl = registryApiBase(parsed.registry);
  const sigTag = digest.replace(":", "-") + ".sig";
  const url = `${registryUrl}/v2/${parsed.repo}/manifests/${sigTag}`;

  try {
    let resp = await fetchManifest(url);
    if (resp.status === 401) {
      const token = await obtainAnonToken(parsed, resp.headers.get("www-authenticate"));
      if (token) resp = await fetchManifest(url, token);
    }
    if (resp.status === 404) return { kind: "unsigned" };
    if (resp.ok) return { kind: "signed" };
    return { kind: "error", code: "registry_error", message: `registry returned ${resp.status}` };
  } catch (err) {
    return {
      kind: "error",
      code: "network_error",
      message: err instanceof Error ? err.message : "network failure",
    };
  }
}

/**
 * Map the short registry name to the full HTTPS base for its v2 API.
 * Docker Hub uses a different hostname from its user-facing name.
 */
function registryApiBase(registry: string): string {
  if (registry === "docker.io") return "https://registry-1.docker.io";
  return `https://${registry}`;
}

async function fetchManifest(url: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: [
      "application/vnd.oci.image.manifest.v1+json",
      "application/vnd.oci.image.index.v1+json",
      "application/vnd.docker.distribution.manifest.v2+json",
      "application/vnd.docker.distribution.manifest.list.v2+json",
    ].join(", "),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { method: "HEAD", headers, redirect: "follow" });
}

/**
 * Parse a WWW-Authenticate challenge and obtain an anonymous bearer
 * token for the specified scope. This is how Docker Hub, GHCR, and
 * ECR Public all gate their public manifests.
 */
async function obtainAnonToken(
  parsed: ParsedRef,
  wwwAuth: string | null
): Promise<string | null> {
  if (!wwwAuth || !wwwAuth.toLowerCase().startsWith("bearer")) return null;
  const params: Record<string, string> = {};
  for (const m of wwwAuth.slice("bearer".length).matchAll(/(\w+)="([^"]+)"/g)) {
    params[m[1]!] = m[2]!;
  }
  const realm = params.realm;
  const service = params.service;
  const scope = params.scope ?? `repository:${parsed.repo}:pull`;
  if (!realm) return null;

  const u = new URL(realm);
  if (service) u.searchParams.set("service", service);
  u.searchParams.set("scope", scope);

  try {
    const resp = await fetch(u.toString());
    if (!resp.ok) return null;
    const body = (await resp.json()) as { token?: string; access_token?: string };
    return body.token ?? body.access_token ?? null;
  } catch {
    return null;
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
