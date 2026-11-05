"use client";

import { useEffect, useMemo, useState } from "react";
import { solveBeginner, type SolveStage } from "@/lib/beginner";
import { isSolved, moveToString, type Move } from "@/lib/cube";
import { solveOptimal } from "@/lib/optimal";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";

/**
 * Solver guide. When on, it lists the beginner-method steps for the current
 * cube and highlights the move to play next. The plan is recomputed from the
 * live state after every turn, so it always matches what is on screen.
 */
export function SolveGuide() {
  const assist = useGameStore((state) => state.assist);
  const setAssist = useGameStore((state) => state.setAssist);
  const cubies = useGameStore((state) => state.cubies);
  const status = useGameStore((state) => state.status);

  const [stages, setStages] = useState<SolveStage[] | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimal, setOptimal] = useState<Move[] | null>(null);
  const [optimalLoading, setOptimalLoading] = useState(false);
  const [optimalError, setOptimalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Defer so the toggle paints first and so state is only touched from an
    // async callback rather than synchronously during the effect body.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      if (!assist) {
        setStages(null);
        setError(null);
        setOptimal(null);
        setOptimalError(null);
        return;
      }
      // The shuffle rewrites the state many times; wait until it settles.
      if (status === "scrambling") return;

      setComputing(true);
      setError(null);
      setOptimal(null);
      setOptimalError(null);
      try {
        const plan = solveBeginner(cubies);
        if (!cancelled) setStages(plan);
      } catch {
        if (!cancelled) {
          setStages(null);
          setError("Panduan gagal dihitung untuk susunan ini.");
        }
      } finally {
        if (!cancelled) setComputing(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [assist, cubies, status]);

  const solved = isSolved(cubies);
  const nextStage = useMemo(
    () => stages?.find((stage) => stage.moves.length > 0) ?? null,
    [stages],
  );
  const nextMove = nextStage?.moves[0] ?? null;

  const pending = useMemo(
    () => stages?.reduce((sum, stage) => sum + stage.moves.length, 0) ?? 0,
    [stages],
  );

  async function loadOptimal() {
    setOptimalLoading(true);
    setOptimalError(null);
    try {
      const moves = await solveOptimal(cubies);
      setOptimal(moves);
    } catch {
      setOptimalError("Solusi optimal gagal dihitung.");
    } finally {
      setOptimalLoading(false);
    }
  }

  return (
    <section aria-labelledby="guide-title" className="border-t border-line pt-4">
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
        <div className="mt-3">
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
                {stages.map((stage) => (
                  <li key={stage.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-xs font-semibold text-ink">
                        {stage.title}
                      </h3>
                      {stage.moves.length === 0 ? (
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
                          const isNext = stage === nextStage && index === 0;
                          return (
                            <li key={`${moveToString(move)}-${index}`}>
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
                ))}
              </ol>

              <div className="border-t border-line pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-ink-soft">
                    Solusi optimal
                  </span>
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
