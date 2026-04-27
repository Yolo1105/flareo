"use client";

import { useEffect, useRef, useState } from "react";

interface CounterProps {
  /** The target number */
  to: number;
  /** Suffix after the number, e.g. "%" */
  suffix?: string;
  /** Duration in ms */
  duration?: number;
  /** Whether to show decimal places (0 = integer) */
  decimals?: number;
}

/**
 * Simple count-up animator that starts when the element enters viewport.
 * Uses IntersectionObserver so the effect only fires when visible.
 */
export function Counter({
  to,
  suffix = "",
  duration = 1400,
  decimals = 0,
}: CounterProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = Date.now();
            const tick = () => {
              const elapsed = Date.now() - start;
              const t = Math.min(elapsed / duration, 1);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(to * eased);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
