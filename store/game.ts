import { create } from "zustand";
import {
  applyMove,
  areAdjacentFaces,
  createSolvedCube,
  DEFAULT_ORIENTATION,
  generateScramble,
  invertMove,
  isIdentity,
  isSlice,
  isSolved,
  physicalMove,
  rotateOrientation,
  type Axis,
  type CubeOrientation,
  type CubeState,
  type Face,
  type Move,
  type MoveName,
  type Turns,
} from "@/lib/cube";

export type GameStatus = "idle" | "scrambling" | "ready" | "running" | "solved";
/** Where a queued turn came from; only `user` turns start the timer and count. */
export type MoveSource = "user" | "scramble" | "undo";

export interface QueuedMove {
  readonly move: Move;
  readonly source: MoveSource;
}

export interface BestTime {
  readonly id: string;
  readonly ms: number;
  readonly moves: number;
  readonly at: number;
}

export const BEST_TIMES_KEY = "kubusin.best-times.v1";
export const BEST_TIMES_LIMIT = 10;
/** Layer turn length in milliseconds. */
export const MOVE_DURATION_MS = 170;
/** Scramble turns run faster so the shuffle does not feel like a cutscene. */
export const SCRAMBLE_DURATION_MS = 75;
/** Layer turn length when the user prefers reduced motion. */
export const MOVE_DURATION_REDUCED_MS = 60;

export function moveDuration(source: MoveSource, reducedMotion: boolean): number {
  if (reducedMotion) return MOVE_DURATION_REDUCED_MS;
  return source === "scramble" ? SCRAMBLE_DURATION_MS : MOVE_DURATION_MS;
}

interface GameStore {
  cubies: CubeState;
  queue: QueuedMove[];
  /** The move currently being animated, if any. */
  active: QueuedMove | null;
  /** User moves already started, oldest first. Drives undo and the counter. */
  moves: Move[];
  status: GameStatus;
  startedAt: number | null;
  /** Final time in ms once solved. */
  finalMs: number | null;
  bestTimes: BestTime[];
  hydrated: boolean;
  /** Bumped on every scramble so the 3D layer can react if needed. */
  scrambleId: number;
  /** Which colours the player treats as front and up. */
  orientation: CubeOrientation;
  /**
   * True only for a run started by an actual scramble. Manual turning never
   * produces a record, so spinning one face back to solved cannot fake a win.
   */
  runScrambled: boolean;

  requestMove: (name: MoveName, turns: Turns, wide?: boolean) => void;
  /** Change the hold; `front` and `up` must be perpendicular physical faces. */
  setOrientation: (front: Face, up: Face) => void;
  /** Rotate the whole cube like a physical x/y/z turn; not a counted move. */
  rotateCube: (axis: Axis, turns: Turns) => void;
  requestScramble: () => void;
  requestUndo: () => void;
  requestReset: () => void;
  /** Called by the 3D layer once the active turn finished animating. */
  commitActive: () => void;
  hydrate: () => void;
}

interface SchedulerState {
  active: QueuedMove | null;
  queue: QueuedMove[];
  startedAt: number | null;
  status: GameStatus;
  moves: Move[];
}

interface SchedulerPatch {
  active: QueuedMove;
  queue: QueuedMove[];
  startedAt?: number;
  status?: GameStatus;
  moves?: Move[];
}

/**
 * Promote the next queued turn into `active`. A user turn also starts the
 * clock the first time one begins and is appended to the undo history.
 */
function pullNext(state: SchedulerState): SchedulerPatch | null {
  if (state.active || state.queue.length === 0) return null;
  const [next, ...rest] = state.queue;
  const patch: SchedulerPatch = { active: next, queue: rest };
  if (next.source === "user") {
    patch.moves = [...state.moves, next.move];
    if (state.startedAt === null) {
      patch.startedAt = Date.now();
      patch.status = "running";
    }
  }
  return patch;
}

function readBestTimes(): BestTime[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BEST_TIMES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is BestTime =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as BestTime).ms === "number" &&
          typeof (entry as BestTime).moves === "number" &&
          typeof (entry as BestTime).at === "number" &&
          typeof (entry as BestTime).id === "string",
      )
      .sort((a, b) => a.ms - b.ms)
      .slice(0, BEST_TIMES_LIMIT);
  } catch {
    return [];
  }
}

