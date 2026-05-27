import * as React from "react";
import { cn } from "@repo/ui/lib/utils";
import { TemporalService } from "@repo/services/modules/temporal-service.js";
import type {
  Era,
  Precision,
  TemporalData,
} from "@repo/services/schemas/temporal.js";

/**
 * TemporalDisplay — the canonical visual for any date in the admin app.
 *
 * Wraps `TemporalService.formatDisplay` for the screen-reader-readable
 * string and re-builds structured parts (year / era / precision /
 * uncertainty) so each fragment can carry its own visual treatment per
 * the Batch E commitments:
 *
 *  - Era code rendered in a hue-tinted, mono-style typographic accent.
 *    Hue alone isn't load-bearing (the mono cue carries the signal too
 *    for colorblind users).
 *  - Precision modifier ("circa", "approximate", "estimated") inline
 *    in subdued color. `exact` is suppressed unless `showExact` is set.
 *  - Uncertainty ("± 0.5M") inline in subdued color.
 *  - Hairline range bar below when uncertainty > 100yr OR range >
 *    1000yr OR crosses an era boundary (per Batch 4 wireframe decision).
 *  - Tabular numerals enforced on the year span.
 *
 * Geological / cosmological renders defer to `formatDisplay` for the
 * full string; the era code at the end still gets the hue-tinted accent.
 */

export type TemporalDisplayFormat = "inline" | "block" | "compact";

export interface TemporalDisplayProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  value: TemporalData;
  /** Render as a range "<start> – <end> <era>" when supplied. */
  endValue?: TemporalData;
  format?: TemporalDisplayFormat;
  /** Render the "(exact)" modifier explicitly. Default suppresses it. */
  showExact?: boolean;
}

const ERA_COLOR: Record<Era, string> = {
  CE: "text-era-ce",
  BCE: "text-era-bce",
  KYA: "text-era-kya",
  MYA: "text-era-mya",
  BYA: "text-era-bya",
};

const PRECISION_LABEL: Record<Precision, string | null> = {
  exact: "exact",
  circa: "circa",
  approximate: "approximate",
  estimated: "estimated",
  // Geological precision is conveyed by the format itself (label + year).
  geological: null,
};

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
];

const formatUncertainty = (uncertainty: number, era: Era): string => {
  switch (era) {
    case "KYA":
      return `${uncertainty / 1_000}K`;
    case "MYA":
      return `${uncertainty / 1_000_000}M`;
    case "BYA":
      return `${uncertainty / 1_000_000_000}B`;
    case "CE":
    case "BCE":
      return `${uncertainty}`;
  }
};

const formatYear = (year: number): string => String(year);

/**
 * Per-era unit suffix used by the range bar trigger logic and by the
 * compact `±` form. Mirrors `TemporalService.formatScientific` so the
 * primitive and the service agree on uncertainty scale.
 */
const shouldShowRangeBar = (
  value: TemporalData,
  endValue?: TemporalData,
): boolean => {
  if ((value.uncertainty ?? 0) > 100) return true;
  if (endValue && (endValue.uncertainty ?? 0) > 100) return true;
  if (endValue) {
    if (value.era !== endValue.era) return true;
    const span = Math.abs(
      TemporalService.toSortableYears(endValue) -
        TemporalService.toSortableYears(value),
    );
    if (span > 1000) return true;
  }
  return false;
};

const isGeologicalOrCosmological = (t: TemporalData): boolean =>
  t.precision === "geological" ||
  t.display_format === "geological" ||
  t.display_format === "cosmological" ||
  t.geological_period != null ||
  t.geological_epoch != null ||
  t.cosmological_epoch != null;

const formatDateText = (t: TemporalData): string => {
  if (t.era === "CE" || t.era === "BCE") {
    if (t.month != null && t.day != null) {
      return `${MONTH_NAMES[t.month - 1]} ${t.day}, ${formatYear(t.year)}`;
    }
    if (t.month != null) {
      return `${MONTH_NAMES[t.month - 1]} ${formatYear(t.year)}`;
    }
    return formatYear(t.year);
  }
  return formatYear(t.year);
};

const EraCode = ({ era, className }: { era: Era; className?: string }) => (
  <span
    className={cn(
      "font-mono text-[0.85em] uppercase tracking-wide",
      ERA_COLOR[era],
      className,
    )}
  >
    {era}
  </span>
);

const PrecisionModifier = ({
  precision,
  showExact,
}: {
  precision: Precision;
  showExact: boolean;
}) => {
  const label = PRECISION_LABEL[precision];
  if (label == null) return null;
  if (precision === "exact" && !showExact) return null;
  return <span className="text-foreground-muted"> ({label})</span>;
};

