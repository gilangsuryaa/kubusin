import { beforeEach, describe, expect, it } from "vitest";
import {
  applyMoves,
  createSolvedCube,
  DEFAULT_ORIENTATION,
  invertMove,
  isSolved,
  orientationFaceMap,
  parseMoves,
  type Face,
} from "@/lib/cube";
import { useGameStore } from "./game";

function resetStore(): void {
  useGameStore.setState({
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
    hydrated: true,
    scrambleId: 0,
    orientation: DEFAULT_ORIENTATION,
    runScrambled: false,
    assist: false,
    guideMethod: "beginner",
    soundOn: true,
  });
}

describe("slice moves in the store", () => {
  beforeEach(resetStore);

  it("counts as a user move and starts the timer", () => {
    useGameStore.getState().requestMove("M", 1);
    const state = useGameStore.getState();
    expect(state.moves).toHaveLength(1);
    expect(state.status).toBe("running");
    expect(state.startedAt).not.toBeNull();
  });

  it("never changes the orientation", () => {
    const before = useGameStore.getState().orientation;
    for (const slice of ["M", "E", "S"] as const) {
      useGameStore.getState().requestMove(slice, 1);
    }
    expect(useGameStore.getState().orientation).toBe(before);
  });

  it("still lets whole-cube rotations change the orientation", () => {
    const before = useGameStore.getState().orientation;
    useGameStore.getState().rotateCube("x", 1);
    expect(useGameStore.getState().orientation).not.toEqual(before);
  });

  it("resolves M through the hold: orange front, yellow up -> physical S", () => {
    useGameStore.getState().setOrientation("L", "D");
    useGameStore.getState().requestMove("M", 1);
    expect(useGameStore.getState().active?.move).toEqual({
      face: "S",
      turns: 1,
    });
  });

  it("resolves E through the hold: orange front, yellow up -> E prime", () => {
    useGameStore.getState().setOrientation("L", "D");
    useGameStore.getState().requestMove("E", 1);
    expect(useGameStore.getState().active?.move).toEqual({
      face: "E",
      turns: -1,
    });
  });

  it("undoes a committed slice turn", () => {
    const { requestMove, commitActive, requestUndo } = useGameStore.getState();
    requestMove("S", 1);
    commitActive();
    expect(useGameStore.getState().moves).toHaveLength(1);

    requestUndo();
    commitActive();
    expect(useGameStore.getState().moves).toHaveLength(0);
    expect(useGameStore.getState().status).toBe("idle");
  });
});

describe("solve records", () => {
  beforeEach(resetStore);

  /** Four quarter turns of one face return a solved cube to solved. */
  function turnRFourTimes(): void {
    for (let i = 0; i < 4; i += 1) {
      useGameStore.getState().requestMove("R", 1);
      useGameStore.getState().commitActive();
    }
  }

  it("ignores a solve made by turning a face without a scramble", () => {
    turnRFourTimes();
    const state = useGameStore.getState();
    expect(state.status).toBe("idle");
    expect(state.finalMs).toBeNull();
    expect(state.startedAt).toBeNull();
    expect(state.bestTimes).toHaveLength(0);
    expect(state.moves).toHaveLength(0);
  });

  it("records a solve once the run started from a scramble", () => {
    useGameStore.setState({ runScrambled: true });
    turnRFourTimes();
    const state = useGameStore.getState();
    expect(state.status).toBe("solved");
    expect(state.finalMs).not.toBeNull();
    expect(state.bestTimes).toHaveLength(1);
  });

  it("clears the run flag on reset", () => {
    useGameStore.setState({ runScrambled: true });
    useGameStore.getState().requestReset();
    expect(useGameStore.getState().runScrambled).toBe(false);
  });
});

