"use client";

import { useT } from "@/hooks/useT";
import type { Face, Slice, Turns } from "@/lib/cube";
import { FACE_COLOR_LABELS } from "@/lib/cubeColors";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";

const TURN_ORDER: Face[] = ["U", "D", "L", "R", "F", "B"];
const SLICE_ORDER: Slice[] = ["M", "E", "S"];
/** Middle slices turn in the direction of the face they follow. */
const SLICE_FOLLOWS: Record<Slice, Face> = { M: "L", E: "D", S: "F" };
const TURNS: Turns[] = [1, -1];

/** Pure icon (no text) so the button's accessible name stays in control. */
function TurnIcon({ clockwise }: { clockwise: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`size-3 shrink-0 text-ink-soft ${clockwise ? "" : "-scale-x-100"}`}
    >
      <path
        d="M12.6 5.4A5.4 5.4 0 1 0 13.2 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12.9 1.9v3.6H9.3z" fill="currentColor" />
    </svg>
  );
}

/**
 * On-screen controls for touch input: the three game actions, a wide-move
 * toggle, and both directions of all six faces plus the three middle slices.
 * Labels stay in cube notation because that is what the keyboard legend uses.
 */
export function ControlBar({
  locked = false,
  wide = false,
  onToggleWide,
  onResetRequest,
}: {
  locked?: boolean;
  /** When on, face buttons turn the face and the middle layer together. */
  wide?: boolean;
  onToggleWide: () => void;
  onResetRequest: () => void;
}) {
  const t = useT();
  const requestMove = useGameStore((state) => state.requestMove);
  const requestScramble = useGameStore((state) => state.requestScramble);
  const requestUndo = useGameStore((state) => state.requestUndo);
  const status = useGameStore((state) => state.status);
  const moveCount = useGameStore((state) => state.moves.length);

  const busy = status === "scrambling";
  const undoDisabled = locked || busy || status === "solved" || moveCount === 0;
  const resetDisabled = locked || busy || status === "idle";
  const wideState = t(wide ? "control.wideOn" : "control.wideOff");

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="primary"
          disabled={locked}
          onClick={requestScramble}
          aria-label={t("control.scrambleAria")}
          title={t("control.scrambleTitle")}
        >
          {t("control.scramble")}
        </Button>
        <Button
          variant="outline"
          disabled={undoDisabled}
          onClick={requestUndo}
          aria-label={t("control.undoAria")}
          title={t("control.undoTitle")}
        >
          {t("control.undo")}
        </Button>
        <Button
          variant="outline"
          disabled={resetDisabled}
          onClick={onResetRequest}
          aria-label={t("control.resetAria")}
          title={t("control.resetTitle")}
        >
          {t("control.reset")}
        </Button>
      </div>

      <Button
        variant={wide ? "primary" : "outline"}
        disabled={locked || busy}
        onClick={onToggleWide}
        aria-pressed={wide}
        aria-label={t("control.wideModeAria", { state: wideState })}
        title={t("control.wideTitle")}
      >
        <span className="font-semibold">W</span>
        <span>{t("control.wide", { state: wideState })}</span>
      </Button>

      <div className="grid grid-cols-6 gap-1.5">
        {TURN_ORDER.flatMap((face) =>
          TURNS.map((turns) => {
            const clockwise = turns === 1;
            const scope = t(wide ? "control.scopeWide" : "control.scopeFace");
            const direction = t(
              clockwise ? "control.faceDir.clockwise" : "control.faceDir.counter",
            );
            const label = t("control.faceLabel", {
              color: t(FACE_COLOR_LABELS[face]),
              direction,
            });
            const notation = `${face}${wide ? "w" : ""}${clockwise ? "" : "'"}`;
            return (
              <Button
                key={`${face}${turns}`}
                variant="tile"
                size="sm"
                disabled={locked || busy}
                onClick={() => requestMove(face, turns, wide)}
                aria-label={t("control.turnAria", { scope, label, notation })}
                title={t("control.turnTitle", { notation, label })}
              >
                <span className="font-semibold">{face}</span>
                <TurnIcon clockwise={clockwise} />
              </Button>
            );
          }),
        )}
      </div>

      <div
        role="group"
        aria-label={t("control.sliceGroupAria")}
        className="grid grid-cols-6 gap-1.5"
      >
        {SLICE_ORDER.flatMap((slice) =>
          TURNS.map((turns) => {
            const clockwise = turns === 1;
            const follows = SLICE_FOLLOWS[slice];
            const notation = `${slice}${clockwise ? "" : "'"}`;
            const label = t("control.sliceLabel", {
              direction: t(
                clockwise
                  ? "control.sliceDir.clockwise"
                  : "control.sliceDir.counter",
              ),
              follows,
            });
            return (
              <Button
                key={`${slice}${turns}`}
                variant="tile"
                size="sm"
                disabled={locked || busy}
                onClick={() => requestMove(slice, turns)}
                aria-label={t("control.sliceAria", { label, notation })}
                title={t("control.sliceTitle", { notation, label })}
              >
                <span className="font-semibold">{slice}</span>
                <TurnIcon clockwise={clockwise} />
              </Button>
            );
          }),
        )}
      </div>
    </div>
  );
}
