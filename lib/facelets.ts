/**
 * Bridge between our cubie model and the 54-character facelet string used by
 * Kociemba-style solvers.
 *
 * Order is the standard `URFDLB`, nine facelets each, read row by row as seen
 * when looking straight at the face. The per-face "right" and "up" world
 * vectors below reproduce that convention, so `Cube.fromString` in
 * `rubik-solver` agrees with our state.
 */

import {
  applyMat,
  FACE_NORMAL,
  faceForNormal,
  stickerNormals,
  type CubeState,
  type Cubie,
  type Face,
  type Vec3,
} from "./cube";

/** Face order used by the facelet string. */
const FACE_ORDER: readonly Face[] = ["U", "R", "F", "D", "L", "B"];

interface Basis {
  readonly right: Vec3;
  readonly up: Vec3;
}

const BASIS: Record<Face, Basis> = {
  U: { right: [1, 0, 0], up: [0, 0, -1] },
  R: { right: [0, 0, -1], up: [0, 1, 0] },
  F: { right: [1, 0, 0], up: [0, 1, 0] },
  D: { right: [1, 0, 0], up: [0, 0, 1] },
  L: { right: [0, 0, 1], up: [0, 1, 0] },
  B: { right: [-1, 0, 0], up: [0, 1, 0] },
};

function key(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}

function vecEquals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/** Colour letter of the sticker a cubie shows along `normal`. */
function stickerColor(cubie: Cubie, normal: Vec3): Face {
  for (const local of stickerNormals(cubie.home)) {
    if (vecEquals(applyMat(cubie.rot, local), normal)) {
      const color = faceForNormal(local);
      if (color) return color;
    }
  }
  throw new Error(`Cubie ${cubie.id} has no sticker facing ${key(normal)}.`);
}

/** Serialise a cube state to the 54-character facelet string. */
export function cubeToFacelets(state: CubeState): string {
  const byPosition = new Map<string, Cubie>();
  for (const cubie of state) byPosition.set(key(cubie.pos), cubie);

  let out = "";
  for (const face of FACE_ORDER) {
    const { right, up } = BASIS[face];
    const n = FACE_NORMAL[face];
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const a = column - 1;
        const b = 1 - row;
        const position: Vec3 = [
          n[0] + a * right[0] + b * up[0],
          n[1] + a * right[1] + b * up[1],
          n[2] + a * right[2] + b * up[2],
        ];
        const cubie = byPosition.get(key(position));
        if (!cubie) throw new Error(`No cubie at ${key(position)}.`);
        out += stickerColor(cubie, n);
      }
    }
  }
  return out;
}
