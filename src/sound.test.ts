import { describe, it, expect } from "vitest";
import { SoundEngine } from "./sound";

describe("SoundEngine", () => {
  it("can be instantiated without errors", () => {
    const sound = new SoundEngine();
    expect(sound).toBeDefined();
  });

  it("has all expected methods", () => {
    const sound = new SoundEngine();
    expect(typeof sound.paddleHit).toBe("function");
    expect(typeof sound.wallHit).toBe("function");
    expect(typeof sound.score).toBe("function");
    expect(typeof sound.victory).toBe("function");
    expect(typeof sound.defeat).toBe("function");
  });
});
