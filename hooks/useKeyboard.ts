"use client";

import { useEffect, useRef } from "react";
import { CAMERA_STEP, hasCameraHandler, nudgeCamera } from "@/lib/cameraBus";
import type { Axis, Face, MoveName, Slice, Turns } from "@/lib/cube";

const FACE_KEYS: Record<string, Face> = {
  u: "U",
  d: "D",
  l: "L",
  r: "R",
  f: "F",
  b: "B",
};

/** Middle slice keys: `M` follows L, `E` follows D, `S` follows F. */
const SLICE_KEYS: Record<string, Slice> = {
  m: "M",
  e: "E",
  s: "S",
};

/** Whole-cube rotations: x follows R, y follows U, z follows F. */
const ROTATION_KEYS: Record<string, Axis> = {
  x: "x",
  y: "y",
  z: "z",
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** Focused controls that own their own Space/Enter activation. */
function isNativeControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "BUTTON" || tag === "A" || tag === "SUMMARY";
}

export interface KeyboardHandlers {
  onMove: (name: MoveName, turns: Turns) => void;
  onRotate: (axis: Axis, turns: Turns) => void;
  onToggleWide: () => void;
  onScramble: () => void;
  onUndo: () => void;
  onReset: () => void;
  onToggleHelp: () => void;
}

/**
 * Global key handling. Cube keys are ignored while a modal owns the screen
 * (`enabled` false), while typing in a field, or with a modifier other than
 * Shift. Arrow keys orbit the camera and are handled here so the page never
 * scrolls underneath the cube.
 */
export function useKeyboard(handlers: KeyboardHandlers, enabled = true): void {
  const handlersRef = useRef(handlers);

  // Keep the latest callbacks without re-binding the listener on every render.
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const { key } = event;
      const current = handlersRef.current;

      // A focused button or link activates itself with Space/Enter; do not let
      // the global cube shortcuts swallow that. Other keys still reach the cube.
      if (
        (key === " " || key === "Spacebar" || key === "Enter") &&
        isNativeControl(event.target)
      ) {
        return;
      }

      if (key === "?" || key === "/") {
        event.preventDefault();
        current.onToggleHelp();
        return;
      }

      if (key.toLowerCase() === "w") {
        event.preventDefault();
        current.onToggleWide();
        return;
      }

      switch (key) {
        case " ":
        case "Spacebar":
          event.preventDefault();
          current.onScramble();
          return;
        case "Backspace":
          event.preventDefault();
          current.onUndo();
          return;
        case "Enter":
          event.preventDefault();
          current.onReset();
          return;
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown": {
          if (!hasCameraHandler()) return;
          event.preventDefault();
          const azimuth =
            key === "ArrowLeft" ? -CAMERA_STEP : key === "ArrowRight" ? CAMERA_STEP : 0;
          const polar = key === "ArrowUp" ? -CAMERA_STEP : key === "ArrowDown" ? CAMERA_STEP : 0;
          nudgeCamera(azimuth, polar);
          return;
        }
        default:
          break;
      }

      const face = FACE_KEYS[key.toLowerCase()];
      if (face) {
        event.preventDefault();
        current.onMove(face, event.shiftKey ? -1 : 1);
        return;
      }

      const slice = SLICE_KEYS[key.toLowerCase()];
      if (slice) {
        event.preventDefault();
        current.onMove(slice, event.shiftKey ? -1 : 1);
        return;
      }

      const axis = ROTATION_KEYS[key.toLowerCase()];
      if (axis) {
        event.preventDefault();
        current.onRotate(axis, event.shiftKey ? -1 : 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
