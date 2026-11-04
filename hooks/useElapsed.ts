"use client";

import { useEffect, useState } from "react";

/**
 * Live elapsed milliseconds while the clock runs, or null when it does not.
 * Only the component calling this re-renders on each tick.
 */
export function useElapsed(startedAt: number | null, running: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!running || startedAt === null) return;
    // The interval only writes state from its own callback, never during the
    // commit itself; the first tick lands ~33ms after the clock starts.
    const id = window.setInterval(() => setNow(Date.now()), 33);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  if (!running || startedAt === null) return null;
  if (now === null) return 0;
  return Math.max(0, now - startedAt);
}
