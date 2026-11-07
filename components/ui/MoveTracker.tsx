"use client";

import { useState } from "react";
import { useT } from "@/hooks/useT";
import { moveToString, type Move } from "@/lib/cube";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";

const CHIP =
  "tnum inline-flex min-h-6 items-center rounded-[3px] border border-line px-1.5 text-[11px] font-semibold text-ink-soft";

function Sequence({ moves, label }: { moves: readonly Move[]; label: string }) {
  return (
    <p className="mt-1.5 flex flex-wrap gap-1" aria-label={label}>
      {moves.map((move, index) => (
        <span key={`${moveToString(move)}-${index}`} className={CHIP}>
          {moveToString(move)}
        </span>
      ))}
    </p>
  );
}

/** One titled row: heading, a move count, and the turn chips. */
function LogGroup({
  title,
  moves,
  label,
  empty,
}: {
  title: string;
  moves: readonly Move[];
  label: string;
  empty?: string;
}) {
  const t = useT();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-medium text-ink-soft">{title}</h3>
        {moves.length > 0 ? (
          <span className="text-[10px] text-ink-soft">
            {t("common.movesCount", { count: moves.length })}
          </span>
        ) : null}
      </div>
      {moves.length > 0 ? (
        <Sequence moves={moves} label={label} />
      ) : empty ? (
        <p className="mt-1.5 text-[11px] text-ink-soft">{empty}</p>
      ) : null}
    </div>
  );
}

/**
 * Move tracker. Lists the shuffle and every turn the player has applied, in
 * notation, so a solve can be replayed or analysed afterwards. The player log
 * is raw: an undone turn is recorded as the inverse turn it really was.
 *
 * When a saved record is being replayed, the tracker shows that record's saved
 * solution instead, since the board is rewriting the current log from scratch.
 */
export function MoveTracker() {
  const t = useT();
  const scramble = useGameStore((state) => state.scramble);
  const history = useGameStore((state) => state.history);
  const replayingId = useGameStore((state) => state.replayingId);
  const bestTimes = useGameStore((state) => state.bestTimes);
  const [copied, setCopied] = useState(false);

  const replayed = replayingId
    ? bestTimes.find((entry) => entry.id === replayingId)
    : undefined;
  const savedSolution = replayed
    ? replayed.solution
        .split(/\s+/)
        .filter((token) => token.length > 0)
        .map((token) => {
          // Notation only; a single face letter is a physical face, and only
          // the label matters here.
          return { text: token };
        })
    : [];

  const empty = scramble.length === 0 && history.length === 0;

  async function copyLog() {
    const lines = replayed
      ? [
          t("tracker.clipScramble", { moves: replayed.scramble }),
          t("tracker.clipMoves", { moves: replayed.solution }),
        ]
      : [
          scramble.length > 0
            ? t("tracker.clipScramble", {
                moves: scramble.map(moveToString).join(" "),
              })
            : null,
          history.length > 0
            ? t("tracker.clipMoves", {
                moves: history.map(moveToString).join(" "),
              })
            : null,
        ].filter((line): line is string => line !== null);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the log is still readable on screen.
    }
  }

  return (
    <section
      aria-labelledby="tracker-title"
      className="border-t border-line pt-4 lg:flex lg:max-h-[min(46vh,380px)] lg:flex-col"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="tracker-title"
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft"
        >
          {t("tracker.title")}
        </h2>
        {empty && !replayed ? null : (
          <Button variant="bare" size="sm" onClick={copyLog}>
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
        )}
      </div>

      {replayed ? (
        <div className="mt-2 space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          <p className="text-[11px] leading-relaxed text-ink-soft">
            {t("tracker.replaying")}
          </p>
          <LogGroup
            title={t("tracker.scramble")}
            moves={scramble}
            label={t("tracker.scrambleAria")}
          />
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[11px] font-medium text-ink-soft">
                {t("tracker.savedMoves")}
              </h3>
              <span className="text-[10px] text-ink-soft">
                {t("common.movesCount", { count: replayed.moves })}
              </span>
            </div>
            <p
              className="mt-1.5 flex flex-wrap gap-1"
              aria-label={t("tracker.savedMovesAria")}
            >
              {savedSolution.map((move, index) => (
                <span key={`${move.text}-${index}`} className={CHIP}>
                  {move.text}
                </span>
              ))}
            </p>
          </div>
        </div>
      ) : empty ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
          {t("tracker.empty")}
        </p>
      ) : (
        <div className="mt-2 space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          {scramble.length > 0 ? (
            <LogGroup
              title={t("tracker.scramble")}
              moves={scramble}
              label={t("tracker.scrambleAria")}
            />
          ) : null}

          <LogGroup
            title={t("tracker.yourMoves")}
            moves={history}
            label={t("tracker.yourMovesAria")}
            empty={t("tracker.noMoves")}
          />
        </div>
      )}
    </section>
  );
}
