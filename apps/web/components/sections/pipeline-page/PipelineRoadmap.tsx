/**
 * Closing roadmap section.
 *
 * Earlier iterations of the pipeline page had three stages running in
 * spec-only mode (CNB auto-detect, VEX annotation surface, OPA policy
 * gate) and this section honestly enumerated their target dates and
 * blockers. As of Q2 2026 all three have shipped — the section now
 * makes that explicit rather than rendering an empty grid.
 *
 * If a future stage regresses to spec-only, restore the per-item
 * cards from the git history.
 */
export function PipelineRoadmap() {
  return (
    <section className="border-b border-hairline bg-canvas-deep px-8 py-12">
      <div className="mb-6">
        <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-good">
          ✓ FULLY REALIZED
        </div>
        <h2 className="font-display text-[28px] font-black leading-[1] tracking-[-0.025em] text-ink">
          Every stage above runs in production.
        </h2>
        <p className="mt-3 max-w-[720px] font-body text-[13.5px] leading-[1.6] text-ink-softer">
          Earlier iterations of this page noted three spec-only stages —
          CNB auto-detect, VEX annotation surface, OPA policy gate. All
          three shipped during Q2 2026. The pipeline you see above is the
          pipeline that actually runs against every submission.
        </p>
        <p className="mt-3 max-w-[720px] font-body text-[13px] leading-[1.6] text-ink-softer">
          Honest framing on the OPA stage:{" "}
          <strong className="text-ink">
            we ship JSON-shaped policy with a TypeScript evaluator today,
            not Rego.
          </strong>{" "}
          The data shape matches what an OPA bundle carries internally —
          if we ever need full Rego (custom rules submitted by orgs,
          conditional logic across signals) the runtime is a swap behind
          the same input/output contract. The proposal called this
          &quot;OPA-based;&quot; that&apos;s how we got there.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <a
            href="/app/admin/policy"
            className="block border border-hairline bg-canvas p-4 transition-colors hover:border-accent"
          >
            <div className="mb-1 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
              ADMIN
            </div>
            <div className="font-display text-[16px] font-black tracking-[-0.02em] text-ink">
              Edit the active policy →
            </div>
            <div className="mt-1 font-body text-[11.5px] text-ink-softer">
              Reviewer-only. Save creates a new revision; older
              revisions stay in the audit trail.
            </div>
          </a>
          <a
            href="/app/admin/vex"
            className="block border border-hairline bg-canvas p-4 transition-colors hover:border-accent"
          >
            <div className="mb-1 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
              ADMIN
            </div>
            <div className="font-display text-[16px] font-black tracking-[-0.02em] text-ink">
              Annotate VEX statements →
            </div>
            <div className="mt-1 font-body text-[11.5px] text-ink-softer">
              Mark Trivy findings not_affected / fixed / under
              investigation per OpenVEX 0.2.0.
            </div>
          </a>
          <a
            href="/roadmap"
            className="block border border-hairline bg-canvas p-4 transition-colors hover:border-accent"
          >
            <div className="mb-1 font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">
              PUBLIC
            </div>
            <div className="font-display text-[16px] font-black tracking-[-0.02em] text-ink">
              See full product roadmap →
            </div>
            <div className="mt-1 font-body text-[11.5px] text-ink-softer">
              What&apos;s shipped, what&apos;s in progress, what&apos;s
              planned. Honest dates only.
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
