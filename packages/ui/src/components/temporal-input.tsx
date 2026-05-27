"use client";

import * as React from "react";

import { TemporalDisplay } from "./temporal-display";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@repo/ui/lib/utils";
import {
  temporalDataSchema,
  type Era,
  type Precision,
  type TemporalData,
} from "@repo/services/schemas/temporal.js";

export interface TemporalInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  value: TemporalData | null;
  onChange: (value: TemporalData | null) => void;
  label?: string;
  required?: boolean;
  error?: string;
  showPreview?: boolean;
  disabled?: boolean;
}

type TemporalDraft = {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  era: Era;
  precision: Precision;
  uncertainty?: number;
  geological_period?: string;
  geological_epoch?: string;
  cosmological_epoch?: string;
  display_format?: TemporalData["display_format"];
  dating_method?: string;
  confidence_level?: TemporalData["confidence_level"];
  source?: string;
};

const createDraft = (value: TemporalData | null): TemporalDraft => ({
  year: value?.year,
  month: value?.month ?? undefined,
  day: value?.day ?? undefined,
  hour: value?.hour ?? undefined,
  minute: value?.minute ?? undefined,
  second: value?.second ?? undefined,
  era: value?.era ?? "CE",
  precision: value?.precision ?? "exact",
  uncertainty: value?.uncertainty ?? undefined,
  geological_period: value?.geological_period ?? undefined,
  geological_epoch: value?.geological_epoch ?? undefined,
  cosmological_epoch: value?.cosmological_epoch ?? undefined,
  display_format: value?.display_format ?? undefined,
  dating_method: value?.dating_method ?? undefined,
  confidence_level: value?.confidence_level ?? undefined,
  source: value?.source ?? undefined,
});

const maybeParse = (draft: TemporalDraft): TemporalData | null => {
  const result = temporalDataSchema.safeParse(draft);
  return result.success ? result.data : null;
};

const fieldClassName =
  "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20";

