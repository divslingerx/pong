import { describe, it, expect } from "vitest";
import { ParticleSystem } from "./particles";

describe("ParticleSystem", () => {
  it("starts with no particles", () => {
    const ps = new ParticleSystem();
    // Draw to a mock context to verify no errors
    const calls: string[] = [];
    const ctx = {
      globalAlpha: 1,
      fillStyle: "",
      fillRect: () => calls.push("fillRect"),
    } as unknown as CanvasRenderingContext2D;

    ps.draw(ctx);
    expect(calls).toHaveLength(0);
  });

  it("emits particles that update and die", () => {
    const ps = new ParticleSystem();
    ps.emit(100, 100, 5, "#fff", 200);

    const rects: number[] = [];
    const ctx = {
      globalAlpha: 1,
      fillStyle: "",
      fillRect: () => rects.push(1),
    } as unknown as CanvasRenderingContext2D;

    ps.draw(ctx);
    expect(rects.length).toBe(5);

    // After enough time, all particles should be dead
    ps.update(2);
    rects.length = 0;
    ps.draw(ctx);
    expect(rects.length).toBe(0);
  });

  it("particles move over time", () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0, 1, "#fff", 1000);

    const positions: Array<{ x: number; y: number }> = [];
    const ctx = {
      globalAlpha: 1,
      fillStyle: "",
      fillRect: (x: number, y: number) => positions.push({ x, y }),
    } as unknown as CanvasRenderingContext2D;

    ps.draw(ctx);
    const initial = { ...positions[0] };

    ps.update(0.1);
    positions.length = 0;
    ps.draw(ctx);

    // Particle should have moved from its initial position
    const moved = positions[0];
    const hasMoved = moved.x !== initial.x || moved.y !== initial.y;
    expect(hasMoved).toBe(true);
  });
});
