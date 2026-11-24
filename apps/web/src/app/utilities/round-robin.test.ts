import { describe, expect, test } from "vitest";
import { createRoundRobin } from "./round-robin";

const a = "https://a.example";
const b = "https://b.example";
const c = "https://c.example";

describe("createRoundRobin", () => {
  test("starts at a random endpoint", () => {
    expect(createRoundRobin([a, b, c], { random: () => 0 }).order()[0]).toBe(a);
    expect(createRoundRobin([a, b, c], { random: () => 0.5 }).order()[0]).toBe(
      b,
    );
    expect(createRoundRobin([a, b, c], { random: () => 0.99 }).order()[0]).toBe(
      c,
    );
  });

  test("rotates the start on every call and keeps the other endpoints as fallbacks", () => {
    const rr = createRoundRobin([a, b, c], { random: () => 0.5 });
    expect(rr.order()).toEqual([b, c, a]);
    expect(rr.order()).toEqual([c, a, b]);
    expect(rr.order()).toEqual([a, b, c]);
    expect(rr.order()).toEqual([b, c, a]);
  });

  test("spreads requests evenly", () => {
    const rr = createRoundRobin([a, b, c], { random: () => 0 });
    const counts: Record<string, number> = {};
    for (let i = 0; i < 300; i++) {
      const first = rr.order()[0];
      counts[first] = (counts[first] ?? 0) + 1;
    }
    expect(counts).toEqual({ [a]: 100, [b]: 100, [c]: 100 });
  });

  test("puts a failed endpoint last until the cooldown ends", () => {
    let time = 0;
    const rr = createRoundRobin([a, b, c], {
      random: () => 0,
      now: () => time,
      cooldownMs: 30_000,
    });
    rr.markFailed(a);
    expect(rr.order()).toEqual([b, c, a]);
    expect(rr.order()).toEqual([b, c, a]);
    expect(rr.order()).toEqual([c, b, a]);
    time = 30_001;
    expect(rr.order()).toEqual([a, b, c]);
  });

  test("ignores empty and duplicate entries", () => {
    const rr = createRoundRobin([a, "", null, a, b], { random: () => 0 });
    expect(rr.endpoints).toEqual([a, b]);
    expect(createRoundRobin([]).order()).toEqual([]);
  });
});
