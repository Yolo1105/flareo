import { META_STRIP } from "@/lib/data/nav";

/**
 * The top meta-strip bar: thin, mono, quietly telemetric.
 * Values come from META_STRIP constant; swap to a server fetch later.
 */
export function MetaStrip() {
  return (
    <div className="sticky top-0 z-[51] flex items-center justify-between border-b border-hairline bg-canvas-meta px-8 py-2 font-mono text-[10.5px] tracking-[0.1em] text-ink-faint">
      <div className="flex items-center gap-[18px]">
        <span className="flex items-center gap-1.5">
          <span className="text-ink-ghost">v</span>
          <span className="text-ink-mute">{META_STRIP.version}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-ink-ghost">region</span>
          <span className="text-ink-mute">{META_STRIP.region}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-ink-ghost">builds/7d</span>
          <span className="text-ink-mute">{META_STRIP.buildsSevenDay}</span>
        </span>
        <span className="flex items-center gap-1.5 text-accent">
          <span className="block h-1.5 w-1.5 rounded-full bg-accent meta-pulse" />
          pipeline active
        </span>
      </div>
      <div className="text-ink-ghost">FLA / PUBLIC BETA</div>
    </div>
  );
}
