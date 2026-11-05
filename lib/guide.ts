import type { CubeState, Move } from "./cube";
import { applyMoves } from "./cube";

/** Two cube states are identical when every cubie matches by order and turn. */
export function sameCube(a: CubeState, b: CubeState): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.pos[0] !== right.pos[0] ||
      left.pos[1] !== right.pos[1] ||
      left.pos[2] !== right.pos[2]
    ) {
      return false;
    }
    for (let k = 0; k < 9; k += 1) {
      if (left.rot[k] !== right.rot[k]) return false;
    }
  }
  return true;
}

/**
 * How far a player has walked through a fixed plan. Returns the number of plan
 * moves played when the cube still equals the plan's prefix for that count, or
 * `null` once the cube diverges (a different move, a scramble, or a reset).
 * Comparing the real cube, not just the move log, lets a plan survive undos
 * and keeps a guide from replanning after every quarter turn.
 */
export function planCursor(
  start: CubeState,
  plan: readonly Move[],
  played: readonly Move[],
  actual: CubeState,
): number | null {
  if (played.length > plan.length) return null;
  const expected = applyMoves(start, plan.slice(0, played.length));
  return sameCube(expected, actual) ? played.length : null;
}
