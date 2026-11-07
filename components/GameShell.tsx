"use client";

import { useEffect, useState } from "react";
import { CubeCanvas } from "@/components/cube/CubeCanvas";
import { BestTimes } from "@/components/ui/BestTimes";
import { Button } from "@/components/ui/Button";
import { ColorLegend } from "@/components/ui/ColorLegend";
import { ControlBar } from "@/components/ui/ControlBar";
import { HelpPanel } from "@/components/ui/HelpPanel";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { MoveTracker } from "@/components/ui/MoveTracker";
import { OrientationPanel } from "@/components/ui/OrientationPanel";
import { ResetDialog } from "@/components/ui/ResetDialog";
import { SolveGuide } from "@/components/ui/SolveGuide";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { StatsPanel } from "@/components/ui/StatsPanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { WinOverlay } from "@/components/ui/WinOverlay";
import { useCubeSound } from "@/hooks/useCubeSound";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useT } from "@/hooks/useT";
import { useGameStore } from "@/store/game";

export function GameShell() {
  const t = useT();
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

  useCubeSound();

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
              {t("app.tagline")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SoundToggle />
            <ThemeToggle />
            <LanguageToggle />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 font-semibold"
              onClick={() => setHelpOpen((open) => !open)}
              aria-expanded={helpOpen}
              aria-label={t("shell.helpAria")}
            >
              <span aria-hidden="true">?</span>
            </Button>
          </div>
        </header>

        <section
          id="kubusin-board"
          aria-label={t("shell.boardAria")}
          className="flex min-w-0 flex-col gap-4 scroll-mt-4 lg:gap-5"
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
            {t("shell.hint")}
          </p>
        </section>

        <aside className="flex min-w-0 flex-col gap-5">
          <SolveGuide />
          <OrientationPanel />
          <StatsPanel />
          <MoveTracker />
          <BestTimes />
          <section className="border-t border-line pt-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
              {t("shell.lettersColors")}
            </h2>
            <ColorLegend className="mt-3" />
          </section>
        </aside>
      </div>

      <footer className="mx-auto w-full max-w-[1180px] px-4 pb-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-line pt-4 text-[11px] text-ink-soft">
          <span>Kubusin</span>
          <a
            href="https://github.com/gilangsuryaa/kubusin"
            target="_blank"
            rel="noreferrer"
            aria-label={t("shell.githubAria")}
            className="inline-flex items-center rounded-[3px] p-1 text-ink-soft transition-colors hover:text-ink"
          >
            <GitHubMark />
          </a>
        </div>
      </footer>

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

/** GitHub mark, sized by the parent text; decorative next to its label. */
function GitHubMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 fill-current"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
