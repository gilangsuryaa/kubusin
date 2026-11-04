import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORIENTATION,
  FACES,
  FACE_GEOMETRY,
  FACE_NORMAL,
  IDENTITY3,
  SLICE_FOR_AXIS,
  SLICES,
  applyMat,
  applyMove,
  applyMoves,
  areAdjacentFaces,
  createSolvedCube,
  cubeRotationMatrix,
  generateScramble,
  invertMove,
  isIdentity,
  isSlice,
  isSolved,
  isWide,
  matEquals,
  moveAxis,
  moveMatrix,
  moveQuarters,
  moveToString,
  mulMat,
  orientationFaceMap,
  orientationRotation,
  parseMoves,
  physicalMove,
  rotateOrientation,
  type CubeState,
  type Face,
  type Mat3,
  type Move,
  type Turns,
} from "./cube";

/** Deterministic RNG (mulberry32) so scramble tests never flake. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function snapshot(state: CubeState): string {
  return state
    .map((c) => `${c.id}|${c.pos.join(",")}|${c.rot.join(",")}`)
    .sort()
    .join(";");
}

function determinant(m: Mat3): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

/** In-place 120 degree twist about the (1,1,1) diagonal: keeps every position. */
const CORNER_TWIST: Mat3 = [0, 0, 1, 1, 0, 0, 0, 1, 0];

describe("applyMove", () => {
  it("a move followed by its inverse returns to the starting state", () => {
    const start = createSolvedCube();
    for (const face of FACES) {
      for (const turns of [1, -1] as const) {
        const move = { face, turns };
        const after = applyMove(applyMove(start, move), invertMove(move));
        expect(snapshot(after)).toBe(snapshot(start));
      }
    }
  });

  it("four quarter turns of the same face are the identity", () => {
    const start = createSolvedCube();
    for (const face of FACES) {
      const once = { face, turns: 1 } as const;
      let state = start;
      for (let i = 0; i < 4; i += 1) state = applyMove(state, once);
      expect(isIdentity(state)).toBe(true);
      expect(isSolved(state)).toBe(true);
    }
  });

  it("two clockwise turns equal two counter-clockwise turns", () => {
    const start = createSolvedCube();
    for (const face of FACES) {
      const first = applyMoves(start, [
        { face, turns: 1 },
        { face, turns: 1 },
      ]);
      const second = applyMoves(start, [
        { face, turns: -1 },
        { face, turns: -1 },
      ]);
      expect(snapshot(first)).toBe(snapshot(second));
    }
  });

  it("does not mutate the input state", () => {
    const start = createSolvedCube();
    const before = snapshot(start);
    applyMoves(start, parseMoves("R U R' U' F B"));
    expect(snapshot(start)).toBe(before);
  });

  it("keeps every cubie on the integer lattice with a proper rotation", () => {
    const state = applyMoves(createSolvedCube(), parseMoves("R U D' L F B' R'"));
    const seen = new Set<string>();
    for (const cubie of state) {
      for (const component of cubie.pos) {
        expect(Number.isInteger(component)).toBe(true);
        expect(Math.abs(component)).toBeLessThanOrEqual(1);
      }
      for (const column of [0, 1, 2]) {
        const length =
          cubie.rot[column] ** 2 +
          cubie.rot[3 + column] ** 2 +
          cubie.rot[6 + column] ** 2;
        expect(length).toBe(1);
      }
      expect(Math.abs(determinant(cubie.rot))).toBe(1);
      seen.add(cubie.pos.join(","));
    }
    expect(seen.size).toBe(27);
  });
});

