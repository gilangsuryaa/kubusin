"use client";

import { useElapsed } from "@/hooks/useElapsed";
import { useT } from "@/hooks/useT";
import { formatTime } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import { useGameStore, type GameStatus } from "@/store/game";

const STATUS_KEY: Record<GameStatus, MessageKey> = {
  idle: "status.idle",
  scrambling: "status.scrambling",
  ready: "status.ready",
  running: "status.running",
  solved: "status.solved",
};

export function StatsPanel() {
  const t = useT();
  const status = useGameStore((state) => state.status);
  const startedAt = useGameStore((state) => state.startedAt);
  const finalMs = useGameStore((state) => state.finalMs);
  const moveCount = useGameStore((state) => state.moves.length);

  const live = useElapsed(startedAt, status === "running");
  const ms = status === "solved" && finalMs !== null ? finalMs : (live ?? 0);

  return (
    <section aria-label={t("stats.aria")} className="border-t border-line pt-4">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
        {t("common.time")}
      </h2>
      <p className="tnum mt-1.5 text-[42px] font-semibold leading-none tracking-tight sm:text-[52px]">
        {formatTime(ms)}
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-xs text-ink-soft">{t(STATUS_KEY[status])}</p>
        <p className="tnum shrink-0 text-xs text-ink-soft">
          <span className="text-ink">{moveCount}</span> {t("common.moves")}
        </p>
      </div>
    </section>
  );
}
