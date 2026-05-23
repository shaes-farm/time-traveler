import { describe, expect, it } from "vitest";
import {
  compareTemporal,
  eraToSortableYears,
  temporalDataSchema,
  temporalRangeSchema,
} from "./temporal.js";

describe("temporalDataSchema", () => {
  it("accepts a valid CE date", () => {
    const result = temporalDataSchema.safeParse({
      year: 2024,
      month: 3,
      day: 15,
      era: "CE",
      precision: "exact",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid BYA date without sub-year fields", () => {
    const result = temporalDataSchema.safeParse({
      year: 14,
      era: "BYA",
      precision: "estimated",
    });
    expect(result.success).toBe(true);
  });

  it("rejects CE year 0", () => {
    const result = temporalDataSchema.safeParse({ year: 0, era: "CE", precision: "exact" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("year");
  });

  it("rejects BCE year 0", () => {
    const result = temporalDataSchema.safeParse({ year: 0, era: "BCE", precision: "exact" });
    expect(result.success).toBe(false);
  });

  it("rejects prehistoric era with month field", () => {
    const result = temporalDataSchema.safeParse({
      year: 65,
      month: 6,
      era: "MYA",
      precision: "estimated",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("month");
  });

  it("rejects day without month", () => {
    const result = temporalDataSchema.safeParse({
      year: 2024,
      day: 15,
      era: "CE",
      precision: "exact",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("day");
  });

  it("rejects Feb 30", () => {
    const result = temporalDataSchema.safeParse({
      year: 2024,
      month: 2,
      day: 30,
      era: "CE",
      precision: "exact",
    });
    expect(result.success).toBe(false);
  });

  it("accepts Feb 29 in a leap year", () => {
    const result = temporalDataSchema.safeParse({
      year: 2024,
      month: 2,
      day: 29,
      era: "CE",
      precision: "exact",
    });
    expect(result.success).toBe(true);
  });

  it("rejects Feb 29 in a non-leap year", () => {
    const result = temporalDataSchema.safeParse({
      year: 2023,
      month: 2,
      day: 29,
      era: "CE",
      precision: "exact",
    });
    expect(result.success).toBe(false);
  });

  it("rejects BYA year exceeding 100", () => {
    const result = temporalDataSchema.safeParse({
      year: 101,
      era: "BYA",
      precision: "estimated",
    });
    expect(result.success).toBe(false);
  });
});

describe("eraToSortableYears", () => {
  it("CE year is positive", () => {
    expect(eraToSortableYears({ era: "CE", year: 2000 })).toBe(2000);
  });

  it("BCE year is negative", () => {
    expect(eraToSortableYears({ era: "BCE", year: 500 })).toBe(-500);
  });

  it("KYA multiplies by 1,000", () => {
    expect(eraToSortableYears({ era: "KYA", year: 10 })).toBe(-10_000);
  });

  it("MYA multiplies by 1,000,000", () => {
    expect(eraToSortableYears({ era: "MYA", year: 65 })).toBe(-65_000_000);
  });

  it("BYA multiplies by 1,000,000,000", () => {
    expect(eraToSortableYears({ era: "BYA", year: 14 })).toBe(-14_000_000_000);
  });
});

describe("compareTemporal", () => {
  const ceDate = (year: number, month?: number, day?: number) =>
    ({
      year,
      month,
      day,
      era: "CE" as const,
      precision: "exact" as const,
    }) as Parameters<typeof compareTemporal>[0];

  it("earlier CE year is less than later", () => {
    expect(compareTemporal(ceDate(1900), ceDate(2000))).toBeLessThan(0);
  });

  it("later CE year is greater than earlier", () => {
    expect(compareTemporal(ceDate(2000), ceDate(1900))).toBeGreaterThan(0);
  });

  it("same year, earlier month comes first", () => {
    expect(compareTemporal(ceDate(2024, 1), ceDate(2024, 6))).toBeLessThan(0);
  });

  it("BCE date is earlier than CE date", () => {
    const bce = { year: 100, era: "BCE" as const, precision: "exact" as const };
    const ce = ceDate(100);
    expect(compareTemporal(bce, ce)).toBeLessThan(0);
  });
});

describe("temporalRangeSchema", () => {
  it("accepts start before end", () => {
    const result = temporalRangeSchema.safeParse({
      start: { year: 1, era: "CE", precision: "exact" },
      end: { year: 2, era: "CE", precision: "exact" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects start after end", () => {
    const result = temporalRangeSchema.safeParse({
      start: { year: 2000, era: "CE", precision: "exact" },
      end: { year: 1000, era: "CE", precision: "exact" },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("end");
  });
});
