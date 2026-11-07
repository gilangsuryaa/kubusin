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
  logMoveToString,
  moveToString,
  orientationPath,
  parseLogMoves,
  parseMoves,
  physicalMove,
  rotateOrientation,
  type Axis,
  type CubeOrientation,
  type CubeState,
  type Face,
  type LogMove,
  type Move,
  type MoveName,
  type Turns,
} from "@/lib/cube";
import {
  applyLocale,
  readStoredLocale,
  writeStoredLocale,
  type Locale,
} from "@/lib/i18n";
import { REPLAY_DURATION_MS } from "./timing";

export type GameStatus = "idle" | "scrambling" | "ready" | "running" | "solved";
/** Where a queued turn came from; only `user` turns start the timer and count. */
export type MoveSource = "user" | "scramble" | "undo";
/** Solver the guide walks the player through. */
export type GuideMethod = "beginner" | "cfop" | "optimal";

export interface QueuedMove {
  readonly move: Move;
  readonly source: MoveSource;
  /** The turn as the player asked for it; set on every player turn. */
  readonly label?: Move;
  /**
   * Whole-cube rotations that happened just before this turn in a replay; they
   * are logged again when the turn starts so a re-saved record keeps them.
   */
  readonly rotations?: readonly LogMove[];
  /** The hold to adopt when this turn starts; set on replay turns only. */
  readonly hold?: CubeOrientation;
}

export interface BestTime {
  readonly id: string;
  readonly ms: number;
  readonly moves: number;
  readonly at: number;
  /** The scramble the run started from, in notation, so it can be replayed. */
  readonly scramble: string;
  /** The player's turns in notation, as the player named them. */
  readonly solution: string;
}

export const BEST_TIMES_KEY = "kubusin.best-times.v1";
/** Every solve is kept so progress can be read back over time. */
export const BEST_TIMES_LIMIT = 200;
/** Playback speeds a replay can run at, slowest first. */
export const REPLAY_SPEEDS = [0.25, 0.5, 1, 1.5, 2] as const;
/** Storage key for the sound-effects preference. */
export const SOUND_KEY = "kubusin.sound.v1";
/** Storage key for the guide's chosen method. */
export const GUIDE_METHOD_KEY = "kubusin.guide-method.v1";
/** Layer turn length in milliseconds. */
export const MOVE_DURATION_MS = 170;
/** Scramble turns run faster so the shuffle does not feel like a cutscene. */
export const SCRAMBLE_DURATION_MS = 75;
/** Layer turn length when the user prefers reduced motion. */
export const MOVE_DURATION_REDUCED_MS = 60;

export function moveDuration(
  source: MoveSource,
  reducedMotion: boolean,
  replaying = false,
  /** Playback multiplier for a replay; 1 is the default rewatch pace. */
  replaySpeed = 1,
): number {
  if (reducedMotion) return MOVE_DURATION_REDUCED_MS;
  // A replay runs the whole saved solve back to back, so it gets a quicker,
  // uniform pace instead of the scramble-then-play timing. The player can slow
  // it right down to study a solve or speed it up to skim one.
  if (replaying) {
    const base = Math.max(0.25, Math.min(4, replaySpeed));
    return REPLAY_DURATION_MS / base;
  }
  return source === "scramble" ? SCRAMBLE_DURATION_MS : MOVE_DURATION_MS;
}

interface GameStore {
  cubies: CubeState;
  queue: QueuedMove[];
  /** The move currently being animated, if any. */
  active: QueuedMove | null;
  /** User moves already started, oldest first. Drives undo and the counter. */
  moves: Move[];
  /**
   * Everything the player did that changes the board or the view, in order:
   * whole-cube rotations and the turns they made. Stored in one log so a saved
   * solution can be replayed exactly, including the hold it was played under.
   */
  log: LogMove[];
  /** The shuffle in notation, kept for the move tracker. */
  scramble: Move[];
  /**
   * Every non-scramble turn applied to the cube, in order, including undos.
   * A raw log for analysis, so it can differ from `moves`, which excludes
   * turns the player took back.
   */
  history: Move[];
  status: GameStatus;
  startedAt: number | null;
  /** Final time in ms once solved. */
  finalMs: number | null;
  bestTimes: BestTime[];
  /** The record whose solution the tracker is showing, if any. */
  replayingId: string | null;
  /** Playback multiplier for replays: 1 is normal, lower is slower. */
  replaySpeed: number;
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
  /**
   * Solver guide. When on, the hold is pinned to the standard orientation and
   * solves do not count as records.
   */
  assist: boolean;
  /** Which method the guide shows while `assist` is on. */
  guideMethod: GuideMethod;
  /** Sound effects for turns and the win chime. On unless the player opted out. */
  soundOn: boolean;
  /** UI language, Indonesian by default. */
  locale: Locale;

