import { PageHero } from "@/components/ui/PageHero";
import { CLI_COMMANDS, GLOBAL_FLAGS } from "@/lib/data/cli";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLI Reference",
  description:
    "Complete reference for the Flareo command line tool. Every command, every flag, every exit code.",
};

const EXIT_CODES = [
  { code: "0", name: "OK", desc: "Success. Output reliable.", tone: "ok" as const },
  { code: "1", name: "GENERAL", desc: "Unrecoverable error. Check stderr.", tone: "bad" as const },
  { code: "2", name: "USAGE", desc: "Invalid flags or arguments.", tone: "bad" as const },
  { code: "3", name: "AUTH", desc: "Missing or expired token.", tone: "bad" as const },
  { code: "4", name: "VERIFY", desc: "Signature or provenance failed.", tone: "bad" as const },
  { code: "5", name: "NETWORK", desc: "Timeout or connection error.", tone: "warn" as const },
];

export default function CliReferencePage() {
  return (
    <>
      <PageHero
        eyebrow="DOCS / CLI REFERENCE"
        prompt="flareo --help"
        promptComment="# 12 commands · 0.4.2"
        size="medium"
        title={
          <>
            THE FLAREO CLI.
            <br />
            EVERY COMMAND, EVERY FLAG.
          </>
        }
      >
        Complete reference for the Flareo command line tool. Twelve commands,
        built on a single binary, roughly 8 MB statically linked.{" "}
        <span className="text-ink">Works on macOS and Linux</span>, x86_64
        and arm64. No runtime dependencies beyond a POSIX shell.
      </PageHero>

      <div className="grid grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="sticky top-[122px] max-h-[calc(100vh-122px)] self-start overflow-y-auto border-r border-hairline py-7">
          <div className="mb-5">
            <div className="mb-2 border-b border-hairline px-6 pb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-ghost">
              GETTING STARTED
            </div>
            <a
              href="#install"
              className="grid grid-cols-[30px_1fr] items-center gap-2 border-l-2 border-transparent py-1.5 pl-4.5 pr-6 font-mono text-[12px] tracking-[0.02em] text-ink-faint transition-colors hover:border-ink-ghost hover:text-ink"
            >
              <span className="text-right text-[10.5px] text-ink-ghost">§</span>
              install
            </a>
            <a
              href="#global"
              className="grid grid-cols-[30px_1fr] items-center gap-2 border-l-2 border-transparent py-1.5 pl-4.5 pr-6 font-mono text-[12px] tracking-[0.02em] text-ink-faint transition-colors hover:border-ink-ghost hover:text-ink"
            >
              <span className="text-right text-[10.5px] text-ink-ghost">§</span>
              global flags
            </a>
          </div>
          <div className="mb-5">
            <div className="mb-2 border-b border-hairline px-6 pb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-ghost">
              COMMANDS
            </div>
            {CLI_COMMANDS.map((c) => (
              <a
                key={c.slug}
                href={`#flareo-${c.slug}`}
                className="grid grid-cols-[30px_1fr] items-center gap-2 border-l-2 border-transparent py-1.5 pl-4.5 pr-6 font-mono text-[12px] tracking-[0.02em] text-ink-faint transition-colors hover:border-ink-ghost hover:text-ink"
              >
                <span className="text-right text-[10.5px] text-ink-ghost">
                  {c.num}
                </span>
                flareo {c.slug}
              </a>
            ))}
          </div>
          <div>
            <div className="mb-2 border-b border-hairline px-6 pb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-ghost">
              REFERENCE
            </div>
            <a
              href="#exit-codes"
              className="grid grid-cols-[30px_1fr] items-center gap-2 border-l-2 border-transparent py-1.5 pl-4.5 pr-6 font-mono text-[12px] tracking-[0.02em] text-ink-faint transition-colors hover:border-ink-ghost hover:text-ink"
            >
              <span className="text-right text-[10.5px] text-ink-ghost">§</span>
              exit codes
            </a>
          </div>
        </aside>

        {/* Main */}
        <main className="max-w-[920px] px-10 pb-16 pt-7">
          {/* Install */}
          <section id="install" className="mb-8 border-b border-hairline pb-7">
            <div className="mb-2.5 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
              § INSTALL
            </div>
            <h2 className="mb-2.5 font-display text-[26px] font-black leading-[1.1] tracking-[-0.03em] text-ink">
              Get the binary.
            </h2>
            <p className="mb-4 max-w-[620px] font-body text-[14.5px] leading-[1.65] text-ink-softer">
              Pick the install path that matches your setup. The{" "}
              <span className="text-ink">one-line curl script</span> is the
              fastest; package managers are recommended for reproducible
              machine setup.
            </p>
            <div className="grid grid-cols-3 border border-hairline">
              <div className="border-r border-hairline bg-canvas-deep p-4">
                <div className="mb-1.5 font-mono text-[9.5px] font-medium tracking-[0.14em] text-ink-faint">
                  SHELL
                </div>
                <div className="overflow-x-auto whitespace-nowrap font-mono text-[12px] text-ink">
                  <span className="text-accent">$</span> /bin/bash -c
                  &quot;$(curl -fsSL https://flareo.sh/install)&quot;
                </div>
              </div>
              <div className="border-r border-hairline bg-canvas-deep p-4">
                <div className="mb-1.5 font-mono text-[9.5px] font-medium tracking-[0.14em] text-ink-faint">
                  HOMEBREW
                </div>
                <div className="font-mono text-[12px] text-ink">
                  <span className="text-accent">$</span> brew install flareo
                </div>
              </div>
              <div className="bg-canvas-deep p-4">
                <div className="mb-1.5 font-mono text-[9.5px] font-medium tracking-[0.14em] text-ink-faint">
                  CARGO
                </div>
                <div className="font-mono text-[12px] text-ink">
                  <span className="text-accent">$</span> cargo install flareo-cli
                </div>
              </div>
            </div>
          </section>

          {/* Global Flags */}
          <section id="global" className="mb-10 border-b border-hairline pb-10">
            <div className="mb-2 flex items-baseline gap-3">
              <span className="font-mono text-[11px] tracking-[0.08em] text-ink-ghost">
                §
              </span>
              <h2 className="font-display text-[22px] font-black leading-[1] tracking-[-0.025em] text-ink">
                Global flags
              </h2>
            </div>
            <p className="mb-4 max-w-[640px] font-body text-[14px] leading-[1.65] text-ink-softer">
              These flags work on every flareo subcommand. Flag precedence
              goes{" "}
              <span className="text-ink">
                command-line &gt; environment variable &gt; config file &gt;
                default
              </span>
              .
            </p>
            <div className="border border-hairline font-mono text-[11.5px]">
              <div className="grid grid-cols-[230px_1fr_80px] gap-4 border-b border-hairline bg-canvas-panel px-4 py-2.5 text-[10px] font-medium tracking-[0.12em] text-ink-faint">
                <div>FLAG</div>
                <div>DESCRIPTION</div>
                <div>DEFAULT</div>
              </div>
              {GLOBAL_FLAGS.map((f, i) => (
                <div
                  key={f.flag}
                  className={`grid grid-cols-[230px_1fr_80px] gap-4 px-4 py-2.5 text-ink-softer leading-[1.55] ${
                    i < GLOBAL_FLAGS.length - 1 ? "border-b border-hairline" : ""
                  }`}
                >
                  <div>
                    <span className="text-blue">{f.flag}</span>
                    <span className="ml-1.5 text-[10.5px] text-accent">
                      {f.type}
                    </span>
                  </div>
                  <div className="font-body text-[12.5px] text-ink-mute leading-[1.55]">
                    {f.description}
                  </div>
                  <div className="text-right text-[10.5px] text-ink-ghost">
                    {f.default}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Commands */}
          {CLI_COMMANDS.map((cmd) => (
            <section
              key={cmd.slug}
              id={`flareo-${cmd.slug}`}
              className="scroll-mt-[110px] border-b border-hairline py-10 last:border-b-0"
            >
              <div className="mb-1 flex items-baseline gap-3">
                <span className="font-mono text-[11px] tracking-[0.08em] text-ink-ghost">
                  {cmd.num}
                </span>
                <span className="font-display text-[26px] font-black leading-[1] tracking-[-0.025em] text-ink">
                  {cmd.name}
                </span>
                <div className="ml-auto">
                  <StatusBadge tone={cmd.auth ? "warn" : "ok"}>
                    {cmd.auth ? "AUTH" : "NO AUTH"}
                  </StatusBadge>
                </div>
              </div>
              <p className="mb-5 max-w-[640px] font-body text-[14px] leading-[1.65] text-ink-softer">
                {cmd.description}
              </p>
              <div className="mb-4 border border-hairline bg-canvas-deep px-4 py-3 font-mono text-[12.5px] leading-[1.7] text-ink-mute">
                <div className="mb-1.5 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-faint">
                  USAGE
                </div>
                <span className="text-accent">$</span> {cmd.usage}
              </div>

              {cmd.flags && cmd.flags.length > 0 && (
                <>
                  <div className="mt-5 mb-2.5 flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
                    FLAGS
                    <div className="flex-1 h-px bg-hairline" />
                  </div>
                  <div className="border border-hairline font-mono text-[11.5px]">
                    {cmd.flags.map((f, i) => (
                      <div
                        key={f.flag}
                        className={`grid grid-cols-[230px_1fr_80px] gap-4 px-4 py-2.5 text-ink-softer leading-[1.55] ${
                          i < cmd.flags!.length - 1 ? "border-b border-hairline" : ""
                        }`}
                      >
                        <div>
                          <span className="text-blue">{f.flag}</span>
                          <span className="ml-1.5 text-[10.5px] text-accent">
                            {f.type}
                          </span>
                        </div>
                        <div className="font-body text-[12.5px] text-ink-mute leading-[1.55]">
                          {f.description}
                        </div>
                        <div className="text-right text-[10.5px] text-ink-ghost">
                          {f.default}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          ))}

          {/* Exit codes */}
          <section id="exit-codes" className="scroll-mt-[110px] py-10">
            <div className="mb-1 flex items-baseline gap-3">
              <span className="font-mono text-[11px] tracking-[0.08em] text-ink-ghost">
                §
              </span>
              <span className="font-display text-[22px] font-black leading-[1] tracking-[-0.025em] text-ink">
                Exit codes
              </span>
            </div>
            <p className="mb-5 max-w-[640px] font-body text-[14px] leading-[1.65] text-ink-softer">
              All Flareo commands return standard POSIX exit codes. Use
              them with <span className="text-accent">set -e</span> in shell
              pipelines and CI workflows.
            </p>
            <div className="grid grid-cols-6 border border-hairline">
              {EXIT_CODES.map((e, i) => (
                <div
                  key={e.code}
                  className={`bg-canvas-deep px-3.5 py-4 ${
                    i < EXIT_CODES.length - 1 ? "border-r border-hairline" : ""
                  }`}
                >
                  <div
                    className={`mb-1.5 font-display text-[28px] font-black leading-[1] tracking-[-0.03em] ${
                      e.tone === "ok"
                        ? "text-good"
                        : e.tone === "warn"
                          ? "text-warn"
                          : "text-bad"
                    }`}
                  >
                    {e.code}
                  </div>
                  <div className="mb-1 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-faint">
                    {e.name}
                  </div>
                  <div className="font-body text-[11.5px] leading-[1.45] text-ink-mute">
                    {e.desc}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
