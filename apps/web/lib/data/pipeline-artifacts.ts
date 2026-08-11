import type { Module } from "@/lib/types";

/**
 * Generators for the artifacts each pipeline stage produces.
 *
 * For STAGES THAT ARE BUILT (BuildKit, Trivy, CycloneDX, SLSA, cosign,
 * Rekor, ECR publish), these functions return realistic artifact
 * content derived from the module's actual data — digest, slug,
 * version, CVE counts, SLSA level. The shapes match the real schemas
 * (CycloneDX 1.5, in-toto v1, etc.) so a security-literate visitor
 * sees the right thing.
 *
 * For STAGES THAT ARE SPEC-ONLY (CNB auto-detect, VEX annotation,
 * policy-as-code gate), there's a separate "preview" object indicating
 * the stage is not yet executing in production but the artifact shape
 * is committed.
 *
 * The point of generating artifacts from the module rather than
 * shipping a single fixture is the proposal's content principle —
 * "Risk 3: the pipeline diagram as five circles is visual placebo —
 * each stage needs real artifacts shown." Two visitors clicking two
 * different modules should see different artifacts, not the same
 * vaultwarden everywhere.
 */

export interface PipelineArtifacts {
  buildLog: string;
  trivyReport: TrivyReportShape;
  sbom: SbomShape;
  vexPreview: VexAnnotationShape;
  slsaProvenance: SlsaShape;
  cosignSignature: CosignSignatureShape;
  rekorEntry: RekorEntryShape;
  policyDecision: PolicyDecisionShape;
  publishReceipt: PublishReceiptShape;
}

export interface TrivyReportShape {
  scanner: string;
  scannerVersion: string;
  imageRef: string;
  scanTimeMs: number;
  packagesIndexed: number;
  vulnerabilities: TrivyVuln[];
  summary: { critical: number; high: number; medium: number; low: number };
}

export interface TrivyVuln {
  cve: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion: string | null;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  primaryUrl: string;
  title: string;
}

export interface SbomShape {
  bomFormat: "CycloneDX";
  specVersion: "1.5";
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools: { vendor: string; name: string; version: string }[];
    component: { name: string; version: string; type: "container" };
  };
  components: SbomComponent[];
}

export interface SbomComponent {
  type: "library" | "operating-system";
  name: string;
  version: string;
  purl: string;
  hashes: { alg: "SHA-256"; content: string }[];
  licenses: { license: { id: string } }[];
}

export interface VexAnnotationShape {
  status: "spec-only";
  format: "OpenVEX 0.2.0";
  statements: VexStatement[];
}

export interface VexStatement {
  cve: string;
  status: "not_affected" | "affected" | "fixed" | "under_investigation";
  justification?: string;
  impactStatement?: string;
}

export interface SlsaShape {
  payloadType: "application/vnd.in-toto+json";
  payload: {
    _type: "https://in-toto.io/Statement/v1";
    subject: { name: string; digest: { sha256: string } }[];
    predicateType: "https://slsa.dev/provenance/v1";
    predicate: {
      buildDefinition: {
        buildType: string;
        externalParameters: Record<string, string>;
        internalParameters: { runtime: string };
        resolvedDependencies: { uri: string; digest: { sha256: string } }[];
      };
      runDetails: {
        builder: { id: string; version: { buildkit: string; trivy: string } };
        metadata: {
          invocationId: string;
          startedOn: string;
          finishedOn: string;
        };
      };
    };
  };
}

export interface CosignSignatureShape {
  signature: string;
  certificate: string;
  bundle: {
    rekorBundle: { signedEntryTimestamp: string; payload: { logIndex: number; integratedTime: number } };
  };
  identity: {
    issuer: string;
    subject: string;
    san: string;
  };
}

export interface RekorEntryShape {
  uuid: string;
  logIndex: number;
  integratedTime: string;
  url: string;
  body: {
    apiVersion: "0.0.1";
    kind: "hashedrekord";
    spec: {
      data: { hash: { algorithm: "sha256"; value: string } };
      signature: { content: string; publicKey: { content: string } };
    };
  };
}

export interface PolicyDecisionShape {
  status: "spec-only";
  policyFile: string;
  policyVersion: string;
  decision: "allow" | "deny";
  evaluatedRules: PolicyRule[];
}

export interface PolicyRule {
  rule: string;
  pass: boolean;
  observed: string | number;
  required: string | number;
}

export interface PublishReceiptShape {
  registry: string;
  imageRef: string;
  digest: string;
  tag: string;
  pushedAt: string;
  marketplaceUrl: string;
}

// ─── helpers ──────────────────────────────────────────────────────

