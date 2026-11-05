import { describe, expect, it } from "vitest";
import { playSolved, playTurn } from "./sound";

/**
 * Web Audio is absent under Node, so the module must degrade to a silent
 * no-op instead of throwing when a turn or a win fires.
 */
describe("sound effects without Web Audio", () => {
  it("plays a turn without throwing", () => {
    expect(() => playTurn({ face: "R", turns: 1 })).not.toThrow();
    expect(() => playTurn({ face: "U", turns: -1, wide: true }, 0.4)).not.toThrow();
  });

  it("plays the win chime without throwing", () => {
    expect(() => playSolved()).not.toThrow();
  });
});