describe("solver guide (assist)", () => {
  beforeEach(resetStore);

  function turnRFourTimes(): void {
    for (let i = 0; i < 4; i += 1) {
      useGameStore.getState().requestMove("R", 1);
      useGameStore.getState().commitActive();
    }
  }

  it("snaps the hold to standard when enabled", () => {
    useGameStore.getState().setOrientation("L", "D");
    useGameStore.getState().setAssist(true);
    expect(useGameStore.getState().orientation).toEqual(DEFAULT_ORIENTATION);
  });

  it("pins the hold while on", () => {
    useGameStore.getState().setAssist(true);
    useGameStore.getState().setOrientation("L", "D");
    useGameStore.getState().rotateCube("x", 1);
    expect(useGameStore.getState().orientation).toEqual(DEFAULT_ORIENTATION);
    useGameStore.getState().setAssist(false);
    useGameStore.getState().rotateCube("x", 1);
    expect(useGameStore.getState().orientation).not.toEqual(DEFAULT_ORIENTATION);
  });

  it("solves a scrambled run without recording a best time", () => {
    useGameStore.setState({ runScrambled: true, assist: true });
    turnRFourTimes();
    const state = useGameStore.getState();
    expect(state.status).toBe("solved");
    expect(state.finalMs).not.toBeNull();
    expect(state.bestTimes).toHaveLength(0);
  });

  it("defaults to the beginner method and switches on demand", () => {
    expect(useGameStore.getState().guideMethod).toBe("beginner");
    useGameStore.getState().setGuideMethod("cfop");
    expect(useGameStore.getState().guideMethod).toBe("cfop");
    useGameStore.getState().setGuideMethod("optimal");
    expect(useGameStore.getState().guideMethod).toBe("optimal");
  });
});

describe("wide moves in the store", () => {
  beforeEach(resetStore);

  it("queues a wide physical move for a face", () => {
    useGameStore.getState().requestMove("R", 1, true);
    expect(useGameStore.getState().active?.move).toEqual({
      face: "R",
      turns: 1,
      wide: true,
    });
  });

  it("resolves a wide face through the hold and keeps the flag", () => {
    useGameStore.getState().setOrientation("L", "D");
    useGameStore.getState().requestMove("F", 1, true);
    // The player's front is the physical orange (L) face.
    expect(useGameStore.getState().active?.move).toEqual({
      face: "L",
      turns: 1,
      wide: true,
    });
  });

  it("ignores the wide flag for slices", () => {
    useGameStore.getState().requestMove("M", 1, true);
    expect(useGameStore.getState().active?.move).toEqual({
      face: "M",
      turns: 1,
    });
  });

  it("never changes the orientation", () => {
    const before = useGameStore.getState().orientation;
    for (const face of ["U", "D", "L", "R", "F", "B"] as const) {
      useGameStore.getState().requestMove(face, 1, true);
    }
    expect(useGameStore.getState().orientation).toBe(before);
  });

  it("undoes a committed wide turn in one step", () => {
    const { requestMove, commitActive, requestUndo } = useGameStore.getState();
    requestMove("U", 1, true);
    commitActive();
    expect(useGameStore.getState().moves).toHaveLength(1);

    requestUndo();
    commitActive();
    expect(useGameStore.getState().moves).toHaveLength(0);
    expect(useGameStore.getState().status).toBe("idle");
  });

  it("does not fake a record when spinning a wide turn back to solved", () => {
    for (let i = 0; i < 4; i += 1) {
      useGameStore.getState().requestMove("R", 1, true);
      useGameStore.getState().commitActive();
    }
    const state = useGameStore.getState();
    expect(state.status).toBe("idle");
    expect(state.bestTimes).toHaveLength(0);
  });
});

