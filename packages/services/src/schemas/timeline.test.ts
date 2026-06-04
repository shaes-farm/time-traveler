import { describe, expect, it } from "vitest";
import {
  timelineSchema,
  timelineTypeEnum,
  timelineVisibilityEnum,
} from "./timeline";

const validTemporal = {
  year: 1,
  era: "CE" as const,
  precision: "exact" as const,
};

const validBase = {
  slug: "world-history",
  title: "World History",
  temporal_data: validTemporal,
};

describe("timelineSchema — valid inputs", () => {
  it("accepts a minimal valid timeline", () => {
    const result = timelineSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("defaults timeline_type to 'general'", () => {
    const result = timelineSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    expect(result.data?.timeline_type).toBe("general");
  });

  it("defaults visibility to 'private'", () => {
    const result = timelineSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    expect(result.data?.visibility).toBe("private");
  });

  it("defaults fractal_depth to 5", () => {
    const result = timelineSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    expect(result.data?.fractal_depth).toBe(5);
  });

  it.each(timelineTypeEnum.options)("accepts timeline_type '%s'", (type) => {
    const result = timelineSchema.safeParse({
      ...validBase,
      timeline_type: type,
    });
    expect(result.success).toBe(true);
  });

  it.each(timelineVisibilityEnum.options)("accepts visibility '%s'", (vis) => {
    const result = timelineSchema.safeParse({ ...validBase, visibility: vis });
    expect(result.success).toBe(true);
  });

  it("accepts fractal_depth of 1 (minimum)", () => {
    const result = timelineSchema.safeParse({ ...validBase, fractal_depth: 1 });
    expect(result.success).toBe(true);
  });

  it("accepts an optional end_temporal_data", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      end_temporal_data: { year: 2000, era: "CE", precision: "exact" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null for end_temporal_data", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      end_temporal_data: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts subject_character_id as a UUID", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      timeline_type: "biographical",
      subject_character_id: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts subject_character_id as null", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      subject_character_id: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("timelineSchema — invalid inputs", () => {
  it("rejects fractal_depth of 0", () => {
    const result = timelineSchema.safeParse({ ...validBase, fractal_depth: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects fractal_depth of -1", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      fractal_depth: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid visibility value", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      visibility: "unlisted",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid timeline_type", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      timeline_type: "personal",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid temporal_data (wrong era string)", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      temporal_data: { year: 100, era: "AD", precision: "exact" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID subject_character_id", () => {
    const result = timelineSchema.safeParse({
      ...validBase,
      subject_character_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = timelineSchema.safeParse({ ...validBase, title: "" });
    expect(result.success).toBe(false);
  });
});
