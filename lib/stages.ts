/**
 * Generic piece machinery for the beginner-method stages.
 *
 * A piece is reduced to "which slot it sits in" plus "which face of that slot
 * its reference sticker points at". A face turn only moves pieces in the turned
 * layer, so one small transition table per move covers every stage. Each stage
 * then runs a breadth-first search over the reduced state of the few pieces it
 * cares about, driven by move sequences that leave earlier stages untouched.
 */

import {
  applyMat,
  axisRotation,
  createSolvedCube,
  FACE_GEOMETRY,
  invertMove,
  moveToString,
  parseMoves,
  stickerNormals,
  type CubeState,
  type Cubie,
  type Mat3,
  type Move,
  type Vec3,
} from "./cube";

function key(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}

function normalsKey(normals: readonly Vec3[]): string {
  return normals.map(key).sort().join("|");
}

function sameNormal(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export interface Slot {
  readonly home: Vec3;
  readonly normals: readonly Vec3[];
}

export interface PieceKind {
  readonly slots: readonly Slot[];
  readonly slotByHome: Map<string, number>;
  readonly slotByNormals: Map<string, number>;
  readonly faceCount: number;
}

function buildKind(stickerCount: number): PieceKind {
  const slots = createSolvedCube()
    .filter((cubie) => stickerNormals(cubie.home).length === stickerCount)
    .map((cubie) => ({
      home: cubie.home,
      normals: stickerNormals(cubie.home),
    }));
  return {
    slots,
    slotByHome: new Map(slots.map((slot, index) => [key(slot.home), index])),
    slotByNormals: new Map(
      slots.map((slot, index) => [normalsKey(slot.normals), index]),
    ),
    faceCount: stickerCount,
  };
}

export const CORNERS: PieceKind = buildKind(3);
export const EDGES: PieceKind = buildKind(2);

/** Orientation reference: U/D sticker if present, else F/B, else L/R. */
export function referenceNormal(home: Vec3): Vec3 {
  const normals = stickerNormals(home);
  return (
    normals.find((normal) => normal[1] !== 0) ??
    normals.find((normal) => normal[2] !== 0) ??
    normals[0]
  );
}

export function slotIndex(kind: PieceKind, home: Vec3): number {
  const index = kind.slotByHome.get(key(home));
  if (index === undefined) throw new Error(`Slot ${key(home)} tidak dikenal.`);
  return index;
}

export function faceIndex(kind: PieceKind, slot: number, normal: Vec3): number {
  const index = kind.slots[slot].normals.findIndex((candidate) =>
    sameNormal(candidate, normal),
  );
  if (index < 0) throw new Error(`Normal ${key(normal)} tidak ada di slot.`);
  return index;
}

export function solvedEntry(kind: PieceKind, home: Vec3): number {
  const slot = slotIndex(kind, home);
  return slot * kind.faceCount + faceIndex(kind, slot, referenceNormal(home));
}

/** Reduced state of one piece: `slot * faceCount + referenceFaceIndex`. */
function pieceState(kind: PieceKind, cubie: Cubie): number {
  const slot = slotIndex(kind, cubie.pos);
  const reference = applyMat(cubie.rot, referenceNormal(cubie.home));
  return slot * kind.faceCount + faceIndex(kind, slot, reference);
}

/** Transition on one piece state for a single face turn. */
function moveTable(kind: PieceKind, move: Move): Uint8Array {
  const { axis, layer } = FACE_GEOMETRY[move.face as keyof typeof FACE_GEOMETRY];
  const rotation: Mat3 = axisRotation(axis, -layer * move.turns);
  const offset = { x: 0, y: 1, z: 2 }[axis];
  const size = kind.slots.length * kind.faceCount;
  const table = new Uint8Array(size);

  kind.slots.forEach((slot, slotIndexValue) => {
    const moved = slot.home[offset] === layer;
    const mapped = slot.normals.map((normal) =>
      moved ? applyMat(rotation, normal) : normal,
    );
    const nextSlot = kind.slotByNormals.get(normalsKey(mapped)) as number;
    slot.normals.forEach((normal, face) => {
      const target = moved ? applyMat(rotation, normal) : normal;
      const nextFace = faceIndex(kind, nextSlot, target);
      table[slotIndexValue * kind.faceCount + face] =
        nextSlot * kind.faceCount + nextFace;
    });
  });

  return table;
}

/** Compose a generator's moves into one piece-state table. */
function generatorTable(kind: PieceKind, moves: readonly Move[]): Uint8Array {
  const size = kind.slots.length * kind.faceCount;
  let combined = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) combined[i] = i;
  for (const move of moves) {
    const step = moveTable(kind, move);
    const next = new Uint8Array(size);
    for (let i = 0; i < size; i += 1) next[i] = step[combined[i]];
    combined = next;
  }
  return combined;
}

