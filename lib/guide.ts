import type { CubeState } from "./cube";

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
