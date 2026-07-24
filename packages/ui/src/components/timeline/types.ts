import type { EventInput } from "@repo/services/schemas/event";

/**
 * Public data + interaction contract for the reader timeline renderer (#65).
 *
 * NOTE: issue #65 asks for the renderer "in the app," but the established
 * precedent for reader visualization lives in `@repo/ui`
 * (`era-timeline-strip.tsx`), which is also where the Vitest + 80% coverage gate
 * and the era/motion tokens are. We follow that convention here and flag the
 * wording divergence per CLAUDE.md ("follow the existing convention and flag the
 * conflict"). A thin mount in `apps/reader` is deferred to the page ticket #261.
 *
 * Downstream tickets (#66 log scale, #67 linear + toggle, #68 fractal zoom, #69
 * overlays) consume these types — keep the shape stable.
 */

/** Log by default; linear compresses geological spans into the recent sliver. */
export type TimelineScaleMode = "log" | "linear";

/** The canonical event-type enum from the schema — never a local literal. */
export type TimelineEventType = EventInput["event_type"];

/**
 * A single event positioned on the temporal axis. `sortYears` is the signed
 * sortable-year value (the `sort_order_years` contract: CE positive, prehistoric
 * large-negative) — callers derive it from the column or
 * `TemporalService.toSortableYears`. `eraCode` + `displayValue` exist so markers
 * label with text, never color alone (ADR-0024).
 */
export interface TimelineEventDatum {
  id: string;
  label: string;
  sortYears: number;
  eventType: TimelineEventType;
  /** Era code, e.g. "BYA" | "MYA" | "KYA" | "BCE" | "CE". */
  eraCode: string;
  /** Formatted temporal value, e.g. "13.8 BYA" or "2560 BCE". */
  displayValue: string;
}

/** Fired on hover/focus enter with the marker id, and `null` on leave/blur. */
export type MarkerHoverHandler = (id: string | null) => void;

/** Fired on click, Enter, or Space — the "open this event" contract for #261. */
export type MarkerActivateHandler = (id: string) => void;
