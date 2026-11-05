"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { solveBeginner, type SolveStage } from "@/lib/beginner";
import { applyMoves, isSolved, moveToString, type CubeState, type Move } from "@/lib/cube";
import { sameCube } from "@/lib/guide";
import { solveOptimal } from "@/lib/optimal";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";

/**
 * Solver guide. When on, it lists the beginner-method steps for the current
 * cube and highlights the move to play next.
 *
 * The plan is kept stable and a cursor walks through it: it only reruns the
 * search once the cube no longer matches what the plan, played so far,
 * predicts. Replanning after every quarter turn would be wrong, because a
 * stage path is shortest in whole algorithms, so its first turn could
 * otherwise be undone by the next replan and the guide would loop on the same
 * few moves. Comparing the real cube state also catches a scramble or reset,
 * which rewrites the cube without any user move to notice.
 */
export function SolveGuide() {
  const assist = useGameStore((state) => state.assist);
  const setAssist = useGameStore((state) => state.setAssist);
  const cubies = useGameStore((state) => state.cubies);
  const status = useGameStore((state) => state.status);
  const active = useGameStore((state) => state.active);
  const moves = useGameStore((state) => state.moves);

  const [stages, setStages] = useState<SolveStage[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimal, setOptimal] = useState<Move[] | null>(null);
  const [optimalLoading, setOptimalLoading] = useState(false);
  const [optimalError, setOptimalError] = useState<string | null>(null);

  /** The exact plan the cursor refers to, with its starting cube and move count. */
  const planRef = useRef<{
    stages: readonly SolveStage[];
    start: CubeState;
  } | null>(null);
  const movesAtStart = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // Defer so the toggle paints first and so state is only touched from an
    // async callback rather than synchronously during the effect body.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      if (!assist) {
        planRef.current = null;
        setStages(null);
        setError(null);
        setOptimal(null);
        setOptimalError(null);
        return;
      }
      // The shuffle rewrites the state many times; wait until it settles.
      if (status === "scrambling") return;
      // Skip mid-turn: `moves` grows when a turn starts, but `cubies` only
      // updates when it finishes, so comparing them here would misfire.
      if (active) return;

      const plan = planRef.current;
      if (plan) {
        const flat = plan.stages.flatMap((stage) => stage.moves);
        const played = moves.slice(movesAtStart.current);
        if (played.length <= flat.length) {
          const expected = applyMoves(plan.start, flat.slice(0, played.length));
          if (sameCube(expected, cubies)) {
            setCursor(played.length);
            return;
          }
        }
      }

      setComputing(true);
      setError(null);
      setOptimal(null);
      setOptimalError(null);
      try {
        const next = solveBeginner(cubies);
        planRef.current = { stages: next, start: cubies };
        movesAtStart.current = moves.length;
        setStages(next);
        setCursor(0);
      } catch {
        planRef.current = null;
        setStages(null);
        setError("Panduan gagal dihitung untuk susunan ini.");
      } finally {
        setComputing(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [assist, cubies, status, active, moves]);

  const flat = useMemo(() => stages?.flatMap((stage) => stage.moves) ?? [], [stages]);
  const offsets = useMemo(() => {
    const result: number[] = [];
    let total = 0;
    for (const stage of stages ?? []) {
      result.push(total);
      total += stage.moves.length;
    }
    return result;
  }, [stages]);

  const solved = isSolved(cubies);
  const nextMove = cursor < flat.length ? flat[cursor] : null;
  const pending = Math.max(0, flat.length - cursor);

  /** Keeps the highlighted step in view while the plan scrolls. */
  const nextChipRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    nextChipRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [cursor]);

  async function loadOptimal() {
    setOptimalLoading(true);
    setOptimalError(null);
    try {
      const result = await solveOptimal(cubies);
      setOptimal(result);
    } catch {
      setOptimalError("Solusi optimal gagal dihitung.");
    } finally {
      setOptimalLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="guide-title"
      className="border-t border-line pt-4 lg:flex lg:max-h-[min(74vh,660px)] lg:flex-col"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="guide-title"
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft"
        >
          Panduan
        </h2>
        <Button
          variant={assist ? "primary" : "outline"}
          size="sm"
          aria-pressed={assist}
          onClick={() => setAssist(!assist)}
        >
          {assist ? "Aktif" : "Nyalakan"}
        </Button>
      </div>

      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
        {assist
          ? "Ikuti langkah yang disorot. Orientasi dikunci ke standar dan waktu tidak masuk rekor."
          : "Nyalakan untuk melihat langkah penyelesaian lengkap."}
      </p>

      {!assist ? null : (
        <div className="mt-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          {computing ? (
            <p className="text-xs text-ink-soft" role="status">
              Menghitung langkah...
            </p>
          ) : error ? (
            <p className="text-xs text-ink-soft" role="alert">
              {error}
            </p>
          ) : solved ? (
            <p className="text-xs text-ink-soft" role="status">
              Kubus sudah selesai.
            </p>
          ) : stages ? (
            <div className="space-y-3">
              <p className="text-xs text-ink-soft" role="status" aria-live="polite">
                Langkah berikutnya:{" "}
                <span className="font-semibold text-ink">
                  {nextMove ? moveToString(nextMove) : "-"}
                </span>{" "}
                · {pending} langkah lagi
              </p>

              <ol className="space-y-2.5">
                {stages.map((stage, stageIndex) => {
                  const offset = offsets[stageIndex];
                  const done = offset + stage.moves.length <= cursor;
                  const hasNext =
                    cursor >= offset && cursor < offset + stage.moves.length;
                  return (
                    <li key={stage.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-xs font-semibold text-ink">
                          {stage.title}
                        </h3>
                        {done ? (
                          <span className="text-[10px] uppercase tracking-wide text-ink-soft">
                            beres
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] leading-relaxed text-ink-soft">
                        {stage.detail}
                      </p>
                      {stage.moves.length > 0 ? (
                        <ul className="mt-1.5 flex flex-wrap gap-1">
                          {stage.moves.map((move, index) => {
                            const isNext = hasNext && index === cursor - offset;
                            return (
                              <li
                                key={`${moveToString(move)}-${index}`}
                                ref={isNext ? nextChipRef : undefined}
                              >
                                <span
                                  className={`tnum inline-flex min-h-6 items-center rounded-[3px] border px-1.5 text-[11px] font-semibold ${
                                    isNext
                                      ? "border-transparent bg-accent text-accent-ink"
                                      : "border-line text-ink-soft"
                                  }`}
                                >
                                  {moveToString(move)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ol>

              <div className="border-t border-line pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-ink-soft">Solusi optimal</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadOptimal}
                    disabled={optimalLoading}
                  >
                    {optimalLoading ? "Menghitung..." : "Lihat"}
                  </Button>
                </div>
                {optimalError ? (
                  <p className="mt-1.5 text-xs text-ink-soft" role="alert">
                    {optimalError}
                  </p>
                ) : optimal ? (
                  <>
                    <p className="mt-1.5 text-[11px] text-ink-soft">
                      {optimal.length} langkah
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1">
                      {optimal.map((move, index) => (
                        <li key={`${moveToString(move)}-${index}`}>
                          <span className="tnum inline-flex min-h-6 items-center rounded-[3px] border border-line px-1.5 text-[11px] font-semibold text-ink-soft">
                            {moveToString(move)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
