import { describe, expect, it } from "vitest";
import { TemporalService } from "./temporal-service.js";
import type { TemporalData } from "../schemas/temporal.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

function ce(year: number, month?: number, day?: number): TemporalData {
  return { year, month, day, era: "CE", precision: "exact" };
}

function bce(year: number): TemporalData {
  return { year, era: "BCE", precision: "exact" };
}

function prehistoric(year: number, era: "KYA" | "MYA" | "BYA"): TemporalData {
  return { year, era, precision: "estimated" };
}

// ─── toSortableYears ──────────────────────────────────────────────────────────

describe("TemporalService.toSortableYears", () => {
  it("CE 2024 → +2024", () => {
    expect(TemporalService.toSortableYears(ce(2024))).toBe(2024);
  });

  it("BCE 500 → -500", () => {
    expect(TemporalService.toSortableYears(bce(500))).toBe(-500);
  });

  it("KYA 12 → -12_000", () => {
    expect(TemporalService.toSortableYears(prehistoric(12, "KYA"))).toBe(
      -12_000,
    );
  });

  it("MYA 65 → -65_000_000", () => {
    expect(TemporalService.toSortableYears(prehistoric(65, "MYA"))).toBe(
      -65_000_000,
    );
  });

  it("BYA 14 → -14_000_000_000", () => {
    expect(TemporalService.toSortableYears(prehistoric(14, "BYA"))).toBe(
      -14_000_000_000,
    );
  });

  it("1 BCE is adjacent to 1 CE (no year 0 gap)", () => {
    const oneBCE = TemporalService.toSortableYears(bce(1));
    const oneCE = TemporalService.toSortableYears(ce(1));
    expect(oneBCE).toBe(-1);
    expect(oneCE).toBe(1);
    expect(oneCE - oneBCE).toBe(2); // 2-unit gap is the expected convention
  });

  it("Big Bang scale (13 BYA) stays within Number.MAX_SAFE_INTEGER", () => {
    const result = TemporalService.toSortableYears(prehistoric(13, "BYA"));
    expect(Math.abs(result)).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
  });

  it("mixed-era array sorts chronologically", () => {
    const dates: TemporalData[] = [
      ce(2000),
      prehistoric(65, "MYA"),
      bce(44),
      prehistoric(14, "BYA"),
      ce(1969),
    ];
    const sorted = [...dates].sort(
      (a, b) =>
        TemporalService.toSortableYears(a) - TemporalService.toSortableYears(b),
    );
    expect(sorted[0]).toEqual(prehistoric(14, "BYA"));
    expect(sorted[1]).toEqual(prehistoric(65, "MYA"));
    expect(sorted[2]).toEqual(bce(44));
    expect(sorted[3]).toEqual(ce(1969));
    expect(sorted[4]).toEqual(ce(2000));
  });
});

// ─── formatDisplay ────────────────────────────────────────────────────────────

describe("TemporalService.formatDisplay — standard", () => {
  it("full CE date: March 15, 44 CE", () => {
    expect(TemporalService.formatDisplay(ce(44, 3, 15))).toBe(
      "March 15, 44 CE",
    );
  });

  it("full CE date: July 20, 1969 CE", () => {
    expect(TemporalService.formatDisplay(ce(1969, 7, 20))).toBe(
      "July 20, 1969 CE",
    );
  });

  it("CE year only: 2024 CE", () => {
    expect(TemporalService.formatDisplay(ce(2024))).toBe("2024 CE");
  });

  it("BCE year only: 44 BCE", () => {
    expect(TemporalService.formatDisplay(bce(44))).toBe("44 BCE");
  });

  it("CE year+month without day: March 2024 CE", () => {
    expect(TemporalService.formatDisplay(ce(2024, 3))).toBe("March 2024 CE");
  });

  it("explicit display_format=standard on CE date", () => {
    const t: TemporalData = { ...ce(1776, 7, 4), display_format: "standard" };
    expect(TemporalService.formatDisplay(t)).toBe("July 4, 1776 CE");
  });
});

