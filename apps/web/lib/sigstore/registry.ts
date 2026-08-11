/**
 * OCI registry transport for Sigstore verification.
 *
 * Parses image references and talks to registries over the distribution
 * API (manifest HEAD/GET, blob GET) using the anonymous Docker token
 * flow. No stored credentials are attached to these requests.
 */

// ─── image reference parsing ──────────────────────────────────────

export interface ParsedRef {
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

  // Now `remainder` is <registry>/<repo>, or just <repo>, or <namespace>/<repo>.
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

// ─── registry HTTP ────────────────────────────────────────────────

/** Default per-call timeout for public verify endpoint registry I/O. */
export const REGISTRY_TIMEOUT_MS = 8_000;

/**
 * Map the short registry name to the full HTTPS base for its v2 API.
 * Docker Hub uses a different hostname from its user-facing name.
 */
export function registryApiBase(registry: string): string {
  if (registry === "docker.io") return "https://registry-1.docker.io";
  return `https://${registry}`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REGISTRY_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchManifest(
  url: string,
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: [
      "application/vnd.oci.image.manifest.v1+json",
      "application/vnd.oci.image.index.v1+json",
      "application/vnd.docker.distribution.manifest.v2+json",
      "application/vnd.docker.distribution.manifest.list.v2+json",
      // Cosign signature manifests and Sigstore bundle layer media types.
      "application/vnd.dev.cosign.simplesigning.v1+json",
      "application/vnd.dev.sigstore.bundle+json;version=0.1",
      "application/vnd.dev.sigstore.bundle+json;version=0.2",
      "application/vnd.dev.sigstore.bundle+json;version=0.3",
      "application/vnd.dev.sigstore.bundle.v0.3+json",
      "*/*",
    ].join(", "),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetchWithTimeout(url, { method: "HEAD", headers, redirect: "follow" });
}

/**
 * Parse a WWW-Authenticate challenge and obtain an anonymous bearer
 * token for the specified scope. This is how Docker Hub, GHCR, and
 * ECR Public all gate their public manifests.
 */
export async function obtainAnonToken(
  parsed: ParsedRef,
  wwwAuth: string | null,
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
    const resp = await fetchWithTimeout(u.toString(), { method: "GET" });
    if (!resp.ok) return null;
    const body = (await resp.json()) as { token?: string; access_token?: string };
    return body.token ?? body.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve a (registry, repo, tag) to its pinned digest by HEAD-requesting
 * the image's manifest URL. Works for any registry that speaks the
 * standard OCI distribution API.
 */
export async function resolveDigestFromTag(
  parsed: ParsedRef,
): Promise<string | null> {
  if (!parsed.tag) return null;

  const registryUrl = registryApiBase(parsed.registry);
  const manifestUrl = `${registryUrl}/v2/${parsed.repo}/manifests/${parsed.tag}`;

  try {
    // First try an anonymous request. Many public registries (GHCR,
    // public.ecr.aws) return a WWW-Authenticate challenge; we follow
    // the token flow if so.
    let resp = await fetchManifest(manifestUrl);
    if (resp.status === 401) {
      const token = await obtainAnonToken(
        parsed,
        resp.headers.get("www-authenticate"),
      );
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

export type RegistryError =
  | { kind: "not_found" }
  | { kind: "http"; status: number }
  | { kind: "timeout" }
  | { kind: "network"; message: string };

export type FetchJsonResult =
  | { ok: true; body: unknown; digestHeader: string | null }
  | { ok: false; error: RegistryError };

/**
 * GET a manifest by tag or digest and return the parsed JSON body.
 * Retries once with an anonymous token on 401.
 */
export async function fetchManifestJson(
  parsed: ParsedRef,
  reference: string,
): Promise<FetchJsonResult> {
  const registryUrl = registryApiBase(parsed.registry);
  const url = `${registryUrl}/v2/${parsed.repo}/manifests/${reference}`;

  try {
    let resp = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        Accept: [
          "application/vnd.oci.image.manifest.v1+json",
          "application/vnd.oci.image.index.v1+json",
          "application/vnd.docker.distribution.manifest.v2+json",
          "application/vnd.docker.distribution.manifest.list.v2+json",
          "application/vnd.dev.cosign.simplesigning.v1+json",
          "application/vnd.dev.sigstore.bundle+json;version=0.1",
          "application/vnd.dev.sigstore.bundle+json;version=0.2",
          "application/vnd.dev.sigstore.bundle+json;version=0.3",
          "application/vnd.dev.sigstore.bundle.v0.3+json",
          "*/*",
        ].join(", "),
      },
      redirect: "follow",
    });
    if (resp.status === 401) {
      const token = await obtainAnonToken(
        parsed,
        resp.headers.get("www-authenticate"),
      );
      if (token) {
        resp = await fetchWithTimeout(url, {
          method: "GET",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          redirect: "follow",
        });
      }
    }
    if (resp.status === 404) return { ok: false, error: { kind: "not_found" } };
    if (!resp.ok) {
      return { ok: false, error: { kind: "http", status: resp.status } };
    }
    const body: unknown = await resp.json();
    return {
      ok: true,
      body,
      digestHeader: resp.headers.get("docker-content-digest"),
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: { kind: "timeout" } };
    }
    return {
      ok: false,
      error: {
        kind: "network",
        message: err instanceof Error ? err.message : "network failure",
      },
    };
  }
}

export type FetchBlobResult =
  | { ok: true; body: Buffer }
  | { ok: false; error: RegistryError };

/**
 * GET `/v2/{repo}/blobs/{digest}` and return the raw body.
 * Retries once with an anonymous token on 401.
 */
export async function fetchBlob(
  parsed: ParsedRef,
  digest: string,
): Promise<FetchBlobResult> {
  const registryUrl = registryApiBase(parsed.registry);
  const url = `${registryUrl}/v2/${parsed.repo}/blobs/${digest}`;

  try {
    let resp = await fetchWithTimeout(url, {
      method: "GET",
      headers: { Accept: "*/*" },
      redirect: "follow",
    });
    if (resp.status === 401) {
      const token = await obtainAnonToken(
        parsed,
        resp.headers.get("www-authenticate"),
      );
      if (token) {
        resp = await fetchWithTimeout(url, {
          method: "GET",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          redirect: "follow",
        });
      }
    }
    if (resp.status === 404) return { ok: false, error: { kind: "not_found" } };
    if (!resp.ok) {
      return { ok: false, error: { kind: "http", status: resp.status } };
    }
    const ab = await resp.arrayBuffer();
    return { ok: true, body: Buffer.from(ab) };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: { kind: "timeout" } };
    }
    return {
      ok: false,
      error: {
        kind: "network",
        message: err instanceof Error ? err.message : "network failure",
      },
    };
  }
}
