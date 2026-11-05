"use client";

import { useEffect, useState } from "react";
import { CubeCanvas } from "@/components/cube/CubeCanvas";
import { BestTimes } from "@/components/ui/BestTimes";
import { Button } from "@/components/ui/Button";
import { ColorLegend } from "@/components/ui/ColorLegend";
import { ControlBar } from "@/components/ui/ControlBar";
import { HelpPanel } from "@/components/ui/HelpPanel";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { OrientationPanel } from "@/components/ui/OrientationPanel";
import { ResetDialog } from "@/components/ui/ResetDialog";
import { SolveGuide } from "@/components/ui/SolveGuide";
import { StatsPanel } from "@/components/ui/StatsPanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { WinOverlay } from "@/components/ui/WinOverlay";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGameStore } from "@/store/game";

export function GameShell() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  /** When on, face turns also rotate the middle layer (`Rw`, `Uw`, ...). */
  const [wideMode, setWideMode] = useState(false);
  /** Which run's win overlay the player already dismissed. */
  const [dismissedSolve, setDismissedSolve] = useState<number | null>(null);

  const reducedMotion = usePrefersReducedMotion();
  const status = useGameStore((state) => state.status);
  const startedAt = useGameStore((state) => state.startedAt);
  const finalMs = useGameStore((state) => state.finalMs);
  const moveCount = useGameStore((state) => state.moves.length);
  const bestTimes = useGameStore((state) => state.bestTimes);
  const assist = useGameStore((state) => state.assist);
  const hydrate = useGameStore((state) => state.hydrate);
  const requestMove = useGameStore((state) => state.requestMove);
  const rotateCube = useGameStore((state) => state.rotateCube);
  const requestScramble = useGameStore((state) => state.requestScramble);
  const requestUndo = useGameStore((state) => state.requestUndo);
  const requestReset = useGameStore((state) => state.requestReset);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const interactive = introDone || reducedMotion;
  const winOpen = status === "solved" && dismissedSolve !== startedAt;
  const keyboardEnabled = interactive && !helpOpen && !winOpen && !resetOpen;
  // Reset only makes sense once there is something to lose.
  const canReset = interactive && status !== "idle" && status !== "scrambling";

  useKeyboard(
    {
      onMove: (name, turns) => requestMove(name, turns, wideMode),
      onRotate: rotateCube,
      onToggleWide: () => setWideMode((on) => !on),
      onScramble: requestScramble,
      onUndo: requestUndo,
      onReset: () => {
        if (canReset) setResetOpen(true);
      },
      onToggleHelp: () => setHelpOpen((open) => !open),
    },
    keyboardEnabled,
  );

  useEffect(() => {
    if (!helpOpen && !winOpen && !resetOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setHelpOpen(false);
      setResetOpen(false);
      setDismissedSolve(startedAt);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen, winOpen, resetOpen, startedAt]);

  const bestMs = bestTimes.length > 0 ? bestTimes[0].ms : null;
  const isNewBest = !assist && finalMs !== null && bestMs !== null && finalMs <= bestMs;

  return (
    <>
      <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-5 px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-x-14 lg:gap-y-8 lg:py-12">
        <header className="flex items-start justify-between gap-4 lg:col-span-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Kubusin
            </h1>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-soft sm:text-sm">
              Putar tiap sisi lewat keyboard atau sentuhan. Waktu mulai pada
              langkah pertama dan berhenti saat kubus selesai.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 font-semibold"
              onClick={() => setHelpOpen((open) => !open)}
              aria-expanded={helpOpen}
              aria-label="Buka bantuan kontrol"
            >
              <span aria-hidden="true">?</span>
            </Button>
          </div>
        </header>

        <section
          aria-label="Papan kubus"
          className="flex min-w-0 flex-col gap-4 lg:gap-5"
        >
          <div className="h-[min(56vh,420px)] sm:h-[min(64vh,520px)] lg:h-[min(74vh,660px)]">
            <CubeCanvas onIntroComplete={() => setIntroDone(true)} />
          </div>
          <ControlBar
            locked={!interactive}
            wide={wideMode}
            onToggleWide={() => setWideMode((on) => !on)}
            onResetRequest={() => {
              if (canReset) setResetOpen(true);
            }}
          />
          <p className="text-[11px] leading-relaxed text-ink-soft">
            Seret kubus untuk memutar kamera, scroll atau cubit untuk zoom.
            Buka panel bantuan untuk daftar lengkap tombol keyboard.
          </p>
        </section>

        <aside className="flex min-w-0 flex-col gap-5">
          <SolveGuide />
          <OrientationPanel />
          <StatsPanel />
          <BestTimes />
          <section className="border-t border-line pt-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
              Huruf dan warna
            </h2>
            <ColorLegend className="mt-3" />
          </section>
        </aside>
      </div>

      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ResetDialog
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          requestReset();
        }}
      />
      <WinOverlay
        open={winOpen}
        ms={finalMs}
        moves={moveCount}
        bestMs={bestMs}
        isNewBest={isNewBest}
        recorded={!assist}
        onPlayAgain={() => {
          setDismissedSolve(startedAt);
          requestScramble();
        }}
        onClose={() => setDismissedSolve(startedAt)}
      />
      <LiveRegion />
    </>
  );
}
