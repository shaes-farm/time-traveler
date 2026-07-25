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

/** Default spacing floor between axis ticks, in px, for readability. */
export const MIN_TICK_SPACING_PX = 56;

/** Approx. px budget per tick when a caller doesn't pass a target count. */
const PX_PER_TICK = 120;

export interface TimelineScaleOptions {
  mode: TimelineScaleMode;
  /** Temporal domain as `[minSortYears, maxSortYears]` (oldest, newest). */
  domain: readonly [number, number];
  /** Pixel range as `[leftPx, rightPx]` (oldest edge, present edge). */
  range: readonly [number, number];
  /** Year treated as "now" for the years-before-present mapping in log mode. */
  presentYear?: number;
}

/**
 * A generated axis tick: a labelled reference position along the timeline.
 * `sortYears` is the mode-agnostic temporal coordinate, `px` is where it lands
 * for the scale that produced it, and `label` is the era-aware display string.
 */
export interface AxisTick {
  readonly sortYears: number;
  readonly px: number;
  readonly label: string;
}

export interface TimelineScale {
  readonly mode: TimelineScaleMode;
  /** Pixel position along the axis for a signed sortable-year value. */
  position(sortYears: number): number;
  /** Inverse of {@link position}: the sortable-year value at a pixel offset. */
  invert(px: number): number;
  /**
   * Readable, collision-free axis ticks across the current domain. Ticks land
   * on human-friendly values (powers of ten and their 2/5 multiples in log
   * mode), carry an era-aware label, and are culled so no two sit closer than
   * `minSpacingPx`. `targetCount` defaults to a width-derived estimate.
   */
  ticks(targetCount?: number, minSpacingPx?: number): AxisTick[];
}

/** Years before `presentYear` for a signed sort-year value, clamped to ≥1. */
function yearsBeforePresent(sortYears: number, presentYear: number): number {
  return Math.max(1, presentYear - sortYears);
}

/** One decimal, dropping a trailing ".0", with thousands grouping. */
function trimScaled(n: number): string {
  return Number(n.toFixed(1)).toLocaleString("en-US");
}

/**
 * Era-aware label for an axis tick at a signed sortable-year value.
 *
 * Deep time reads as "<n> KYA/MYA/BYA", keyed off years-before-present — the
 * same "years ago" framing as the landing strip's era bands (`computeLogBands`
 * in `era-timeline-strip.tsx`) — while the recent band (within ~10k years of
 * the present, and anything in the future) reads as a calendar "<year> CE/BCE".
 * The KYA cutoff sits at 10,000 ybp so antiquity (e.g. 2560 BCE) labels as a
 * calendar year, matching how the seed data records those eras.
 *
 * There is no year zero (BCE year N → -N, CE year N → N), so a sort value of 0
 * is treated as 1 CE.
 */
function formatTickLabel(sortYears: number, presentYear: number): string {
  const year = sortYears === 0 ? 1 : sortYears;
  const ybp = presentYear - year;
  if (ybp >= 1_000_000_000) return `${trimScaled(ybp / 1_000_000_000)} BYA`;
  if (ybp >= 1_000_000) return `${trimScaled(ybp / 1_000_000)} MYA`;
  if (ybp >= 10_000) return `${trimScaled(ybp / 1_000)} KYA`;
  return year > 0 ? `${year} CE` : `${-year} BCE`;
}

/** Width-derived tick target when the caller doesn't pin one. */
function defaultTickCount(leftPx: number, rightPx: number): number {
  return Math.max(2, Math.round(Math.abs(rightPx - leftPx) / PX_PER_TICK));
}

/**
 * Maps raw sort-year candidates to labelled, positioned ticks and culls them
 * so no two sit closer than `minSpacingPx`. A single greedy left-to-right pass
 * over px-sorted candidates handles both exact collisions (out-of-range values
 * clamped to the same edge) and merely-too-close ticks. Raw ticks at the
 * non-existent year zero are snapped to 1 CE before positioning.
 */
function assembleTicks(
  rawSortYears: readonly number[],
  presentYear: number,
  position: (sortYears: number) => number,
  minSpacingPx: number,
): AxisTick[] {
  const candidates = rawSortYears
    .map((raw) => {
      const sortYears = raw === 0 ? 1 : raw;
      return {
        sortYears,
        px: position(sortYears),
        label: formatTickLabel(sortYears, presentYear),
      };
    })
    .sort((a, b) => a.px - b.px);

  const kept: AxisTick[] = [];
  for (const tick of candidates) {
    const last = kept[kept.length - 1];
    if (last == null || tick.px - last.px >= minSpacingPx) kept.push(tick);
  }
  return kept;
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

    const position = (sortYears: number): number => {
      if (!Number.isFinite(sortYears)) return rightPx;
      return scale(yearsBeforePresent(sortYears, presentYear));
    };

    return {
      mode,
      position,
      invert(px: number): number {
        return presentYear - scale.invert(px);
      },
      ticks(
        targetCount?: number,
        minSpacingPx: number = MIN_TICK_SPACING_PX,
      ): AxisTick[] {
        const count = targetCount ?? defaultTickCount(leftPx, rightPx);
        // d3 log ticks live in years-before-present space; map each back to a
        // signed sort-year so labels and positions share one coordinate.
        const rawSortYears = scale.ticks(count).map((ybp) => presentYear - ybp);
        return assembleTicks(rawSortYears, presentYear, position, minSpacingPx);
      },
    };
  }

  // Linear: signed sort-years map directly, oldest (min) left → newest right.
  const scale = scaleLinear()
    .domain([minSort, maxSort])
    .range([leftPx, rightPx])
    .clamp(true);

  const position = (sortYears: number): number => {
    if (!Number.isFinite(sortYears)) return rightPx;
    return scale(sortYears);
  };

  return {
    mode,
    position,
    invert(px: number): number {
      return scale.invert(px);
    },
    ticks(
      targetCount?: number,
      minSpacingPx: number = MIN_TICK_SPACING_PX,
    ): AxisTick[] {
      const count = targetCount ?? defaultTickCount(leftPx, rightPx);
      // Linear ticks are already in signed sort-year space.
      return assembleTicks(
        scale.ticks(count),
        presentYear,
        position,
        minSpacingPx,
      );
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
