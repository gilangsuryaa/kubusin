"use client";

import { formatTime } from "@/lib/format";
import { useGameStore } from "@/store/game";

/** Screen-reader announcements for game state changes. */
export function LiveRegion() {
  const status = useGameStore((state) => state.status);
  const finalMs = useGameStore((state) => state.finalMs);
  const moveCount = useGameStore((state) => state.moves.length);

  let message = "";
  if (status === "solved" && finalMs !== null) {
    message = `Kubus selesai. Waktu ${formatTime(finalMs)} dengan ${moveCount} langkah.`;
  } else if (status === "scrambling") {
    message = "Mengacak kubus.";
  } else if (status === "ready") {
    message = "Kubus teracak. Waktu mulai pada langkah pertama.";
  }

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}
