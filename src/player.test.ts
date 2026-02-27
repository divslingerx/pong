import { describe, it, expect } from "vitest";
import Player from "./player";

describe("Player", () => {
  it("creates a 20x100 paddle", () => {
    const player = new Player();
    expect(player.size.x).toBe(20);
    expect(player.size.y).toBe(100);
  });

  it("starts with score of 0", () => {
    const player = new Player();
    expect(player.score).toBe(0);
  });

  it("score increments correctly", () => {
    const player = new Player();
    player.score++;
    player.score++;
    expect(player.score).toBe(2);
  });

  it("paddle bounds are correct for collision detection", () => {
    const player = new Player();
    player.pos.set(40, 200);
    expect(player.left).toBe(30);
    expect(player.right).toBe(50);
    expect(player.top).toBe(150);
    expect(player.bottom).toBe(250);
  });
});
