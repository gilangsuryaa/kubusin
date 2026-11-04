import { beforeEach, describe, expect, it } from "vitest";
import { createSolvedCube, DEFAULT_ORIENTATION } from "@/lib/cube";
import { useGameStore } from "./game";

function resetStore(): void {
  useGameStore.setState({
    cubies: createSolvedCube(),
    queue: [],
    active: null,
    moves: [],
    status: "idle",
    startedAt: null,
    finalMs: null,
    bestTimes: [],
    hydrated: true,
    scrambleId: 0,
    orientation: DEFAULT_ORIENTATION,
    runScrambled: false,
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