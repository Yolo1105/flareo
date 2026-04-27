"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Module } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import {
  generateCompose,
  generateHelmValues,
  generateEnv,
  generateRun,
} from "@/lib/data/takeaway";

type Tab = "compose" | "helm" | "env" | "run";

interface Props {
  module: Module;
}

/**
 * "What you walk away with."
 *
 * Four real-syntax artifacts visitors can copy: docker-compose.yaml,
 * Helm values.yaml fragment, .env, and a single-command docker run.
 * All four reference the verified sha256 digest, never a tag — so
 * the deployment stays pinned to the exact image you trusted.
 *
 * Generators live in lib/data/takeaway.ts so the API endpoint that
 * produces the downloadable bundle (/api/v1/modules/[slug]/takeaway)
 * renders identical output. Both surfaces are guaranteed in sync.
 *
 * Per-category specialization (port, volumes, env keys) means modules
 * in different categories get meaningfully different artifacts. Two
 * visitors looking at vaultwarden vs grafana see different YAML, not
 * a generic template renamed.
 */
export function DeploySection({ module }: Props) {
  const [tab, setTab] = useState<Tab>("compose");

  const compose = generateCompose(module);
  const helm = generateHelmValues(module);
  const env = generateEnv(module);
  const run = generateRun(module);

  const tabs: { id: Tab; label: string; sub: string }[] = [
    { id: "compose", label: "Docker Compose", sub: "docker-compose.yaml" },
    { id: "helm", label: "Helm Values", sub: "values.yaml" },
    { id: "env", label: "Environment", sub: ".env" },
    { id: "run", label: "Docker Run", sub: "single command" },
  ];

  const content =
    tab === "compose"
      ? compose
      : tab === "helm"
        ? helm
        : tab === "env"
          ? env
          : run;

  return (
    <section className="border-b border-hairline px-8 py-14">
      <SectionHeader
        num="03"
        label="DEPLOY · WHAT YOU WALK AWAY WITH"
        title="Real takeaway artifacts. Yours to keep."
      >
        Every output references the verified sha256 digest, not the mutable
        tag — your deploy stays on the exact image you trusted, even if
        upstream repoints :latest tomorrow. We don&apos;t host your
        deployment; we prepare it.
      </SectionHeader>

      <div className="border border-hairline bg-canvas-deep">
        <div className="flex border-b border-hairline">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 flex-col items-start gap-0.5 border-r border-hairline px-4 py-3 text-left transition-colors last:border-r-0",
                tab === t.id
                  ? "bg-canvas-panel text-accent"
                  : "text-ink-faint hover:bg-canvas-panel/50 hover:text-ink"
              )}
            >
              <span className="font-mono text-[11.5px] tracking-[0.04em]">
                {t.label}
              </span>
              <span className="font-mono text-[9.5px] tracking-[0.06em] text-ink-ghost">
                {t.sub}
              </span>
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-[1.7] text-ink-mute">
          {content}
        </pre>
      </div>

      {/* No-lock-in framing — proposal's "Flareo's value is in getting
          you to the compose/Helm file, not in running it for you" point
          made explicit. The download link below produces a real
          tarball with all four files plus a README. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-dashed border-hairline bg-canvas-deep px-5 py-4">
        <div className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
          <strong className="text-ink">No lock-in by design.</strong> These
          files run anywhere — your VPS, your Kubernetes cluster, a homelab
          NUC, an air-gapped lab. Flareo is not in your runtime path after
          you copy them out.
        </div>
        <a
          href={`/api/v1/modules/${module.slug}/takeaway`}
          download
          className="shrink-0 border border-hairline bg-canvas-panel px-3 py-1.5 font-mono text-[10.5px] tracking-[0.04em] text-accent transition-colors hover:border-accent"
        >
          ↓ DOWNLOAD .md BUNDLE
        </a>
      </div>
    </section>
  );
}
