import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * The landing's install block. Source build is the primary path until
 * signed release binaries are actually produced by the release workflow.
 */
export function InstallSection() {
  return (
    <section id="install" className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="§"
        label="INSTALL"
        title="Build from source."
      >
        The Flareo CLI is a Rust binary. Until signed release artifacts
        are published, install by building from the repository. Requires
        a Rust toolchain (1.80+).
      </SectionHeader>

      <div className="grid grid-cols-3 border border-hairline">
        <div className="col-span-3 border-b border-hairline bg-canvas-deep p-6 md:col-span-2 md:border-b-0 md:border-r">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            SOURCE / RECOMMENDED
          </div>
          <div className="space-y-1 overflow-x-auto font-mono text-[13px] leading-[1.55] text-ink">
            <div>
              <span className="text-accent">$</span> git clone
              https://github.com/Yolo1105/flareo.git
            </div>
            <div>
              <span className="text-accent">$</span> cd flareo/packages/cli
            </div>
            <div>
              <span className="text-accent">$</span> cargo build --release
            </div>
            <div className="text-ink-faint">
              # binary: target/release/flareo
            </div>
          </div>
        </div>
        <div className="col-span-3 grid grid-cols-2 md:col-span-1 md:grid-cols-1">
          <div className="border-b border-hairline p-5">
            <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              RELEASES
            </div>
            <p className="font-body text-[12px] leading-[1.5] text-ink-softer">
              Signed release binaries will be published once the release
              workflow runs. Until then, build from source.
            </p>
          </div>
          <div className="p-5">
            <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              DOCS
            </div>
            <div className="overflow-x-auto whitespace-nowrap font-mono text-[12px] text-ink">
              <span className="text-accent">→</span> /docs/install
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
