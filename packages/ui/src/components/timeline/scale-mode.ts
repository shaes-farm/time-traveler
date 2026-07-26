import type { ViewMode } from "@repo/ui/stores";
import type { TimelineScaleMode } from "./types";

/**
 * Scale-mode plumbing for the reader timeline toggle (#67).
 *
 * This module is the single source of the log/linear mode contract shared by the
 * toggle UI, the URL query, and the renderer. It exists to centralise two things
 * so SSR and client can never disagree ([implementation-risks R-67b]):
 *
 * 1. `?scale=` parsing + coercion (interaction spec §5.1).
 * 2. The explicit "linear compresses a long span" threshold (validation V-07),
 *    so the hint's trigger is a documented constant, not a magic number.
 *
 * ## Two mode vocabularies (deliberate divergence — flagged per CLAUDE.md)
 *
 * The timeline renderer speaks {@link TimelineScaleMode} (`"log" | "linear"`,
 * `./types`) while both the URL query (`?scale=logarithmic|linear`, spec §5.1)
 * and the persisted `navigation-store` speak {@link ViewMode}
 * (`"logarithmic" | "linear"`). Neither predates the other cleanly and both are
 * load-bearing (changing either breaks a shipped API or the store's tests), so
 * rather than refactor we bridge them with {@link toScaleMode} / {@link toViewMode}.
 * The URL + control layer is the long form; the renderer is the short form.
 */

/** URL query key carrying the persisted scale mode (interaction spec §5.1). */
export const SCALE_QUERY_KEY = "scale";

/** Default scale mode on timeline entry / for any invalid input (spec §5.1). */
export const DEFAULT_VIEW_MODE: ViewMode = "logarithmic";

/**
 * Coerce a raw `?scale=` query value to a valid {@link ViewMode}. Only an exact
 * `"linear"` selects linear; everything else — `"logarithmic"`, `null`,
 * `undefined`, unknown strings, wrong casing, arrays flattened to a joined
 * string — falls back to logarithmic (spec §5.1, R-67b). Centralising the rule
 * here keeps the server-rendered and client-hydrated modes in agreement.
 */
export function coerceScaleParam(value: string | null | undefined): ViewMode {
  return value === "linear" ? "linear" : DEFAULT_VIEW_MODE;
}

/** Bridge the long-form {@link ViewMode} to the renderer's {@link TimelineScaleMode}. */
export function toScaleMode(view: ViewMode): TimelineScaleMode {
  return view === "linear" ? "linear" : "log";
}

/** Bridge the renderer's {@link TimelineScaleMode} back to the long-form {@link ViewMode}. */
export function toViewMode(mode: TimelineScaleMode): ViewMode {
  return mode === "linear" ? "linear" : "logarithmic";
}

/**
 * Domain span (in years) at or above which linear mode compresses events badly
 * enough to warrant the V-07 hint. One megayear: past this, a linear axis packs
 * all of deep time into a sliver while the recent era dominates the width, which
 * is exactly the "illegible pile" the validation flagged. Logarithmic mode never
 * trips the hint. Exposed so the threshold is explicit and testable
 * (issue #67 AC: "suggestion logic threshold is explicit").
 */
export const LINEAR_COMPRESSION_THRESHOLD_YEARS = 1_000_000;

/**
 * Whether the current view should surface the "events compressed" hint: true
 * only in linear mode when the domain spans at least
 * {@link LINEAR_COMPRESSION_THRESHOLD_YEARS}. Non-blocking by design — the hint
 * suggests logarithmic, it never forces a switch (spec §5.3, R-67a).
 */
export function isSpanCompressed(
  domain: readonly [number, number],
  mode: ViewMode,
): boolean {
  if (mode !== "linear") return false;
  const [min, max] = domain;
  return Math.abs(max - min) >= LINEAR_COMPRESSION_THRESHOLD_YEARS;
}
