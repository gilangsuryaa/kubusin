"use client";

import { useMemo, useState } from "react";
import { useLocale, useT } from "@/hooks/useT";
import { formatDate, formatTime } from "@/lib/format";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

/** Sort orders the list can be read in. */
type SortMode = "fastest" | "newest";

const BOARD_TARGET = "kubusin-board";

/**
 * Best times. Every solve is kept, so this doubles as progress history: it can
 * be read fastest-first or newest-first, each entry can be replayed on the
 * board, and unwanted records can be deleted.
 */
export function BestTimes() {
  const t = useT();
  const locale = useLocale();
  const bestTimes = useGameStore((state) => state.bestTimes);
  const hydrated = useGameStore((state) => state.hydrated);
  const replayRecord = useGameStore((state) => state.replayRecord);
  const deleteBestTime = useGameStore((state) => state.deleteBestTime);
  const [sort, setSort] = useState<SortMode>("fastest");
  /** The record waiting for its deletion to be confirmed, if any. */
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const times = [...bestTimes];
    if (sort === "newest") {
      // Newest first; the id starts with the timestamp, so a string compare
      // keeps it stable for the rare same-millisecond solves.
      times.sort((a, b) => (b.at - a.at) || (a.id < b.id ? 1 : -1));
    } else {
      times.sort((a, b) => a.ms - b.ms);
    }
    return times;
  }, [bestTimes, sort]);

  const pendingEntry = pendingDelete
    ? bestTimes.find((entry) => entry.id === pendingDelete)
    : undefined;

  function onReplay(id: string) {
    const board = document.getElementById(BOARD_TARGET);
    board?.scrollIntoView({ behavior: "smooth", block: "start" });
    replayRecord(id);
  }

  return (
    <section aria-label={t("best.aria")} className="border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
          {t("best.title")}
        </h2>
        {hydrated && bestTimes.length > 1 ? (
          <div
            role="group"
            aria-label={t("best.sortAria")}
            className="flex gap-1 text-[10px] font-medium uppercase tracking-[0.12em]"
          >
            {(
              [
                ["fastest", t("best.sortFastest")],
                ["newest", t("best.sortNewest")],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSort(mode)}
                aria-pressed={sort === mode}
                className={`rounded-[3px] px-1.5 py-0.5 transition-colors ${
                  sort === mode
                    ? "bg-ink text-bg"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

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
          {sorted.map((entry, index) => {
            const time = formatTime(entry.ms);
            const replayable = entry.scramble.length > 0 && entry.solution.length > 0;
            return (
              <li
                key={entry.id}
                className="tnum flex items-baseline gap-2 py-1.5 text-sm"
              >
                <span className="w-5 shrink-0 text-xs text-ink-soft">
                  {index + 1}
                </span>
                <span className="font-medium">{time}</span>
                <span className="text-xs text-ink-soft">
                  {t("common.movesCount", { count: entry.moves })}
                </span>
                <span
                  className="hidden text-[11px] text-ink-soft sm:block"
                  title={t("best.addedAria", {
                    date: formatDate(entry.at, locale),
                  })}
                >
                  {formatDate(entry.at, locale)}
                </span>
                <span className="ml-auto flex shrink-0 items-baseline gap-0.5">
                  <Button
                    variant="bare"
                    size="sm"
                    className="px-1.5 not-italic"
                    disabled={!replayable}
                    onClick={() => onReplay(entry.id)}
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
                  <Button
                    variant="bare"
                    size="sm"
                    className="px-1.5 not-italic text-ink-soft hover:text-ink"
                    onClick={() => setPendingDelete(entry.id)}
                    aria-label={t("best.deleteAria", {
                      time,
                      date: formatDate(entry.at, locale),
                    })}
                    title={t("best.delete")}
                  >
                    ✕
                  </Button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <Dialog
        open={pendingEntry !== undefined}
        labelledBy="best-delete-title"
        describedBy="best-delete-desc"
        onClose={() => setPendingDelete(null)}
        panelClassName="max-w-sm"
      >
        <div className="p-5 sm:p-6">
          <h2 id="best-delete-title" className="text-xl font-semibold tracking-tight">
            {t("best.deleteTitle")}
          </h2>
          <p id="best-delete-desc" className="mt-2 text-xs leading-relaxed text-ink-soft">
            {pendingEntry
              ? t("best.deleteDesc", {
                  time: formatTime(pendingEntry.ms),
                  count: pendingEntry.moves,
                  date: formatDate(pendingEntry.at, locale),
                })
              : ""}
          </p>
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              data-autofocus="true"
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (pendingDelete) deleteBestTime(pendingDelete);
                setPendingDelete(null);
              }}
              className="flex-1"
            >
              {t("best.deleteConfirm")}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