const RangeBar = ({ era, endEra }: { era: Era; endEra?: Era }) => (
  <span
    aria-hidden
    className="mt-1 block h-px w-full opacity-60"
    style={{
      // Render via CSS variables so gradients don't depend on dynamic class names.
      backgroundImage: `linear-gradient(to right, var(--color-era-${era.toLowerCase()}), var(--color-era-${(endEra ?? era).toLowerCase()}))`,
    }}
  />
);

/**
 * Renders a single point — used internally for both the standalone point
 * case and as the start/end of a range.
 */
const PointDisplay = ({
  value,
  format,
  showExact,
  hideEra,
  hidePrecision,
}: {
  value: TemporalData;
  format: TemporalDisplayFormat;
  showExact: boolean;
  /** When part of a range that shares an era, the start point's era is hidden. */
  hideEra?: boolean;
  /** Compact + range start: suppress the precision modifier on the leading point. */
  hidePrecision?: boolean;
}) => {
  if (isGeologicalOrCosmological(value)) {
    // Defer to the service for the full string; still hue-accent the era.
    const full = TemporalService.formatDisplay(value);
    const idx = full.lastIndexOf(value.era);
    if (idx === -1) return <span>{full}</span>;
    return (
      <span>
        <span className="text-foreground-muted">{full.slice(0, idx)}</span>
        {!hideEra && <EraCode era={value.era} />}
        <span className="text-foreground-muted">
          {full.slice(idx + value.era.length)}
        </span>
      </span>
    );
  }

  const dateText = formatDateText(value);
  const uncertaintyText =
    value.uncertainty != null && value.uncertainty > 0
      ? formatUncertainty(value.uncertainty, value.era)
      : null;

  if (format === "block") {
    const showEraCode = !hideEra;
    const showPrecisionMod =
      !hidePrecision &&
      PRECISION_LABEL[value.precision] != null &&
      (value.precision !== "exact" || showExact);
    const hasSecondRow = showEraCode || showPrecisionMod;
    return (
      <span className={cn("flex flex-col", hasSecondRow && "gap-0.5")}>
        <span className="tabular-nums">
          {dateText}
          {uncertaintyText && (
            <span className="text-foreground-muted"> ± {uncertaintyText}</span>
          )}
        </span>
        {hasSecondRow && (
          <span className="flex items-center gap-1.5">
            {showEraCode && <EraCode era={value.era} />}
            {showPrecisionMod && (
              <PrecisionModifier
                precision={value.precision}
                showExact={showExact}
              />
            )}
          </span>
        )}
      </span>
    );
  }

  // inline + compact share the same flow; compact suppresses the precision modifier
  return (
    <span className="tabular-nums">
      {dateText}
      {uncertaintyText && (
        <span className="text-foreground-muted"> ± {uncertaintyText}</span>
      )}
      {!hideEra && (
        <>
          {" "}
          <EraCode era={value.era} />
        </>
      )}
      {format !== "compact" && !hidePrecision && (
        <PrecisionModifier precision={value.precision} showExact={showExact} />
      )}
    </span>
  );
};

export const TemporalDisplay = React.forwardRef<
  HTMLSpanElement,
  TemporalDisplayProps
>(
  (
    {
      value,
      endValue,
      format = "inline",
      showExact = false,
      className,
      ...rest
    },
    ref,
  ) => {
    const ariaLabel = endValue
      ? `${TemporalService.formatDisplay(value)} to ${TemporalService.formatDisplay(endValue)}`
      : TemporalService.formatDisplay(value);

    const showBar = shouldShowRangeBar(value, endValue);

    // Range collapses to "<start> – <end> <era>" when both share the era.
    const sharedEra = endValue && value.era === endValue.era;
    // Preserve start precision unless we're in compact mode where brevity wins.
    const hideStartPrecision = Boolean(sharedEra && format === "compact");

    return (
      <span
        ref={ref}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex flex-col items-start font-body text-foreground",
          className,
        )}
        {...rest}
      >
        <span className="inline-flex items-center">
          <PointDisplay
            value={value}
            format={format}
            showExact={showExact}
            hideEra={sharedEra}
            hidePrecision={hideStartPrecision}
          />
          {endValue && (
            <>
              <span aria-hidden className="text-foreground-muted">
                {" – "}
              </span>
              <PointDisplay
                value={endValue}
                format={format}
                showExact={showExact}
              />
            </>
          )}
        </span>
        {showBar && (
          <RangeBar era={value.era} endEra={endValue?.era ?? value.era} />
        )}
      </span>
    );
  },
);
TemporalDisplay.displayName = "TemporalDisplay";
