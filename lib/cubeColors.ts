import type { Face } from "./cube";
import type { MessageKey } from "./i18n";

/**
 * Standard Western colour scheme: white up, yellow down, green front, blue
 * back, red right, orange left.
 */
export const FACE_COLORS: Record<Face, string> = {
  U: "#f8f7f4",
  D: "#ffd23f",
  F: "#1fa85c",
  B: "#1b6fe3",
  R: "#e2372f",
  L: "#ff7f1f",
};

/** Small swatch colours for the legend, tuned to read on both themes. */
export const FACE_COLOR_LABELS: Record<Face, MessageKey> = {
  U: "face.label.U",
  D: "face.label.D",
  F: "face.label.F",
  B: "face.label.B",
  R: "face.label.R",
  L: "face.label.L",
};

/** Human colour names, used by the orientation picker. */
export const FACE_COLOR_NAMES: Record<Face, MessageKey> = {
  U: "face.name.U",
  D: "face.name.D",
  F: "face.name.F",
  B: "face.name.B",
  R: "face.name.R",
  L: "face.name.L",
};

/** Text colour that stays legible on top of each sticker colour. */
export const FACE_ON_COLOR: Record<Face, string> = {
  U: "#17161a",
  D: "#17161a",
  F: "#17161a",
  B: "#ffffff",
  R: "#17161a",
  L: "#17161a",
};

export const CUBE_BODY_COLOR = "#0c0c0c";
