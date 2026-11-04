"use client";

import { useElapsed } from "@/hooks/useElapsed";
import { formatTime } from "@/lib/format";
import { useGameStore, type GameStatus } from "@/store/game";

const STATUS_TEXT: Record<GameStatus, string> = {
  idle: "Kubus selesai. Tekan Spasi untuk acak dan mulai.",
  scrambling: "Mengacak…",
  ready: "Putar sisi mana saja untuk memulai waktu.",
  running: "Berjalan…",
  solved: "Selesai!",
};

export function StatsPanel() {
  const status = useGameStore((state) => state.status);
  const startedAt = useGameStore((state) => state.startedAt);
  const finalMs = useGameStore((state) => state.finalMs);
  const moveCount = useGameStore((state) => state.moves.length);

  const live = useElapsed(startedAt, status === "running");
  const ms = status === "solved" && finalMs !== null ? finalMs : (live ?? 0);

  return (
    <section aria-label="Statistik permainan" className="border-t border-line pt-4">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
        Waktu
      </h2>
      <p className="tnum mt-1.5 text-[42px] font-semibold leading-none tracking-tight sm:text-[52px]">
        {formatTime(ms)}
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-xs text-ink-soft">{STATUS_TEXT[status]}</p>
        <p className="tnum shrink-0 text-xs text-ink-soft">
          <span className="text-ink">{moveCount}</span> langkah
        </p>
      </div>
    </section>
  );
}
