import {
  compareTemporal,
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

function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

/**
 * Selects a display format from era + precision + metadata when the caller
 * hasn't set `display_format`. Considers metadata (not just era) so that, for
 * example, an MYA value with `precision: "estimated"` and no geological
 * fields renders as scientific rather than geological.
 */
function autoDetectFormat(t: TemporalData): DisplayFormat {
  if (t.era === "CE" || t.era === "BCE") return "standard";
  if (
    t.precision === "geological" ||
    t.geological_period != null ||
    t.geological_epoch != null
  ) {
    return "geological";
  }
  if (t.cosmological_epoch != null) return "cosmological";
  return "scientific";
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
   * server-side ordering exactly. Per-era year bounds enforced by
   * temporalDataSchema keep the scaled result within Number.MAX_SAFE_INTEGER.
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
    const format: DisplayFormat = t.display_format ?? autoDetectFormat(t);
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

  static createFromYear(
    year: number,
    era: Era,
    precision?: Precision,
  ): TemporalData {
    return temporalDataSchema.parse({
      year,
      era,
      precision: precision ?? defaultPrecisionFor(era),
    });
  }

  static createRange(start: TemporalData, end: TemporalData): TemporalRange {
    return temporalRangeSchema.parse({ start, end });
  }

  static compare(a: TemporalData, b: TemporalData): number {
    return compareTemporal(a, b);
  }

  static isInRange(
    point: TemporalData,
    start: TemporalData,
    end: TemporalData,
  ): boolean {
    return (
      compareTemporal(point, start) >= 0 && compareTemporal(point, end) <= 0
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

  /**
   * Compact era-unit form per system-design.md §6.2 (e.g., "66 MYA",
   * "66 ± 0.5 MYA"). Uncertainty is converted to the same era unit as the
   * base value so both share one scale.
   */
  private static formatScientific(t: TemporalData): string {
    if (t.era === "CE" || t.era === "BCE") {
      return TemporalService.formatStandard(t);
    }
    if (t.uncertainty != null && t.uncertainty > 0) {
      const eraUnits = uncertaintyInEraUnits(t.uncertainty, t.era);
      return `${t.year} ± ${eraUnits} ${t.era}`;
    }
    return `${t.year} ${t.era}`;
  }

  /**
   * Form is "<label> (~<year> <era>)" per the issue #24 body, with the
   * spec/issue ordering discrepancy tracked in #111. When both fields are
   * present, prefers `geological_epoch` over `geological_period` since epochs
   * are more granular in the geologic time hierarchy (era > period > epoch).
   */
  private static formatGeological(t: TemporalData): string {
    const label = t.geological_epoch ?? t.geological_period;
    if (label == null) {
      return TemporalService.formatScientific(t);
    }
    if (t.era === "CE" || t.era === "BCE") {
      return `${label} (${t.year} ${t.era})`;
    }
    return `${label} (~${t.year} ${t.era})`;
  }

  /**
   * Requires `cosmological_epoch` for the canonical "<epoch> (~<year> <era>)"
   * form. When absent, falls through to scientific — there's no integer-safe
   * way to compute "<N> billion years after the Big Bang" given the schema's
   * integer-year constraint without producing zero or negative N near the
   * Big Bang itself.
   */
  private static formatCosmological(t: TemporalData): string {
    if (t.cosmological_epoch != null) {
      return `${t.cosmological_epoch} (~${t.year} ${t.era})`;
    }
    return TemporalService.formatScientific(t);
  }
}
