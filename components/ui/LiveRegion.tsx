"use client";

import { useT } from "@/hooks/useT";
import { formatTime } from "@/lib/format";
import { useGameStore } from "@/store/game";

/** Screen-reader announcements for game state changes. */
export function LiveRegion() {
  const t = useT();
  const status = useGameStore((state) => state.status);
  const finalMs = useGameStore((state) => state.finalMs);
  const moveCount = useGameStore((state) => state.moves.length);

  let message = "";
  if (status === "solved" && finalMs !== null) {
    message = t("live.solved", {
      time: formatTime(finalMs),
      count: moveCount,
    });
  } else if (status === "scrambling") {
    message = t("live.scrambling");
  } else if (status === "ready") {
    message = t("live.ready");
  }

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}
