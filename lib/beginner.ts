/**
 * Beginner-method solver.
 *
 * Layers are solved bottom-up. The D face (yellow centre) is the first layer,
 * which keeps the last-layer algorithms in their standard "last layer on top"
 * form, and the U face (white centre) is the last layer. The final state is the
 * canonical solved cube. Every stage is a reduced-state breadth-first search
 * over just the few pieces it targets, driven by move sequences that leave the
 * earlier stages untouched.
 */

import {
  FACES,
  applyMoves,
  type CubeState,
  type Face,
  type Move,
  type Vec3,
} from "./cube";
import {
  alg,
  CORNERS,
  EDGES,
  faceIndex,
  makeStageSolver,
  piecesSolved,
  solvedEntry,
  type PieceKind,
  type StageConfig,
} from "./stages";

const U_NORMAL: Vec3 = [0, 1, 0];
const D_NORMAL: Vec3 = [0, -1, 0];

function sameNormal(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function cornerHomes(normal: Vec3): Vec3[] {
  return CORNERS.slots
    .filter((slot) => slot.normals.some((candidate) => sameNormal(candidate, normal)))
    .map((slot) => slot.home);
}

function edgeHomes(normal: Vec3): Vec3[] {
  return EDGES.slots
    .filter((slot) => slot.normals.some((candidate) => sameNormal(candidate, normal)))
    .map((slot) => slot.home);
}

/** Pieces with a D-face sticker (yellow). These form the first layer. */
const D_CORNERS = cornerHomes(D_NORMAL);
export const D_EDGES = edgeHomes(D_NORMAL);
/** Pieces with a U-face sticker (white). These form the last layer. */
const U_CORNERS = cornerHomes(U_NORMAL);
const U_EDGES = edgeHomes(U_NORMAL);

const MIDDLE_EDGES = EDGES.slots
  .filter((slot) => slot.home[1] === 0)
  .map((slot) => slot.home);

/** Pinned goal: every piece sits at home with its reference sticker homeward. */
function solvedGoal(kind: PieceKind, homes: readonly Vec3[]): number[][] {
  return homes.map((home) => [solvedEntry(kind, home)]);
}

/**
 * Orientation goal: the reference sticker faces `normal` in any slot that has
 * it, so layer permutation is not constrained and a later stage can fix it.
 */
function orientationGoal(
  kind: PieceKind,
  homes: readonly Vec3[],
  normal: Vec3,
): number[][] {
  return homes.map(() =>
    kind.slots.flatMap((slot, index) =>
      slot.normals.some((candidate) => sameNormal(candidate, normal))
        ? [index * kind.faceCount + faceIndex(kind, index, normal)]
        : [],
    ),
  );
}

function config(
  name: string,
  kind: PieceKind,
  homes: readonly Vec3[],
  goalOptions: number[][],
  generators: readonly Move[][],
): StageConfig {
  return {
    name,
    pieces: homes.map((home) => ({ kind, home })),
    goalOptions,
    generators,
  };
}

/* ------------------------------------------------------------------ *
 * Move vocabulary shared by the stage generators.
 * ------------------------------------------------------------------ */

const U_MOVE = alg("U");
const UP_MOVE = alg("U'");
const U2_MOVE = alg("U U");

/** Whole-cube y maps these faces into each other. */
const Y_MAP: Record<Face, Face> = {
  U: "U",
  D: "D",
  R: "F",
  F: "L",
  L: "B",
  B: "R",
};

function rotated(notation: string, times: number): Move[] {
  let moves = alg(notation);
  for (let step = 0; step < times; step += 1) {
    moves = moves.map((move) => ({ ...move, face: Y_MAP[move.face as Face] }));
  }
  return moves;
}

/** Every single quarter turn, used by the free first-layer cross stage. */
const SINGLE_TURNS: Move[][] = FACES.flatMap((face) =>
  ([1, -1] as const).map((turns) => [{ face, turns }]),
);

/* ------------------------------------------------------------------ *
 * Stage definitions.
 * ------------------------------------------------------------------ */

const SEXY = "R U R' U'";

const crossStage = config(
  "cross",
  EDGES,
  D_EDGES,
  solvedGoal(EDGES, D_EDGES),
  SINGLE_TURNS,
);

const cornerStage = config(
  "corners",
  CORNERS,
  D_CORNERS,
  solvedGoal(CORNERS, D_CORNERS),
  [
    U_MOVE,
    UP_MOVE,
    U2_MOVE,
    rotated(SEXY, 0),
    rotated(SEXY, 1),
    rotated(SEXY, 2),
    rotated(SEXY, 3),
  ],
);

const middleStage = config(
  "middle",
  EDGES,
  MIDDLE_EDGES,
  solvedGoal(EDGES, MIDDLE_EDGES),
  [
    U_MOVE,
    UP_MOVE,
    U2_MOVE,
    ...[0, 1, 2, 3].map((turn) => rotated("U R U' R' U' F' U F", turn)),
    ...[0, 1, 2, 3].map((turn) => rotated("U' L' U L U F U' F'", turn)),
  ],
);

const whiteCrossStage = config(
  "white-cross",
  EDGES,
  U_EDGES,
  orientationGoal(EDGES, U_EDGES, U_NORMAL),
  [U_MOVE, UP_MOVE, U2_MOVE, alg("F R U R' U' F'")],
);

const ollCornersStage = config(
  "oll-corners",
  CORNERS,
  U_CORNERS,
  orientationGoal(CORNERS, U_CORNERS, U_NORMAL),
  [
    U_MOVE,
    UP_MOVE,
    U2_MOVE,
    alg("R U R' U R U U R'"),
    alg("R U U R' U' R U' R'"),
  ],
);

const pllCornersStage = config(
  "pll-corners",
  CORNERS,
  U_CORNERS,
  solvedGoal(CORNERS, U_CORNERS),
  [U_MOVE, UP_MOVE, U2_MOVE, alg("U R U' L' U R' U' L")],
);

/** Pure edge 3-cycle (Ua perm); leaves corner positions untouched. */
const PLL_EDGE_ALG = "R U' R U R U R U' R' U' R R";

const pllEdgesStage = config(
  "pll-edges",
  EDGES,
  U_EDGES,
  solvedGoal(EDGES, U_EDGES),
  [
    // Conjugates by U keep the already-placed corners fixed, unlike a bare U.
    alg(PLL_EDGE_ALG),
    alg(`U ${PLL_EDGE_ALG} U'`),
    alg(`U U ${PLL_EDGE_ALG} U U`),
    alg(`U' ${PLL_EDGE_ALG} U`),
  ],
);

const CROSS = makeStageSolver(crossStage);
const CORNER = makeStageSolver(cornerStage);
const MIDDLE = makeStageSolver(middleStage);
export const WHITE_CROSS = makeStageSolver(whiteCrossStage);
export const OLL_CORNERS = makeStageSolver(ollCornersStage);
export const PLL_CORNERS = makeStageSolver(pllCornersStage);
export const PLL_EDGES = makeStageSolver(pllEdgesStage);

/** Moves that complete the first-layer cross, shortest for its four edges. */
export function solveCross(state: CubeState): Move[] {
  return CROSS(state);
}

/** True when the four first-layer edges form their cross. */
export function isCrossSolved(state: CubeState): boolean {
  return piecesSolved(EDGES, state, D_EDGES);
}

export interface SolveStage {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly moves: readonly Move[];
}

interface StageDefinition {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly solve: (state: CubeState) => Move[];
}

const STAGES: readonly StageDefinition[] = [
  {
    id: "cross",
    title: "Cross lapisan bawah",
    detail: "Susun empat tepi kuning mengelilingi pusat kuning di sisi bawah.",
    solve: CROSS,
  },
  {
    id: "corners",
    title: "Sudut lapisan bawah",
    detail: "Masukkan empat sudut kuning ke lapisan bawah.",
    solve: CORNER,
  },
  {
    id: "middle",
    title: "Lapisan tengah",
    detail: "Selipkan empat tepi tengah yang tidak berwarna putih.",
    solve: MIDDLE,
  },
  {
    id: "white-cross",
    title: "Cross lapisan atas",
    detail: "Bentuk palang putih di sisi atas.",
    solve: WHITE_CROSS,
  },
  {
    id: "oll-corners",
    title: "Orientasi sudut atas",
    detail: "Balik sudut atas sampai warna putih menghadap atas.",
    solve: OLL_CORNERS,
  },
  {
    id: "pll-corners",
    title: "Susun sudut atas",
    detail: "Pindahkan sudut putih ke posisi akhirnya.",
    solve: PLL_CORNERS,
  },
  {
    id: "pll-edges",
    title: "Susun tepi atas",
    detail: "Pindahkan tepi putih agar kubus selesai.",
    solve: PLL_EDGES,
  },
];

/** Drop adjacent opposite turns of the same face; they cancel out. */
export function cancelRedundant(moves: readonly Move[]): Move[] {
  const out: Move[] = [];
  for (const move of moves) {
    const top = out[out.length - 1];
    if (
      top &&
      top.face === move.face &&
      (top.wide ?? false) === (move.wide ?? false) &&
      top.turns === -move.turns
    ) {
      out.pop();
      continue;
    }
    out.push(move);
  }
  return out;
}

/** Full staged beginner solution for the current cube state. */
export function solveBeginner(state: CubeState): SolveStage[] {
  let current = state;
  const result: SolveStage[] = [];
  for (const stage of STAGES) {
    const moves = cancelRedundant(stage.solve(current));
    current = applyMoves(current, moves);
    result.push({
      id: stage.id,
      title: stage.title,
      detail: stage.detail,
      moves,
    });
  }
  return result;
}
