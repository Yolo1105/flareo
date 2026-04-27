"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown starting at 28:47, resets to 30:00 when it hits zero.
 */
export function SandboxCountdown() {
  const [seconds, setSeconds] = useState(28 * 60 + 47);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 30 * 60 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return (
    <span>
      {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </span>
  );
}