describe("TemporalService.formatDisplay — scientific", () => {
  it("MYA value without uncertainty: '66 MYA'", () => {
    const t: TemporalData = {
      ...prehistoric(66, "MYA"),
      display_format: "scientific",
    };
    expect(TemporalService.formatDisplay(t)).toBe("66 MYA");
  });

  it("MYA value with uncertainty: '66 ± 0.5 MYA'", () => {
    const t: TemporalData = {
      ...prehistoric(66, "MYA"),
      uncertainty: 500_000, // 0.5 MYA in years
      display_format: "scientific",
    };
    expect(TemporalService.formatDisplay(t)).toBe("66 ± 0.5 MYA");
  });

  it("KYA value: '12 KYA'", () => {
    const t: TemporalData = {
      ...prehistoric(12, "KYA"),
      display_format: "scientific",
    };
    expect(TemporalService.formatDisplay(t)).toBe("12 KYA");
  });

  it("auto-detects scientific for KYA with no metadata", () => {
    expect(TemporalService.formatDisplay(prehistoric(12, "KYA"))).toBe(
      "12 KYA",
    );
  });
});

describe("TemporalService.formatDisplay — geological", () => {
  it("uses geological_epoch label when present", () => {
    const t: TemporalData = {
      ...prehistoric(66, "MYA"),
      geological_epoch: "Paleocene",
      geological_period: "Paleogene",
      display_format: "geological",
    };
    expect(TemporalService.formatDisplay(t)).toBe("Paleocene (~66 MYA)");
  });

  it("falls back to geological_period when epoch is absent", () => {
    const t: TemporalData = {
      ...prehistoric(66, "MYA"),
      geological_period: "Cretaceous",
      display_format: "geological",
    };
    expect(TemporalService.formatDisplay(t)).toBe("Cretaceous (~66 MYA)");
  });

  it("falls through to scientific when neither geological field is set", () => {
    const t: TemporalData = {
      ...prehistoric(66, "MYA"),
      display_format: "geological",
    };
    expect(TemporalService.formatDisplay(t)).toBe("66 MYA");
  });

  it("auto-detects geological when geological_period is present", () => {
    const t: TemporalData = {
      ...prehistoric(66, "MYA"),
      geological_period: "Cretaceous",
    };
    expect(TemporalService.formatDisplay(t)).toBe("Cretaceous (~66 MYA)");
  });

  it("auto-detects geological when precision='geological'", () => {
    const t: TemporalData = {
      year: 66,
      era: "MYA",
      precision: "geological",
      geological_period: "Cretaceous",
    };
    expect(TemporalService.formatDisplay(t)).toBe("Cretaceous (~66 MYA)");
  });
});

describe("TemporalService.formatDisplay — cosmological", () => {
  it("renders cosmological_epoch label", () => {
    const t: TemporalData = {
      ...prehistoric(14, "BYA"),
      cosmological_epoch: "Big Bang",
      display_format: "cosmological",
    };
    expect(TemporalService.formatDisplay(t)).toBe("Big Bang (~14 BYA)");
  });

  it("falls through to scientific when cosmological_epoch is absent", () => {
    const t: TemporalData = {
      ...prehistoric(14, "BYA"),
      display_format: "cosmological",
    };
    expect(TemporalService.formatDisplay(t)).toBe("14 BYA");
  });

  it("auto-detects cosmological when cosmological_epoch is present", () => {
    const t: TemporalData = {
      ...prehistoric(14, "BYA"),
      cosmological_epoch: "Recombination Era",
    };
    expect(TemporalService.formatDisplay(t)).toBe(
      "Recombination Era (~14 BYA)",
    );
  });
});

// ─── createFromDate ───────────────────────────────────────────────────────────

describe("TemporalService.createFromDate", () => {
  it("round-trips Apollo 11 Moon landing timestamp", () => {
    const date = new Date("1969-07-20T20:17:00Z");
    const t = TemporalService.createFromDate(date);
    expect(t.year).toBe(1969);
    expect(t.month).toBe(7);
    expect(t.day).toBe(20);
    expect(t.hour).toBe(20);
    expect(t.minute).toBe(17);
    expect(t.era).toBe("CE");
    expect(t.precision).toBe("exact");
  });

  it("round-trips a January 1 date", () => {
    const date = new Date("2000-01-01T00:00:00Z");
    const t = TemporalService.createFromDate(date);
    expect(t.year).toBe(2000);
    expect(t.month).toBe(1);
    expect(t.day).toBe(1);
  });
});

// ─── createFromYear ───────────────────────────────────────────────────────────

