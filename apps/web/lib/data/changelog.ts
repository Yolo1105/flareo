import type { ChangelogEntry } from "@/lib/types";

/**
 * Real-feeling changelog for Flareo's public beta.
 * Replaces the fake blog posts from the original JSX — for a product in
 * public beta, shipped changes are more interesting than marketing essays.
 */
export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: "0.4.2",
    date: "2026-04-18",
    title: "Provenance attestation format update",
    summary:
      "SLSA provenance attestations now include the full BuildKit frontend version and build argument hashes. Existing attestations remain verifiable; new builds emit the richer predicate.",
    changes: [
      { kind: "feature", text: "Emit BuildKit frontend version in in-toto predicate" },
      { kind: "feature", text: "Hash-sealed build arguments included in provenance subject" },
      { kind: "fix", text: "Rekor entry URL was occasionally truncated in verify output" },
      { kind: "fix", text: "flareo search --json now emits valid JSONL when 0 results" },
    ],
  },
  {
    version: "0.4.1",
    date: "2026-04-09",
    title: "Trivy 0.54.1 → 0.54.2 incident fix",
    summary:
      "Pinned Trivy to the 0.54.1 release across all workers after an upstream schema change caused 37 minutes of degraded scan throughput. Post-mortem published in the architecture repo.",
    changes: [
      { kind: "fix", text: "Pin Trivy binary to 0.54.1 pending schema stabilization" },
      { kind: "fix", text: "Scan retry logic now distinguishes panic from timeout" },
      { kind: "feature", text: "Add scan_stage_p99_duration alert at 3× baseline threshold" },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-03-27",
    title: "Public status page launched",
    summary:
      "flareo.sh/status now shows real 90-day component health, incident history, and the exact SQL queries behind every metric. No smoothed averages, no marketing spin.",
    changes: [
      { kind: "feature", text: "Live /status dashboard at flareo.sh/status" },
      { kind: "feature", text: "Published SQL for uptime, scan pass, stage p50 metrics" },
      { kind: "feature", text: "Subscribe via email, RSS, webhook, or Slack webhook" },
      { kind: "feature", text: "90-day service-level bar charts per component" },
    ],
  },
  {
    version: "0.3.8",
    date: "2026-03-12",
    title: "CLI: flareo verify command",
    summary:
      "The three-check verification suite is now available as a standalone CLI command. Run cosign, trivy, and slsa-verifier against any image without pulling.",
    changes: [
      { kind: "feature", text: "New `flareo verify <image>` command with --strict and --require-slsa flags" },
      { kind: "feature", text: "Exit code 4 reserved for verification failures (CI-friendly)" },
      { kind: "fix", text: "flareo pull now auto-verifies signatures before loading into docker" },
    ],
  },
  {
    version: "0.3.5",
    date: "2026-02-28",
    title: "Catalog reaches 10 verified modules",
    summary:
      "Keycloak, Grafana, and CrowdSec joined the catalog. Total build throughput reached 41 pipelines per 7-day window.",
    changes: [
      { kind: "feature", text: "Keycloak 24.0.3 verified and published" },
      { kind: "feature", text: "Grafana 10.2.3 verified and published" },
      { kind: "feature", text: "CrowdSec 1.6.0 verified and published" },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-02-05",
    title: "Sandbox preview feature (beta)",
    summary:
      "Every previewable module can now be spun up in a 30-minute disposable Firecracker microVM, proxied to a unique subdomain. See the live demo at flareo.sh/sandbox.",
    changes: [
      { kind: "feature", text: "Live sandbox sessions via Firecracker + Caddy" },
      { kind: "feature", text: "30-minute hard TTL with atomic teardown" },
      { kind: "feature", text: "Egress deny-all by default; sandboxes can receive but not initiate traffic" },
      { kind: "security", text: "No shared filesystem or network namespace between sandbox sessions" },
    ],
  },
  {
    version: "0.2.0",
    date: "2025-12-15",
    title: "Public beta opens",
    summary:
      "Flareo enters public beta with 5 verified modules, the full 6-stage pipeline, and no card required for any tier. Paid billing starts September 2026 with 30 days advance notice.",
    changes: [
      { kind: "breaking", text: "flareo.sh is now publicly accessible; invite-only closed beta ended" },
      { kind: "feature", text: "Early 5 modules: Vaultwarden, Caddy, Nginx Proxy Manager, Uptime Kuma, Authentik" },
      { kind: "feature", text: "Keyless cosign signing via Sigstore Fulcio and Rekor" },
    ],
  },
];