export function TemporalInput({
  value,
  onChange,
  label = "Date",
  required = false,
  error,
  showPreview = true,
  disabled = false,
  className,
  ...props
}: TemporalInputProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<TemporalDraft>(() =>
    createDraft(value),
  );
  const [hasInteracted, setHasInteracted] = React.useState(false);

  const candidate = React.useMemo(() => maybeParse(draft), [draft]);
  const previewValue = candidate ?? value;

  const updateDraft = React.useCallback(
    <K extends keyof TemporalDraft>(key: K, nextValue: TemporalDraft[K]) => {
      setHasInteracted(true);
      setDraft((current) => {
        const next = { ...current, [key]: nextValue } as TemporalDraft;

        if (next.era === "CE" || next.era === "BCE") {
          // Keep CE/BCE fields intact.
        } else {
          next.month = undefined;
          next.day = undefined;
          next.hour = undefined;
          next.minute = undefined;
          next.second = undefined;
        }
        return next;
      });
    },
    [],
  );

  const clear = React.useCallback(() => {
    setHasInteracted(true);
    setDraft(createDraft(null));
    onChange(null);
  }, [onChange]);

  const showErrors = hasInteracted && candidate == null;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-foreground-muted"> *</span> : null}
        </label>
        <div className="flex items-center gap-2">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              disabled={disabled}
            >
              Clear
            </Button>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="secondary" disabled={disabled}>
                {previewValue ? (
                  <TemporalDisplay value={previewValue} format="compact" />
                ) : (
                  <span>+ Add date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-152 space-y-4">
              {showPreview && (
                <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                  {candidate ? (
                    <TemporalDisplay
                      value={candidate}
                      format="block"
                      showExact
                    />
                  ) : (
                    <span className="text-foreground-muted">
                      Finish the required fields to preview the date.
                    </span>
                  )}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="block font-medium">Era</span>
                  <select
                    className={cn(fieldClassName, "w-full")}
                    value={draft.era}
                    onChange={(event) =>
                      updateDraft("era", event.target.value as Era)
                    }
                  >
                    {(["CE", "BCE", "KYA", "MYA", "BYA"] as const).map(
                      (era) => (
                        <option key={era} value={era}>
                          {era}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="block font-medium">Precision</span>
                  <select
                    className={cn(fieldClassName, "w-full")}
                    value={draft.precision}
                    onChange={(event) =>
                      updateDraft("precision", event.target.value as Precision)
                    }
                  >
                    {(
                      [
                        "exact",
                        "circa",
                        "approximate",
                        "estimated",
                        "geological",
                      ] as const
                    ).map((precision) => (
                      <option key={precision} value={precision}>
                        {precision}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1 text-sm md:col-span-1">
                  <span className="block font-medium">Year</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={draft.year ?? ""}
                    onChange={(event) =>
                      updateDraft(
                        "year",
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                      )
                    }
                  />
                </label>
                {draft.era === "CE" || draft.era === "BCE" ? (
                  <>
                    <label className="space-y-1 text-sm">
                      <span className="block font-medium">Month</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={12}
                        value={draft.month ?? ""}
                        onChange={(event) =>
                          updateDraft(
                            "month",
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="block font-medium">Day</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={31}
                        value={draft.day ?? ""}
                        onChange={(event) =>
                          updateDraft(
                            "day",
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  </>
                ) : (
                  <div className="md:col-span-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-foreground-muted">
                    Month and day are hidden for prehistoric eras.
                  </div>
                )}
              </div>

              {(draft.era === "CE" || draft.era === "BCE") && (
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Hour</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={23}
                      value={draft.hour ?? ""}
                      onChange={(event) =>
                        updateDraft(
                          "hour",
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Minute</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={59}
                      value={draft.minute ?? ""}
                      onChange={(event) =>
                        updateDraft(
                          "minute",
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Second</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={59}
                      value={draft.second ?? ""}
                      onChange={(event) =>
                        updateDraft(
                          "second",
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {(draft.era === "KYA" ||
                draft.era === "MYA" ||
                draft.era === "BYA") && (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">
                      Uncertainty (years)
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={draft.uncertainty ?? ""}
                      onChange={(event) =>
                        updateDraft(
                          "uncertainty",
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Dating method</span>
                    <Input
                      value={draft.dating_method ?? ""}
                      onChange={(event) =>
                        updateDraft(
                          "dating_method",
                          event.target.value || undefined,
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {(draft.era === "MYA" || draft.era === "BYA") && (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Geological period</span>
                    <Input
                      value={draft.geological_period ?? ""}
                      onChange={(event) =>
                        updateDraft(
                          "geological_period",
                          event.target.value || undefined,
                        )
                      }
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Geological epoch</span>
                    <Input
                      value={draft.geological_epoch ?? ""}
                      onChange={(event) =>
                        updateDraft(
                          "geological_epoch",
                          event.target.value || undefined,
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {draft.era === "BYA" && (
                <label className="space-y-1 text-sm">
                  <span className="block font-medium">Cosmological epoch</span>
                  <Input
                    value={draft.cosmological_epoch ?? ""}
                    onChange={(event) =>
                      updateDraft(
                        "cosmological_epoch",
                        event.target.value || undefined,
                      )
                    }
                  />
                </label>
              )}

              {showErrors && (
                <p className="text-sm text-destructive">
                  {error ??
                    "Complete the required fields to save this temporal value."}
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (candidate != null) {
                      onChange(candidate);
                    }
                    setOpen(false);
                  }}
                >
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {value && showPreview ? (
        <div className="text-sm text-foreground-muted">
          <TemporalDisplay value={value} format="inline" showExact />
        </div>
      ) : (
        <p className="text-xs text-foreground-muted">
          {required ? "Required temporal value." : "Optional temporal value."}
        </p>
      )}
    </div>
  );
}
