import {
  temporalDataSchema,
  temporalRangeSchema,
  type DisplayFormat,
  type Era,
  type Precision,
  type TemporalData,
  type TemporalRange,
} from "../schemas/temporal.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const BIG_BANG_BYA = 13.8;

function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

function autoDetectFormat(era: Era): DisplayFormat {
  switch (era) {
    case "CE":
    case "BCE":
      return "standard";
    case "KYA":
      return "scientific";
    case "MYA":
      return "geological";
    case "BYA":
      return "cosmological";
  }
}

function eraUnitLabel(era: Era): string {
  switch (era) {
    case "KYA":
      return "thousand";
    case "MYA":
      return "million";
    case "BYA":
      return "billion";
    case "CE":
    case "BCE":
      return "";
  }
}

function uncertaintyInEraUnits(uncertaintyYears: number, era: Era): number {
  switch (era) {
    case "KYA":
      return uncertaintyYears / 1_000;
    case "MYA":
      return uncertaintyYears / 1_000_000;
    case "BYA":
      return uncertaintyYears / 1_000_000_000;
    case "CE":
    case "BCE":
      return uncertaintyYears;
  }
}

function defaultPrecisionFor(era: Era): Precision {
  return era === "CE" || era === "BCE" ? "exact" : "approximate";
}

export class TemporalService {
  /**
   * Converts a TemporalData value to the same BIGINT scale used by the
   * `sort_order_years` generated column in
   * supabase/migrations/00001_initial_schema.sql so client-side sort matches
   * server-side ordering exactly.
   */
  static toSortableYears(t: TemporalData): number {
    switch (t.era) {
      case "CE":
        return t.year;
      case "BCE":
        return -t.year;
      case "KYA":
        return -t.year * 1_000;
      case "MYA":
        return -t.year * 1_000_000;
      case "BYA":
        return -t.year * 1_000_000_000;
    }
  }

  static formatDisplay(t: TemporalData): string {
    const format: DisplayFormat = t.display_format ?? autoDetectFormat(t.era);
    switch (format) {
      case "standard":
        return TemporalService.formatStandard(t);
      case "scientific":
        return TemporalService.formatScientific(t);
      case "geological":
        return TemporalService.formatGeological(t);
      case "cosmological":
        return TemporalService.formatCosmological(t);
    }
  }

  static createFromDate(date: Date): TemporalData {
    return temporalDataSchema.parse({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
      era: "CE",
      precision: "exact",
    });
  }

  static createFromYear(year: number, era: Era, precision?: Precision): TemporalData {
    return temporalDataSchema.parse({
      year,
      era,
      precision: precision ?? defaultPrecisionFor(era),
    });
  }

  static createRange(start: TemporalData, end: TemporalData): TemporalRange {
    return temporalRangeSchema.parse({ start, end });
  }

  /**
   * Sort comparator consistent with `toSortableYears` (the DB sort key).
   * For CE/BCE same-year ties, falls back to month/day/hour/minute/second so
   * client-side rendering puts e.g. Jan 2024 before Dec 2024. The DB has no
   * tiebreaker; this is a client-only refinement that never inverts DB order.
   */
  static compare(a: TemporalData, b: TemporalData): number {
    const primary = TemporalService.toSortableYears(a) - TemporalService.toSortableYears(b);
    if (primary !== 0) return primary;

    const aSubYear = a.era === "CE" || a.era === "BCE";
    const bSubYear = b.era === "CE" || b.era === "BCE";
    if (!aSubYear || !bSubYear) return 0;

    const subYearFields = ["month", "day", "hour", "minute", "second"] as const;
    for (const field of subYearFields) {
      const diff = (a[field] ?? 0) - (b[field] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  static isInRange(point: TemporalData, start: TemporalData, end: TemporalData): boolean {
    return (
      TemporalService.compare(point, start) >= 0 &&
      TemporalService.compare(point, end) <= 0
    );
  }

  static getUncertaintyRange(t: TemporalData): { min: number; max: number } {
    const center = TemporalService.toSortableYears(t);
    const uncertainty = t.uncertainty ?? 0;
    return { min: center - uncertainty, max: center + uncertainty };
  }

  private static formatStandard(t: TemporalData): string {
    if (t.era !== "CE" && t.era !== "BCE") {
      return TemporalService.formatScientific(t);
    }
    if (t.month != null && t.day != null) {
      return `${monthName(t.month)} ${t.day}, ${t.year} ${t.era}`;
    }
    if (t.month != null) {
      return `${monthName(t.month)} ${t.year} ${t.era}`;
    }
    return `${t.year} ${t.era}`;
  }

  private static formatScientific(t: TemporalData): string {
    if (t.era === "CE" || t.era === "BCE") {
      return TemporalService.formatStandard(t);
    }
    const unit = eraUnitLabel(t.era);
    const base = `~${t.year} ${unit} years ago`;
    if (t.uncertainty != null && t.uncertainty > 0) {
      const eraUnits = uncertaintyInEraUnits(t.uncertainty, t.era);
      return `${base} ± ${eraUnits} ${t.era}`;
    }
    return base;
  }

  // Geological format follows issue #24 body ("<period> (~<year> <era>)").
  // Spec/issue mismatch tracked in #111.
  private static formatGeological(t: TemporalData): string {
    const label = t.geological_period ?? t.geological_epoch;
    if (label == null) {
      return TemporalService.formatScientific(t);
    }
    if (t.era === "CE" || t.era === "BCE") {
      return `${label} (${t.year} ${t.era})`;
    }
    return `${label} (~${t.year} ${t.era})`;
  }

  private static formatCosmological(t: TemporalData): string {
    if (t.cosmological_epoch != null) {
      return `${t.cosmological_epoch} (~${t.year} ${t.era})`;
    }
    if (t.era === "BYA") {
      const yearsAfterBigBang = BIG_BANG_BYA - t.year;
      return `${yearsAfterBigBang} billion years after the Big Bang`;
    }
    return TemporalService.formatScientific(t);
  }
}
