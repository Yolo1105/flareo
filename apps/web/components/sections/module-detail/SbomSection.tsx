import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Module } from "@/lib/types";

const SAMPLE_PACKAGES = [
  { name: "tokio", version: "1.36.0", license: "MIT", size: "420KB" },
  { name: "rocket", version: "0.5.0", license: "MIT/Apache-2.0", size: "180KB" },
  { name: "diesel", version: "2.1.4", license: "MIT/Apache-2.0", size: "96KB" },
  { name: "serde", version: "1.0.196", license: "MIT/Apache-2.0", size: "72KB" },
  { name: "jsonwebtoken", version: "9.3.0", license: "MIT", size: "34KB" },
  { name: "chrono", version: "0.4.34", license: "MIT/Apache-2.0", size: "58KB" },
  { name: "reqwest", version: "0.11.24", license: "MIT/Apache-2.0", size: "104KB" },
  { name: "glibc", version: "2.36-9+deb12u4", license: "LGPL-2.1", size: "2.1MB" },
];

interface Props {
  module: Module;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SbomSection({ module: _module }: Props) {
  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="04"
        label="SBOM"
        title="Every package, every version, every license."
      >
        CycloneDX 1.4 format. Downloadable as JSON or XML. When the next
        CVE lands, you can grep this file instead of guessing whether
        your image is affected.
      </SectionHeader>

      <div className="grid grid-cols-[320px_1fr] gap-6">
        <div className="border border-hairline bg-canvas-deep p-5">
          <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-accent">
            SBOM META
          </div>
          <dl className="space-y-2 font-mono text-[11.5px]">
            <div className="flex justify-between border-b border-hairline pb-2">
              <dt className="text-ink-faint">format</dt>
              <dd className="text-ink">CycloneDX 1.4</dd>
            </div>
            <div className="flex justify-between border-b border-hairline pb-2">
              <dt className="text-ink-faint">packages</dt>
              <dd className="text-ink">48</dd>
            </div>
            <div className="flex justify-between border-b border-hairline pb-2">
              <dt className="text-ink-faint">size</dt>
              <dd className="text-ink">210 KB</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-faint">licenses</dt>
              <dd className="text-ink">6 unique</dd>
            </div>
          </dl>
          <button className="mt-4 w-full border border-hairline bg-canvas-panel px-3 py-2 font-mono text-[11px] tracking-[0.04em] text-accent transition-colors hover:border-accent">
            ↓ Download SBOM (JSON)
          </button>
        </div>

        <div className="border border-hairline bg-canvas-deep">
          <div className="grid grid-cols-[2fr_1fr_1.5fr_80px] gap-4 border-b border-hairline bg-canvas-panel px-5 py-3 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint">
            <div>PACKAGE</div>
            <div>VERSION</div>
            <div>LICENSE</div>
            <div className="text-right">SIZE</div>
          </div>
          {SAMPLE_PACKAGES.map((p, i) => (
            <div
              key={p.name}
              className={`grid grid-cols-[2fr_1fr_1.5fr_80px] items-center gap-4 px-5 py-2.5 font-mono text-[11.5px] ${
                i < SAMPLE_PACKAGES.length - 1
                  ? "border-b border-hairline"
                  : ""
              }`}
            >
              <div className="text-ink">{p.name}</div>
              <div className="text-blue">{p.version}</div>
              <div className="text-ink-mute">{p.license}</div>
              <div className="text-right text-ink-faint">{p.size}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