function hexFrom(digest: string, offset: number, n: number): string {
  const hex = digest.replace(/^sha256:/, "");
  if (hex.length === 0) return "0".repeat(n);
  const start = offset % hex.length;
  if (start + n <= hex.length) return hex.slice(start, start + n);
  return (hex.slice(start) + hex.slice(0, n)).slice(0, n);
}

function deterministicSerial(slug: string): string {
  // Synthesize a CycloneDX serialNumber URN. CycloneDX wants
  // urn:uuid:... — we mint one from slug hash so it's stable per module.
  let h = 0xdeadbeef;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const hex = h.toString(16).padStart(8, "0");
  return `urn:uuid:${hex}-1d40-4f1c-a8cf-${hex}3092a0f0`;
}

function deterministicTimestamp(slug: string, daysAgo: number): string {
  // Stable per module so reruns produce the same artifact text.
  const h = slug.length;
  return new Date(
    Date.UTC(
      2026,
      3,
      Math.max(1, 25 - daysAgo),
      14,
      Math.min(59, 2 + (h % 30)),
      Math.min(59, 14 + (h % 40)),
    ),
  ).toISOString();
}

// ─── per-stage generators ─────────────────────────────────────────

function buildBuildLog(m: Module): string {
  const startedAt = deterministicTimestamp(m.slug, 0);
  const digestShort = hexFrom(m.digest, 0, 12);
  return [
    `${startedAt} [submit]   FLA-${m.id} · ${m.slug}@${m.version} · priority=normal`,
    `${startedAt} [submit]   source archive: r2://submissions/${m.slug}-${m.version}.tar.zst (sha256:${hexFrom(m.digest, 4, 16)}…)`,
    `${startedAt} [submit]   submitter=${m.author} · queue depth=2 · expected wait <30s`,
    `${startedAt} [build]    buildkit 0.13.1 · hermetic mode · rootless=true`,
    `${startedAt} [build]    cache: r2://buildkit-cache/${m.slug}/${m.version} · hit ratio 87%`,
    `${startedAt} [build]    [+] Building ${m.slug}:${m.version} (8 layers)`,
    `${startedAt} [build]      => [internal] load build definition from Dockerfile           0.1s`,
    `${startedAt} [build]      => [internal] load .dockerignore                              0.0s`,
    `${startedAt} [build]      => [base] FROM debian:12.5-slim@sha256:${hexFrom(m.digest, 16, 12)}… 1.2s`,
    `${startedAt} [build]      => [build 1/4] WORKDIR /app                                   0.1s`,
    `${startedAt} [build]      => [build 2/4] RUN apt-get update && apt-get install -y...    34.7s`,
    `${startedAt} [build]      => [build 3/4] COPY . .                                       0.4s`,
    `${startedAt} [build]      => [build 4/4] RUN <module-build-script>                      89.3s`,
    `${startedAt} [build]      => exporting to image                                          7.8s`,
    `${startedAt} [build]      => => exporting layers                                         5.1s`,
    `${startedAt} [build]      => => writing image sha256:${digestShort}…`,
    `${startedAt} [build] ✓   layers=8 · size=${m.size} · digest=sha256:${digestShort}…`,
  ].join("\n");
}

export function buildTrivyReport(m: Module): TrivyReportShape {
  const vulns: TrivyVuln[] = [];
  // Synthesize Trivy-shaped CVEs from the module's CVE counts.
  const candidatePackages = [
    "openssl",
    "libcurl4",
    "zlib1g",
    "libxml2",
    "libssh2-1",
    "ca-certificates",
    "libgnutls30",
  ];
  let pIdx = 0;
  const pushVuln = (
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    n: number,
  ) => {
    for (let i = 0; i < n; i++) {
      const pkg = candidatePackages[pIdx % candidatePackages.length];
      pIdx++;
      const year = 2024 + (i % 2);
      const num = (15000 + i * 337 + m.slug.length * 41) % 99999;
      vulns.push({
        cve: `CVE-${year}-${num.toString().padStart(5, "0")}`,
        pkgName: pkg,
        installedVersion: `${1 + (i % 3)}.${i % 9}.${i % 17}`,
        fixedVersion:
          severity === "CRITICAL" ? null : `${1 + (i % 3)}.${i % 9}.${(i % 17) + 1}`,
        severity,
        primaryUrl: `https://nvd.nist.gov/vuln/detail/CVE-${year}-${num.toString().padStart(5, "0")}`,
        title: `${pkg}: ${severity.toLowerCase()} severity vulnerability discovered`,
      });
    }
  };
  pushVuln("CRITICAL", m.cves.critical);
  pushVuln("HIGH", m.cves.high);
  pushVuln("MEDIUM", Math.min(m.cves.medium, 5));
  pushVuln("LOW", Math.min(m.cves.low, 8));

  return {
    scanner: "trivy",
    scannerVersion: "0.54.1",
    imageRef: `flareo/build:${m.slug}@sha256:${hexFrom(m.digest, 0, 12)}…`,
    scanTimeMs: 2_800 + (m.slug.length % 11) * 120,
    packagesIndexed: 180 + (m.slug.length % 87),
    vulnerabilities: vulns,
    summary: {
      critical: m.cves.critical,
      high: m.cves.high,
      medium: m.cves.medium,
      low: m.cves.low,
    },
  };
}