describe("move tracker", () => {
  beforeEach(resetStore);

  function play(face: "U" | "D" | "L" | "R" | "F" | "B", turns: 1 | -1): void {
    useGameStore.getState().requestMove(face, turns);
    useGameStore.getState().commitActive();
  }

  it("stores the shuffle in notation", () => {
    useGameStore.getState().requestScramble();
    const scramble = useGameStore.getState().scramble;
    expect(scramble.length).toBeGreaterThanOrEqual(20);
    expect(scramble.length).toBeLessThanOrEqual(25);
  });

  it("logs each committed user turn in order", () => {
    play("R", 1);
    play("U", -1);
    expect(useGameStore.getState().history).toEqual([
      { face: "R", turns: 1 },
      { face: "U", turns: -1 },
    ]);
  });

  it("logs an undo as the inverse turn", () => {
    play("R", 1);
    useGameStore.getState().requestUndo();
    useGameStore.getState().commitActive();
    expect(useGameStore.getState().history).toEqual([
      { face: "R", turns: 1 },
      { face: "R", turns: -1 },
    ]);
  });

  it("starts a fresh log on a new scramble", () => {
    play("R", 1);
    useGameStore.getState().requestScramble();
    const state = useGameStore.getState();
    expect(state.history).toEqual([]);
    expect(state.scramble.length).toBeGreaterThan(0);
  });

  it("clears the log on reset", () => {
    play("R", 1);
    useGameStore.getState().requestReset();
    expect(useGameStore.getState().history).toEqual([]);
    expect(useGameStore.getState().scramble).toEqual([]);
  });
});

describe("sound preference", () => {
  beforeEach(resetStore);

  it("defaults to on", () => {
    expect(useGameStore.getState().soundOn).toBe(true);
  });

  it("flips when toggled", () => {
    useGameStore.getState().toggleSound();
    expect(useGameStore.getState().soundOn).toBe(false);
    useGameStore.getState().toggleSound();
    expect(useGameStore.getState().soundOn).toBe(true);
  });
});

