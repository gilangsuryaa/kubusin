import { describe, expect, it } from "vitest";
import { applyMove, applyMoves, createSolvedCube, generateScramble } from "./cube";
import { sameCube } from "./guide";

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