describe("TemporalService.createFromYear", () => {
  it("creates a CE date with defaults", () => {
    const t = TemporalService.createFromYear(2024, "CE");
    expect(t.year).toBe(2024);
    expect(t.era).toBe("CE");
    expect(t.precision).toBe("exact");
    expect(t.month).toBeUndefined();
  });

  it("creates a MYA date with default precision 'approximate'", () => {
    const t = TemporalService.createFromYear(65, "MYA");
    expect(t.precision).toBe("approximate");
  });

  it("accepts an explicit precision override", () => {
    const t = TemporalService.createFromYear(65, "MYA", "geological");
    expect(t.precision).toBe("geological");
  });
});

// ─── createRange ─────────────────────────────────────────────────────────────

describe("TemporalService.createRange", () => {
  it("accepts valid start < end", () => {
    const range = TemporalService.createRange(ce(1000), ce(2000));
    expect(range.start.year).toBe(1000);
    expect(range.end.year).toBe(2000);
  });

  it("accepts equal start and end", () => {
    const range = TemporalService.createRange(ce(2024), ce(2024));
    expect(range.start.year).toBe(2024);
  });

  it("throws when start > end", () => {
    expect(() => TemporalService.createRange(ce(2000), ce(1000))).toThrow();
  });
});

// ─── compare ─────────────────────────────────────────────────────────────────

describe("TemporalService.compare", () => {
  it("earlier year → negative result", () => {
    expect(TemporalService.compare(ce(1900), ce(2000))).toBeLessThan(0);
  });

  it("later year → positive result", () => {
    expect(TemporalService.compare(ce(2000), ce(1900))).toBeGreaterThan(0);
  });

  it("same year, earlier month → negative result", () => {
    expect(TemporalService.compare(ce(2024, 1), ce(2024, 6))).toBeLessThan(0);
  });

  it("same year, same month, earlier day → negative result", () => {
    expect(
      TemporalService.compare(ce(2024, 6, 1), ce(2024, 6, 15)),
    ).toBeLessThan(0);
  });

  it("BCE < CE for same numeric year", () => {
    expect(TemporalService.compare(bce(100), ce(100))).toBeLessThan(0);
  });

  it("BYA date is earlier than MYA date", () => {
    expect(
      TemporalService.compare(prehistoric(14, "BYA"), prehistoric(65, "MYA")),
    ).toBeLessThan(0);
  });
});

// ─── isInRange ────────────────────────────────────────────────────────────────

describe("TemporalService.isInRange", () => {
  const start = ce(1000);
  const end = ce(2000);

  it("point equal to start is in range", () => {
    expect(TemporalService.isInRange(ce(1000), start, end)).toBe(true);
  });

  it("point equal to end is in range", () => {
    expect(TemporalService.isInRange(ce(2000), start, end)).toBe(true);
  });

  it("point inside range is in range", () => {
    expect(TemporalService.isInRange(ce(1500), start, end)).toBe(true);
  });

  it("point before start is not in range", () => {
    expect(TemporalService.isInRange(ce(500), start, end)).toBe(false);
  });

  it("point after end is not in range", () => {
    expect(TemporalService.isInRange(ce(2500), start, end)).toBe(false);
  });
});

// ─── getUncertaintyRange ─────────────────────────────────────────────────────

describe("TemporalService.getUncertaintyRange", () => {
  it("returns symmetric range around center with uncertainty", () => {
    const t: TemporalData = { ...prehistoric(66, "MYA"), uncertainty: 500_000 };
    const { min, max } = TemporalService.getUncertaintyRange(t);
    const center = TemporalService.toSortableYears(t);
    expect(min).toBe(center - 500_000);
    expect(max).toBe(center + 500_000);
  });

  it("returns [center, center] when uncertainty is 0", () => {
    const t: TemporalData = { ...prehistoric(66, "MYA"), uncertainty: 0 };
    const { min, max } = TemporalService.getUncertaintyRange(t);
    expect(min).toBe(max);
  });

  it("returns [center, center] when uncertainty is absent", () => {
    const t: TemporalData = prehistoric(66, "MYA");
    const { min, max } = TemporalService.getUncertaintyRange(t);
    expect(min).toBe(max);
  });

  it("CE date center is correct", () => {
    const t: TemporalData = { ...ce(2024), uncertainty: 1 };
    const { min, max } = TemporalService.getUncertaintyRange(t);
    expect(min).toBe(2023);
    expect(max).toBe(2025);
  });
});
