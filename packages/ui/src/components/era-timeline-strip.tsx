"use client";

import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";

/**
 * EraTimelineStrip — the landing page's interactive all-of-time strip
 * (docs/design/public/08-high-fidelity/Time_Traveler_Landing_Final.html).
 *
 * Plots markers from the Big Bang to today on a single horizontal axis with a
 * logarithmic/linear scale toggle. Log mode also renders the era bands
 * (BYA / MYA / KYA / CE-BCE) as tinted backdrops. The caption under the strip
 * explains the active scale — and why the reader defaults to logarithmic.
 *
 * Era hues always travel with their mono era-code text (band labels, marker
 * values), never color alone (accessibility-spec §6). The dot/label colors use
 * a static era→class map so Tailwind can see every class at build time.
 */
export type EraScale = "log" | "linear";
export type EraCode = "BYA" | "MYA" | "KYA" | "BCE" | "CE";

export interface EraTimelineMarker {
  name: string;
  /** Years before present; clamped to ≥1 by the scale math. */
  yearsAgo: number;
  era: EraCode;
  /** Formatted display value, e.g. "13.8 BYA" or "2560 BCE". */
  value: string;
  /** Alternate labels above/below the axis so neighbors don't collide. */
  labelPosition: "above" | "below";
}

/** Full span of the plotted axis — Big Bang to present. */
const MAX_YEARS_AGO = 13.8e9;
/** Horizontal padding: markers span 7%–92% of the strip width. */
const LEFT_PAD = 7;
const SPAN = 85;

/**
 * Horizontal position (% from left) of a moment `yearsAgo` before present.
 * Log scale gives each power of ten equal width; linear crushes all of human
 * history into the right edge — which is the point the toggle demonstrates.
 */
export const computeMarkerLeft = (
  scale: EraScale,
  yearsAgo: number,
): number => {
  const ya = Math.max(yearsAgo, 1);
  const fraction =
    scale === "log"
      ? Math.log10(ya) / Math.log10(MAX_YEARS_AGO)
      : ya / MAX_YEARS_AGO;
  return LEFT_PAD + (1 - fraction) * SPAN;
};

export interface EraTimelineBand {
  code: string;
  era: EraCode;
  /** % offsets on the log axis. */
  left: number;
  width: number;
}

/** The four era bands rendered behind the axis in log mode. */
export const computeLogBands = (): EraTimelineBand[] => {
  const defs: { code: string; era: EraCode; hi: number; lo: number }[] = [
    { code: "BYA", era: "BYA", hi: 13.8e9, lo: 1e9 },
    { code: "MYA", era: "MYA", hi: 1e9, lo: 1e6 },
    { code: "KYA", era: "KYA", hi: 1e6, lo: 1e3 },
    { code: "CE / BCE", era: "CE", hi: 1e3, lo: 1 },
  ];
  return defs.map(({ code, era, hi, lo }) => {
    const left = computeMarkerLeft("log", hi);
    return { code, era, left, width: computeMarkerLeft("log", lo) - left };
  });
};

const DEFAULT_MARKERS: EraTimelineMarker[] = [
  {
    name: "Big Bang",
    yearsAgo: 13.8e9,
    era: "BYA",
    value: "13.8 BYA",
    labelPosition: "above",
  },
  {
    name: "Earth forms",
    yearsAgo: 4.54e9,
    era: "BYA",
    value: "4.54 BYA",
    labelPosition: "below",
  },
  {
    name: "Dinosaurs end",
    yearsAgo: 66e6,
    era: "MYA",
    value: "66 MYA",
    labelPosition: "above",
  },
  {
    name: "First humans",
    yearsAgo: 3e5,
    era: "KYA",
    value: "300 KYA",
    labelPosition: "below",
  },
  {
    name: "Great Pyramid",
    yearsAgo: 4586,
    era: "BCE",
    value: "2560 BCE",
    labelPosition: "above",
  },
  {
    name: "Today",
    yearsAgo: 1,
    era: "CE",
    value: "2026 CE",
    labelPosition: "below",
  },
];

const DEFAULT_CAPTIONS: Record<EraScale, string> = {
  log: "Logarithmic scale — each step is 10× deeper in time. All of recorded human history is the bright sliver at the far right.",
  linear:
    "On a linear scale, 13.8 billion years crushes every human event into the final sliver — which is exactly why the reader defaults to logarithmic.",
};

