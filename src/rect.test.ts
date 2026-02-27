import { describe, it, expect } from "vitest";
import Rect from "./rect";

describe("Rect", () => {
  it("creates with correct size", () => {
    const r = new Rect(20, 40);
    expect(r.size.x).toBe(20);
    expect(r.size.y).toBe(40);
  });

  it("initializes position at origin", () => {
    const r = new Rect(10, 10);
    expect(r.pos.x).toBe(0);
    expect(r.pos.y).toBe(0);
  });

  it("computes bounds from center position", () => {
    const r = new Rect(20, 40);
    r.pos.set(100, 200);
    expect(r.left).toBe(90);
    expect(r.right).toBe(110);
    expect(r.top).toBe(180);
    expect(r.bottom).toBe(220);
  });

  it("bounds at origin are symmetric", () => {
    const r = new Rect(10, 10);
    expect(r.left).toBe(-5);
    expect(r.right).toBe(5);
    expect(r.top).toBe(-5);
    expect(r.bottom).toBe(5);
  });
});