export interface StageSolver {
  (state: CubeState): Move[];
}

/** One tracked piece: which kind it is and where it belongs on a solved cube. */
export interface PieceSpec {
  readonly kind: PieceKind;
  readonly home: Vec3;
}

export interface StageConfig {
  readonly name: string;
  /**
   * Pieces this stage solves, in a fixed order. They may mix kinds, so a stage
   * can solve a corner and an edge together as one F2L pair.
   */
  readonly pieces: readonly PieceSpec[];
  /**
   * Acceptable reduced entries (`slot * faceCount + face`) for each piece, in
   * the same order as `pieces`. A single option pins the piece; several options
   * describe a goal that only constrains one aspect, such as "yellow facing up
   * in any top slot" for the last-layer orientation stage.
   */
  readonly goalOptions: readonly (readonly number[])[];
  /** Move sequences that keep this stage's earlier stages solved. */
  readonly generators: readonly Move[][];
}

interface StageRuntime {
  readonly config: StageConfig;
  readonly generators: readonly Move[][];
  /** `tables[generator][piece]` transitions, one table per tracked piece. */
  readonly tables: Uint8Array[][];
  /** Entry count per piece (slot * faceCount), used as mixed-radix bases. */
  readonly bases: number[];
  /** Mixed-radix stride per piece, so an entry tuple encodes to one index. */
  readonly strides: number[];
  readonly total: number;
  distance?: Uint8Array;
}

const runtimeCache = new WeakMap<StageConfig, StageRuntime>();

function generatorKey(moves: readonly Move[]): string {
  return moves.map(moveToString).join(" ");
}

function inverseOf(moves: readonly Move[]): Move[] {
  return moves.map(invertMove).reverse();
}

/**
 * Add the inverse of every generator that is missing. Without this the
 * generator graph is directed, and a distance table built from the goal cannot
 * be walked forwards from an arbitrary state.
 */
function closedGenerators(source: readonly Move[][]): Move[][] {
  const seen = new Set(source.map(generatorKey));
  const result = source.map((moves) => [...moves]);
  for (const moves of source) {
    const inverse = inverseOf(moves);
    const key = generatorKey(inverse);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(inverse);
    }
  }
  return result;
}

function runtime(config: StageConfig): StageRuntime {
  const cached = runtimeCache.get(config);
  if (cached) return cached;
  const generators = closedGenerators(config.generators);
  const bases = config.pieces.map(
    (piece) => piece.kind.slots.length * piece.kind.faceCount,
  );
  // Least-significant piece first, so index = sum(entry[i] * strides[i]).
  const strides: number[] = [];
  let total = 1;
  for (const base of bases) {
    strides.push(total);
    total *= base;
  }
  const value: StageRuntime = {
    config,
    generators,
    tables: generators.map((moves) =>
      config.pieces.map((piece) => generatorTable(piece.kind, moves)),
    ),
    bases,
    strides,
    total,
  };
  runtimeCache.set(config, value);
  return value;
}

