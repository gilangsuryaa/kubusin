import { describe, expect, it } from "vitest";
import { applyMove, applyMoves, createSolvedCube, generateScramble, type Move } from "./cube";
import { planCursor, sameCube } from "./guide";

describe("sameCube", () => {
  it("treats two solved cubes as equal", () => {
    expect(sameCube(createSolvedCube(), createSolvedCube())).toBe(true);
  });

  it("detects a single turn", () => {
    const solved = createSolvedCube();
    const turned = applyMove(solved, { face: "R", turns: 1 });
    expect(sameCube(turned, solved)).toBe(false);
    // The same turn fired twice from a solved cube differs from one turn.
    const twice = applyMove(turned, { face: "R", turns: 1 });
    expect(sameCube(twice, turned)).toBe(false);
  });

  it("matches a replay of the same moves", () => {
    const scramble = generateScramble({ count: 25 });
    const state = applyMoves(createSolvedCube(), scramble);
    const replayed = applyMoves(createSolvedCube(), [...scramble]);
    expect(sameCube(state, replayed)).toBe(true);
  });
});

describe("planCursor", () => {
  const plan: Move[] = [
    { face: "R", turns: 1 },
    { face: "U", turns: -1 },
    { face: "F", turns: 1 },
    { face: "L", turns: 1 },
    { face: "D", turns: -1 },
    { face: "B", turns: 1 },
    { face: "R", turns: -1 },
    { face: "U", turns: 1 },
  ];
  const start = applyMoves(createSolvedCube(), plan);

  it("returns 0 before any move is played", () => {
    expect(planCursor(start, plan, [], start)).toBe(0);
  });

  it("walks forward as the plan's own moves are played", () => {
    for (let played = 0; played <= plan.length; played += 1) {
      const actual = applyMoves(start, plan.slice(0, played));
      expect(planCursor(start, plan, plan.slice(0, played), actual)).toBe(played);
    }
  });

  it("returns null once the cube leaves the plan", () => {
    const off = applyMove(start, { face: "U", turns: 1 });
    // One move played, but the cube took a different turn than plan[0].
    expect(planCursor(start, plan, [{ face: "U", turns: 1 }], off)).toBeNull();
  });

  it("returns null when more moves were played than the plan holds", () => {
    const played = plan.concat([{ face: "U", turns: 1 }]);
    expect(planCursor(start, plan, played, applyMoves(start, played))).toBeNull();
  });
});
