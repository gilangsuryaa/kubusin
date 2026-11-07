"use client";

import { useLocale, useT } from "@/hooks/useT";
import { formatDate, formatTime } from "@/lib/format";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";

export function BestTimes() {
  const t = useT();
  const locale = useLocale();
  const bestTimes = useGameStore((state) => state.bestTimes);
  const hydrated = useGameStore((state) => state.hydrated);
  const replayRecord = useGameStore((state) => state.replayRecord);

  return (
    <section aria-label={t("best.aria")} className="border-t border-line pt-4">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
        {t("best.title")}
      </h2>

      {!hydrated ? (
        <ul className="mt-3 space-y-2" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <li key={index} className="h-4 w-full max-w-[180px] bg-ink/[0.07]" />
          ))}
        </ul>
      ) : bestTimes.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          {t("best.empty")}
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-line">
          {bestTimes.map((entry, index) => {
            const time = formatTime(entry.ms);
            const replayable = entry.scramble.length > 0 && entry.solution.length > 0;
            return (
              <li
                key={entry.id}
                className="tnum flex items-baseline gap-3 py-1.5 text-sm"
              >
                <span className="w-5 shrink-0 text-xs text-ink-soft">{index + 1}</span>
                <span className="font-medium">{time}</span>
                <span className="text-xs text-ink-soft">
                  {t("common.movesCount", { count: entry.moves })}
                </span>
                <span className="ml-auto hidden text-[11px] text-ink-soft sm:block">
                  {formatDate(entry.at, locale)}
                </span>
                <Button
                  variant="bare"
                  size="sm"
                  className="shrink-0 px-1.5 not-italic"
                  disabled={!replayable}
                  onClick={() => replayRecord(entry.id)}
                  aria-label={t("best.replayAria", {
                    time,
                    count: entry.moves,
                  })}
                  title={
                    replayable ? t("best.replayTitle") : t("best.replayUnavailable")
                  }
                >
                  {t("best.replay")}
                </Button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
