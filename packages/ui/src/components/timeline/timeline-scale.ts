import { scaleLinear, scaleLog } from "d3-scale";
import type { TimelineScaleMode } from "./types";

/**
 * Timeline positioning math — the core value D3 brings to the renderer (#65).
 *
 * We use `d3-scale` for the math ONLY; React owns the SVG DOM (ADR-0039). The
 * `d3` meta-package and `d3-selection` are deliberately not used. Keeping this
 * module pure and renderer-agnostic means the PRD's future Canvas fallback
 * (>5000 events, PRD §5488) can reuse it unchanged.
 *
 * The log axis must operate on a strictly-positive domain, so it maps signed
 * sortable-years onto **years-before-present** (clamped ≥1) — the same insight
 * as `computeMarkerLeft` in `era-timeline-strip.tsx`, but backed by a real
 * `scaleLog` so we also get `.invert()` (needed for pointer/click hit-testing
 * and every downstream interaction). Linear positions signed sort-years directly.
 *
 * Axis orientation matches the landing strip: oldest at the left, present at the
 * right.
 */

/** Fallback "present" year when the caller doesn't pin one (matches the strip). */
export const DEFAULT_PRESENT_YEAR = 2026;

export interface TimelineScaleOptions {
  mode: TimelineScaleMode;
  /** Temporal domain as `[minSortYears, maxSortYears]` (oldest, newest). */
  domain: readonly [number, number];
  /** Pixel range as `[leftPx, rightPx]` (oldest edge, present edge). */
  range: readonly [number, number];
  /** Year treated as "now" for the years-before-present mapping in log mode. */
  presentYear?: number;
}

export interface TimelineScale {
  readonly mode: TimelineScaleMode;
  /** Pixel position along the axis for a signed sortable-year value. */
  position(sortYears: number): number;
  /** Inverse of {@link position}: the sortable-year value at a pixel offset. */
  invert(px: number): number;
}

/** Years before `presentYear` for a signed sort-year value, clamped to ≥1. */
function yearsBeforePresent(sortYears: number, presentYear: number): number {
  return Math.max(1, presentYear - sortYears);
}

/**
 * Builds a positioning function for the timeline axis. Both scales `.clamp()`
 * so out-of-domain inputs pin to the axis edges rather than overflowing; a
 * non-finite `sortYears` resolves to the present (right) edge, mirroring the
 * strip's NaN handling.
 */
export function createTimeScale(options: TimelineScaleOptions): TimelineScale {
  const { mode, domain, range, presentYear = DEFAULT_PRESENT_YEAR } = options;
  const [minSort, maxSort] = domain;
  const [leftPx, rightPx] = range;

  if (mode === "log") {
    // Oldest (max years-before-present) → left edge; present (ybp 1) → right.
    const oldestYbpRaw = yearsBeforePresent(minSort, presentYear);
    const newestYbp = yearsBeforePresent(maxSort, presentYear);
    // Guard against a degenerate domain: when the whole (present-widened)
    // domain falls at or after `presentYear` — e.g. an all-future/
    // speculative event set — both endpoints clamp to the same
    // years-before-present value (1) and scaleLog's domain collapses to a
    // single point, which resolves every position to the range midpoint
    // instead of a real pixel. Widen the oldest edge by one unit so present
    // and future values consistently pin to the right (present) edge.
    const oldestYbp = oldestYbpRaw > newestYbp ? oldestYbpRaw : newestYbp + 1;
    const scale = scaleLog()
      .domain([oldestYbp, newestYbp])
      .range([leftPx, rightPx])
      .clamp(true);

    return {
      mode,
      position(sortYears: number): number {
        if (!Number.isFinite(sortYears)) return rightPx;
        return scale(yearsBeforePresent(sortYears, presentYear));
      },
      invert(px: number): number {
        return presentYear - scale.invert(px);
      },
    };
  }

  // Linear: signed sort-years map directly, oldest (min) left → newest right.
  const scale = scaleLinear()
    .domain([minSort, maxSort])
    .range([leftPx, rightPx])
    .clamp(true);

  return {
    mode,
    position(sortYears: number): number {
      if (!Number.isFinite(sortYears)) return rightPx;
      return scale(sortYears);
    },
    invert(px: number): number {
      return scale.invert(px);
    },
  };
}

/**
 * Convenience: the `[min, max]` signed-sort-year domain covering a set of
 * events, widened to include the present so the axis always reaches "now".
 * Returns a sensible unit span when the set is empty.
 */
export function domainFromSortYears(
  sortYears: readonly number[],
  presentYear: number = DEFAULT_PRESENT_YEAR,
): [number, number] {
  // Reduce in a single pass rather than `Math.min(...finite)` — spreading a
  // large event array as call arguments risks a call-stack RangeError once
  // the array exceeds the engine's argument-list limit.
  let min = presentYear;
  let max = presentYear;
  let hasFinite = false;
  for (const y of sortYears) {
    if (!Number.isFinite(y)) continue;
    hasFinite = true;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  if (!hasFinite) return [presentYear - 1, presentYear];
  // Guard against a zero-width domain (single event at the present).
  return min === max ? [min - 1, max] : [min, max];
}
