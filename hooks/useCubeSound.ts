"use client";

import { useEffect, useRef } from "react";
import { playSolved, playTurn } from "@/lib/sound";
import { useGameStore, type QueuedMove } from "@/store/game";

/**
 * Plays a click when a turn starts animating and a chime when the cube is
 * solved. Muted while `soundOn` is off, and the refs are kept in step even
 * while muted so unmuting mid-turn does not replay the current move.
 */
export function useCubeSound(): void {
  const active = useGameStore((state) => state.active);
  const status = useGameStore((state) => state.status);
  const soundOn = useGameStore((state) => state.soundOn);

  const lastActive = useRef<QueuedMove | null>(null);
  const lastStatus = useRef(status);

  useEffect(() => {
    if (soundOn && active && active !== lastActive.current) {
      // The shuffle fires turns far faster; keep it to a soft rattle.
      playTurn(active.move, active.source === "scramble" ? 0.4 : 1);
    }
    lastActive.current = active;
  }, [active, soundOn]);

  useEffect(() => {
    if (soundOn && status === "solved" && lastStatus.current !== "solved") {
      playSolved();
    }
    lastStatus.current = status;
  }, [status, soundOn]);
}
