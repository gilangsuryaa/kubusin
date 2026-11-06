import { beforeAll, describe, expect, it } from "vitest";
import { Cube, initSolver } from "rubik-solver";
import {
  applyMat,
  applyMoves,
  createSolvedCube,
  generateScramble,
  isSolved,
  moveToString,
  stickerNormals,
  type CubeState,
  type Cubie,
  type Vec3,
} from "./cube";
import { cubeToFacelets } from "./facelets";
import { isCrossSolved, solveBeginner, solveCross } from "./beginner";
import { solveCfop } from "./cfop";
import { solveOptimal } from "./optimal";

const U_NORMAL: Vec3 = [0, 1, 0];
const D_NORMAL: Vec3 = [0, -1, 0];

function eq(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function hasNormal(cubie: Cubie, normal: Vec3): boolean {
  return stickerNormals(cubie.home).some((candidate) => eq(candidate, normal));
}

function atHome(cubie: Cubie, facing: Vec3, normal: Vec3): boolean {
  return eq(cubie.pos, cubie.home) && eq(applyMat(cubie.rot, normal), facing);
}

/** Every piece carrying a D sticker sits home with that sticker down. */
function firstLayer(state: CubeState): boolean {
  return state.filter((c) => hasNormal(c, D_NORMAL)).every((c) => atHome(c, D_NORMAL, D_NORMAL));
}

function middleLayer(state: CubeState): boolean {
  return state
    .filter((c) => stickerNormals(c.home).length === 2 && c.home[1] === 0)
    .every((c) => eq(c.pos, c.home));
}

/** Every piece carrying a U sticker points that sticker up, position ignored. */
function lastLayerOriented(state: CubeState, stickers: number): boolean {
  return state
    .filter((c) => stickerNormals(c.home).length === stickers && hasNormal(c, U_NORMAL))
    .every((c) => eq(applyMat(c.rot, U_NORMAL), U_NORMAL));
}

/** Every piece carrying a U sticker sits home with that sticker up. */
function lastLayerPlaced(state: CubeState): boolean {
  return state
    .filter((c) => hasNormal(c, U_NORMAL))
    .every((c) => atHome(c, U_NORMAL, U_NORMAL));
}

/** U-sticker corners (or edges) sit home with the sticker up. */
function lastLayerPiecesPlaced(state: CubeState, stickers: number): boolean {
  return state
    .filter((c) => stickerNormals(c.home).length === stickers && hasNormal(c, U_NORMAL))
    .every((c) => atHome(c, U_NORMAL, U_NORMAL));
}

const SOLVED_FACELETS =
  "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

function format(moves: ReturnType<typeof generateScramble>): string {
  return moves.map(moveToString).join(" ");
}

describe("cubeToFacelets", () => {
  beforeAll(() => initSolver());

  it("matches the solved string", () => {
    expect(cubeToFacelets(createSolvedCube())).toBe(SOLVED_FACELETS);
  });

  it("matches the solver library for random sequences", () => {
    for (let i = 0; i < 40; i += 1) {
      const moves = generateScramble({ count: 25 });
      const state = applyMoves(createSolvedCube(), moves);
      const reference = new Cube().move(format(moves)).asString();
      expect(cubeToFacelets(state)).toBe(reference);
    }
  });
});

describe("solveCross", () => {
  it("builds the white cross on random states", () => {
    let total = 0;
    for (let i = 0; i < 30; i += 1) {
      const moves = generateScramble({ count: 25 });
      const state = applyMoves(createSolvedCube(), moves);
      const solution = solveCross(state);
      const solved = applyMoves(state, solution);
      expect(isCrossSolved(solved)).toBe(true);
      total += solution.length;
    }
    // Optimal for the four white edges, so short on average.
    expect(total / 30).toBeLessThan(9);
  }, 30000);
});

describe("solveBeginner", () => {
  it("solves random states one stage at a time", () => {
    for (let i = 0; i < 20; i += 1) {
      const scramble = generateScramble({ count: 25 });
      const state = applyMoves(createSolvedCube(), scramble);
      let current = state;
      for (const stage of solveBeginner(state)) {
        current = applyMoves(current, stage.moves);
      }
      expect(isSolved(current)).toBe(true);
    }
  }, 120000);

  it("never breaks an earlier stage", () => {
    for (let i = 0; i < 12; i += 1) {
      const scramble = generateScramble({ count: 25 });
      let current = applyMoves(createSolvedCube(), scramble);
      for (const stage of solveBeginner(current)) {
        current = applyMoves(current, stage.moves);
        // Each boundary keeps every goal any earlier stage already reached.
        switch (stage.id) {
          case "cross":
            expect(isCrossSolved(current)).toBe(true);
            break;
          case "corners":
            expect(firstLayer(current)).toBe(true);
            break;
          case "middle":
            expect(firstLayer(current)).toBe(true);
            expect(middleLayer(current)).toBe(true);
            break;
          case "white-cross":
            expect(firstLayer(current)).toBe(true);
            expect(middleLayer(current)).toBe(true);
            expect(lastLayerOriented(current, 2)).toBe(true);
            break;
          case "oll-corners":
            expect(middleLayer(current)).toBe(true);
            expect(lastLayerOriented(current, 2)).toBe(true);
            expect(lastLayerOriented(current, 3)).toBe(true);
            break;
          case "pll-corners":
            expect(middleLayer(current)).toBe(true);
            expect(lastLayerOriented(current, 3)).toBe(true);
            expect(lastLayerPiecesPlaced(current, 3)).toBe(true);
            break;
          case "pll-edges":
            expect(middleLayer(current)).toBe(true);
            expect(lastLayerPiecesPlaced(current, 3)).toBe(true);
            expect(lastLayerPlaced(current)).toBe(true);
            expect(isSolved(current)).toBe(true);
            break;
        }
      }
    }
  }, 120000);
});

const F2L_SLOT_HOMES: readonly { corner: Vec3; edge: Vec3 }[] = [
  { corner: [1, -1, 1], edge: [1, 0, 1] },
  { corner: [-1, -1, 1], edge: [-1, 0, 1] },
  { corner: [1, -1, -1], edge: [1, 0, -1] },
  { corner: [-1, -1, -1], edge: [-1, 0, -1] },
];

/** A piece sits home with every one of its stickers facing home. */
function pieceSolved(state: CubeState, home: Vec3): boolean {
  const cubie = state.find((candidate) => eq(candidate.home, home));
  if (!cubie) return false;
  return (
    eq(cubie.pos, cubie.home) &&
    stickerNormals(cubie.home).every((normal) => eq(applyMat(cubie.rot, normal), normal))
  );
}

function f2lSlotsSolved(state: CubeState, count: number): boolean {
  return F2L_SLOT_HOMES.slice(0, count).every(
    (slot) => pieceSolved(state, slot.corner) && pieceSolved(state, slot.edge),
  );
}

describe("solveCfop", () => {
  it("solves random states end to end", () => {
    for (let i = 0; i < 12; i += 1) {
      const scramble = generateScramble({ count: 25 });
      const state = applyMoves(createSolvedCube(), scramble);
      let current = state;
      for (const stage of solveCfop(state)) {
        current = applyMoves(current, stage.moves);
      }
      expect(isSolved(current)).toBe(true);
    }
  }, 120000);

  it("never breaks an earlier stage", () => {
    for (let i = 0; i < 8; i += 1) {
      const scramble = generateScramble({ count: 25 });
      let current = applyMoves(createSolvedCube(), scramble);
      for (const stage of solveCfop(current)) {
        current = applyMoves(current, stage.moves);
        switch (stage.id) {
          case "cross":
            expect(isCrossSolved(current)).toBe(true);
            break;
          case "f2l-1":
          case "f2l-2":
          case "f2l-3":
          case "f2l-4": {
            const count = Number(stage.id.slice(4));
            expect(isCrossSolved(current)).toBe(true);
            expect(f2lSlotsSolved(current, count)).toBe(true);
            break;
          }
          case "eoll":
            expect(f2lSlotsSolved(current, 4)).toBe(true);
            expect(lastLayerOriented(current, 2)).toBe(true);
            break;
          case "ocll":
            expect(f2lSlotsSolved(current, 4)).toBe(true);
            expect(lastLayerOriented(current, 3)).toBe(true);
            break;
          case "cpll":
            expect(f2lSlotsSolved(current, 4)).toBe(true);
            expect(lastLayerOriented(current, 3)).toBe(true);
            expect(lastLayerPiecesPlaced(current, 3)).toBe(true);
            break;
          case "epll":
            expect(lastLayerPiecesPlaced(current, 3)).toBe(true);
            expect(lastLayerPlaced(current)).toBe(true);
            expect(isSolved(current)).toBe(true);
            break;
        }
      }
    }
  }, 120000);
});

describe("solveOptimal", () => {
  it("solves random scrambles end to end", async () => {
    for (let i = 0; i < 12; i += 1) {
      const moves = generateScramble({ count: 25 });
      const state = applyMoves(createSolvedCube(), moves);
      const solution = await solveOptimal(state);
      expect(isSolved(applyMoves(state, solution))).toBe(true);
    }
  }, 60000);
});
