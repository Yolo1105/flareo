import type { Module } from "@/lib/types";
import type { PolicyDecisionShape } from "@/lib/data/pipeline-artifacts";
import { TerminalBlock } from "@/components/ui/TerminalBlock";
import { StageShell } from "./StageShell";

interface Props {
  module: Module;
  decision: PolicyDecisionShape;
}

export function Stage07Policy({ module, decision }: Props) {
  const allow = decision.decision === "allow";
  return (
    <StageShell
      number="07"
      anchorId="stage-policy"
      title="Policy-as-code · admission gate"
      subtitle="Before a module is published, the canary chain evaluates it against the active admission policy — a versioned, declarative document specifying what the catalog accepts. Maximum critical CVEs, required attestations, minimum SLSA level. If the policy denies, the module is held for human review even if all the cryptographic checks passed."
      status="built"
      durationLabel="≈ 5-15ms eval time"
    >
      <div className="border border-good/40 bg-good/[0.04] p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.14em] text-good">
            ✓ NOW IN PRODUCTION
          </span>
        </div>
        <p className="font-body text-[13px] leading-[1.6] text-ink-softer">
          The active policy is editable at{" "}
          <code className="font-mono text-[12px] text-accent">
            /app/admin/policy
          </code>{" "}
          — every save creates a new revision, every revision is captured
          in an audit trail. Verdicts are cached per module and exposed at{" "}
          <code className="font-mono text-[12px] text-accent">
            /api/v1/modules/{module.slug}/policy
          </code>
          . The policy is OPA-shaped JSON; the evaluator is pure
          TypeScript today, with Rego as a future runtime swap behind
          the same input/output contract.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
        <div className="border border-hairline bg-canvas-deep">
          <div className="border-b border-hairline bg-canvas-panel px-4 py-2.5">
            <span className="font-mono text-[10.5px] tracking-[0.04em] text-ink-faint">
              policy evaluation · {decision.policyFile} v{decision.policyVersion}
            </span>
          </div>
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="border-b border-hairline text-left text-ink-faint">
                <th className="px-4 py-2 font-medium tracking-[0.04em]">RULE</th>
                <th className="px-4 py-2 font-medium tracking-[0.04em]">
                  OBSERVED
                </th>
                <th className="px-4 py-2 font-medium tracking-[0.04em]">
                  REQUIRED
                </th>
                <th className="px-4 py-2 font-medium tracking-[0.04em]">
                  RESULT
                </th>
              </tr>
            </thead>
            <tbody>
              {decision.evaluatedRules.map((r) => (
                <tr
                  key={r.rule}
                  className="border-b border-hairline last:border-0"
                >
                  <td className="px-4 py-2.5 text-ink">{r.rule}</td>
                  <td className="px-4 py-2.5 text-ink-mute">{String(r.observed)}</td>
                  <td className="px-4 py-2.5 text-ink-mute">{String(r.required)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        r.pass ? "text-good" : "text-bad"
                      }`}
                    >
                      <span
                        className={`block h-1.5 w-1.5 rounded-full ${
                          r.pass ? "bg-good" : "bg-bad"
                        }`}
                      />
                      {r.pass ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-center border border-hairline bg-canvas-deep p-6">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
            DECISION
          </div>
          <div
            className={`font-display text-[44px] font-black leading-[0.85] tracking-[-0.04em] ${
              allow ? "text-good" : "text-bad"
            }`}
          >
            {allow ? "ALLOW" : "DENY"}
          </div>
          <div className="mt-2 text-center font-body text-[11.5px] leading-[1.4] text-ink-softer">
            {allow
              ? `${module.slug} cleared all rules — promotion to public catalog approved.`
              : `${module.slug} failed one or more rules — held for human review.`}
          </div>
        </div>
      </div>

      <TerminalBlock
        title="admission-policy.json · the gate's source of truth"
        status={{ tone: "ok", label: "EXAMPLE · live at /api/v1/modules/<slug>/policy" }}
      >
        <pre className="overflow-x-auto p-5 font-mono text-[10.5px] leading-[1.65] text-ink-mute">
{`{
  "$schema": "https://flareo.app/schemas/admission-policy/0.1.0.json",
  "version": "${decision.policyVersion}",
  "rules": {
    "max_critical_cves": 0,
    "max_high_cves": 5,
    "require_sbom": true,
    "require_signature": "cosign-keyless",
    "require_provenance": "signed provenance, upstream digest recorded",
    "minimal_base_image_required": false,
    "allowed_licenses": ["MIT", "Apache-2.0", "BSD-*", "ISC", "MPL-*", "GPL-*", "LGPL-*"],
    "block_packages": []
  },
  "appeals": {
    "high_cve_overrides_via": "vex_not_affected_statement"
  }
}`}
        </pre>
      </TerminalBlock>
    </StageShell>
  );
}