describe("isSolved", () => {
  it("is true for a fresh cube", () => {
    expect(isSolved(createSolvedCube())).toBe(true);
    expect(isIdentity(createSolvedCube())).toBe(true);
  });

  it("is false right after a single turn", () => {
    const state = applyMove(createSolvedCube(), { face: "R", turns: 1 });
    expect(isSolved(state)).toBe(false);
  });

  it("is true again after an algorithm that repeats to solved", () => {
    // (R U R' U') repeated six times returns to the solved state.
    const algorithm = parseMoves("R U R' U'");
    let state = createSolvedCube();
    for (let i = 0; i < 6; i += 1) state = applyMoves(state, algorithm);
    expect(isSolved(state)).toBe(true);
    expect(isIdentity(state)).toBe(true);
  });

  it("is false for a twisted corner whose position is unchanged", () => {
    const fresh = createSolvedCube();
    const twisted = fresh.map((cubie) =>
      cubie.id === "1,1,1" ? { ...cubie, rot: CORNER_TWIST } : cubie,
    );
    const corner = twisted.find((c) => c.id === "1,1,1");
    const original = fresh.find((c) => c.id === "1,1,1");
    expect(corner?.pos).toEqual(original?.pos);
    expect(matEquals(corner!.rot, original!.rot)).toBe(false);
    expect(isSolved(twisted)).toBe(false);
    expect(isSolved(fresh)).toBe(true);
  });
});

describe("generateScramble", () => {
  it("respects the requested length and avoids the same face twice in a row", () => {
    const moves = generateScramble({ count: 25, random: seededRandom(42) });
    expect(moves).toHaveLength(25);
    for (let i = 1; i < moves.length; i += 1) {
      expect(moves[i].face).not.toBe(moves[i - 1].face);
    }
  });

  it("avoids the same axis twice in a row by default", () => {
    const moves = generateScramble({ count: 25, random: seededRandom(7) });
    for (let i = 1; i < moves.length; i += 1) {
      expect(FACE_GEOMETRY[moves[i].face as Face].axis).not.toBe(
        FACE_GEOMETRY[moves[i - 1].face as Face].axis,
      );
    }
  });

  it("defaults to 20..25 moves that are solvable and actually shuffled", () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const moves = generateScramble({ random: seededRandom(seed) });
      expect(moves.length).toBeGreaterThanOrEqual(20);
      expect(moves.length).toBeLessThanOrEqual(25);
      const shuffled = applyMoves(createSolvedCube(), moves);
      expect(isSolved(shuffled)).toBe(false);
      const restored = applyMoves(shuffled, [...moves].reverse().map(invertMove));
      expect(isIdentity(restored)).toBe(true);
    }
  });

  it("only uses known faces", () => {
    const moves = generateScramble({ count: 25, random: seededRandom(99) });
    for (const move of moves) {
      expect(FACES).toContain(move.face as Face);
      expect(isSlice(move.face)).toBe(false);
    }
  });
});

describe("parseMoves", () => {
  it("parses prime notation", () => {
    expect(parseMoves("R U' F")).toEqual([
      { face: "R", turns: 1 },
      { face: "U", turns: -1 },
      { face: "F", turns: 1 },
    ]);
  });

  it("returns an empty list for blank input", () => {
    expect(parseMoves("   ")).toEqual([]);
  });

  it("throws on an unknown face", () => {
    expect(() => parseMoves("X")).toThrowError(/Unknown face/);
  });
});

function transpose(m: Mat3): Mat3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

/** `+ 0` collapses negative zero so exact array comparisons stay stable. */
function plain(values: readonly number[]): number[] {
  return values.map((value) => value + 0);
}

const VALID_ORIENTATIONS = FACES.flatMap((front) =>
  FACES.filter((up) => areAdjacentFaces(front, up)).map(
    (up) => [front, up] as const,
  ),
);

