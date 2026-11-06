"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { solveBeginner, type SolveStage } from "@/lib/beginner";
import { solveCfop } from "@/lib/cfop";
import { isSolved, moveToString, type CubeState, type Move } from "@/lib/cube";
import { planCursor } from "@/lib/guide";
import { solveOptimal } from "@/lib/optimal";
import { useGameStore, type GuideMethod } from "@/store/game";
import { Button } from "./Button";

const METHOD_OPTIONS: readonly { id: GuideMethod; label: string; title: string }[] = [
  {
    id: "beginner",
    label: "Metode Pemula",
    title: "Selesaikan lapis demi lapis, dari cross bawah sampai lapis atas.",
  },
  {
    id: "cfop",
    label: "CFOP",
    title: "Cross, F2L, lalu OLL dan PLL — metode cepat yang populer.",
  },
  {
    id: "optimal",
    label: "Optimal",
    title: "Solusi terpendek dari keadaan kubus saat ini.",
  },
];

/**
 * Solver guide. When on, it lists steps for the chosen method — beginner,
 * CFOP, or the optimal solve — and highlights the move to play next.
 *
 * The plan is kept stable and a cursor walks through it: it only reruns the
 * search once the cube no longer matches what the plan, played so far,
 * predicts. Replanning after every quarter turn would be wrong, because a
 * stage path is shortest in whole algorithms, so its first turn could
 * otherwise be undone by the next replan and the guide would loop on the same
 * few moves. Comparing the real cube state also catches a scramble or reset,
 * which rewrites the cube without any user move to notice.
 *
 * The optimal solution is held the same way: one fixed sequence from the cube
 * it was solved from, walked with its own cursor. Playing one of its steps
 * advances the highlight; the sequence is only dropped when the cube leaves
 * the path it predicted.
 */
