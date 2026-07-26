"use client";

import { useId } from "react";
import { cn } from "@repo/ui/lib/utils";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import type { ViewMode } from "@repo/ui/stores";

/**
 * ScaleModeControl — the log/linear scale toggle for the reader timeline (#67).
 *
 * Modelled as a **radio group**, not a toggle button: log and linear are
 * mutually exclusive, so each option carries `aria-checked` (via the Radix
 * primitive), never `aria-pressed`
 * ([accessibility-spec §6], [mid-fidelity 03 §controls]). Labels are the precise
 * domain terms "Logarithmic" / "Linear", each paired with plain-language helper
 * text so a general reader can predict the effect (validation V-03).
 *
 * Controlled: the parent owns the {@link ViewMode} (canonically the `?scale=`
 * query per interaction spec §5.1) and re-runs the renderer's position mapping
 * on change — this control holds no mode state of its own. Preserving the
 * `viewportCenter` temporal anchor across the swap needs no state here: the
 * anchor is a mode-agnostic `sortYears` the scale consumes symmetrically
 * (issue #67 comment, [implementation-risks R-66a]).
 *
 * A polite live region announces the new mode immediately, since toggling scale
 * is a discrete, intentional action ([accessibility-spec §4.1]). The visible
 * label uses `cross-fade` for the content swap; that class collapses to an
 * instant redraw under `prefers-reduced-motion` (spec §10.3), so no bespoke
 * reduced-motion handling is needed.
 */

interface ScaleOption {
  readonly value: ViewMode;
  readonly label: string;
  readonly helper: string;
}

/** The two options, in reading order (logarithmic is the default/first). */
const OPTIONS: readonly ScaleOption[] = [
  {
    value: "logarithmic",
    label: "Logarithmic",
    helper: "Compressed for deep time",
  },
  { value: "linear", label: "Linear", helper: "Even spacing" },
];

/** Immediate SR announcement text for a mode (accessibility-spec §4.1). */
function announce(mode: ViewMode): string {
  return mode === "linear" ? "Linear scale" : "Logarithmic scale";
}

export interface ScaleModeControlProps {
  /** Currently selected mode (owned by the parent / `?scale=`). */
  value: ViewMode;
  /** Fired with the newly selected mode. */
  onValueChange: (mode: ViewMode) => void;
  /** Accessible group name. */
  ariaLabel?: string;
  className?: string;
}

export const ScaleModeControl = ({
  value,
  onValueChange,
  ariaLabel = "Time scale",
  className,
}: ScaleModeControlProps) => {
  const groupId = useId();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <RadioGroup
        value={value}
        onValueChange={(next) => onValueChange(next as ViewMode)}
        aria-label={ariaLabel}
        className="flex gap-4 rounded-md bg-surface p-2"
      >
        {OPTIONS.map((option) => {
          const itemId = `${groupId}-${option.value}`;
          const helperId = `${itemId}-helper`;
          return (
            <div key={option.value} className="flex items-start gap-2">
              <RadioGroupItem
                id={itemId}
                value={option.value}
                aria-describedby={helperId}
                className="mt-0.5"
              />
              {/* Only the title is inside the label, so the radio's accessible
                  name is the term alone; the plain-language helper is wired as a
                  description via `aria-describedby` (V-03). */}
              <div className="flex flex-col">
                <label
                  htmlFor={itemId}
                  className="cross-fade cursor-pointer select-none text-sm font-medium text-foreground"
                >
                  {option.label}
                </label>
                <span id={helperId} className="text-xs text-foreground-muted">
                  {option.helper}
                </span>
              </div>
            </div>
          );
        })}
      </RadioGroup>

      {/* Immediate, discrete-action announcement of the active mode. */}
      <div aria-live="polite" className="sr-only">
        {announce(value)}
      </div>
    </div>
  );
};
