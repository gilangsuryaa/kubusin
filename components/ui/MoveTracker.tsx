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

/**
 * Move tracker. Lists the shuffle and every turn the player has applied, in
 * notation, so a solve can be replayed or analysed afterwards. The player log
 * is raw: an undone turn is recorded as the inverse turn it really was.
 */
export function MoveTracker() {
  const t = useT();
  const scramble = useGameStore((state) => state.scramble);
  const history = useGameStore((state) => state.history);
  const [copied, setCopied] = useState(false);

  const empty = scramble.length === 0 && history.length === 0;

  async function copyLog() {
    const lines = [
      scramble.length > 0
        ? t("tracker.clipScramble", { moves: scramble.map(moveToString).join(" ") })
        : null,
      history.length > 0
        ? t("tracker.clipMoves", { moves: history.map(moveToString).join(" ") })
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
        {empty ? null : (
          <Button variant="bare" size="sm" onClick={copyLog}>
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
        )}
      </div>

      {empty ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
          {t("tracker.empty")}
        </p>
      ) : (
        <div className="mt-2 space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          {scramble.length > 0 ? (
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[11px] font-medium text-ink-soft">
                  {t("tracker.scramble")}
                </h3>
                <span className="text-[10px] text-ink-soft">
                  {t("common.movesCount", { count: scramble.length })}
                </span>
              </div>
              <Sequence moves={scramble} label={t("tracker.scrambleAria")} />
            </div>
          ) : null}

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[11px] font-medium text-ink-soft">
                {t("tracker.yourMoves")}
              </h3>
              <span className="text-[10px] text-ink-soft">
                {t("common.movesCount", { count: history.length })}
              </span>
            </div>
            {history.length > 0 ? (
              <Sequence moves={history} label={t("tracker.yourMovesAria")} />
            ) : (
              <p className="mt-1.5 text-[11px] text-ink-soft">
                {t("tracker.noMoves")}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
