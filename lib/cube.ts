/**
 * Pure Rubik's Cube model. No three.js, no React, no browser APIs.
 *
 * State is a list of 27 cubies. Each cubie keeps its home coordinate (where it
 * sits on a solved cube), its current integer coordinate and a 3x3 integer
 * rotation matrix that maps local directions to world directions. Integer
 * arithmetic means no floating point drift, so equality checks are exact.
 *
 * Coordinates: x right, y up, z toward the viewer. A clockwise turn of a face as
 * seen from outside is a -90 degree rotation about that face's outward axis.
 */

export type Vec3 = readonly [number, number, number];

/** Row-major 3x3 integer matrix. */
export type Mat3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

export type Axis = "x" | "y" | "z";
export type Face = "U" | "D" | "L" | "R" | "F" | "B";
/** Middle slice: `M` follows L, `E` follows D, `S` follows F. */
export type Slice = "M" | "E" | "S";
export type MoveName = Face | Slice;
/** 1 = clockwise as seen from outside, -1 = counter-clockwise. */
export type Turns = 1 | -1;

export interface Move {
  readonly face: MoveName;
  readonly turns: Turns;
  /**
   * Wide turn: the face layer and the middle layer on the same axis turn
   * together (`Rw`, `Uw`, ...). Ignored for slice moves. Orientation is never
   * affected, just like a normal face turn.
   */
  readonly wide?: boolean;
  /**
   * Face named by the player's hold rather than by the physical cube. Set on
   * logged player turns so a saved record still means the same turn when it is
   * replayed under a different orientation (`requestMove` resolves it again).
   */
  readonly logical?: boolean;
}

export interface Cubie {
  /** Stable identity, derived from the home coordinate. */
  readonly id: string;
  /** Position on a solved cube. */
  readonly home: Vec3;
  /** Current position. */
  readonly pos: Vec3;
  /** Current orientation. */
  readonly rot: Mat3;
}

export type CubeState = readonly Cubie[];

export const IDENTITY3: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export const FACES: readonly Face[] = ["U", "D", "L", "R", "F", "B"];

const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

interface FaceGeometry {
  readonly axis: Axis;
  /** Which layer of that axis the face occupies: +1 or -1. */
  readonly layer: 1 | -1;
}

export const FACE_GEOMETRY: Record<Face, FaceGeometry> = {
  U: { axis: "y", layer: 1 },
  D: { axis: "y", layer: -1 },
  R: { axis: "x", layer: 1 },
  L: { axis: "x", layer: -1 },
  F: { axis: "z", layer: 1 },
  B: { axis: "z", layer: -1 },
};

/** Middle slices sit at layer 0 and take their direction from a face. */
export const SLICE_GEOMETRY: Record<Slice, { axis: Axis; follows: Face }> = {
  M: { axis: "x", follows: "L" },
  E: { axis: "y", follows: "D" },
  S: { axis: "z", follows: "F" },
};

/** The slice token that owns a given axis: x -> M, y -> E, z -> S. */
export const SLICE_FOR_AXIS: Record<Axis, Slice> = { x: "M", y: "E", z: "S" };

export const SLICES: readonly Slice[] = ["M", "E", "S"];

export function isSlice(name: MoveName): name is Slice {
  return name === "M" || name === "E" || name === "S";
}

/** Face letter to the outward normal of that face on a solved cube. */
export const FACE_NORMAL: Record<Face, Vec3> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

export const OPPOSITE_FACE: Record<Face, Face> = {
  U: "D",
  D: "U",
  R: "L",
  L: "R",
  F: "B",
  B: "F",
};

/** Positive (counter-clockwise looking down the positive axis) quarter turns. */
const AXIS_ROTATION: Record<Axis, Mat3> = {
  x: [1, 0, 0, 0, 0, -1, 0, 1, 0],
  y: [0, 0, 1, 0, 1, 0, -1, 0, 0],
  z: [0, -1, 0, 1, 0, 0, 0, 0, 1],
};