describe("orientation", () => {
  it("defaults to the canonical white-up green-front hold", () => {
    expect(
      areAdjacentFaces(DEFAULT_ORIENTATION.front, DEFAULT_ORIENTATION.up),
    ).toBe(true);
    expect(orientationFaceMap("F", "U")).toEqual({
      U: "U",
      D: "D",
      L: "L",
      R: "R",
      F: "F",
      B: "B",
    });
    expect(orientationRotation("F", "U")).toEqual(IDENTITY3);
  });

  it("maps blue front with white up to a half turn about the vertical", () => {
    expect(orientationFaceMap("B", "U")).toEqual({
      U: "U",
      D: "D",
      F: "B",
      B: "F",
      R: "L",
      L: "R",
    });
    expect(orientationRotation("B", "U")).toEqual([
      -1, 0, 0,
      0, 1, 0,
      0, 0, -1,
    ]);
  });

  it("rejects a front and up that are opposite", () => {
    expect(areAdjacentFaces("F", "B")).toBe(false);
    expect(areAdjacentFaces("U", "D")).toBe(false);
    expect(() => orientationFaceMap("F", "B")).toThrowError(/not perpendicular/);
    expect(() => orientationRotation("U", "D")).toThrowError(/not perpendicular/);
  });

  it("aligns every chosen colour with its algorithm face", () => {
    for (const [front, up] of VALID_ORIENTATIONS) {
      const rotation = orientationRotation(front, up);
      const map = orientationFaceMap(front, up);
      for (const face of FACES) {
        expect(plain(applyMat(rotation, FACE_NORMAL[map[face]]))).toEqual(
          plain(FACE_NORMAL[face]),
        );
      }
    }
  });

  it("turns the same way on screen as the algorithm it maps to", () => {
    // Conjugating the physical turn by the display rotation must equal the
    // algorithm turn, for every valid hold, face, and direction.
    for (const [front, up] of VALID_ORIENTATIONS) {
      const rotation = orientationRotation(front, up);
      const inverse = transpose(rotation);
      const map = orientationFaceMap(front, up);
      for (const face of FACES) {
        for (const turns of [1, -1] as const) {
          const physical = moveMatrix({ face: map[face], turns });
          const displayed = mulMat(mulMat(rotation, physical), inverse);
          const expected = moveMatrix({ face, turns });
          expect(plain(displayed)).toEqual(plain(expected));
        }
      }
    }
  });
});

describe("cube rotation", () => {
  it("maps x, y, z to the R, U, F directions", () => {
    const faces = { x: "R", y: "U", z: "F" } as const;
    for (const axis of ["x", "y", "z"] as const) {
      expect(plain(cubeRotationMatrix(axis, 1))).toEqual(
        plain(moveMatrix({ face: faces[axis], turns: 1 })),
      );
    }
  });

  it("matches the documented examples", () => {
    // Blue front, white down (yellow up).
    const held = { front: "B", up: "D" } as const;

    // x: blue becomes up, white becomes front.
    expect(rotateOrientation(held, "x", 1)).toEqual({ front: "U", up: "B" });
    // y: blue becomes left, red becomes front.
    expect(rotateOrientation(held, "y", 1)).toEqual({ front: "R", up: "D" });
    // z: red becomes down, yellow becomes right (orange up).
    expect(rotateOrientation(held, "z", 1)).toEqual({ front: "B", up: "L" });
  });

  it("composes the whole-cube rotation into the display frame", () => {
    for (const [front, up] of VALID_ORIENTATIONS) {
      const held = { front, up };
      const display = orientationRotation(front, up);
      for (const axis of ["x", "y", "z"] as const) {
        for (const turns of [1, -1] as const) {
          const next = rotateOrientation(held, axis, turns);
          expect(plain(orientationRotation(next.front, next.up))).toEqual(
            plain(mulMat(cubeRotationMatrix(axis, turns), display)),
          );
          expect(areAdjacentFaces(next.front, next.up)).toBe(true);
        }
      }
    }
  });

  it("returns to the same hold after four quarter rotations", () => {
    for (const [front, up] of VALID_ORIENTATIONS) {
      const held = { front, up };
      for (const axis of ["x", "y", "z"] as const) {
        let result = held;
        for (let i = 0; i < 4; i += 1) {
          result = rotateOrientation(result, axis, 1);
        }
        expect(result).toEqual(held);
      }
    }
  });

  it("cancels when a rotation is followed by its inverse", () => {
    for (const [front, up] of VALID_ORIENTATIONS) {
      const held = { front, up };
      for (const axis of ["x", "y", "z"] as const) {
        for (const turns of [1, -1] as const) {
          const inverse: Turns = turns === 1 ? -1 : 1;
          const there = rotateOrientation(held, axis, turns);
          expect(rotateOrientation(there, axis, inverse)).toEqual(held);
        }
      }
    }
  });
});