const UNVISITED = 255;

function encode(entries: readonly number[], strides: readonly number[]): number {
  let index = 0;
  for (let i = 0; i < entries.length; i += 1) index += entries[i] * strides[i];
  return index;
}

function decode(index: number, bases: readonly number[], strides: readonly number[]): number[] {
  const entries = new Array<number>(bases.length);
  for (let i = 0; i < bases.length; i += 1) {
    entries[i] = Math.floor(index / strides[i]) % bases[i];
  }
  return entries;
}

/** Every reduced index that satisfies a config: one combination per option. */
function goalIndices(run: StageRuntime): number[] {
  let entries: number[][] = [[]];
  for (const options of run.config.goalOptions) {
    entries = entries.flatMap((prefix) =>
      options.map((option) => [...prefix, option]),
    );
  }
  return entries.map((list) => encode(list, run.strides));
}

/** Exact generator count from every reduced state to the stage goal. */
function stageDistance(run: StageRuntime): Uint8Array {
  if (run.distance) return run.distance;
  const count = run.config.pieces.length;
  const total = run.total;
  const distance = new Uint8Array(total).fill(UNVISITED);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  for (const start of goalIndices(run)) {
    if (distance[start] !== UNVISITED) continue;
    distance[start] = 0;
    queue[tail] = start;
    tail += 1;
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const base_ = distance[index];
    if (base_ >= UNVISITED - 1) continue;
    const entries = decode(index, run.bases, run.strides);
    for (const tables of run.tables) {
      const next = new Array<number>(count);
      for (let i = 0; i < count; i += 1) next[i] = tables[i][entries[i]];
      const nextIndex = encode(next, run.strides);
      if (distance[nextIndex] === UNVISITED) {
        distance[nextIndex] = base_ + 1;
        queue[tail] = nextIndex;
        tail += 1;
      }
    }
  }

  run.distance = distance;
  return distance;
}

function findCubie(state: CubeState, home: Vec3): Cubie {
  const cubie = state.find((candidate) => sameNormal(candidate.home, home));
  if (!cubie) throw new Error(`Cubie ${key(home)} hilang.`);
  return cubie;
}

/** Build a solver that walks the distance table one generator at a time. */
export function makeStageSolver(config: StageConfig): StageSolver {
  const run = runtime(config);
  const { pieces } = config;

  return (state: CubeState): Move[] => {
    const distance = stageDistance(run);
    let entries = pieces.map((piece) =>
      pieceState(piece.kind, findCubie(state, piece.home)),
    );
    let index = encode(entries, run.strides);
    const moves: Move[] = [];

    while (distance[index] > 0) {
      let advanced = false;
      for (let generator = 0; generator < run.tables.length; generator += 1) {
        const tables = run.tables[generator];
        const next = entries.map((entry, i) => tables[i][entry]);
        const nextIndex = encode(next, run.strides);
        if (distance[nextIndex] === distance[index] - 1) {
          moves.push(...run.generators[generator]);
          entries = next;
          index = nextIndex;
          advanced = true;
          break;
        }
      }
      if (!advanced) {
        throw new Error(`Stage solver (${config.name}) menemui jalan buntu.`);
      }
    }

    return moves;
  };
}

/** True when every listed piece sits at its home with its reference facing home. */
export function piecesSolved(
  kind: PieceKind,
  state: CubeState,
  homes: readonly Vec3[],
): boolean {
  return homes.every((home) => {
    const cubie = findCubie(state, home);
    const slot = slotIndex(kind, cubie.pos);
    const reference = applyMat(cubie.rot, referenceNormal(home));
    return (
      slot === slotIndex(kind, home) &&
      sameNormal(reference, referenceNormal(home)) &&
      sameNormal(cubie.pos, cubie.home)
    );
  });
}

/** Helper so stage definitions read like cube notation. */
export function alg(notation: string): Move[] {
  return parseMoves(notation);
}
