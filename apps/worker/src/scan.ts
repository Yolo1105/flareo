/**
 * Post-build CVE scanning and SBOM generation.
 *
 * Trivy does both — one pass over the image produces both the CVE
 * report and a CycloneDX SBOM. We call it twice rather than trying
 * to parse one combined output, because Trivy's output modes aren't
 * designed to be combined in one invocation.
 */

import { spawn } from "node:child_process";

export interface ScanResult {
  /** True if the image has zero CRITICAL or HIGH CVEs. */
  pass: boolean;
  /** Parsed CVE identifiers (for email / UI display). */
  cves: { id: string; severity: string; pkg: string }[];
  /** Raw Trivy JSON output for archival. */
  rawJson: string;
  /** Human-readable summary for logs. */
  summary: string;
}

/**
 * Run Trivy against the built image, rejecting on CRITICAL/HIGH.
 */
export async function scanImage(imageTag: string): Promise<ScanResult> {
  return await new Promise<ScanResult>((resolve) => {
    // --exit-code 1 on finding; --severity filters the results; JSON
    // format for downstream parsing.
    const child = spawn(
      "trivy",
      [
        "image",
        "--severity",
        "CRITICAL,HIGH",
        "--format",
        "json",
        "--quiet",
        imageTag,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (c: Buffer) => out.push(c));
    child.stderr.on("data", (c: Buffer) => err.push(c));

    child.on("close", (code) => {
      const rawJson = Buffer.concat(out).toString("utf8");
      const stderr = Buffer.concat(err).toString("utf8");

      // Trivy returns 0 when no findings, non-zero when findings OR
      // when it crashes. Distinguish by whether stdout is parseable.
      let cves: ScanResult["cves"] = [];
      try {
        const parsed = JSON.parse(rawJson) as {
          Results?: Array<{
            Vulnerabilities?: Array<{
              VulnerabilityID: string;
              Severity: string;
              PkgName: string;
            }>;
          }>;
        };
        for (const r of parsed.Results ?? []) {
          for (const v of r.Vulnerabilities ?? []) {
            cves.push({
              id: v.VulnerabilityID,
              severity: v.Severity,
              pkg: v.PkgName,
            });
          }
        }
      } catch {
        // JSON parse fail means Trivy itself errored. Treat as system
        // failure rather than scan rejection.
        resolve({
          pass: false,
          cves: [],
          rawJson: "",
          summary: `trivy failed to produce JSON output. stderr: ${stderr.slice(0, 500)}`,
        });
        return;
      }

      const pass = cves.length === 0 && code === 0;
      resolve({
        pass,
        cves,
        rawJson,
        summary:
          cves.length === 0
            ? "No CRITICAL/HIGH CVEs found."
            : `${cves.length} CRITICAL/HIGH CVE${cves.length === 1 ? "" : "s"}: ${cves
                .slice(0, 5)
                .map((c) => `${c.id} (${c.pkg})`)
                .join(", ")}${cves.length > 5 ? "…" : ""}`,
      });
    });

    child.on("error", (e) => {
      resolve({
        pass: false,
        cves: [],
        rawJson: "",
        summary: `failed to spawn trivy: ${e.message}`,
      });
    });
  });
}

export interface SbomResult {
  cyclonedxJson: string;
  packageCount: number;
}

/**
 * Generate a CycloneDX-format SBOM for the image.
 */
export async function generateSbom(imageTag: string): Promise<SbomResult> {
  return await new Promise<SbomResult>((resolve, reject) => {
    const child = spawn(
      "trivy",
      [
        "image",
        "--format",
        "cyclonedx",
        "--quiet",
        imageTag,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (c: Buffer) => out.push(c));
    child.stderr.on("data", (c: Buffer) => err.push(c));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `sbom generation failed (exit ${code}): ${Buffer.concat(err).toString("utf8").slice(0, 500)}`
          )
        );
        return;
      }
      const cyclonedxJson = Buffer.concat(out).toString("utf8");
      let packageCount = 0;
      try {
        const parsed = JSON.parse(cyclonedxJson) as {
          components?: unknown[];
        };
        packageCount = parsed.components?.length ?? 0;
      } catch {
        // Malformed but non-empty — keep going, don't block.
      }
      resolve({ cyclonedxJson, packageCount });
    });

    child.on("error", (e) => reject(e));
  });
}