describe("slice moves", () => {
  it("turns the middle layer in the direction of L, D, and F", () => {
    expect(moveAxis({ face: "M", turns: 1 })).toBe("x");
    expect(moveAxis({ face: "E", turns: 1 })).toBe("y");
    expect(moveAxis({ face: "S", turns: 1 })).toBe("z");

    // +1 quarter about the positive axis, matching the reference face.
    expect(moveQuarters({ face: "M", turns: 1 })).toBe(1);
    expect(moveQuarters({ face: "E", turns: 1 })).toBe(1);
    expect(moveQuarters({ face: "S", turns: 1 })).toBe(-1);
  });

  it("only moves cubies in the middle layer", () => {
    for (const slice of SLICES) {
      const state = createSolvedCube();
      const axisIndex = { M: 0, E: 1, S: 2 }[slice];
      const after = applyMove(state, { face: slice, turns: 1 });
      for (const before of state) {
        const next = after.find((cubie) => cubie.id === before.id);
        if (before.pos[axisIndex] !== 0) {
          expect(next).toBe(before);
        } else {
          // Every cubie in the middle layer is rebuilt (centre included).
          expect(next).not.toBe(before);
        }
      }
    }
  });

  it("applies the algorithm slice in the player's frame for every hold", () => {
    // Conjugating the physical middle turn by the display rotation must equal
    // the slice as written, for every valid hold and direction.
    for (const [front, up] of VALID_ORIENTATIONS) {
      const orientation = { front, up };
      const display = orientationRotation(front, up);
      const inverse = transpose(display);
      for (const slice of SLICES) {
        for (const turns of [1, -1] as const) {
          const move = { face: slice, turns };
          const physical = physicalMove(move, orientation);
          const displayed = mulMat(
            mulMat(display, moveMatrix(physical)),
            inverse,
          );
          expect(plain(displayed)).toEqual(plain(moveMatrix(move)));
        }
      }
    }
  });

  it("returns to solved after four quarter turns", () => {
    for (const slice of SLICES) {
      let state = createSolvedCube();
      for (let i = 0; i < 4; i += 1) {
        state = applyMove(state, { face: slice, turns: 1 });
      }
      expect(isIdentity(state)).toBe(true);
    }
  });

  it("a slice and its inverse cancel", () => {
    for (const slice of SLICES) {
      const move: Move = { face: slice, turns: 1 };
      const moved = applyMove(createSolvedCube(), move);
      expect(isIdentity(applyMove(moved, invertMove(move)))).toBe(true);
    }
  });

  it("matches the documented examples in the player's view", () => {
    // Orange front, yellow up.
    const hold = { front: "L", up: "D" } as const;
    const display = orientationRotation(hold.front, hold.up);
    const inverse = transpose(display);
    const movesTo = (name: "M" | "E" | "S", viewPoint: [number, number, number]) => {
      const physical = applyMat(inverse, viewPoint);
      const turn = physicalMove({ face: name, turns: 1 }, hold);
      return plain(applyMat(display, applyMat(moveMatrix(turn), physical)));
    };

    // M: orange (front) middle goes down, yellow (up) middle goes front.
    expect(movesTo("M", [0, 0, 1])).toEqual([0, -1, 0]);
    expect(movesTo("M", [0, 1, 0])).toEqual([0, 0, 1]);

    // E: orange (front) middle goes right, green (left) middle goes front.
    expect(movesTo("E", [0, 0, 1])).toEqual([1, 0, 0]);
    expect(movesTo("E", [-1, 0, 0])).toEqual([0, 0, 1]);

    // S: blue (right) middle goes down, yellow (up) middle goes right.
    expect(movesTo("S", [1, 0, 0])).toEqual([0, -1, 0]);
    expect(movesTo("S", [0, 1, 0])).toEqual([1, 0, 0]);
  });

  it("parses slice notation", () => {
    expect(parseMoves("M E' S")).toEqual([
      { face: "M", turns: 1 },
      { face: "E", turns: -1 },
      { face: "S", turns: 1 },
    ]);
  });
});

