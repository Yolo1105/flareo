import { describe, expect, it } from "vitest";
import { parseImageRef } from "@/lib/sigstore/registry";
import { detectSigManifestLayout } from "@/lib/sigstore/bundle";
import {
  mapVerifyOutcome,
  type CatalogModule,
} from "@/lib/sigstore/verify";

const DIGEST =
  "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function catalog(overrides: Partial<CatalogModule> = {}): CatalogModule {
  return {
    slug: "vaultwarden",
    name: "Vaultwarden",
    version: "1.0.0",
    trust: 80,
    cveCritical: 0,
    cveHigh: 0,
    cveMedium: 0,
    cveLow: 0,
    signerIdentity: "https://github.com/example/.github/workflows/x.yml@refs/heads/main",
    signerIssuer: "https://token.actions.githubusercontent.com",
    rekorIndex: "123",
    lastRebuiltAt: null,
    sbomUrl: null,
    trivyUrl: null,
    ...overrides,
  };
}

describe("parseImageRef", () => {
  it("expands Docker Hub short form", () => {
    expect(parseImageRef("nginx:latest")).toEqual({
      registry: "docker.io",
      repo: "library/nginx",
      tag: "latest",
      digest: null,
      canonicalBase: "docker.io/library/nginx",
    });
  });

  it("keeps an explicit Docker Hub namespace", () => {
    expect(parseImageRef("docker.io/library/alpine:3.20")).toMatchObject({
      registry: "docker.io",
      repo: "library/alpine",
      tag: "3.20",
    });
  });

  it("parses GHCR", () => {
    expect(parseImageRef("ghcr.io/owner/name:tag")).toMatchObject({
      registry: "ghcr.io",
      repo: "owner/name",
      tag: "tag",
    });
  });

  it("parses ECR Public", () => {
    expect(parseImageRef("public.ecr.aws/alias/name:1.2.3")).toMatchObject({
      registry: "public.ecr.aws",
      repo: "alias/name",
      tag: "1.2.3",
    });
  });

  it("parses digest-only refs", () => {
    expect(parseImageRef(`cgr.dev/chainguard/static@${DIGEST}`)).toMatchObject({
      registry: "cgr.dev",
      repo: "chainguard/static",
      tag: null,
      digest: DIGEST,
    });
  });

  it("keeps tag and digest when both are present", () => {
    expect(
      parseImageRef(`ghcr.io/owner/name:v1@${DIGEST}`),
    ).toMatchObject({
      tag: "v1",
      digest: DIGEST,
    });
  });

  it("rejects empty and whitespace-only refs", () => {
    expect(parseImageRef("")).toBeNull();
    expect(parseImageRef("   ")).toBeNull();
  });

  it("rejects refs that contain whitespace", () => {
    expect(parseImageRef("not a ref")).toBeNull();
  });
});

describe("detectSigManifestLayout", () => {
  it("detects a Sigstore bundle layer (v0.3)", () => {
    expect(
      detectSigManifestLayout({
        layers: [
          {
            mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json",
            digest: DIGEST,
          },
        ],
      }),
    ).toBe("bundle-layer");
  });

  it("detects the older simplesigning annotation layout", () => {
    expect(
      detectSigManifestLayout({
        layers: [
          {
            mediaType: "application/vnd.dev.cosign.simplesigning.v1+json",
            digest: DIGEST,
            annotations: {
              "dev.cosignproject.cosign/signature": "x",
            },
          },
        ],
      }),
    ).toBe("annotation");
  });

  it("returns unrecognized when neither layout is present", () => {
    expect(
      detectSigManifestLayout({
        layers: [{ mediaType: "application/octet-stream", digest: DIGEST }],
      }),
    ).toBe("unrecognized");
  });
});

describe("mapVerifyOutcome", () => {
  it("maps a verified non-catalog image to signed with bundle fields", () => {
    const result = mapVerifyOutcome({
      imageRef: "cgr.dev/chainguard/static:latest",
      digest: DIGEST,
      catalog: null,
      outcome: {
        kind: "verified",
        signerIdentity: "https://github.com/org/.github/workflows/x.yml@refs/heads/main",
        signerIssuer: "https://token.actions.githubusercontent.com",
        rekorLogIndex: "42",
        integratedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(result.status).toBe("signed");
    expect(result.signerIdentity).toContain("github.com");
    expect(result.signerIssuer).toContain("token.actions");
    expect(result.rekorLogIndex).toBe("42");
    expect(result.errorMessage).toBeNull();
  });

  it("maps a catalog hit with no critical CVEs to verified", () => {
    const result = mapVerifyOutcome({
      imageRef: "public.ecr.aws/x/vaultwarden:1.0.0",
      digest: DIGEST,
      catalog: catalog({ cveCritical: 0, cveHigh: 1 }),
      outcome: {
        kind: "verified",
        signerIdentity: catalog().signerIdentity,
        signerIssuer: catalog().signerIssuer,
        rekorLogIndex: "123",
        integratedAt: null,
      },
    });
    expect(result.status).toBe("verified");
    expect(result.flareoModule?.slug).toBe("vaultwarden");
  });

  it("maps a catalog hit with critical CVEs to invalid", () => {
    const result = mapVerifyOutcome({
      imageRef: "public.ecr.aws/x/vaultwarden:1.0.0",
      digest: DIGEST,
      catalog: catalog({ cveCritical: 2 }),
      outcome: {
        kind: "verified",
        signerIdentity: catalog().signerIdentity,
        signerIssuer: catalog().signerIssuer,
        rekorLogIndex: "123",
        integratedAt: null,
      },
    });
    expect(result.status).toBe("invalid");
  });

  it("maps verification failure to invalid with a reason", () => {
    const result = mapVerifyOutcome({
      imageRef: "example.com/a/b:1",
      digest: DIGEST,
      catalog: null,
      outcome: { kind: "invalid", message: "signature verification failed" },
    });
    expect(result.status).toBe("invalid");
    expect(result.errorMessage).toBe("signature verification failed");
  });

  it("maps registry failure to error, not invalid", () => {
    const result = mapVerifyOutcome({
      imageRef: "example.com/a/b:1",
      digest: DIGEST,
      catalog: null,
      outcome: {
        kind: "error",
        code: "registry_error",
        message: "registry returned 503",
      },
    });
    expect(result.status).toBe("error");
    expect(result.errorMessage).toMatch(/^registry_error:/);
  });

  it("prefers bundle identity over catalog and surfaces a mismatch", () => {
    const result = mapVerifyOutcome({
      imageRef: "public.ecr.aws/x/vaultwarden:1.0.0",
      digest: DIGEST,
      catalog: catalog({
        signerIdentity: "https://github.com/old/identity",
        rekorIndex: "1",
      }),
      outcome: {
        kind: "verified",
        signerIdentity: "https://github.com/new/identity",
        signerIssuer: catalog().signerIssuer,
        rekorLogIndex: "99",
        integratedAt: null,
      },
    });
    expect(result.signerIdentity).toBe("https://github.com/new/identity");
    expect(result.rekorLogIndex).toBe("99");
    expect(result.errorMessage).toMatch(/catalog mismatch/);
    expect(result.errorMessage).toMatch(/signerIdentity/);
    expect(result.errorMessage).toMatch(/rekorLogIndex/);
  });
});
