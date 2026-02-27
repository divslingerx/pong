import { describe, it, expect } from "vitest";
import Ball from "./ball";

describe("Ball", () => {
  it("creates a 10x10 ball", () => {
    const ball = new Ball();
    expect(ball.size.x).toBe(10);
    expect(ball.size.y).toBe(10);
  });

  it("starts with zero velocity", () => {
    const ball = new Ball();
    expect(ball.vel.x).toBe(0);
    expect(ball.vel.y).toBe(0);
  });

  it("position updates correctly with velocity", () => {
    const ball = new Ball();
    ball.pos.set(100, 100);
    ball.vel.set(200, -100);

    const dt = 0.016;
    ball.pos.x += ball.vel.x * dt;
    ball.pos.y += ball.vel.y * dt;

    expect(ball.pos.x).toBeCloseTo(103.2);
    expect(ball.pos.y).toBeCloseTo(98.4);
  });
});
