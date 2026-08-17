"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { DEMO_RUN, DEMO_STEPS, type DemoStepId } from "@/lib/data/demo-pipeline";
import { DemoStepBody } from "./DemoSteps";

/**
 * Public, linear walkthrough of one recorded republish.
 *
 * One step on screen at a time. Steps show frozen artifacts immediately —
 * no interim "running" flash between clicks.
 */
export function PipelineWalkthrough() {
  const [index, setIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const maxReachedRef = useRef(maxReached);
  maxReachedRef.current = maxReached;

  const step = DEMO_STEPS[index];
  const isLast = index === DEMO_STEPS.length - 1;
  const isFirst = index === 0;

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(DEMO_STEPS.length - 1, next));
    if (clamped > maxReachedRef.current + 1) return;
    setIndex(clamped);
    setMaxReached((reached) => Math.max(reached, clamped));
  }, []);

  // Keep the URL hash in sync after navigation — never during render.
  useEffect(() => {
    window.history.replaceState(null, "", `#${DEMO_STEPS[index].id}`);
  }, [index]);

  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as DemoStepId;
    const idx = DEMO_STEPS.findIndex((s) => s.id === fromHash);
    if (idx > 0) {
      setIndex(idx);
      setMaxReached(idx);
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        goTo(index + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  function restart() {
    setIndex(0);
    setMaxReached(0);
  }

  return (
    <div>
      <section className="sticky top-[100px] z-30 border-b border-hairline bg-canvas/95 px-8 py-3 backdrop-blur-md">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <StatusBadge tone="neutral">RECORDED RUN</StatusBadge>
            <span className="font-mono text-[11px] text-ink-faint">
              {DEMO_RUN.runId}
              <span className="mx-2 text-ink-ghost">·</span>
              {DEMO_RUN.module.slug}@{DEMO_RUN.module.version}
              <span className="mx-2 text-ink-ghost">·</span>
              same results every time
            </span>
          </div>
          <button
            type="button"
            onClick={restart}
            className="cursor-pointer font-mono text-[10.5px] tracking-[0.08em] text-ink-faint transition-colors hover:text-accent"
          >
            START OVER
          </button>
        </div>
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {DEMO_STEPS.map((s, i) => {
            const current = i === index;
            const reachable = i <= maxReached + 1;
            const done = i < index;
            return (
              <li key={s.id} className="flex items-center">
                {i > 0 && (
                  <span className="mx-1 hidden h-px w-4 bg-hairline sm:block" />
                )}
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goTo(i)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 font-mono text-[11px] tracking-[0.04em] transition-colors",
                    current
                      ? "bg-accent text-canvas"
                      : reachable
                        ? "cursor-pointer text-ink-mute hover:text-accent"
                        : "cursor-not-allowed text-ink-ghost",
                  )}
                >
                  <span className={current ? "text-canvas/80" : "text-accent"}>
                    {s.num}
                  </span>
                  {s.label}
                  {done && !current && <span className="text-good">✓</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-b border-hairline px-8 py-10">
        <DemoStepBody stepId={step.id} playing={false} />
      </section>

      <section className="sticky bottom-0 z-30 flex items-center justify-between gap-4 border-t border-hairline bg-canvas/95 px-8 py-4 backdrop-blur-md">
        <div className="font-mono text-[11px] tracking-[0.06em] text-ink-faint">
          STEP {step.num} / {String(DEMO_STEPS.length).padStart(2, "0")}
          <span className="mx-2 text-ink-ghost">·</span>
          {step.label}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={isFirst}
            onClick={() => goTo(index - 1)}
          >
            Back
          </Button>
          {isLast ? (
            <Button href={DEMO_RUN.module.catalogHref} variant="primary">
              Open catalog listing →
            </Button>
          ) : (
            <Button variant="primary" onClick={() => goTo(index + 1)}>
              Next →
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