export function SolveGuide() {
  const assist = useGameStore((state) => state.assist);
  const setAssist = useGameStore((state) => state.setAssist);
  const guideMethod = useGameStore((state) => state.guideMethod);
  const setGuideMethod = useGameStore((state) => state.setGuideMethod);
  const cubies = useGameStore((state) => state.cubies);
  const status = useGameStore((state) => state.status);
  const active = useGameStore((state) => state.active);
  const moves = useGameStore((state) => state.moves);

  const [stages, setStages] = useState<SolveStage[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimal, setOptimal] = useState<Move[] | null>(null);
  const [optimalCursor, setOptimalCursor] = useState(0);
  const [optimalLoading, setOptimalLoading] = useState(false);
  const [optimalError, setOptimalError] = useState<string | null>(null);

  /** The exact plan the cursor refers to, with its starting cube and method. */
  const planRef = useRef<{
    stages: readonly SolveStage[];
    start: CubeState;
    method: GuideMethod;
  } | null>(null);
  const movesAtStart = useRef(0);

  /**
   * The optimal solution, held the same way as the staged plan: a fixed move
   * list tied to the cube it was solved from. The player walks it with a
   * cursor, so playing one of its steps advances the highlight instead of
   * discarding the solution and recomputing a different one.
   */
  const optimalRef = useRef<{ moves: readonly Move[]; start: CubeState } | null>(null);
  const optimalMovesAt = useRef(0);
  /** Guards against a slow solve landing after the cube already changed. */
  const optimalToken = useRef(0);

  const loadOptimal = useCallback(async () => {
    const token = optimalToken.current + 1;
    optimalToken.current = token;
    setOptimalLoading(true);
    setOptimalError(null);
    const start = cubies;
    const startMoves = moves.length;
    try {
      const result = await solveOptimal(start);
      if (token !== optimalToken.current) return;
      optimalRef.current = { moves: result, start };
      optimalMovesAt.current = startMoves;
      setOptimal(result);
      setOptimalCursor(0);
    } catch {
      if (token !== optimalToken.current) return;
      setOptimalError("Solusi optimal gagal dihitung.");
    } finally {
      if (token === optimalToken.current) setOptimalLoading(false);
    }
  }, [cubies, moves.length]);

  useEffect(() => {
    let cancelled = false;
    // Defer so the toggle paints first and so state is only touched from an
    // async callback rather than synchronously during the effect body.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      if (!assist) {
        planRef.current = null;
        optimalRef.current = null;
        optimalToken.current += 1;
        setStages(null);
        setError(null);
        setOptimal(null);
        setOptimalCursor(0);
        setOptimalError(null);
        setOptimalLoading(false);
        return;
      }
      // The shuffle rewrites the state many times; wait until it settles.
      if (status === "scrambling") return;
      // Skip mid-turn: `moves` grows when a turn starts, but `cubies` only
      // updates when it finishes, so comparing them here would misfire.
      if (active) return;

      if (guideMethod === "optimal") {
        // The optimal method has no staged plan.
        if (planRef.current) {
          planRef.current = null;
          setStages(null);
          setError(null);
        }
        // Keep a shown optimal solution in step with the cube. It survives
        // playing its own steps, but is dropped once the cube leaves the path
        // it predicted (a different move, a scramble, or a reset).
        const optimalPlan = optimalRef.current;
        if (optimalPlan) {
          const cursorNow = planCursor(
            optimalPlan.start,
            optimalPlan.moves,
            moves.slice(optimalMovesAt.current),
            cubies,
          );
          if (cursorNow !== null) {
            setOptimalCursor(cursorNow);
            return;
          }
          optimalRef.current = null;
          setOptimal(null);
          setOptimalCursor(0);
        }
        if (isSolved(cubies)) return;
        void loadOptimal();
        return;
      }

      // Staged methods: drop any optimal sequence left over from the other tab.
      if (optimalRef.current) {
        optimalRef.current = null;
        optimalToken.current += 1;
        setOptimal(null);
        setOptimalCursor(0);
        setOptimalError(null);
        setOptimalLoading(false);
      }

      const plan = planRef.current;
      if (plan && plan.method === guideMethod) {
        const flat = plan.stages.flatMap((stage) => stage.moves);
        const cursorNow = planCursor(
          plan.start,
          flat,
          moves.slice(movesAtStart.current),
          cubies,
        );
        if (cursorNow !== null) {
          setCursor(cursorNow);
          return;
        }
      }

      setComputing(true);
      setError(null);
      try {
        const next =
          guideMethod === "cfop" ? solveCfop(cubies) : solveBeginner(cubies);
        planRef.current = { stages: next, start: cubies, method: guideMethod };
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
  }, [assist, guideMethod, cubies, status, active, moves, loadOptimal]);

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

  const optimalNext = optimal && optimalCursor < optimal.length ? optimal[optimalCursor] : null;
  const optimalPending = optimal ? Math.max(0, optimal.length - optimalCursor) : 0;

  /** Keeps the highlighted step in view while the plan scrolls. */
  const nextChipRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    nextChipRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [cursor]);

  /** Same, for the optimal sequence. */
  const optimalChipRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    optimalChipRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [optimalCursor]);

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
          : "Nyalakan untuk memilih metode dan melihat langkah penyelesaian lengkap."}
      </p>

      {!assist ? null : (
        <>
          <div
            role="radiogroup"
            aria-label="Metode penyelesaian"
            className="mt-3 grid grid-cols-3 gap-1"
          >
            {METHOD_OPTIONS.map((option) => (
              <Button
                key={option.id}
                variant={guideMethod === option.id ? "primary" : "outline"}
                size="sm"
                role="radio"
                aria-checked={guideMethod === option.id}
                title={option.title}
                className="truncate px-1.5"
                onClick={() => setGuideMethod(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="mt-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            {guideMethod === "optimal" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-ink-soft">
                    Solusi terpendek
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadOptimal}
                    disabled={optimalLoading}
                  >
                    {optimalLoading ? "Menghitung..." : "Hitung ulang"}
                  </Button>
                </div>
                {optimalError ? (
                  <p className="text-xs text-ink-soft" role="alert">
                    {optimalError}
                  </p>
                ) : solved ? (
                  <p className="text-xs text-ink-soft" role="status">
                    Kubus sudah selesai.
                  </p>
                ) : optimal ? (
                  <>
                    <p className="text-[11px] text-ink-soft" aria-live="polite">
                      Langkah berikutnya:{" "}
                      <span className="font-semibold text-ink">
                        {optimalNext ? moveToString(optimalNext) : "-"}
                      </span>{" "}
                      · {optimalPending} langkah lagi
                    </p>
                    <ul className="flex flex-wrap gap-1">
                      {optimal.map((move, index) => {
                        const isNext = index === optimalCursor;
                        return (
                          <li
                            key={`${moveToString(move)}-${index}`}
                            ref={isNext ? optimalChipRef : undefined}
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
                  </>
                ) : (
                  <p className="text-xs text-ink-soft" role="status">
                    {optimalLoading ? "Menghitung solusi terpendek..." : null}
                  </p>
                )}
              </div>
            ) : computing ? (
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
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}