/* Static era→class maps — Tailwind must see literal class names. */
const ERA_TEXT: Record<EraCode, string> = {
  BYA: "text-era-bya",
  MYA: "text-era-mya",
  KYA: "text-era-kya",
  BCE: "text-era-bce",
  CE: "text-era-ce",
};
const ERA_BG: Record<EraCode, string> = {
  BYA: "bg-era-bya",
  MYA: "bg-era-mya",
  KYA: "bg-era-kya",
  BCE: "bg-era-bce",
  CE: "bg-era-ce",
};
const ERA_BAND: Record<EraCode, string> = {
  BYA: "bg-era-bya/10 border-era-bya",
  MYA: "bg-era-mya/10 border-era-mya",
  KYA: "bg-era-kya/10 border-era-kya",
  BCE: "bg-era-bce/10 border-era-bce",
  CE: "bg-era-ce/10 border-era-ce",
};

export interface EraTimelineStripProps {
  /** Moments plotted on the axis. Defaults to the canonical six. */
  markers?: EraTimelineMarker[];
  defaultScale?: EraScale;
  /** Mono kicker above the strip. */
  kicker?: string;
  /** Per-scale explanation shown under the strip. */
  captions?: Record<EraScale, string>;
  className?: string;
}

export const EraTimelineStrip = ({
  markers = DEFAULT_MARKERS,
  defaultScale = "log",
  kicker = "We refuse the preface",
  captions = DEFAULT_CAPTIONS,
  className,
}: EraTimelineStripProps) => {
  const [scale, setScale] = useState<EraScale>(defaultScale);
  const isLog = scale === "log";

  const toggleClass = (active: boolean) =>
    cn(
      "px-4 py-2 font-mono text-xs transition-colors duration-fast ease-standard",
      active
        ? "bg-era-mya/20 text-era-mya"
        : "text-foreground-subtle hover:text-foreground-muted",
    );

  return (
    <div className={className}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="font-mono text-xs uppercase tracking-widest text-foreground-subtle">
          {kicker}
        </span>
        <div
          role="group"
          aria-label="Timeline scale"
          className="inline-flex overflow-hidden rounded-md border border-border"
        >
          <button
            type="button"
            aria-pressed={isLog}
            onClick={() => setScale("log")}
            className={toggleClass(isLog)}
          >
            Logarithmic
          </button>
          <button
            type="button"
            aria-pressed={!isLog}
            onClick={() => setScale("linear")}
            className={toggleClass(!isLog)}
          >
            Linear
          </button>
        </div>
      </div>

      <div className="relative h-[250px] overflow-hidden rounded-lg border border-border-muted bg-background">
        {isLog ? (
          <div className="absolute inset-0" data-testid="era-bands">
            {computeLogBands().map((band) => (
              <div
                key={band.code}
                className={cn(
                  "absolute inset-y-0 border-l",
                  ERA_BAND[band.era],
                )}
                style={{ left: `${band.left}%`, width: `${band.width}%` }}
              >
                <span
                  className={cn(
                    "absolute bottom-2 left-2 font-mono text-[11px]",
                    ERA_TEXT[band.era],
                  )}
                >
                  {band.code}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {/* axis midline */}
        <div
          className="absolute inset-x-0 top-1/2 h-px bg-border"
          aria-hidden
        />

        {markers.map((marker) => {
          const above = marker.labelPosition === "above";
          const label = (
            <div className="whitespace-nowrap text-center">
              <div
                className={cn("font-mono text-[11px]", ERA_TEXT[marker.era])}
              >
                {marker.value}
              </div>
              <div className="text-xs text-foreground">{marker.name}</div>
            </div>
          );
          const stem = (
            <div
              aria-hidden
              className={cn("h-6 w-px opacity-45", ERA_BG[marker.era])}
            />
          );
          return (
            <div
              key={marker.name}
              className="absolute inset-y-0 flex -translate-x-1/2 flex-col items-center transition-[left] duration-slow ease-standard"
              style={{
                left: `${computeMarkerLeft(scale, marker.yearsAgo).toFixed(2)}%`,
              }}
            >
              <div className="flex flex-1 flex-col items-center justify-end gap-1.5 pb-2">
                {above ? (
                  <>
                    {label}
                    {stem}
                  </>
                ) : null}
              </div>
              <div
                className={cn(
                  "h-3 w-3 flex-none rounded-full ring-4 ring-background",
                  ERA_BG[marker.era],
                )}
              />
              <div className="flex flex-1 flex-col items-center justify-start gap-1.5 pt-2">
                {above ? null : (
                  <>
                    {stem}
                    {label}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="mt-4 max-w-[820px] text-sm leading-relaxed text-foreground-muted"
      >
        {captions[scale]}
      </p>
    </div>
  );
};