export function mulMat(a: Mat3, b: Mat3): Mat3 {
  const out = new Array<number>(9);
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      out[r * 3 + c] =
        a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    }
  }
  return out as unknown as Mat3;
}

export function applyMat(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

function mod4(n: number): number {
  return ((n % 4) + 4) % 4;
}

/** Rotation about an axis by `quarters` quarter turns (positive = +90 degrees). */
export function axisRotation(axis: Axis, quarters: number): Mat3 {
  let result = IDENTITY3;
  const steps = mod4(quarters);
  for (let i = 0; i < steps; i += 1) {
    result = mulMat(AXIS_ROTATION[axis], result);
  }
  return result;
}

/**
 * Total quarter turns of a move about the positive axis.
 * Clockwise from outside is -90 degrees about the outward axis, and the outward
 * axis equals `direction` times the positive axis, hence `-direction * turns`.
 * A slice follows its reference face's direction but stays at layer 0.
 */
export function moveQuarters(move: Move): number {
  const direction = isSlice(move.face)
    ? FACE_GEOMETRY[SLICE_GEOMETRY[move.face].follows].layer
    : FACE_GEOMETRY[move.face].layer;
  return -direction * move.turns;
}

export function moveAxis(move: Move): Axis {
  return isSlice(move.face)
    ? SLICE_GEOMETRY[move.face].axis
    : FACE_GEOMETRY[move.face].axis;
}

export function moveLayer(move: Move): -1 | 0 | 1 {
  return isSlice(move.face) ? 0 : FACE_GEOMETRY[move.face].layer;
}

export function moveMatrix(move: Move): Mat3 {
  return axisRotation(moveAxis(move), moveQuarters(move));
}

export function invertMove(move: Move): Move {
  return { ...move, turns: move.turns === 1 ? -1 : 1 };
}

/**
 * True when the move turns the face layer and the middle layer together
 * (`Rw`, `Uw`, ...). Slices are never wide.
 */
export function isWide(move: Move): boolean {
  return move.wide === true && !isSlice(move.face);
}

function vecEquals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function matEquals(a: Mat3, b: Mat3): boolean {
  for (let i = 0; i < 9; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

/** True when the cubie belongs to the turned group of `move`. */
export function isInLayer(cubie: Cubie, move: Move): boolean {
  const position = cubie.pos[AXIS_INDEX[moveAxis(move)]];
  if (position === moveLayer(move)) return true;
  return isWide(move) && position === 0;
}

export function faceColor(face: Face): Face {
  return face;
}

/** Sticker normals of a cubie, taken from its home position. */
export function stickerNormals(home: Vec3): Vec3[] {
  const normals: Vec3[] = [];
  (["x", "y", "z"] as Axis[]).forEach((axis) => {
    const value = home[AXIS_INDEX[axis]];
    if (value !== 0) {
      const v: [number, number, number] = [0, 0, 0];
      v[AXIS_INDEX[axis]] = value > 0 ? 1 : -1;
      normals.push(v);
    }
  });
  return normals;
}

function normalKey(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}

const NORMAL_FACE = new Map<string, Face>(
  (Object.keys(FACE_NORMAL) as Face[]).map((face) => [
    normalKey(FACE_NORMAL[face]),
    face,
  ]),
);

/** Which face of a solved cube points along `normal`. */
export function faceForNormal(normal: Vec3): Face | undefined {
  return NORMAL_FACE.get(normalKey(normal));
}

/** Two faces can be front and up together only when they are perpendicular. */
export function areAdjacentFaces(a: Face, b: Face): boolean {
  const na = FACE_NORMAL[a];
  const nb = FACE_NORMAL[b];
  return na[0] * nb[0] + na[1] * nb[1] + na[2] * nb[2] === 0;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  // `+ 0` normalises negative zero so integer matrix comparisons stay exact.
  return [
    a[1] * b[2] - a[2] * b[1] + 0,
    a[2] * b[0] - a[0] * b[2] + 0,
    a[0] * b[1] - a[1] * b[0] + 0,
  ];
}

function assertAdjacent(front: Face, up: Face): void {
  if (!areAdjacentFaces(front, up)) {
    throw new Error(`Faces ${front} and ${up} are not perpendicular.`);
  }
}

/**
 * How the player holds the cube. `front` and `up` are the *physical* faces
 * whose colours the player wants to treat as front (algorithm `F`) and up
 * (algorithm `U`).
 */
export interface CubeOrientation {
  readonly front: Face;
  readonly up: Face;
}

export const DEFAULT_ORIENTATION: CubeOrientation = { front: "F", up: "U" };

/**
 * Map each algorithm face letter to the physical face that must turn.
 *
 * With `front` facing the viewer and `up` above, the player's right is
 * `up x front`; the remaining faces are the opposites.
 */
export function orientationFaceMap(
  front: Face,
  up: Face,
): Record<Face, Face> {
  assertAdjacent(front, up);
  const right = faceForNormal(
    cross(FACE_NORMAL[up], FACE_NORMAL[front]),
  );
  if (!right) throw new Error("Orientation produced an invalid right face.");
  return {
    U: up,
    D: OPPOSITE_FACE[up],
    F: front,
    B: OPPOSITE_FACE[front],
    R: right,
    L: OPPOSITE_FACE[right],
  };
}

/**
 * Rotation that brings the physical `front` to +z and `up` to +y, so the
 * chosen colours line up with the canonical camera. Row-major 3x3.
 */
export function orientationRotation(front: Face, up: Face): Mat3 {
  assertAdjacent(front, up);
  const right = cross(FACE_NORMAL[up], FACE_NORMAL[front]);
  const f = FACE_NORMAL[front];
  const u = FACE_NORMAL[up];
  return [
    right[0], right[1], right[2],
    u[0], u[1], u[2],
    f[0], f[1], f[2],
  ];
}

/** True when the orientation is the canonical white-up green-front hold. */
export function isDefaultOrientation(orientation: CubeOrientation): boolean {
  return orientation.front === "F" && orientation.up === "U";
}

/** Whole-cube rotation axes follow these move directions (standard x/y/z). */
export const CUBE_ROTATION_FACE: Record<Axis, Face> = {
  x: "R",
  y: "U",
  z: "F",
};

const AXES: readonly Axis[] = ["x", "y", "z"];

export function transposeMat(m: Mat3): Mat3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

/**
 * Rotation of the entire cube: `x` follows an R turn, `y` an U turn, and `z`
 * an F turn. Same `turns` convention as a face move.
 */
export function cubeRotationMatrix(axis: Axis, turns: Turns): Mat3 {
  return moveMatrix({ face: CUBE_ROTATION_FACE[axis], turns });
}

/**
 * Re-hold the cube after a whole-cube rotation. Rotating in the player's view
 * frame means pre-multiplying the display rotation by the move rotation; the
 * new front and up are the physical faces that end up at +z and +y.
 */
export function rotateOrientation(
  orientation: CubeOrientation,
  axis: Axis,
  turns: Turns,
): CubeOrientation {
  const display = orientationRotation(orientation.front, orientation.up);
  const rotation = mulMat(cubeRotationMatrix(axis, turns), display);
  const inverse = transposeMat(rotation);
  const front = faceForNormal(applyMat(inverse, FACE_NORMAL.F));
  const up = faceForNormal(applyMat(inverse, FACE_NORMAL.U));
  if (!front || !up) {
    throw new Error("Whole-cube rotation produced an invalid orientation.");
  }
  return { front, up };
}

/**
 * Shortest sequence of whole-cube rotations (`x`/`y`/`z` with +/- turns) that
 * turns one hold into another. Every hold is reachable in at most two quarter
 * turns, so a breadth-first walk over the 24 holds is cheap.
 */
export function orientationPath(
  from: CubeOrientation,
  to: CubeOrientation,
): { axis: Axis; turns: Turns }[] {
  if (from.front === to.front && from.up === to.up) return [];
  const key = (orientation: CubeOrientation) =>
    `${orientation.front}${orientation.up}`;
  const goal = key(to);
  const seen = new Set([key(from)]);
  const steps: [Axis, Turns][] = [];
  for (const axis of AXES) {
    for (const turns of [1, -1] as Turns[]) steps.push([axis, turns]);
  }
  type Node = { orientation: CubeOrientation; path: { axis: Axis; turns: Turns }[] };
  let frontier: Node[] = [{ orientation: from, path: [] }];
  while (frontier.length > 0) {
    const next: Node[] = [];
    for (const node of frontier) {
      for (const [axis, turns] of steps) {
        const orientation = rotateOrientation(node.orientation, axis, turns);
        if (key(orientation) === goal) {
          return [...node.path, { axis, turns }];
        }
        if (seen.has(key(orientation))) continue;
        seen.add(key(orientation));
        next.push({ orientation, path: [...node.path, { axis, turns }] });
      }
    }
    frontier = next;
  }
  throw new Error("Orientation is unreachable by whole-cube rotations.");
}

/**
 * Resolve a notated move to the physical layer that must turn for a given
 * hold. Face letters map directly; a slice takes the axis and direction of its
 * reference face, so `M` always follows the physical left face. The result is
 * independent of the display, which can then change freely.
 */
export function physicalMove(
  move: Move,
  orientation: CubeOrientation,
): Move {
  const map = orientationFaceMap(orientation.front, orientation.up);
  if (!isSlice(move.face)) {
    const physical: Move = { face: map[move.face], turns: move.turns };
    // Wide is a property of the hold-independent notation, so it carries over.
    return isWide(move) ? { ...physical, wide: true } : physical;
  }
  const physicalRef = map[SLICE_GEOMETRY[move.face].follows];
  const axis = FACE_GEOMETRY[physicalRef].axis;
  const direction = FACE_GEOMETRY[physicalRef].layer;
  const target = SLICE_FOR_AXIS[axis];
  const targetDirection = FACE_GEOMETRY[SLICE_GEOMETRY[target].follows].layer;
  // Pick the sign that reproduces the reference face's direction on this axis.
  const turns: Turns =
    direction * move.turns * targetDirection === 1 ? 1 : -1;
  return { face: target, turns };
}

export function createSolvedCube(): CubeState {
  const cubies: Cubie[] = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const home: Vec3 = [x, y, z];
        cubies.push({
          id: `${x},${y},${z}`,
          home,
          pos: home,
          rot: IDENTITY3,
        });
      }
    }
  }
  return cubies;
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const rotation = moveMatrix(move);
  return state.map((cubie) => {
    if (!isInLayer(cubie, move)) return cubie;
    return {
      ...cubie,
      pos: applyMat(rotation, cubie.pos),
      rot: mulMat(rotation, cubie.rot),
    };
  });
}