describe("record replay", () => {
  beforeEach(resetStore);

  /** Plays a scripted run to solved and returns the saved record's id. */
  function recordRun(scramble: string, solution: string): string {
    // Writes the shuffle up front; the "turns" that follow undo it. A four-turn
    // run avoids the one-turn cancellation that is not a win.
    const moves = parseMoves(scramble);
    useGameStore.setState({
      runScrambled: true,
      cubies: applyMoves(createSolvedCube(), moves),
      scramble: moves,
    });
    for (const move of parseMoves(solution)) {
      useGameStore.getState().requestMove(move.face, move.turns, move.wide);
      useGameStore.getState().commitActive();
    }
    const state = useGameStore.getState();
    expect(state.status).toBe("solved");
    expect(state.bestTimes).toHaveLength(1);
    return state.bestTimes[0].id;
  }

  it("saves the scramble and the player's turns with the time", () => {
    const id = recordRun("R U F' L", "L' F U' R'");
    const entry = useGameStore.getState().bestTimes[0];
    expect(entry.id).toBe(id);
    expect(entry.scramble).toBe("R U F' L");
    expect(entry.solution).toBe("l' f u' r'");
    expect(entry.moves).toBe(4);
  });

  it("logs face turns in the player's hold, not the physical face", () => {
    // Yellow front, orange up: the player's R is the physical F face.
    useGameStore.getState().setOrientation("D", "L");
    useGameStore.setState({ runScrambled: true });
    const { requestMove, commitActive } = useGameStore.getState();
    requestMove("R", 1);
    commitActive();
    // The hold change itself is part of the log, so the saved solution still
    // means the same turns when it is replayed under the standard hold.
    const log = useGameStore.getState().log;
    expect(log[log.length - 1]).toEqual({
      kind: "turn",
      move: { face: "R", turns: 1, logical: true },
    });
    expect(useGameStore.getState().moves).toEqual([{ face: "F", turns: 1 }]);
  });

  it("records whole-cube rotations in the log", () => {
    useGameStore.setState({ runScrambled: true });
    useGameStore.getState().rotateCube("y", 1);
    useGameStore.getState().rotateCube("x", -1);
    expect(useGameStore.getState().log).toEqual([
      { kind: "rotate", axis: "y", turns: 1 },
      { kind: "rotate", axis: "x", turns: -1 },
    ]);
  });

  it("replays a run played under a rotated hold back to solved", () => {
    // Four turns to undo, so the single-turn cancellation rule never applies.
    const scramble = parseMoves("R U F' L");
    useGameStore.setState({
      runScrambled: true,
      cubies: applyMoves(createSolvedCube(), scramble),
      scramble,
    });
    // The player turns the whole cube before solving; the solve is then named
    // in the rotated hold, which is what the saved log has to capture.
    useGameStore.getState().rotateCube("y", 1);
    const hold = useGameStore.getState().orientation;
    const physicalToLabel = Object.fromEntries(
      Object.entries(orientationFaceMap(hold.front, hold.up)).map(
        ([label, physical]) => [physical, label],
      ),
    ) as Record<Face, Face>;
    for (const move of [...scramble].reverse().map(invertMove)) {
      useGameStore
        .getState()
        .requestMove(physicalToLabel[move.face as Face], move.turns);
      useGameStore.getState().commitActive();
    }

    const recorded = useGameStore.getState();
    expect(recorded.status).toBe("solved");
    const entry = recorded.bestTimes[0];
    expect(entry.solution).toBe("y b' l u' f'");

    // Replay: the rotation must run too, or every turn after it means the wrong
    // physical face and the cube never solves.
    useGameStore.getState().requestReset();
    useGameStore.getState().replayRecord(entry.id);
    for (;;) {
      const state = useGameStore.getState();
      if (!state.active && state.queue.length === 0) break;
      state.commitActive();
    }
    const replayed = useGameStore.getState();
    expect(replayed.status).toBe("solved");
    expect(isSolved(replayed.cubies)).toBe(true);
    expect(replayed.orientation).toEqual(hold);
  });

  it("replays the scramble and solution on the board", () => {
    const id = recordRun("R U F' L", "L' F U' R'");
    useGameStore.getState().requestReset();
    useGameStore.getState().replayRecord(id);

    const state = useGameStore.getState();
    // The first scramble turn is already the active one, so the queue holds the
    // remaining three scramble turns plus the four player turns.
    expect(state.replayingId).toBe(id);
    expect(state.status).toBe("scrambling");
    expect(state.queue).toHaveLength(7);
    expect(state.active?.source).toBe("scramble");
    expect(state.queue.slice(0, 3).map((entry) => entry.source)).toEqual([
      "scramble",
      "scramble",
      "scramble",
    ]);
    expect(state.queue.slice(3).map((entry) => entry.source)).toEqual([
      "user",
      "user",
      "user",
      "user",
    ]);
  });

  it("plays a replayed solution back to solved", () => {
    const id = recordRun("R U F' L", "L' F U' R'");
    useGameStore.getState().requestReset();
    useGameStore.getState().replayRecord(id);
    for (let i = 0; i < 8; i += 1) useGameStore.getState().commitActive();
    expect(useGameStore.getState().status).toBe("solved");
  });

  it("drops the replay flag once the player turns the cube", () => {
    const id = recordRun("R U F' L", "L' F U' R'");
    useGameStore.getState().replayRecord(id);
    useGameStore.getState().requestMove("U", 1);
    expect(useGameStore.getState().replayingId).toBeNull();
  });

  it("ignores unknown or pre-upgrade records", () => {
    useGameStore.setState({
      bestTimes: [
        {
          id: "legacy",
          ms: 1234,
          moves: 10,
          at: 0,
          scramble: "",
          solution: "",
        },
      ],
    });
    useGameStore.getState().replayRecord("legacy");
    useGameStore.getState().replayRecord("missing");
    const state = useGameStore.getState();
    expect(state.replayingId).toBeNull();
    expect(state.queue).toHaveLength(0);
    expect(state.status).toBe("idle");
  });
});