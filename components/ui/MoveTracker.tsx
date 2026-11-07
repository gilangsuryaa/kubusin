"use client";

import { useState } from "react";
import { useT } from "@/hooks/useT";
import { logMoveToString, moveToString } from "@/lib/cube";
import { useGameStore, REPLAY_SPEEDS } from "@/store/game";
import { Button } from "./Button";

const CHIP =
  "tnum inline-flex min-h-6 items-center rounded-[3px] border border-line px-1.5 text-[11px] font-semibold text-ink-soft";
/** Rotations change the hold, so they read as background notes, not turns. */
const ROTATION_CHIP =
  "tnum inline-flex min-h-6 items-center rounded-[3px] px-1 text-[11px] font-semibold text-ink-soft/70";

/** Playback slider shown while a record is being replayed. */
function ReplaySpeed() {
  const t = useT();
  const replaySpeed = useGameStore((state) => state.replaySpeed);
  const setReplaySpeed = useGameStore((state) => state.setReplaySpeed);
  const index = Math.max(0, REPLAY_SPEEDS.indexOf(replaySpeed as never));
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="replay-speed"
        className="text-[10px] uppercase tracking-[0.14em] text-ink-soft"
      >
        {t("replay.speed")}
      </label>
      <input
        id="replay-speed"
        type="range"
        min={0}
        max={REPLAY_SPEEDS.length - 1}
        step={1}
        value={index}
        onChange={(event) =>
          setReplaySpeed(REPLAY_SPEEDS[Number(event.target.value)])
        }
        aria-valuetext={t("replay.speedValue", { speed: `${replaySpeed}x` })}
        className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-ink"
      />
      <span className="tnum w-10 shrink-0 text-right text-[11px] font-medium text-ink">
        {replaySpeed}x
      </span>
    </div>
  );
}

/** One titled row: heading, a move count, and the move chips. */
function LogGroup({
  title,
  moves,
  label,
  empty,
  rotations,
}: {
  title: string;
  moves: readonly string[];
  label: string;
  empty?: string;
  /** Indexes in `moves` that are rotations rather than turns. */
  rotations?: ReadonlySet<number>;
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
        <p className="mt-1.5 flex flex-wrap gap-1" aria-label={label}>
          {moves.map((move, index) => (
            <span
              key={`${move}-${index}`}
              className={rotations?.has(index) ? ROTATION_CHIP : CHIP}
            >
              {move}
            </span>
          ))}
        </p>
      ) : empty ? (
        <p className="mt-1.5 text-[11px] text-ink-soft">{empty}</p>
      ) : null}
    </div>
  );
}

/** Splits a stored solution into chips, noting which ones are rotations. */
function solutionChips(solution: string | undefined): {
  tokens: string[];
  rotations: Set<number>;
} {
  if (!solution) return { tokens: [], rotations: new Set() };
  const tokens = solution.split(/\s+/).filter((token) => token.length > 0);
  const rotations = new Set<number>();
  tokens.forEach((token, index) => {
    if (/^[xyz]/.test(token)) rotations.add(index);
  });
  return { tokens, rotations };
}

/**
 * Move tracker. Lists the shuffle and every turn the player has applied, in
 * notation, so a solve can be replayed or analysed afterwards. The player log
 * is raw: an undone turn is recorded as the inverse turn it really was, and
 * whole-cube rotations sit between the turns they preceded.
 *
 * When a saved record is being replayed, the tracker shows that record's saved
 * solution instead, since the board is rewriting the current log from scratch.
 */
export function MoveTracker() {
  const t = useT();
  const scramble = useGameStore((state) => state.scramble);
  const log = useGameStore((state) => state.log);
  const replayingId = useGameStore((state) => state.replayingId);
  const bestTimes = useGameStore((state) => state.bestTimes);
  const [copied, setCopied] = useState(false);

  const replayed = replayingId
    ? bestTimes.find((entry) => entry.id === replayingId)
    : undefined;
  const saved = solutionChips(replayed?.solution);
  const logTokens = log.map(logMoveToString);
  const logRotations = new Set(
    log.reduce<number[]>((acc, entry, index) => {
      if (entry.kind === "rotate") acc.push(index);
      return acc;
    }, []),
  );

  const empty = scramble.length === 0 && log.length === 0;

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
          log.length > 0
            ? t("tracker.clipMoves", { moves: logTokens.join(" ") })
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
          <ReplaySpeed />
          <LogGroup
            title={t("tracker.scramble")}
            moves={scramble.map(moveToString)}
            label={t("tracker.scrambleAria")}
          />
          <LogGroup
            title={t("tracker.savedMoves")}
            moves={saved.tokens}
            rotations={saved.rotations}
            label={t("tracker.savedMovesAria")}
          />
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
              moves={scramble.map(moveToString)}
              label={t("tracker.scrambleAria")}
            />
          ) : null}

          <LogGroup
            title={t("tracker.yourMoves")}
            moves={logTokens}
            rotations={logRotations}
            label={t("tracker.yourMovesAria")}
            empty={t("tracker.noMoves")}
          />
        </div>
      )}
    </section>
  );
}
