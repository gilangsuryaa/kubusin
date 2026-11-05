/**
 * Optimal solver, backed by `rubik-solver` (Kociemba two-phase).
 *
 * The library is imported lazily so its tables are only built when the player
 * asks for an optimal solution, keeping the initial bundle and boot cheap.
 */

import { parseMoves, type CubeState, type Move } from "./cube";
import { cubeToFacelets } from "./facelets";

type SolverModule = typeof import("rubik-solver");

let loadPromise: Promise<SolverModule> | null = null;
let tablesReady = false;

async function loadSolver(): Promise<SolverModule> {
  if (!loadPromise) loadPromise = import("rubik-solver");
  const mod = await loadPromise;
  if (!tablesReady) {
    // ~1s of table generation, paid once per session.
    mod.initSolver();
    tablesReady = true;
  }
  return mod;
}

/** Solve any legal state with a short move list. */
export async function solveOptimal(state: CubeState): Promise<Move[]> {
  const { Cube, solve } = await loadSolver();
  const solution = solve(Cube.fromString(cubeToFacelets(state)));
  if (!solution) throw new Error("Solver optimal tidak menemukan solusi.");
  return parseMoves(expandHalfTurns(solution));
}

/** Our move type has no half turns, so `R2` becomes `R R`. */
function expandHalfTurns(algorithm: string): string {
  return algorithm
    .split(/\s+/)
    .flatMap((token) => (token.endsWith("2") ? [token[0], token[0]] : [token]))
    .join(" ");
}
