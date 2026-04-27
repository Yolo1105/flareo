"use client";

import { useEffect, useRef, useState } from "react";
import type { Job } from "@/lib/types";

/**
 * Live log panel for a single job. For running jobs, simulates an SSE
 * stream by appending new mock lines every ~600ms. For completed jobs,
 * shows the full recorded log at once.
 */

const RUNNING_LOG_LINES = [
  { ts: "+0.140s", ev: "SUBMIT", cls: "text-accent", text: "source uploaded · 142 MB" },
  { ts: "+0.562s", ev: "BUILD", cls: "text-accent", text: "buildkit 0.13.1 · hermetic · rootless" },
  { ts: "+182.4s", ev: "BUILD ✓", cls: "text-good", text: "layers: 6 · size: 148 MB · digest: sha256:d9e0f1a2b3c4" },
  { ts: "+184.2s", ev: "SCAN", cls: "text-accent", text: "trivy image · severity ALL · indexing packages..." },
  { ts: "+184.8s", ev: "SCAN", cls: "text-accent", text: "indexed 284 packages · querying NVD..." },
  { ts: "+187.4s", ev: "SCAN", cls: "text-accent", text: "cross-referencing GHSA advisories..." },
];

interface Props {
  job: Job;
}

export function JobLogStream({ job }: Props) {
  const isRunning = job.status === "running";
  const [streamed, setStreamed] = useState<number>(isRunning ? 0 : RUNNING_LOG_LINES.length);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRunning || streamed >= RUNNING_LOG_LINES.length) return;
    const t = setTimeout(() => setStreamed((s) => s + 1), 620);
    return () => clearTimeout(t);
  }, [streamed, isRunning]);

  // Scroll to bottom on new line
  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [streamed]);

  const lines = RUNNING_LOG_LINES.slice(0, streamed);

  return (
    <div className="overflow-hidden border border-hairline bg-canvas-deep">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-4 py-2.5 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
        <div className="flex items-center gap-3">
          <div className="flex gap-[5px]">
            <span className="block h-2 w-2 rounded-full bg-accent" />
            <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
            <span className="block h-2 w-2 rounded-full bg-hairline-soft" />
          </div>
          <span>
            flareo tail #{job.id} · {job.moduleName}@{job.version}
          </span>
        </div>
        {isRunning ? (
          <div className="flex items-center gap-2 text-good">
            <span className="block h-[6px] w-[6px] rounded-full bg-good meta-pulse" />
            <span className="font-medium tracking-[0.08em]">STREAMING</span>
          </div>
        ) : (
          <div
            className={`font-medium tracking-[0.08em] ${
              job.status === "success" ? "text-good" : "text-bad"
            }`}
          >
            {job.status === "success" ? "SUCCESS" : job.status.toUpperCase()}
          </div>
        )}
      </div>

      {/* Log body */}
      <div
        ref={boxRef}
        className="h-[320px] overflow-y-auto p-5 font-mono text-[12px] leading-[1.8] text-ink-mute"
      >
        {lines.length === 0 ? (
          <span className="text-ink-faint">waiting for first event...</span>
        ) : (
          lines.map((l, i) => (
            <div key={i} className="slidein">
              <span className="mr-3 text-ink-ghost">{l.ts}</span>
              <span className={`mr-2 font-medium ${l.cls}`}>{l.ev}</span>
              <span className="text-ink-mute">{l.text}</span>
            </div>
          ))
        )}
        {isRunning && streamed < RUNNING_LOG_LINES.length && (
          <span className="inline-block h-[14px] w-[7px] animate-pulse bg-accent" />
        )}
      </div>
    </div>
  );
}
