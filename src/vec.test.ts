import { describe, it, expect } from "vitest";
import Vec from "./vec";

describe("Vec", () => {
  it("initializes with default values", () => {
    const v = new Vec();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it("initializes with provided values", () => {
    const v = new Vec(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it("sets x and y", () => {
    const v = new Vec();
    v.set(5, 10);
    expect(v.x).toBe(5);
    expect(v.y).toBe(10);
  });

  it("calculates length for 3-4-5 triangle", () => {
    const v = new Vec(3, 4);
    expect(v.len).toBe(5);
  });

  it("returns 0 length for zero vector", () => {
    const v = new Vec();
    expect(v.len).toBe(0);
  });

  it("sets length while preserving direction", () => {
    const v = new Vec(3, 4);
    v.len = 10;
    expect(v.x).toBeCloseTo(6);
    expect(v.y).toBeCloseTo(8);
    expect(v.len).toBeCloseTo(10);
  });

  it("does not divide by zero when setting length on zero vector", () => {
    const v = new Vec(0, 0);
    v.len = 10;
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });
});
