"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@repo/ui/lib/utils";
import {
  createTimeScale,
  domainFromSortYears,
  type TimelineScale,
} from "./timeline-scale";
import type {
  MarkerActivateHandler,
  MarkerHoverHandler,
  TimelineEventDatum,
  TimelineScaleMode,
} from "./types";

/**
 * TimelineRenderer — the foundation timeline renderer for the public reader (#65).
 *
 * React owns the SVG DOM; `d3-scale` (via `./timeline-scale`) provides the
 * positioning math only — no `d3-selection`, no `d3` meta-package (ADR-0039).
 * This ticket is intentionally a foundation: it renders era-coloured event
 * markers on a log (default) or linear axis, wires the hover/activate contracts
 * downstream tickets consume, and establishes the a11y + perf baselines. Fractal
 * zoom (#68), the scale toggle (#67), semantic label density and clustering
 * (#66/#68), and overlays (#69) build on top of this.
 *
 * See `./types` for the "in the app vs @repo/ui" placement note (#65 / #261).
 */

/** Horizontal padding so edge markers aren't clipped (px). */
const PAD_X = 24;
const DEFAULT_HEIGHT = 240;
const MARKER_RADIUS = 6;

/** Era code → CSS colour var (ADR-0024). Text always accompanies the hue. */
const ERA_FILL: Record<string, string> = {
  BYA: "var(--color-era-bya)",
  MYA: "var(--color-era-mya)",
  KYA: "var(--color-era-kya)",
  BCE: "var(--color-era-bce)",
  CE: "var(--color-era-ce)",
};

function eraFill(eraCode: string): string {
  return ERA_FILL[eraCode.toUpperCase()] ?? "var(--color-foreground-muted)";
}

export interface TimelineRendererProps {
  /** Events to plot. Marker positions derive from each event's `sortYears`. */
  events: readonly TimelineEventDatum[];
  /** Axis scale — log (default) or linear. Toggle UI arrives in #67. */
  scale?: TimelineScaleMode;
  /** Year treated as "now" for the years-before-present log mapping. */
  presentYear?: number;
  /** Axis height in px. */
  height?: number;
  /**
   * Explicit axis width in px. When omitted, the renderer measures its
   * container with a `ResizeObserver` (responsive). Provide it for SSR, fixed
   * layouts, or tests where layout measurement is unavailable.
   */
  width?: number;
  /** Accessible name for the axis region. */
  ariaLabel?: string;
  /** Fired on hover/focus enter with the marker id; `null` on leave/blur. */
  onMarkerHover?: MarkerHoverHandler;
  /** Fired on click / Enter / Space — the "open this event" contract (#261). */
  onMarkerActivate?: MarkerActivateHandler;
  className?: string;
}

export const TimelineRenderer = ({
  events,
  scale = "log",
  presentYear,
  height = DEFAULT_HEIGHT,
  width: widthProp,
  ariaLabel = "Timeline",
  onMarkerHover,
  onMarkerActivate,
  className,
}: TimelineRendererProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const helpId = useId();

  const width = widthProp ?? measuredWidth;

  // Responsive width via ResizeObserver, with deterministic cleanup. Skipped
  // when an explicit `width` is supplied.
  useEffect(() => {
    if (widthProp != null) return;
    const el = containerRef.current;
    if (el == null || typeof ResizeObserver === "undefined") return;

    setMeasuredWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry != null) setMeasuredWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [widthProp]);

  const domain = useMemo(
    () =>
      domainFromSortYears(
        events.map((e) => e.sortYears),
        presentYear,
      ),
    [events, presentYear],
  );

  const timeScale: TimelineScale | null = useMemo(() => {
    if (width <= PAD_X * 2) return null;
    return createTimeScale({
      mode: scale,
      domain,
      range: [PAD_X, width - PAD_X],
      presentYear,
    });
  }, [scale, domain, width, presentYear]);

  // Era-aware axis ticks — structural chrome, recomputed with the scale.
  const ticks = useMemo(() => timeScale?.ticks() ?? [], [timeScale]);

  const setActive = useCallback(
    (id: string | null) => {
      setActiveId(id);
      onMarkerHover?.(id);
    },
    [onMarkerHover],
  );

  const activate = useCallback(
    (id: string) => onMarkerActivate?.(id),
    [onMarkerActivate],
  );

  const activeEvent = events.find((e) => e.id === activeId) ?? null;
  const axisY = height / 2;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <p id={helpId} className="sr-only">
        Timeline of events on a {scale === "log" ? "logarithmic" : "linear"}{" "}
        time axis. Use Tab to move between event markers and press Enter to open
        one.
      </p>

      {timeScale != null ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label={ariaLabel}
          aria-describedby={helpId}
          className="block max-w-full"
        >
          {/* axis baseline */}
          <line
            x1={PAD_X}
            y1={axisY}
            x2={width - PAD_X}
            y2={axisY}
            className="stroke-border"
            strokeWidth={1}
          />

          {/* Axis ticks + era labels — decorative chrome (the SR help text
              already describes the axis), so hidden from the a11y tree. */}
          {ticks.map((tick) => (
            <g
              key={`tick-${tick.sortYears}`}
              data-testid="timeline-tick"
              transform={`translate(${tick.px}, ${axisY})`}
              aria-hidden
            >
              <line y1={0} y2={6} className="stroke-border" strokeWidth={1} />
              <text
                y={18}
                textAnchor="middle"
                className="fill-foreground-subtle font-mono text-[10px]"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {events.map((event) => {
            const x = timeScale.position(event.sortYears);
            const isActive = event.id === activeId;
            const accessibleName = `${event.displayValue}, ${event.label}`;
            return (
              <g
                key={event.id}
                data-testid="timeline-marker"
                data-event-id={event.id}
                data-active={isActive || undefined}
                transform={`translate(${x}, ${axisY})`}
                role="button"
                tabIndex={0}
                aria-label={accessibleName}
                className="cursor-pointer outline-none transition-transform duration-slow ease-standard"
                onMouseEnter={() => setActive(event.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(event.id)}
                onBlur={() => setActive(null)}
                onClick={() => activate(event.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate(event.id);
                  }
                }}
              >
                <title>{accessibleName}</title>
                {isActive ? (
                  <circle
                    r={MARKER_RADIUS + 4}
                    fill="none"
                    strokeWidth={2}
                    className="stroke-ring"
                  />
                ) : null}
                <circle
                  r={MARKER_RADIUS}
                  style={{ fill: eraFill(event.eraCode) }}
                />
                {isActive ? (
                  <text
                    y={-(MARKER_RADIUS + 10)}
                    textAnchor="middle"
                    className="fill-foreground text-xs"
                  >
                    {event.displayValue}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : null}

      {/* V-02: a visible affordance cue for pointer users. */}
      <p className="mt-2 font-mono text-[11px] text-foreground-subtle">
        Hover or focus a marker to preview; select it to open.
      </p>

      {/* Polite live region stub — full coalescing/debounce lands with #68. */}
      <div aria-live="polite" className="sr-only">
        {activeEvent != null
          ? `${activeEvent.displayValue}, ${activeEvent.label}`
          : ""}
      </div>
    </div>
  );
};
