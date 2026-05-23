import { describe, expect, it } from "vitest";
import { periodSchema } from "./period.js";

const validTemporal = {
  year: 66,
  era: "MYA" as const,
  precision: "geological" as const,
};

const validBase = {
  slug: "cretaceous-period",
  title: "Cretaceous Period",
  temporal_data: validTemporal,
};

describe("periodSchema — valid inputs", () => {
  it("accepts a minimal valid period", () => {
    const result = periodSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("defaults significance to 'medium'", () => {
    const result = periodSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    expect(result.data?.significance).toBe("medium");
  });

  it("accepts an optional end_temporal_data", () => {
    const result = periodSchema.safeParse({
      ...validBase,
      end_temporal_data: { year: 145, era: "MYA", precision: "geological" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts characteristics array", () => {
    const result = periodSchema.safeParse({
      ...validBase,
      characteristics: ["Dinosaurs", "Flowering plants", "Sea-level rise"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional parent_period_id as a UUID", () => {
    const result = periodSchema.safeParse({
      ...validBase,
      parent_period_id: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });
});

describe("periodSchema — invalid inputs", () => {
  it("rejects invalid temporal_data (wrong era string)", () => {
    const result = periodSchema.safeParse({
      ...validBase,
      temporal_data: { year: 100, era: "GA", precision: "geological" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID parent_period_id", () => {
    const result = periodSchema.safeParse({
      ...validBase,
      parent_period_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = periodSchema.safeParse({ ...validBase, title: "" });
    expect(result.success).toBe(false);
  });
});
