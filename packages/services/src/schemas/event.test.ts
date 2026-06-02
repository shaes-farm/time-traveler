import { describe, expect, it } from "vitest";
import { eventSchema, eventTypeEnum } from "./event";

const validTemporal = {
  year: 1969,
  month: 7,
  day: 20,
  era: "CE" as const,
  precision: "exact" as const,
};

const validBase = {
  slug: "moon-landing",
  title: "Moon Landing",
  temporal_data: validTemporal,
};

describe("eventSchema — valid inputs", () => {
  it("accepts a minimal valid event", () => {
    const result = eventSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("defaults event_type to 'milestone'", () => {
    const result = eventSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    expect(result.data?.event_type).toBe("milestone");
  });

  it("defaults importance to 5", () => {
    const result = eventSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    expect(result.data?.importance).toBe(5);
  });

  it.each(eventTypeEnum.options)("accepts event_type '%s'", (type) => {
    const result = eventSchema.safeParse({ ...validBase, event_type: type });
    expect(result.success).toBe(true);
  });

  it("accepts an optional end_temporal_data", () => {
    const result = eventSchema.safeParse({
      ...validBase,
      end_temporal_data: { year: 1972, era: "CE", precision: "exact" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts importance within range [1..10]", () => {
    const lo = eventSchema.safeParse({ ...validBase, importance: 1 });
    const hi = eventSchema.safeParse({ ...validBase, importance: 10 });
    expect(lo.success).toBe(true);
    expect(hi.success).toBe(true);
  });
});

describe("eventSchema — invalid inputs", () => {
  it("rejects an invalid event_type", () => {
    const result = eventSchema.safeParse({
      ...validBase,
      event_type: "holiday",
    });
    expect(result.success).toBe(false);
  });

  it("rejects importance outside range (0)", () => {
    const result = eventSchema.safeParse({ ...validBase, importance: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects importance outside range (11)", () => {
    const result = eventSchema.safeParse({ ...validBase, importance: 11 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid temporal_data (wrong era string)", () => {
    const result = eventSchema.safeParse({
      ...validBase,
      temporal_data: { year: 100, era: "AD", precision: "exact" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID parent_event_id", () => {
    const result = eventSchema.safeParse({
      ...validBase,
      parent_event_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = eventSchema.safeParse({ ...validBase, title: "" });
    expect(result.success).toBe(false);
  });
});
