import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * The landing's install block. Three-cell grid with the curl-pipe
 * one-liner prominent on the left. Mirrored on CLI reference.
 */
export function InstallSection() {
  return (
    <section id="install" className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="§"
        label="INSTALL"
        title="One line. Zero dependencies."
      >
        Install the Flareo CLI in 3 seconds. Binary is 8 MB statically
        linked — no Node, Python, Java, or Docker required. Works on
        macOS and Linux, amd64 and arm64.
      </SectionHeader>

      <div className="grid grid-cols-3 border border-hairline">
        <div className="col-span-3 border-b border-hairline bg-canvas-deep p-6 md:col-span-2 md:border-b-0 md:border-r">
          <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            SHELL / RECOMMENDED
          </div>
          <div className="overflow-x-auto whitespace-nowrap font-mono text-[15px] text-ink">
            <span className="text-accent">$</span> /bin/bash -c &quot;$(curl -fsSL
            https://flareo.sh/install)&quot;
          </div>
        </div>
        <div className="col-span-3 grid grid-cols-2 md:col-span-1 md:grid-cols-1">
          <div className="border-b border-hairline p-5">
            <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              HOMEBREW
            </div>
            <div className="overflow-x-auto whitespace-nowrap font-mono text-[12px] text-ink">
              <span className="text-accent">$</span> brew install flareo
            </div>
          </div>
          <div className="p-5">
            <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              CARGO
            </div>
            <div className="overflow-x-auto whitespace-nowrap font-mono text-[12px] text-ink">
              <span className="text-accent">$</span> cargo install flareo-cli
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