export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  return moves.reduce(applyMove, state);
}

/**
 * A cube is solved when every one of the six faces shows a single colour.
 * Sticker colours come from the cubie's home normals, world normals from its
 * orientation, so this catches twisted corners that a position-only check
 * would miss.
 */
export function isSolved(state: CubeState): boolean {
  const faceColors = new Map<string, Face>();
  const faceCounts = new Map<string, number>();
  for (const cubie of state) {
    for (const normal of stickerNormals(cubie.home)) {
      const world = applyMat(cubie.rot, normal);
      const key = normalKey(world);
      const color = NORMAL_FACE.get(normalKey(normal));
      if (!color) return false;
      const existing = faceColors.get(key);
      if (existing !== undefined && existing !== color) return false;
      faceColors.set(key, color);
      faceCounts.set(key, (faceCounts.get(key) ?? 0) + 1);
    }
  }
  if (faceColors.size !== 6) return false;
  for (const count of faceCounts.values()) if (count !== 9) return false;
  return true;
}

/** A cube is pristine when the exact state equals the solved one, orientations included. */
export function isIdentity(state: CubeState): boolean {
  return state.every(
    (cubie) => vecEquals(cubie.pos, cubie.home) && matEquals(cubie.rot, IDENTITY3),
  );
}

export function moveToString(move: Move): string {
  const wide = isWide(move) ? "w" : "";
  const face = move.logical ? move.face.toLowerCase() : move.face;
  return `${face}${wide}${move.turns === -1 ? "'" : ""}`;
}

