"use client";

import { orientationFaceMap, type Face } from "@/lib/cube";
import {
  FACE_COLORS,
  FACE_COLOR_LABELS,
  FACE_COLOR_NAMES,
} from "@/lib/cubeColors";
import { useGameStore } from "@/store/game";

const ORDER: Face[] = ["U", "D", "F", "B", "R", "L"];

/**
 * Colour legend for the current hold: each algorithm face is paired with the
 * physical colour that now sits on it. Changing the orientation updates this.
 */
export function ColorLegend({ className = "" }: { className?: string }) {
  const orientation = useGameStore((state) => state.orientation);
  const map = orientationFaceMap(orientation.front, orientation.up);

  return (
    <ul className={`grid grid-cols-2 gap-x-4 gap-y-1.5 ${className}`}>
      {ORDER.map((face) => {
        const physical = map[face];
        return (
          <li key={face} className="flex items-center gap-2 text-xs text-ink-soft">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[1px] ring-1 ring-inset ring-ink/20"
              style={{ backgroundColor: FACE_COLORS[physical] }}
            />
            <span className="text-ink">{face}</span>
            <span>{FACE_COLOR_LABELS[face]}</span>
            <span className="sr-only">{FACE_COLOR_NAMES[physical]}</span>
          </li>
        );
      })}
    </ul>
  );
}