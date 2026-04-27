import type { Module } from "@/lib/types";
import type { TrivyReportShape } from "@/lib/data/pipeline-artifacts";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StageShell } from "./StageShell";

interface Props {
  module: Module;
  report: TrivyReportShape;
}

export function Stage02Trivy({ module, report }: Props) {
  const total =
    report.summary.critical +
    report.summary.high +
    report.summary.medium +
    report.summary.low;
  const cleanScan = report.summary.critical + report.summary.high === 0;

  return (
    <StageShell
      number="02"
      anchorId="stage-trivy"
      title="Trivy · CVE scan against NVD + advisories"
      subtitle="Every layer of the built image is scanned against the National Vulnerability Database and OS advisory feeds. Critical CVEs auto-reject; high CVEs require explicit submitter justification. The scan report becomes part of the module's permanent record."
      status="built"
      durationLabel="≈ 2-5s scan time"
    >
      {/* Severity histogram strip */}
      <div className="grid grid-cols-4 gap-px border border-hairline bg-hairline">
        {(
          [
            ["critical", report.summary.critical, "text-bad", "border-bad"],
            ["high", report.summary.high, "text-warn", "border-warn"],
            ["medium", report.summary.medium, "text-ink", "border-hairline"],
            ["low", report.summary.low, "text-ink-mute", "border-hairline"],
          ] as const
        ).map(([label, val, tone]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-3 bg-canvas-deep px-4 py-3"
          >
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-ghost">
              {label.toUpperCase()}
            </span>
            <span
              className={`font-display text-[28px] font-black leading-none tracking-[-0.02em] ${tone}`}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      <TerminalBlock
        title={`trivy image ${report.imageRef}`}
        status={{
          tone: cleanScan ? "ok" : "warn",
          label: cleanScan
            ? `CLEAN · ${report.scanTimeMs}ms`
            : `${report.summary.critical + report.summary.high} ACTIONABLE`,
        }}
      >
        <div className="p-5 font-mono text-[11px] leading-[1.7] text-ink-mute">
          <div className="text-ink-ghost">
            ${" "}
            <span className="text-ink">
              trivy image --severity ALL --format json {report.imageRef.split("@")[0]}
            </span>
          </div>
          <div className="mt-1 text-ink-faint">
            {`Scanner: ${report.scanner} ${report.scannerVersion}`}
          </div>
          <div className="text-ink-faint">
            {`OS: debian 12.5 · packages indexed: ${report.packagesIndexed}`}
          </div>
          <div className="mt-3">
            {total === 0 ? (
              <span className="text-good">
                ✓ No vulnerabilities matched.
              </span>
            ) : (
              <span>
                Found <span className="text-ink">{total}</span>{" "}
                vulnerabilities.
              </span>
            )}
          </div>
        </div>
      </TerminalBlock>

      {report.vulnerabilities.length > 0 && (
        <div className="overflow-x-auto border border-hairline bg-canvas-deep">
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="border-b border-hairline bg-canvas-panel text-left text-ink-faint">
                <th className="px-4 py-2.5 font-medium tracking-[0.04em]">CVE</th>
                <th className="px-4 py-2.5 font-medium tracking-[0.04em]">PKG</th>
                <th className="px-4 py-2.5 font-medium tracking-[0.04em]">
                  INSTALLED
                </th>
                <th className="px-4 py-2.5 font-medium tracking-[0.04em]">FIXED</th>
                <th className="px-4 py-2.5 font-medium tracking-[0.04em]">
                  SEVERITY
                </th>
              </tr>
            </thead>
            <tbody>
              {report.vulnerabilities.slice(0, 8).map((v) => (
                <tr key={v.cve} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-2.5 text-accent">{v.cve}</td>
                  <td className="px-4 py-2.5 text-ink">{v.pkgName}</td>
                  <td className="px-4 py-2.5 text-ink-mute">
                    {v.installedVersion}
                  </td>
                  <td className="px-4 py-2.5 text-ink-mute">
                    {v.fixedVersion ?? <span className="text-bad">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <SeverityChip severity={v.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.vulnerabilities.length > 8 && (
            <div className="border-t border-hairline px-4 py-2 font-mono text-[10.5px] text-ink-ghost">
              + {report.vulnerabilities.length - 8} more — full report at{" "}
              <span className="text-accent">
                /modules/{module.slug}#receipts
              </span>
            </div>
          )}
        </div>
      )}
    </StageShell>
  );
}

function SeverityChip({
  severity,
}: {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}) {
  const cls =
    severity === "CRITICAL"
      ? "border-bad text-bad"
      : severity === "HIGH"
        ? "border-warn text-warn"
        : severity === "MEDIUM"
          ? "border-hairline text-ink-mute"
          : "border-hairline text-ink-faint";
  return (
    <span className={`inline-block border px-1.5 py-0.5 text-[9.5px] tracking-[0.1em] ${cls}`}>
      {severity}
    </span>
  );
}