/**
 * One entry in a player's solve log: either a face/slice turn, or a whole-cube
 * rotation (`x`, `y`, `z`) that only changes the hold. Rotations must ride along
 * with the turns so a replay reproduces the same view the player had.
 */
export type LogMove =
  | { readonly kind: "turn"; readonly move: Move }
  | { readonly kind: "rotate"; readonly axis: Axis; readonly turns: Turns };

export function logMoveToString(entry: LogMove): string {
  return entry.kind === "rotate"
    ? `${entry.axis}${entry.turns === -1 ? "'" : ""}`
    : moveToString(entry.move);
}

export function parseLogMoves(input: string): LogMove[] {
  const tokens = input.trim().length === 0 ? [] : input.trim().split(/\s+/);
  return tokens.map((token) => {
    const raw = token[0];
    const upper = raw.toUpperCase();
    const lower = raw.toLowerCase();
    const turns: Turns = token.includes("'") ? -1 : 1;
    // Rotation letters are always written lower-case, so the axis check runs on
    // the raw letter before face parsing upper-cases it.
    if (AXES.includes(lower as Axis)) {
      return { kind: "rotate" as const, axis: lower as Axis, turns };
    }
    const logical = raw !== upper;
    const name = upper as MoveName;
    if (!isSlice(name) && !FACES.includes(name)) {
      throw new Error(`Unknown face: ${token}`);
    }
    const wide = !isSlice(name) && /w/i.test(token);
    const move: Move = wide ? { face: name, turns, wide: true } : { face: name, turns };
    return {
      kind: "turn" as const,
      move: logical ? { ...move, logical: true } : move,
    };
  });
}