describe("wide moves", () => {
  const WIDE_FACES: Face[] = ["U", "D", "L", "R", "F", "B"];
  const AXIS_INDEX: Record<"x" | "y" | "z", number> = { x: 0, y: 1, z: 2 };

  it("is never wide for a slice, even with the flag set", () => {
    for (const slice of SLICES) {
      expect(isWide({ face: slice, turns: 1, wide: true })).toBe(false);
    }
    expect(isWide({ face: "R", turns: 1 })).toBe(false);
    expect(isWide({ face: "R", turns: 1, wide: true })).toBe(true);
  });

  it("turns the face layer and the middle layer together", () => {
    for (const face of WIDE_FACES) {
      const state = createSolvedCube();
      const move: Move = { face, turns: 1, wide: true };
      const after = applyMove(state, move);
      const index = AXIS_INDEX[moveAxis(move)];
      const layer = FACE_GEOMETRY[face].layer;
      for (const before of state) {
        const next = after.find((cubie) => cubie.id === before.id)!;
        const offset = before.pos[index];
        // Only the face layer and the middle layer move; the far layer stays.
        if (offset === layer || offset === 0) {
          expect(next).not.toBe(before);
        } else {
          expect(next).toBe(before);
        }
      }
    }
  });

  it("equals the face turn plus the matching middle slice", () => {
    for (const face of WIDE_FACES) {
      for (const turns of [1, -1] as const) {
        const faceMove: Move = { face, turns };
        const wideMove: Move = { face, turns, wide: true };
        const slice = SLICE_FOR_AXIS[moveAxis(faceMove)];
        const sameWay: Turns =
          moveQuarters({ face: slice, turns: 1 }) === moveQuarters(faceMove)
            ? 1
            : -1;
        const expected = applyMove(applyMove(createSolvedCube(), faceMove), {
          face: slice,
          turns: sameWay,
        });
        expect(snapshot(applyMove(createSolvedCube(), wideMove))).toBe(
          snapshot(expected),
        );
      }
    }
  });

  it("returns to solved after four quarter turns", () => {
    for (const face of WIDE_FACES) {
      let state = createSolvedCube();
      for (let i = 0; i < 4; i += 1) {
        state = applyMove(state, { face, turns: 1, wide: true });
      }
      expect(isIdentity(state)).toBe(true);
    }
  });

  it("a wide move and its inverse cancel", () => {
    for (const face of WIDE_FACES) {
      const move: Move = { face, turns: 1, wide: true };
      const inverse = invertMove(move);
      expect(isWide(inverse)).toBe(true);
      const moved = applyMove(createSolvedCube(), move);
      expect(isIdentity(applyMove(moved, inverse))).toBe(true);
    }
  });

  it("keeps the wide flag when resolved through the hold", () => {
    for (const [front, up] of VALID_ORIENTATIONS) {
      const map = orientationFaceMap(front, up);
      expect(physicalMove({ face: "R", turns: 1, wide: true }, { front, up })).toEqual({
        face: map.R,
        turns: 1,
        wide: true,
      });
    }
    // Slices ignore the flag entirely.
    expect(
      physicalMove({ face: "M", turns: 1, wide: true }, DEFAULT_ORIENTATION),
    ).toEqual({ face: "M", turns: 1 });
  });

  it("round-trips wide notation", () => {
    expect(moveToString({ face: "R", turns: 1, wide: true })).toBe("Rw");
    expect(moveToString({ face: "U", turns: -1, wide: true })).toBe("Uw'");
    expect(moveToString({ face: "F", turns: 1 })).toBe("F");
    expect(parseMoves("Rw Uw' Rw'")).toEqual([
      { face: "R", turns: 1, wide: true },
      { face: "U", turns: -1, wide: true },
      { face: "R", turns: -1, wide: true },
    ]);
    expect(parseMoves("M'")).toEqual([{ face: "M", turns: -1 }]);
  });
});