  requestMove: (name: MoveName, turns: Turns, wide?: boolean) => void;
  /** Change the hold; `front` and `up` must be perpendicular physical faces. */
  setOrientation: (front: Face, up: Face) => void;
  /** Rotate the whole cube like a physical x/y/z turn; not a counted move. */
  rotateCube: (axis: Axis, turns: Turns) => void;
  /** Turn the solver guide on or off; enabling pins the standard hold. */
  setAssist: (enabled: boolean) => void;
  /** Pick the guide's method and remember it. */
  setGuideMethod: (method: GuideMethod) => void;
  /** Flip the sound-effects preference and remember it. */
  toggleSound: () => void;
  /** Switch the UI language and remember it. */
  setLocale: (locale: Locale) => void;
  requestScramble: () => void;
  requestUndo: () => void;
  requestReset: () => void;
  /** Called by the 3D layer once the active turn finished animating. */
  commitActive: () => void;
  /** Replay a saved record: scramble, solution, and a fresh timed run. */
  replayRecord: (id: string) => void;
  /** Set the replay playback multiplier; clamped to the known speeds. */
  setReplaySpeed: (speed: number) => void;
  /** Delete one saved record; ignored when the id is unknown. */
  deleteBestTime: (id: string) => void;
  hydrate: () => void;
}

interface SchedulerState {
  active: QueuedMove | null;
  queue: QueuedMove[];
  startedAt: number | null;
  status: GameStatus;
  moves: Move[];
  log: LogMove[];
}

interface SchedulerPatch {
  active: QueuedMove;
  queue: QueuedMove[];
  startedAt?: number;
  status?: GameStatus;
  moves?: Move[];
  log?: LogMove[];
  orientation?: CubeOrientation;
}

/**
 * Promote the next queued turn into `active`. A user turn also starts the
 * clock the first time one begins and is appended to the undo history.
 */