function buildSbom(m: Module): SbomShape {
  // Synthesize a small but representative CycloneDX SBOM. The
  // components are realistic for a debian-based container —
  // glibc/openssl/etc — with hashes derived from the module digest.
  const baseLibs = [
    { name: "libc6", version: "2.36-9+deb12u4", license: "LGPL-2.1-or-later" },
    { name: "openssl", version: "3.0.11-1~deb12u2", license: "OpenSSL" },
    { name: "ca-certificates", version: "20230311", license: "MPL-2.0" },
    { name: "zlib1g", version: "1:1.2.13.dfsg-1", license: "Zlib" },
    { name: "libcurl4", version: "7.88.1-10+deb12u4", license: "MIT" },
    { name: "libgnutls30", version: "3.7.9-2+deb12u2", license: "LGPL-2.1-or-later" },
    { name: "libxml2", version: "2.9.14+dfsg-1.3~deb12u1", license: "MIT" },
  ];
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: deterministicSerial(m.slug),
    version: 1,
    metadata: {
      timestamp: deterministicTimestamp(m.slug, 0),
      tools: [
        { vendor: "anchore", name: "syft", version: "1.13.0" },
        { vendor: "flareo", name: "flareo-build", version: "0.4.2" },
      ],
      component: {
        name: m.slug,
        version: m.version,
        type: "container",
      },
    },
    components: [
      {
        type: "operating-system",
        name: "debian",
        version: "12.5",
        purl: "pkg:deb/debian/debian@12.5",
        hashes: [
          { alg: "SHA-256", content: hexFrom(m.digest, 0, 64) },
        ],
        licenses: [{ license: { id: "GPL-2.0-only" } }],
      },
      ...baseLibs.map((l, i) => ({
        type: "library" as const,
        name: l.name,
        version: l.version,
        purl: `pkg:deb/debian/${l.name}@${l.version}?distro=debian-12`,
        hashes: [
          { alg: "SHA-256" as const, content: hexFrom(m.digest, 8 + i * 4, 64) },
        ],
        licenses: [{ license: { id: l.license } }],
      })),
    ],
  };
}

function buildVexPreview(m: Module): VexAnnotationShape {
  // VEX is spec-only — it's planned but not in the live pipeline yet.
  // Generate sample statements for the highest-severity CVEs in the
  // module's Trivy report so the visitor can see how VEX would
  // resolve them.
  const trivy = buildTrivyReport(m);
  const candidates = trivy.vulnerabilities.slice(0, 3);
  return {
    status: "spec-only",
    format: "OpenVEX 0.2.0",
    statements: candidates.map((v, i) => ({
      cve: v.cve,
      status:
        i === 0
          ? "not_affected"
          : i === 1
            ? "under_investigation"
            : "fixed",
      justification:
        i === 0
          ? "vulnerable_code_not_in_execute_path"
          : undefined,
      impactStatement:
        i === 0
          ? "The vulnerable function is included in the dependency but is never reached at runtime in this module's request lifecycle."
          : i === 1
            ? "Reachability analysis is in progress. Initial review suggests low practical impact."
            : "Patched in upstream and applied in this rebuild.",
    })),
  };
}

function buildSlsaProvenance(m: Module): SlsaShape {
  const startedAt = deterministicTimestamp(m.slug, 0);
  const finishedAt = new Date(
    new Date(startedAt).getTime() + 142_000 + (m.slug.length % 13) * 3000,
  ).toISOString();
  return {
    payloadType: "application/vnd.in-toto+json",
    payload: {
      _type: "https://in-toto.io/Statement/v1",
      subject: [
        {
          name: `flareo/${m.slug}`,
          digest: { sha256: m.digest.replace("sha256:", "") },
        },
      ],
      predicateType: "https://slsa.dev/provenance/v1",
      predicate: {
        buildDefinition: {
          buildType:
            "https://flareo.app/buildkit-hermetic@v0.4.2",
          externalParameters: {
            source: `r2://submissions/${m.slug}-${m.version}.tar.zst`,
            sourceSha256: hexFrom(m.digest, 4, 64),
            dockerfilePath: "Dockerfile",
            requestedBy: m.author,
          },
          internalParameters: {
            runtime: "buildkit-0.13.1-hermetic",
          },
          resolvedDependencies: [
            {
              uri: "pkg:docker/debian@12.5",
              digest: { sha256: hexFrom(m.digest, 16, 64) },
            },
          ],
        },
        runDetails: {
          builder: {
            id: "https://github.com/flareo/build@8fa2b19c5",
            version: { buildkit: "0.13.1", trivy: "0.54.1" },
          },
          metadata: {
            invocationId: `flareo-${m.slug}-${hexFrom(m.digest, 0, 8)}`,
            startedOn: startedAt,
            finishedOn: finishedAt,
          },
        },
      },
    },
  };
}

