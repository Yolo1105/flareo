"use client";

import { useEffect, useRef, useState } from "react";

interface LogLine {
  seq: number;
  text: string;
  stream: string;
  emittedAt: string;
}

interface LogPayload {
  lines: LogLine[];
  lastSeq: number;
  complete: boolean;
  status: string;
}

interface Props {
  submissionId: string;
  /**
   * Initial status — drives whether polling starts immediately. If a
   * submission is already in a terminal state at page load, we fetch
   * once then stop (to show the full log) rather than polling forever.
   */
  initialStatus: string;
  /** Polling interval in ms. Default 1500 gives "feels live" with
   * modest server pressure. */
  pollIntervalMs?: number;
}

const TERMINAL_STATES = new Set([
  "built",
  "failed",
  "scan_rejected",
  "rejected",
  "worker_failures",
]);

/**
 * Live build-log panel. Polls /api/v1/submissions/[id]/build-log
 * every `pollIntervalMs` while the submission is non-terminal,
 * appending new lines as they arrive. Auto-scrolls to the bottom
 * unless the user has scrolled up (standard log-tailer behavior).
 *
 * When the API reports a terminal status, polling stops and the
 * panel displays a completion banner.
 */
export function LiveBuildLog({
  submissionId,
  initialStatus,
  pollIntervalMs = 1500,
}: Props) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const userScrolledRef = useRef(false);
  const lastSeqRef = useRef(-1);
  const stoppedRef = useRef(false);

  // Core polling loop. Recursive setTimeout rather than setInterval so
  // a slow response doesn't stack up queued calls — each poll only
  // kicks off after the previous response lands.
  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (cancelled || stoppedRef.current) return;
      try {
        const resp = await fetch(
          `/api/v1/submissions/${submissionId}/build-log?after=${lastSeqRef.current}`,
          { cache: "no-store" },
        );
        if (!resp.ok) {
          if (resp.status === 401 || resp.status === 404) {
            setError("You don't have access to this build log.");
            stoppedRef.current = true;
            return;
          }
          if (resp.status === 429) {
            // Back off briefly on rate-limit; don't stop entirely.
            setTimeout(tick, pollIntervalMs * 3);
            return;
          }
          setError(`Log fetch failed (${resp.status}).`);
          setTimeout(tick, pollIntervalMs * 2);
          return;
        }
        const body = (await resp.json()) as LogPayload;
        if (cancelled) return;
        setLoading(false);
        setError(null);

        if (body.lines.length > 0) {
          setLines((prev) => [...prev, ...body.lines]);
          lastSeqRef.current = body.lastSeq;
        }
        setStatus(body.status);

        if (body.complete || TERMINAL_STATES.has(body.status)) {
          stoppedRef.current = true;
          return;
        }
        setTimeout(tick, pollIntervalMs);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? `Log fetch failed: ${err.message}`
            : "Log fetch failed.",
        );
        setTimeout(tick, pollIntervalMs * 2);
      }
    }

    tick();

    return () => {
      cancelled = true;
    };
  }, [submissionId, pollIntervalMs]);

  // Auto-scroll to bottom when new lines arrive, unless the user has
  // scrolled up to read earlier output.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || userScrolledRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    userScrolledRef.current = !atBottom;
  }

  function jumpToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    userScrolledRef.current = false;
  }

  const isLive = !TERMINAL_STATES.has(status);
  const hasLines = lines.length > 0;

  return (
    <div className="border border-hairline bg-canvas-deep">
      <div className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
            BUILD LOG
          </span>
          {isLive ? (
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-ink-softer">
              <span className="block h-2 w-2 rounded-full bg-good meta-pulse" />
              streaming
            </span>
          ) : (
            <span className="font-mono text-[10.5px] text-ink-faint">
              final · {status}
            </span>
          )}
          <span className="font-mono text-[10.5px] text-ink-ghost">
            {lines.length} line{lines.length === 1 ? "" : "s"}
          </span>
        </div>
        {userScrolledRef.current && isLive && (
          <button
            type="button"
            onClick={jumpToBottom}
            className="border border-hairline px-2 py-0.5 font-mono text-[10px] text-ink-softer hover:border-accent hover:text-accent"
          >
            jump to latest ↓
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-[480px] overflow-y-auto px-4 py-3 font-mono text-[11.5px] leading-[1.55]"
      >
        {loading && !hasLines ? (
          <div className="text-ink-ghost">waiting for first chunk…</div>
        ) : error ? (
          <div className="text-bad">{error}</div>
        ) : !hasLines ? (
          <div className="text-ink-ghost">
            No log lines yet. {isLive ? "Build hasn't started producing output — this is normal for the first few seconds." : "This submission completed without emitting a streamable log (likely pre-dates the streaming feature)."}
          </div>
        ) : (
          lines.map((l) => (
            <div
              key={l.seq}
              className={
                l.stream === "stderr"
                  ? "whitespace-pre-wrap text-bad/90"
                  : l.stream === "system"
                    ? "whitespace-pre-wrap text-accent"
                    : "whitespace-pre-wrap text-ink-softer"
              }
            >
              {l.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