export function parseMoves(input: string): Move[] {
  const tokens = input.trim().length === 0 ? [] : input.trim().split(/\s+/);
  return tokens.map((token) => {
    // A lower-case face letter means "as the player named it", which only
    // matters for a replay under a non-standard hold. Slices stay upper case.
    const raw = token[0];
    const upper = raw.toUpperCase();
    const logical = raw !== upper;
    const name = upper as MoveName;
    if (!isSlice(name) && !FACES.includes(name)) {
      throw new Error(`Unknown face: ${token}`);
    }
    const turns: Turns = token.includes("'") ? -1 : 1;
    const wide = !isSlice(name) && /w/i.test(token);
    const move: Move = wide ? { face: name, turns, wide: true } : { face: name, turns };
    return logical && !isSlice(name) ? { ...move, logical: true } : move;
  });
}

export interface ScrambleOptions {
  /** Number of moves, clamped to 20..25 by default range. */
  readonly count?: number;
  /** Injectable RNG for deterministic tests. Returns [0, 1). */
  readonly random?: () => number;
  /** Avoid repeating the same axis back to back as well as the same face. */
  readonly avoidSameAxis?: boolean;
}

export function generateScramble(options: ScrambleOptions = {}): Move[] {
  const {
    count = 20 + Math.floor((options.random ?? Math.random)() * 6),
    random = Math.random,
    avoidSameAxis = true,
  } = options;
  const moves: Move[] = [];
  let previousFace: Face | null = null;
  let previousAxis: Axis | null = null;

  while (moves.length < count) {
    const face = FACES[Math.floor(random() * FACES.length)];
    const axis = FACE_GEOMETRY[face].axis;
    if (face === previousFace) continue;
    if (avoidSameAxis && axis === previousAxis) continue;
    const turns: Turns = random() < 0.5 ? 1 : -1;
    moves.push({ face, turns });
    previousFace = face;
    previousAxis = axis;
  }
  return moves;
}