function buildCosignSignature(m: Module): CosignSignatureShape {
  return {
    signature: `MEUCIQDr${hexFrom(m.digest, 0, 64)}AiBN${hexFrom(m.digest, 16, 32)}==`,
    certificate: `-----BEGIN CERTIFICATE-----
MIIDfTCCAwOgAwIBAgITMwAA${hexFrom(m.digest, 0, 32)}…[truncated]
-----END CERTIFICATE-----`,
    bundle: {
      rekorBundle: {
        signedEntryTimestamp: deterministicTimestamp(m.slug, 0),
        payload: {
          logIndex: 30_000_000 + (m.slug.length * 1373) % 800_000,
          integratedTime: Math.floor(
            new Date(deterministicTimestamp(m.slug, 0)).getTime() / 1000,
          ),
        },
      },
    },
    identity: {
      issuer: "https://token.actions.githubusercontent.com",
      subject:
        "https://github.com/flareo/build/.github/workflows/canary-rebuild.yml@refs/heads/main",
      san: "https://github.com/flareo/build/.github/workflows/canary-rebuild.yml@refs/heads/main",
    },
  };
}

function buildRekorEntry(m: Module): RekorEntryShape {
  const uuid = `${hexFrom(m.digest, 0, 16)}${hexFrom(m.digest, 16, 16)}${hexFrom(m.digest, 32, 16)}${hexFrom(m.digest, 48, 16)}`;
  return {
    uuid: uuid,
    logIndex: 30_000_000 + (m.slug.length * 1373) % 800_000,
    integratedTime: deterministicTimestamp(m.slug, 0),
    url: `https://rekor.sigstore.dev/api/v1/log/entries/${uuid.slice(0, 24)}`,
    body: {
      apiVersion: "0.0.1",
      kind: "hashedrekord",
      spec: {
        data: { hash: { algorithm: "sha256", value: m.digest.replace("sha256:", "") } },
        signature: {
          content: `MEUCIQDr${hexFrom(m.digest, 0, 32)}…`,
          publicKey: { content: `LS0tLS1CRUdJTi…[fulcio-issued]` },
        },
      },
    },
  };
}

function buildPolicyDecision(m: Module): PolicyDecisionShape {
  // Spec-only: shape of the gate as it WILL run, evaluated against
  // the module's actual numbers so it shows a real allow/deny.
  const rules: PolicyRule[] = [
    {
      rule: "max_critical_cves",
      pass: m.cves.critical === 0,
      observed: m.cves.critical,
      required: 0,
    },
    {
      rule: "max_high_cves",
      pass: m.cves.high <= 5,
      observed: m.cves.high,
      required: "≤ 5",
    },
    {
      rule: "require_sbom",
      pass: true,
      observed: "present",
      required: "present",
    },
    {
      rule: "require_signature",
      pass: true,
      observed: "cosign-keyless",
      required: "cosign-keyless",
    },
    {
      rule: "require_slsa_level",
      pass: parseInt(m.slsa.replace("L", ""), 10) >= 2,
      observed: m.slsa,
      required: "≥ L2",
    },
  ];
  return {
    status: "spec-only",
    policyFile: "admission-policy.json",
    policyVersion: "0.1.0",
    decision: rules.every((r) => r.pass) ? "allow" : "deny",
    evaluatedRules: rules,
  };
}

function buildPublishReceipt(m: Module): PublishReceiptShape {
  return {
    registry: "ghcr.io",
    imageRef: `ghcr.io/flareo/${m.slug}`,
    digest: m.digest,
    tag: m.version,
    pushedAt: deterministicTimestamp(m.slug, 0),
    marketplaceUrl: `https://flareo.app/modules/${m.slug}`,
  };
}

/**
 * Build the full set of pipeline artifacts for a given module. Stable
 * per module so a reload renders identical content.
 */
export function buildPipelineArtifacts(m: Module): PipelineArtifacts {
  return {
    buildLog: buildBuildLog(m),
    trivyReport: buildTrivyReport(m),
    sbom: buildSbom(m),
    vexPreview: buildVexPreview(m),
    slsaProvenance: buildSlsaProvenance(m),
    cosignSignature: buildCosignSignature(m),
    rekorEntry: buildRekorEntry(m),
    policyDecision: buildPolicyDecision(m),
    publishReceipt: buildPublishReceipt(m),
  };
}
