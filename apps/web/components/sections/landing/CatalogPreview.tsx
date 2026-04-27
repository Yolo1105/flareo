import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MODULES } from "@/lib/data/modules";
import { StatusBadge } from "@/components/ui/StatusBadge";

/**
 * Landing's catalog preview — shows the 4 most-deployed modules.
 * Full catalog view lives at /catalog.
 */
export function CatalogPreview() {
  const featured = [...MODULES]
    .sort((a, b) => b.deploys - a.deploys)
    .slice(0, 4);

  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="03"
        label="THE CATALOG"
        title="12 modules today, growing every week."
      >
        Every module has a verified signature, a current SBOM, a SLSA L2+
        attestation, and a one-line pull command. Click any row to see the
        full receipts.
      </SectionHeader>

      <div className="border border-hairline bg-canvas-deep">
        {featured.map((m, i) => (
          <Link
            key={m.slug}
            href={`/modules/${m.slug}`}
            className={`grid grid-cols-[50px_2fr_1fr_140px] items-center gap-4 px-5 py-5 transition-colors hover:bg-canvas-panel ${
              i < featured.length - 1 ? "border-b border-hairline" : ""
            }`}
          >
            <div className="font-mono text-[10.5px] tracking-[0.08em] text-ink-ghost">
              [{String(i + 1).padStart(2, "0")}]
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <span className="font-display text-[18px] font-black leading-[1] tracking-[-0.025em] text-ink">
                  {m.name}
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.02em] text-ink-faint">
                  v{m.version}
                </span>
                <StatusBadge
                  tone={
                    m.status === "verified"
                      ? "ok"
                      : m.status === "pending"
                        ? "warn"
                        : "bad"
                  }
                >
                  {m.status.toUpperCase()}
                </StatusBadge>
              </div>
              <div className="font-body text-[13px] text-ink-softer">
                {m.description}
              </div>
            </div>
            <div className="font-mono text-[11.5px] text-ink-mute">
              <span className="text-accent">$</span> flareo pull {m.slug}
            </div>
            <div className="text-right">
              <div
                className={`font-display text-[32px] font-black leading-[1] tracking-[-0.03em] ${
                  m.trust >= 90
                    ? "text-good"
                    : m.trust >= 70
                      ? "text-warn"
                      : "text-bad"
                }`}
              >
                {m.trust}
              </div>
              <div className="mt-1 font-mono text-[9.5px] tracking-[0.1em] text-ink-ghost">
                TRUST SCORE
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          href="/catalog"
          className="font-mono text-[11.5px] tracking-[0.08em] text-accent transition-colors hover:text-accent-hot"
        >
          VIEW ALL 12 MODULES →
        </Link>
      </div>
    </section>
  );
}