function pullNext(state: SchedulerState): SchedulerPatch | null {
  if (state.active || state.queue.length === 0) return null;
  const [next, ...rest] = state.queue;
  const patch: SchedulerPatch = { active: next, queue: rest };
  // A replay turn restores the hold it was played under, then logs the
  // rotations that produced that hold so a re-saved record keeps them.
  if (next.hold) patch.orientation = next.hold;
  if (next.rotations && next.rotations.length > 0) {
    patch.log = [...state.log, ...next.rotations];
  }
  if (next.source === "user") {
    patch.moves = [...state.moves, next.move];
    patch.log = [
      ...(patch.log ?? state.log),
      { kind: "turn", move: next.label ?? next.move },
    ];
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
      // Records saved before the replay fields existed stay valid; only the
      // replay itself is missing.
      .map((entry) => ({
        ...entry,
        scramble: typeof entry.scramble === "string" ? entry.scramble : "",
        solution: typeof entry.solution === "string" ? entry.solution : "",
      }))
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

/** Sound defaults on, so only an explicit "off" turns it down. */
function readSound(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

function writeSound(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // Non-fatal: the toggle still works for this session.
  }
}

const GUIDE_METHODS: readonly GuideMethod[] = ["beginner", "cfop", "optimal"];

function readGuideMethod(): GuideMethod {
  if (typeof window === "undefined") return "beginner";
  try {
    const raw = window.localStorage.getItem(GUIDE_METHOD_KEY);
    return GUIDE_METHODS.includes(raw as GuideMethod)
      ? (raw as GuideMethod)
      : "beginner";
  } catch {
    return "beginner";
  }
}

function writeGuideMethod(method: GuideMethod): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUIDE_METHOD_KEY, method);
  } catch {
    // Non-fatal: the choice still applies for this session.
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  cubies: createSolvedCube(),
  queue: [],
  active: null,
  moves: [],
  log: [],
  scramble: [],
  history: [],
  status: "idle",
  startedAt: null,
  finalMs: null,
  bestTimes: [],
  replayingId: null,
  replaySpeed: 1,
  hydrated: false,
  scrambleId: 0,
  orientation: DEFAULT_ORIENTATION,
  runScrambled: false,
  assist: false,
  guideMethod: "beginner",
  soundOn: true,
  locale: "id",

  requestMove(name, turns, wide = false) {
    const { status, active, orientation, replayingId } = get();
    // Input is ignored while a shuffle plays, but not during a replay: taking
    // over mid-replay is the clearest way to say "I want to play again".
    if (status === "scrambling" && replayingId === null) return;
    if (status === "solved") return;
    // Letters are relative to the player's hold; queue the physical turn so
    // changing the hold later cannot rewrite an already queued turn. Wide only
    // applies to face turns, so slices ignore the flag.
    const requested: Move =
      wide && !isSlice(name)
        ? { face: name, turns, wide: true }
        : { face: name, turns };
    const move = physicalMove(requested, orientation);
    set((state) => {
      const next: QueuedMove = {
        move,
        // The player's own letter, kept so `log` and a saved record stay the
        // same under any hold.
        label: { face: name, turns, logical: true, ...(wide ? { wide: true } : {}) },
        source: "user",
      };
      const patch: Partial<GameStore> = {
        queue: [...state.queue, next],
        replayingId: null,
      };
      // Taking over from a replay: the board is mid-scramble, so drop the rest
      // of the replay and let the player carry on from where the cube stands.
      if (state.replayingId !== null) {
        const queued = state.queue
          .filter((entry) => entry.source === "scramble")
          .map((entry) => ({ ...entry, source: "scramble" as MoveSource }));
        patch.queue = [...queued, next];
        patch.status = "running";
        patch.scramble = [...state.scramble, ...queued.map((entry) => entry.move)];
      }
      return patch;
    });
    if (!active) set((state) => pullNext(state) ?? {});
  },

  setOrientation(front, up) {
    // The guide needs the screen letters to match the physical hold.
    if (get().assist) return;
    // Reject opposite faces; the UI only offers perpendicular choices.
    if (!areAdjacentFaces(front, up)) return;
    const state = get();
    // Whole-cube rotations that reach this hold, so the tracker and any saved
    // record keep the view change alongside the turns around it.
    const rotations = orientationPath(state.orientation, { front, up }).map(
      (rotation): LogMove => ({ kind: "rotate", ...rotation }),
    );
    set({
      orientation: { front, up },
      log: [...state.log, ...rotations],
      replayingId: null,
    });
  },

  rotateCube(axis, turns) {
    const state = get();
    // The shuffle owns the cube while it plays; do not fight it.
    if (state.status === "scrambling" && state.replayingId === null) return;
    // The guide pins the hold, so whole-cube rotations are ignored.
    if (state.assist) return;
    const entry: LogMove = { kind: "rotate", axis, turns };
    set({
      orientation: rotateOrientation(state.orientation, axis, turns),
      // Rotating changes which face a letter means, so a saved solution needs
      // the rotation in the log to be replayed under the same hold.
      log: [...state.log, entry],
      replayingId: null,
    });
  },

  setAssist(enabled) {
    // Enabling the guide snaps the hold so the shown letters are unambiguous.
    set({ assist: enabled, ...(enabled ? { orientation: DEFAULT_ORIENTATION } : {}) });
  },

  setGuideMethod(method) {
    writeGuideMethod(method);
    set({ guideMethod: method });
  },

  toggleSound() {
    set((state) => {
      const on = !state.soundOn;
      writeSound(on);
      return { soundOn: on };
    });
  },

  setLocale(locale) {
    writeStoredLocale(locale);
    applyLocale(locale);
    set({ locale });
  },

  requestScramble() {
    const moves = generateScramble();
    set((state) => ({
      cubies: createSolvedCube(),
      queue: moves.map((move) => ({ move, source: "scramble" as const })),
      active: null,
      moves: [],
      log: [],
      scramble: moves,
      history: [],
      status: "scrambling",
      startedAt: null,
      finalMs: null,
      replayingId: null,
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
    // Drop the turn's log entry; any rotations before it stay, since the hold
    // they produced is still what the board shows.
    const lastTurn = state.log.map((entry) => entry.kind).lastIndexOf("turn");
    const log = lastTurn < 0 ? state.log : [...state.log.slice(0, lastTurn), ...state.log.slice(lastTurn + 1)];
    set((prev) => ({
      moves: prev.moves.slice(0, -1),
      log,
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
      log: [],
      scramble: [],
      history: [],
      status: "idle",
      startedAt: null,
      finalMs: null,
      replayingId: null,
      runScrambled: false,
    });
  },

  commitActive() {
    const state = get();
    if (!state.active) return;

    const cubies = applyMove(state.cubies, state.active.move);
    // The shuffle is logged once, up front; only player turns stream in here.
    const history =
      state.active.source === "scramble"
        ? state.history
        : [...state.history, state.active.move];

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
        history,
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
        history,
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
      history,
      active: null,
      status: solvedNow ? "solved" : state.status,
      finalMs,
      ...(solvedNow ? { queue: [] } : {}),
    });

    if (solvedNow && finalMs !== null && !state.assist) {
      const now = Date.now();
      const finished = get();
      const entry: BestTime = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        ms: finalMs,
        moves: finished.moves.length,
        at: now,
        scramble: finished.scramble.map(moveToString).join(" "),
        solution: finished.log.map(logMoveToString).join(" "),
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

  /** Replay a saved record: same scramble, same turns, fresh timed run. */
  replayRecord(id) {
    const state = get();
    const entry = state.bestTimes.find((candidate) => candidate.id === id);
    if (!entry || entry.scramble.length === 0 || entry.solution.length === 0) return;

    let scramble: Move[];
    let solution: LogMove[];
    try {
      scramble = parseMoves(entry.scramble);
      solution = parseLogMoves(entry.solution);
    } catch {
      // A malformed log must never wedge the board; keep the current run.
      return;
    }

    // Walk the saved log from the standard hold. Rotations move the hold first,
    // then each turn is resolved with that hold, which is exactly how it was
    // played. The result is a queue of turns plus the view changes between them.
    const queue: QueuedMove[] = scramble.map((move) => ({
      move,
      source: "scramble" as const,
    }));
    let hold: CubeOrientation = DEFAULT_ORIENTATION;
    let rotations: LogMove[] = [];
    for (const item of solution) {
      if (item.kind === "rotate") {
        hold = rotateOrientation(hold, item.axis, item.turns);
        rotations = [...rotations, item];
        continue;
      }
      const turn = item.move;
      const requested: Move = turn.logical
        ? { face: turn.face, turns: turn.turns, ...(turn.wide ? { wide: true } : {}) }
        : turn;
      queue.push({
        move: physicalMove(requested, hold),
        source: "user",
        label: turn.logical ? requested : undefined,
        rotations,
        hold,
      });
      rotations = [];
    }

    set({
      cubies: createSolvedCube(),
      queue,
      active: null,
      moves: [],
      log: [],
      scramble,
      history: [],
      status: "scrambling",
      startedAt: null,
      finalMs: null,
      replayingId: entry.id,
      scrambleId: state.scrambleId + 1,
      runScrambled: true,
      orientation: DEFAULT_ORIENTATION,
    });
    // A replayed run is already a finished record; it must not be saved again.
    set((current) => ({ ...(pullNext(current) ?? {}), assist: true }));
  },

  setReplaySpeed(speed) {
    if (!Number.isFinite(speed) || speed <= 0) return;
    set({ replaySpeed: Math.max(0.25, Math.min(4, speed)) });
  },

  deleteBestTime(id) {
    const state = get();
    if (!state.bestTimes.some((entry) => entry.id === id)) return;
    const bestTimes = state.bestTimes.filter((entry) => entry.id !== id);
    writeBestTimes(bestTimes);
    // Removing the record that is playing stops the rewatch instead of leaving
    // the board replaying something the player just deleted.
    set({
      bestTimes,
      ...(state.replayingId === id ? { replayingId: null } : {}),
    });
  },

  hydrate() {
    const locale = readStoredLocale();
    applyLocale(locale);
    set({
      bestTimes: readBestTimes(),
      soundOn: readSound(),
      guideMethod: readGuideMethod(),
      locale,
      hydrated: true,
    });
  },
}));
