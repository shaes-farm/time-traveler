import { describe, it, expect } from "vitest";
import type { TemporalData } from "@repo/services/schemas/temporal";
import type { PeriodWithRelations } from "@repo/services/period-service";
import {
  periodFormSchema,
  BLANK_VALUES,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
  seedForAddAnother,
  type PeriodFormValues,
} from "./period-form-mappers";

const start: TemporalData = { era: "MYA", year: 201, precision: "approximate" };
const end: TemporalData = { era: "MYA", year: 145, precision: "approximate" };

const validValues: PeriodFormValues = {
  title: "Jurassic",
  slug: "jurassic",
  summary: "The middle period of the Mesozoic.",
  detail: "Dinosaurs diversified.",
  temporal_data: start,
  end_temporal_data: end,
  parent_period_id: "11111111-1111-4111-8111-111111111111",
  significance: "high",
  characteristics: ["reptiles", "warm"],
};

describe("periodFormSchema", () => {
  it("accepts a well-formed value", () => {
    expect(periodFormSchema.safeParse(validValues).success).toBe(true);
  });

  it("requires a title", () => {
    const result = periodFormSchema.safeParse({ ...validValues, title: "" });
    expect(result.success).toBe(false);
  });

  it("requires a start date", () => {
    const result = periodFormSchema.safeParse({
      ...validValues,
      temporal_data: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["temporal_data"]);
    }
  });

  it("rejects an end that precedes the start", () => {
    const result = periodFormSchema.safeParse({
      ...validValues,
      temporal_data: end, // 145 MYA
      end_temporal_data: start, // 201 MYA — earlier in real time, so invalid
    });
    // In MYA, larger year = older = earlier; compareTemporal handles the era
    // direction. Here start(145) is later than end(201), so it must fail.
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["end_temporal_data"]);
    }
  });

  it("allows an open-ended span (null end)", () => {
    const result = periodFormSchema.safeParse({
      ...validValues,
      end_temporal_data: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("mapRowToFormValues", () => {
  it("maps a row, defaulting nullable fields", () => {
    const row = {
      title: "Jurassic",
      slug: "jurassic",
      summary: null,
      detail: null,
      temporal_data: start,
      end_temporal_data: end,
      parent_period_id: "abc",
      significance: null,
      characteristics: null,
    } as unknown as PeriodWithRelations;

    expect(mapRowToFormValues(row)).toEqual({
      title: "Jurassic",
      slug: "jurassic",
      summary: "",
      detail: "",
      temporal_data: start,
      end_temporal_data: end,
      parent_period_id: "abc",
      significance: "medium",
      characteristics: [],
    });
  });
});

describe("toCreateInput", () => {
  it("omits empty optional fields and the slug when blank", () => {
    const input = toCreateInput({
      ...BLANK_VALUES,
      title: "Jurassic",
      temporal_data: start,
    });
    expect(input).toEqual({
      title: "Jurassic",
      slug: undefined,
      summary: undefined,
      detail: undefined,
      temporal_data: start,
      end_temporal_data: null,
      parent_period_id: undefined,
      significance: "medium",
      characteristics: undefined,
    });
  });

  it("passes through populated fields", () => {
    const input = toCreateInput(validValues);
    expect(input.slug).toBe("jurassic");
    expect(input.parent_period_id).toBe(validValues.parent_period_id);
    expect(input.characteristics).toEqual(["reptiles", "warm"]);
  });

  it("throws when the start date is missing", () => {
    expect(() => toCreateInput(BLANK_VALUES)).toThrow(/start date/i);
  });
});

describe("toUpdateData", () => {
  it("includes text fields as-is and omits a null start", () => {
    const data = toUpdateData({ ...validValues, temporal_data: null });
    expect(data.temporal_data).toBeUndefined();
    expect(data.end_temporal_data).toEqual(end);
    expect(data.summary).toBe(validValues.summary);
  });

  it("includes the start when present", () => {
    const data = toUpdateData(validValues);
    expect(data.temporal_data).toEqual(start);
    expect(data.parent_period_id).toBe(validValues.parent_period_id);
  });
});

describe("seedForAddAnother", () => {
  it("carries significance and parent into a fresh blank form", () => {
    const seeded = seedForAddAnother(validValues);
    expect(seeded).toEqual({
      ...BLANK_VALUES,
      significance: "high",
      parent_period_id: validValues.parent_period_id,
    });
  });
});
