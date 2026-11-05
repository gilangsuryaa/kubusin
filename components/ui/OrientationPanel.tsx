"use client";

import { OPPOSITE_FACE, type Face } from "@/lib/cube";
import {
  FACE_COLORS,
  FACE_COLOR_NAMES,
  FACE_ON_COLOR,
} from "@/lib/cubeColors";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";

const SWATCH_ORDER: Face[] = ["U", "D", "F", "B", "R", "L"];

const ROLE_LABEL = { front: "depan", up: "atas" } as const;

function Swatches({
  role,
  value,
  blocked,
  disabled,
  onPick,
}: {
  role: "front" | "up";
  value: Face;
  /** The face opposite the other selection; cannot be used at the same time. */
  blocked: Face;
  disabled: boolean;
  onPick: (face: Face) => void;
}) {
  const otherRole = role === "front" ? "up" : "front";
  return (
    <div className="flex flex-wrap gap-1.5">
      {SWATCH_ORDER.map((face) => {
        const selected = face === value;
        const unavailable = face === blocked;
        return (
          <button
            key={face}
            type="button"
            disabled={disabled || unavailable}
            aria-pressed={selected}
            aria-label={`${face} — ${FACE_COLOR_NAMES[face]} sebagai sisi ${ROLE_LABEL[role]}`}
            title={
              unavailable
                ? `${FACE_COLOR_NAMES[face]} berseberangan dengan sisi ${ROLE_LABEL[otherRole]}`
                : `${FACE_COLOR_NAMES[face]} sebagai sisi ${ROLE_LABEL[role]}`
            }
            onClick={() => onPick(face)}
            style={{
              backgroundColor: FACE_COLORS[face],
              color: FACE_ON_COLOR[face],
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-[3px] text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-25 ${
              selected
                ? "ring-2 ring-ink ring-offset-2 ring-offset-bg"
                : "ring-1 ring-inset ring-black/20"
            }`}
          >
            {face}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Lets the player tell the app how they hold the cube: which colour is front
 * (algorithm `F`) and which is up (`U`). The rest follows from those two, and
 * both the 3D view and the key mapping update together.
 */
export function OrientationPanel() {
  const orientation = useGameStore((state) => state.orientation);
  const setOrientation = useGameStore((state) => state.setOrientation);
  const assist = useGameStore((state) => state.assist);
  const locked = useGameStore((state) => state.status === "scrambling" || assist);

  // A front and an up face must be perpendicular, so each row hides the face
  // exactly opposite the other selection.
  const frontBlocked = OPPOSITE_FACE[orientation.up];
  const upBlocked = OPPOSITE_FACE[orientation.front];
  const isDefault = orientation.front === "F" && orientation.up === "U";

  return (
    <section
      aria-labelledby="orientation-title"
      className="border-t border-line pt-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="orientation-title"
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft"
        >
          Orientasi
        </h2>
        <Button
          variant="bare"
          size="sm"
          className="px-1.5"
          disabled={isDefault || locked}
          onClick={() => setOrientation("F", "U")}
          title="Kembalikan ke orientasi standar"
        >
          Standar
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
        {assist
          ? "Orientasi dikunci ke standar selama panduan aktif."
          : "Pilih warna yang menghadap depan dan atas. Huruf F, U, dan lainnya mengikuti pilihan ini."}
      </p>
      <div className="mt-3 space-y-2">
        <div
          role="group"
          aria-label="Warna sisi depan"
          className="flex items-center gap-3"
        >
          <span className="w-16 shrink-0 text-xs text-ink-soft">Depan · F</span>
          <Swatches
            role="front"
            value={orientation.front}
            blocked={frontBlocked}
            disabled={locked}
            onPick={(face) => setOrientation(face, orientation.up)}
          />
        </div>
        <div
          role="group"
          aria-label="Warna sisi atas"
          className="flex items-center gap-3"
        >
          <span className="w-16 shrink-0 text-xs text-ink-soft">Atas · U</span>
          <Swatches
            role="up"
            value={orientation.up}
            blocked={upBlocked}
            disabled={locked}
            onPick={(face) => setOrientation(orientation.front, face)}
          />
        </div>
      </div>
    </section>
  );
}