import Link from "next/link";
import type { Module } from "@/lib/types";

interface Props {
  module: Module;
  modules: Module[];
  signedInAs: string;
  userRole: string;
}

/**
 * Strip directly under the page hero. Two roles:
 *
 * 1. Confirms the visitor is authenticated and which seeded role
 *    they're signed in as (so admin / publisher / submitter / reviewer
 *    demo flows are unambiguous).
 * 2. Lets the visitor pick which module's artifacts to render.
 *    Because each module produces different artifacts (different
 *    digest, different CVE counts, different size), the page
 *    rewards switching — which is the proposal's "real artifacts,
 *    not a placebo diagram" point made interactive.
 */
export function PipelineHeader({
  module,
  modules,
  signedInAs,
  userRole,
}: Props) {
  return (
    <section className="border-b border-hairline bg-canvas-deep px-8 py-5">
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-ink-faint">
          <span className="flex items-center gap-2">
            <span className="block h-1.5 w-1.5 rounded-full bg-good" />
            <span className="tracking-[0.04em]">SIGNED IN</span>
            <span className="text-ink-mute">{signedInAs}</span>
            {userRole === "admin" && (
              <span className="border border-warn/60 px-1.5 py-px text-[9px] tracking-[0.14em] text-warn">
                ADMIN
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <span className="tracking-[0.04em] text-ink-ghost">VIEWING</span>
            <span className="text-ink">
              {module.name}@{module.version}
            </span>
            <span className="text-ink-ghost">·</span>
            <span className="text-good">signed provenance</span>
            <span className="text-ink-ghost">·</span>
            <span className="text-ink-mute">trust {module.trust}</span>
          </span>
        </div>

        {modules.length > 1 && (
          <ModulePicker active={module.slug} modules={modules} />
        )}
      </div>
    </section>
  );
}

function ModulePicker({
  active,
  modules,
}: {
  active: string;
  modules: Module[];
}) {
  // Server-rendered picker — each option is a link with ?module=<slug>
  // so the page reloads with new artifacts. Avoids client-state drift
  // and keeps the URL shareable (a visitor can copy /pipeline?module=
  // authentik and someone else loads the same artifacts).
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-ink-ghost">
        SWITCH MODULE
      </span>
      <div className="flex flex-wrap gap-1.5">
        {modules.slice(0, 6).map((m) => (
          <Link
            key={m.slug}
            href={`/pipeline?module=${m.slug}`}
            className={
              m.slug === active
                ? "border border-accent bg-accent px-2.5 py-1 font-mono text-[10.5px] text-canvas"
                : "border border-hairline bg-canvas-panel px-2.5 py-1 font-mono text-[10.5px] text-ink-mute transition-colors hover:border-accent hover:text-accent"
            }
          >
            {m.slug}
          </Link>
        ))}
      </div>
    </div>
  );
}
