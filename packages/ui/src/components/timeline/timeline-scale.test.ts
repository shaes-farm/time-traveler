import { describe, expect, it } from "vitest";
import {
  createTimeScale,
  domainFromSortYears,
  DEFAULT_PRESENT_YEAR,
} from "./timeline-scale";

const PRESENT = 2026;
const DOMAIN: [number, number] = [-13.8e9, PRESENT];
const RANGE: [number, number] = [0, 1000];

/** Absolute-difference assertion for large magnitudes `toBeCloseTo` can't do. */
function expectNear(actual: number, expected: number, eps: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

describe("createTimeScale — log", () => {
  const scale = createTimeScale({
    mode: "log",
    domain: DOMAIN,
    range: RANGE,
    presentYear: PRESENT,
  });

  it("pins the oldest moment to the left edge and the present to the right", () => {
    expectNear(scale.position(-13.8e9), 0, 1);
    expectNear(scale.position(PRESENT), 1000, 1);
  });

  it("orders older events to the left of younger ones", () => {
    const bya = scale.position(-13.8e9);
    const mya = scale.position(-66e6);
    const kya = scale.position(-300e3);
    const ce = scale.position(1969);
    expect(bya).toBeLessThan(mya);
    expect(mya).toBeLessThan(kya);
    expect(kya).toBeLessThan(ce);
  });

  it("round-trips through invert for in-domain values", () => {
    const sy = -300e3;
    expectNear(scale.invert(scale.position(sy)), sy, 1);
  });

  it("clamps out-of-domain inputs to the axis edges", () => {
    // Older than the domain minimum still pins to the left edge.
    expectNear(scale.position(-20e9), 0, 1);
  });

  it("resolves a non-finite sort value to the present (right) edge", () => {
    expect(scale.position(Number.NaN)).toBe(1000);
  });
});

describe("createTimeScale — linear", () => {
  const scale = createTimeScale({
    mode: "linear",
    domain: DOMAIN,
    range: RANGE,
    presentYear: PRESENT,
  });

  it("maps the domain endpoints linearly to the range", () => {
    expectNear(scale.position(-13.8e9), 0, 1e-6);
    expectNear(scale.position(PRESENT), 1000, 1e-6);
    // Midpoint of the domain lands at the midpoint of the range.
    const mid = (DOMAIN[0] + DOMAIN[1]) / 2;
    expectNear(scale.position(mid), 500, 1);
  });

  it("round-trips through invert", () => {
    const sy = -1e6;
    expectNear(scale.invert(scale.position(sy)), sy, 1);
  });

  it("resolves a non-finite sort value to the present (right) edge", () => {
    expect(scale.position(Number.POSITIVE_INFINITY)).toBe(1000);
  });

  it("defaults the present year when unspecified", () => {
    const s = createTimeScale({ mode: "linear", domain: DOMAIN, range: RANGE });
    // Sanity: present-year default is exercised without throwing.
    expect(DEFAULT_PRESENT_YEAR).toBe(2026);
    expect(Number.isFinite(s.position(0))).toBe(true);
  });
});

describe("domainFromSortYears", () => {
  it("widens the domain to include the present", () => {
    const [min, max] = domainFromSortYears([-66e6, -300e3], PRESENT);
    expect(min).toBe(-66e6);
    expect(max).toBe(PRESENT);
  });

  it("returns a unit span for an empty set", () => {
    expect(domainFromSortYears([], PRESENT)).toEqual([PRESENT - 1, PRESENT]);
  });

  it("avoids a zero-width domain for a single present-day event", () => {
    expect(domainFromSortYears([PRESENT], PRESENT)).toEqual([
      PRESENT - 1,
      PRESENT,
    ]);
  });

  it("ignores non-finite values", () => {
    const [min, max] = domainFromSortYears([Number.NaN, -1e3], PRESENT);
    expect(min).toBe(-1e3);
    expect(max).toBe(PRESENT);
  });

  it("uses the default present year when omitted", () => {
    const [, max] = domainFromSortYears([-1e3]);
    expect(max).toBe(DEFAULT_PRESENT_YEAR);
  });
});