function writeBestTimes(list: BestTime[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(list));
  } catch {
    // Storage can be full or blocked; history is a nice-to-have, never fatal.
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  cubies: createSolvedCube(),
  queue: [],
  active: null,
  moves: [],
  status: "idle",
  startedAt: null,
  finalMs: null,
  bestTimes: [],
  hydrated: false,
  scrambleId: 0,
  orientation: DEFAULT_ORIENTATION,
  runScrambled: false,

  requestMove(name, turns, wide = false) {
    const { status, active, orientation } = get();
    // Input is ignored while the shuffle plays; everything else falls through
    // so rapid key presses only ever queue up.
    if (status === "scrambling" || status === "solved") return;
    // Letters are relative to the player's hold; queue the physical turn so
    // changing the hold later cannot rewrite an already queued turn. Wide only
    // applies to face turns, so slices ignore the flag.
    const requested: Move =
      wide && !isSlice(name)
        ? { face: name, turns, wide: true }
        : { face: name, turns };
    const move = physicalMove(requested, orientation);
    set((state) => ({
      queue: [...state.queue, { move, source: "user" as const }],
    }));
    if (!active) set((state) => pullNext(state) ?? {});
  },

  setOrientation(front, up) {
    // Reject opposite faces; the UI only offers perpendicular choices.
    if (!areAdjacentFaces(front, up)) return;
    set({ orientation: { front, up } });
  },

  rotateCube(axis, turns) {
    const state = get();
    // The shuffle owns the cube while it plays; do not fight it.
    if (state.status === "scrambling") return;
    set({ orientation: rotateOrientation(state.orientation, axis, turns) });
  },

  requestScramble() {
    const moves = generateScramble();
    set((state) => ({
      cubies: createSolvedCube(),
      queue: moves.map((move) => ({ move, source: "scramble" as const })),
      active: null,
      moves: [],
      status: "scrambling",
      startedAt: null,
      finalMs: null,
      scrambleId: state.scrambleId + 1,
      runScrambled: true,
    }));
    set((state) => pullNext(state) ?? {});
  },

  requestUndo() {
    const state = get();
    if (state.status === "scrambling" || state.status === "solved") return;

    // Turns that never started animating are dropped first: that is what the
    // last key press actually was.
    const pendingUserTurns = state.queue.filter((entry) => entry.source === "user");
    if (pendingUserTurns.length > 0) {
      const lastPending = state.queue.lastIndexOf(pendingUserTurns[pendingUserTurns.length - 1]);
      set({
        queue: state.queue.filter((_, index) => index !== lastPending),
      });
      return;
    }

    if (state.moves.length === 0) return;
    const lastMove = state.moves[state.moves.length - 1];
    set((prev) => ({
      moves: prev.moves.slice(0, -1),
      queue: [...prev.queue, { move: invertMove(lastMove), source: "undo" as const }],
    }));
    if (!state.active) set((prev) => pullNext(prev) ?? {});
  },

  requestReset() {
    set({
      cubies: createSolvedCube(),
      queue: [],
      active: null,
      moves: [],
      status: "idle",
      startedAt: null,
      finalMs: null,
      runScrambled: false,
    });
  },

  commitActive() {
    const state = get();
    if (!state.active) return;

    const cubies = applyMove(state.cubies, state.active.move);

    // Undoing the only move of a run that began on a solved cube lands on the
    // exact starting state; that is a cancellation, not a win.
    if (
      state.active.source === "undo" &&
      state.queue.length === 0 &&
      state.moves.length === 0 &&
      isIdentity(cubies)
    ) {
      set({
        cubies,
        active: null,
        status: "idle",
        startedAt: null,
        finalMs: null,
      });
      return;
    }

    const solvedNow =
      state.active.source === "user" &&
      state.status === "running" &&
      state.queue.length === 0 &&
      isSolved(cubies);

    // A record only counts for a run that began with an actual scramble.
    // Manually spinning a face back to solved just returns to idle.
    if (solvedNow && !state.runScrambled) {
      set({
        cubies,
        active: null,
        moves: [],
        status: "idle",
        startedAt: null,
        finalMs: null,
      });
      return;
    }

    const finalMs = solvedNow ? Date.now() - (state.startedAt ?? Date.now()) : null;

    set({
      cubies,
      active: null,
      status: solvedNow ? "solved" : state.status,
      finalMs,
      ...(solvedNow ? { queue: [] } : {}),
    });

    if (solvedNow && finalMs !== null) {
      const now = Date.now();
      const entry: BestTime = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        ms: finalMs,
        moves: get().moves.length,
        at: now,
      };
      const bestTimes = [...get().bestTimes, entry]
        .sort((a, b) => a.ms - b.ms)
        .slice(0, BEST_TIMES_LIMIT);
      writeBestTimes(bestTimes);
      set({ bestTimes });
      return;
    }

    const next = pullNext(get());
    if (next) {
      set(next);
      return;
    }
    if (get().status === "scrambling") set({ status: "ready" });
  },

  hydrate() {
    set({ bestTimes: readBestTimes(), hydrated: true });
  },
}));
