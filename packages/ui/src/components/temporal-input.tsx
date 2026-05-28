"use client";

import * as React from "react";

import {
  ERA_COLOR,
  PRECISION_LABEL,
  TemporalDisplay,
} from "./temporal-display";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Separator } from "./separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@repo/ui/lib/utils";
import {
  temporalDataSchema,
  type ConfidenceLevel,
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
  dating_method?: string;
  confidence_level?: ConfidenceLevel;
  source?: string;
};

const ERAS = ["CE", "BCE", "KYA", "MYA", "BYA"] as const;
const PRECISIONS: Precision[] = [
  "exact",
  "circa",
  "approximate",
  "estimated",
  "geological",
];
const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["high", "medium", "low"];

const ERA_DESCRIPTION: Record<Era, string> = {
  CE: "Common Era",
  BCE: "Before Common Era",
  KYA: "Thousand years ago",
  MYA: "Million years ago",
  BYA: "Billion years ago",
};

const isPrehistoric = (era: Era) =>
  era === "KYA" || era === "MYA" || era === "BYA";

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
  dating_method: value?.dating_method ?? undefined,
  confidence_level: value?.confidence_level ?? undefined,
  source: value?.source ?? undefined,
});

const maybeParse = (draft: TemporalDraft): TemporalData | null => {
  const result = temporalDataSchema.safeParse(draft);
  return result.success ? result.data : null;
};

type FieldErrors = Partial<Record<"year" | "era", string>>;

interface ValidationState {
  fieldErrors: FieldErrors;
  /**
   * First non-year/era issue, formatted as "field: message". Used by the
   * catch-all error row so users see *what* failed when validation rejects a
   * field that has no inline error slot of its own (month/day/hour/etc.).
   */
  genericError: string | null;
}

const getValidationState = (draft: TemporalDraft): ValidationState => {
  const result = temporalDataSchema.safeParse(draft);
  if (result.success) return { fieldErrors: {}, genericError: null };
  const fieldErrors: FieldErrors = {};
  let genericError: string | null = null;
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (key === "year" && !fieldErrors.year) {
      fieldErrors.year = issue.message;
    } else if (key === "era" && !fieldErrors.era) {
      fieldErrors.era = issue.message;
    } else if (genericError == null) {
      genericError =
        typeof key === "string" ? `${key}: ${issue.message}` : issue.message;
    }
  }
  return { fieldErrors, genericError };
};

const numericInputClass = "tabular-nums";

// ─── DisclosureSection (native <details> with rotating ▸) ────────────────────

function DisclosureSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground">
        <span
          aria-hidden
          className="inline-block w-3 text-center transition-transform group-open:rotate-90"
        >
          ▸
        </span>
        {title}
      </summary>
      <div className="mt-3 space-y-3 pl-4">{children}</div>
    </details>
  );
}

// ─── FieldError ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

// ─── EraSelect ───────────────────────────────────────────────────────────────

function EraSelectField({
  value,
  onChange,
  disabled,
}: {
  value: Era;
  onChange: (v: Era) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Era)}
      disabled={disabled}
    >
      <SelectTrigger aria-label="Era">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ERAS.map((era) => (
          <SelectItem key={era} value={era}>
            <span className="flex items-center gap-2">
              <span className={cn("font-mono text-xs", ERA_COLOR[era])}>
                {era}
              </span>
              <span className="text-foreground-muted">
                {ERA_DESCRIPTION[era]}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── PrecisionSelect ─────────────────────────────────────────────────────────

function PrecisionSelectField({
  value,
  onChange,
  disabled,
}: {
  value: Precision;
  onChange: (v: Precision) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Precision)}
      disabled={disabled}
    >
      <SelectTrigger aria-label="Precision">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRECISIONS.map((p) => (
          <SelectItem key={p} value={p}>
            <span className="capitalize">{PRECISION_LABEL[p] ?? p}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── ConfidenceSelect ────────────────────────────────────────────────────────

function ConfidenceSelectField({
  value,
  onChange,
}: {
  value: ConfidenceLevel | undefined;
  onChange: (v: ConfidenceLevel | undefined) => void;
}) {
  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => onChange(v as ConfidenceLevel)}
    >
      <SelectTrigger aria-label="Confidence">
        <SelectValue placeholder="(none)" />
      </SelectTrigger>
      <SelectContent>
        {CONFIDENCE_LEVELS.map((c) => (
          <SelectItem key={c} value={c}>
            <span className="capitalize">{c}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Dating method & source disclosure (shared) ──────────────────────────────

function DatingMethodSourceDisclosure({
  draft,
  updateDraft,
}: {
  draft: TemporalDraft;
  updateDraft: <K extends keyof TemporalDraft>(
    key: K,
    value: TemporalDraft[K],
  ) => void;
}) {
  return (
    <DisclosureSection title="Dating method & source (optional)">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Method</span>
          <Input
            placeholder="(none)"
            value={draft.dating_method ?? ""}
            onChange={(e) =>
              updateDraft("dating_method", e.target.value || undefined)
            }
          />
        </label>
        <div className="space-y-1 text-sm">
          <span className="block font-medium">Confidence</span>
          <ConfidenceSelectField
            value={draft.confidence_level}
            onChange={(v) => updateDraft("confidence_level", v)}
          />
        </div>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="block font-medium">Source</span>
        <Input
          placeholder="(none)"
          value={draft.source ?? ""}
          onChange={(e) => updateDraft("source", e.target.value || undefined)}
        />
      </label>
    </DisclosureSection>
  );
}

// ─── Geological context (always-visible for prehistoric) ─────────────────────

function GeologicalContext({
  draft,
  updateDraft,
}: {
  draft: TemporalDraft;
  updateDraft: <K extends keyof TemporalDraft>(
    key: K,
    value: TemporalDraft[K],
  ) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Geological context</p>
      <div className="space-y-2">
        <label className="grid grid-cols-[8rem_1fr] items-center gap-3 text-sm">
          <span className="text-foreground-muted">Period</span>
          <Input
            placeholder="(none)"
            value={draft.geological_period ?? ""}
            onChange={(e) =>
              updateDraft("geological_period", e.target.value || undefined)
            }
          />
        </label>
        <label className="grid grid-cols-[8rem_1fr] items-center gap-3 text-sm">
          <span className="text-foreground-muted">Epoch</span>
          <Input
            placeholder="(none)"
            value={draft.geological_epoch ?? ""}
            onChange={(e) =>
              updateDraft("geological_epoch", e.target.value || undefined)
            }
          />
        </label>
        {(draft.era === "MYA" || draft.era === "BYA") && (
          <label className="grid grid-cols-[8rem_1fr] items-center gap-3 text-sm">
            <span className="text-foreground-muted">Cosmological</span>
            <Input
              placeholder="(none)"
              value={draft.cosmological_epoch ?? ""}
              onChange={(e) =>
                updateDraft("cosmological_epoch", e.target.value || undefined)
              }
            />
          </label>
        )}
      </div>
    </div>
  );
}

// ─── Main TemporalInput component ────────────────────────────────────────────

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
  const [eraChangeNotice, setEraChangeNotice] = React.useState<string | null>(
    null,
  );
  const committedRef = React.useRef<TemporalData | null>(value);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      // Snapshot committed value + reset draft each time the popover opens,
      // so cancel/discard always falls back to the parent's last-saved value.
      if (nextOpen) {
        setDraft(createDraft(value));
        setHasInteracted(false);
        setEraChangeNotice(null);
        committedRef.current = value;
      }
      setOpen(nextOpen);
    },
    [value],
  );

  const candidate = React.useMemo(() => maybeParse(draft), [draft]);
  const previewValue = candidate ?? value;
  const { fieldErrors, genericError } = React.useMemo(
    () =>
      hasInteracted
        ? getValidationState(draft)
        : { fieldErrors: {} as FieldErrors, genericError: null },
    [draft, hasInteracted],
  );

  const updateDraft = React.useCallback(
    <K extends keyof TemporalDraft>(key: K, nextValue: TemporalDraft[K]) => {
      setHasInteracted(true);
      setEraChangeNotice(null);
      setDraft((current) => {
        const next = { ...current, [key]: nextValue } as TemporalDraft;
        if (key === "era") {
          const newEra = nextValue as Era;
          if (isPrehistoric(newEra)) {
            const hadSubYearData =
              current.month != null ||
              current.day != null ||
              current.hour != null ||
              current.minute != null ||
              current.second != null;
            next.month = undefined;
            next.day = undefined;
            next.hour = undefined;
            next.minute = undefined;
            next.second = undefined;
            if (hadSubYearData) {
              setEraChangeNotice(
                `Month, day, and time were cleared for ${newEra} dates.`,
              );
            }
          }
          // Clear cosmological_epoch when leaving BYA/MYA → KYA (KYA can't have it)
          if (newEra === "KYA") {
            next.cosmological_epoch = undefined;
          }
        }
        return next;
      });
    },
    [],
  );

  const handleYearChange = React.useCallback(
    (raw: string) => {
      if (raw === "") {
        updateDraft("year", undefined);
        return;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        // Reject non-integer entries; field stays at last valid value.
        setHasInteracted(true);
        return;
      }
      updateDraft("year", parsed);
    },
    [updateDraft],
  );

  const clear = React.useCallback(() => {
    setHasInteracted(true);
    setDraft(createDraft(null));
    onChange(null);
  }, [onChange]);

  const cancel = React.useCallback(() => {
    setDraft(createDraft(committedRef.current));
    setHasInteracted(false);
    setEraChangeNotice(null);
    setOpen(false);
  }, []);

  const apply = React.useCallback(() => {
    setHasInteracted(true);
    if (candidate != null) {
      onChange(candidate);
      committedRef.current = candidate;
      setOpen(false);
    }
    // If parse failed, leave popover open so field errors surface.
  }, [candidate, onChange]);

  const showPrecisionWarning =
    isPrehistoric(draft.era) && draft.precision === "exact";

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
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button type="button" variant="secondary" disabled={disabled}>
                {previewValue ? (
                  <TemporalDisplay value={previewValue} format="compact" />
                ) : (
                  <span>+ Add date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(36rem,calc(100vw-2rem))] space-y-4">
              {/* Preview row */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                <span className="font-medium text-foreground-muted">
                  Preview:
                </span>
                {candidate ? (
                  <TemporalDisplay
                    value={candidate}
                    format="inline"
                    showExact
                  />
                ) : (
                  <span className="italic text-foreground-muted">
                    Finish required fields to preview.
                  </span>
                )}
              </div>
              <Separator />

              {/* Era + Precision row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-sm">
                  <span className="block font-medium">Era</span>
                  <EraSelectField
                    value={draft.era}
                    onChange={(v) => updateDraft("era", v)}
                  />
                  <FieldError message={fieldErrors.era} />
                </div>
                <div className="space-y-1 text-sm">
                  <span className="block font-medium">Precision</span>
                  <PrecisionSelectField
                    value={draft.precision}
                    onChange={(v) => updateDraft("precision", v)}
                  />
                  {showPrecisionWarning && (
                    <p className="text-xs text-foreground-muted">
                      Exact precision is rarely honest at the {draft.era} scale
                      — consider “approximate” or “estimated”.
                    </p>
                  )}
                </div>
              </div>

              {/* Year + (Month/Day for CE/BCE) or (Uncertainty for prehistoric) */}
              {draft.era === "CE" || draft.era === "BCE" ? (
                <div className="grid grid-cols-3 gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Year</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      className={numericInputClass}
                      value={draft.year ?? ""}
                      onChange={(e) => handleYearChange(e.target.value)}
                      aria-invalid={fieldErrors.year ? true : undefined}
                    />
                    <FieldError message={fieldErrors.year} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Month</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={12}
                      className={numericInputClass}
                      value={draft.month ?? ""}
                      onChange={(e) =>
                        updateDraft(
                          "month",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
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
                      className={numericInputClass}
                      value={draft.day ?? ""}
                      onChange={(e) =>
                        updateDraft(
                          "day",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">Year</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      className={numericInputClass}
                      value={draft.year ?? ""}
                      onChange={(e) => handleYearChange(e.target.value)}
                      aria-invalid={fieldErrors.year ? true : undefined}
                    />
                    <FieldError message={fieldErrors.year} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="block font-medium">
                      Uncertainty (± years)
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      className={numericInputClass}
                      value={draft.uncertainty ?? ""}
                      onChange={(e) =>
                        updateDraft(
                          "uncertainty",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {eraChangeNotice && (
                <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-foreground-muted">
                  {eraChangeNotice}
                </p>
              )}

              {/* CE/BCE disclosures: Time of day, Uncertainty, Dating method & source */}
              {(draft.era === "CE" || draft.era === "BCE") && (
                <div className="space-y-3">
                  <DisclosureSection title="Time of day (optional)">
                    <div className="grid grid-cols-3 gap-3">
                      <label className="space-y-1 text-sm">
                        <span className="block font-medium">Hour</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={23}
                          className={numericInputClass}
                          value={draft.hour ?? ""}
                          onChange={(e) =>
                            updateDraft(
                              "hour",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
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
                          className={numericInputClass}
                          value={draft.minute ?? ""}
                          onChange={(e) =>
                            updateDraft(
                              "minute",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
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
                          className={numericInputClass}
                          value={draft.second ?? ""}
                          onChange={(e) =>
                            updateDraft(
                              "second",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                            )
                          }
                        />
                      </label>
                    </div>
                  </DisclosureSection>

                  <DisclosureSection title="Uncertainty (optional)">
                    <label className="block space-y-1 text-sm">
                      <span className="block font-medium">
                        Uncertainty (± years)
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        className={numericInputClass}
                        value={draft.uncertainty ?? ""}
                        onChange={(e) =>
                          updateDraft(
                            "uncertainty",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    </label>
                  </DisclosureSection>

                  <DatingMethodSourceDisclosure
                    draft={draft}
                    updateDraft={updateDraft}
                  />
                </div>
              )}

              {/* Prehistoric: Geological context always shown; dating-method disclosure */}
              {isPrehistoric(draft.era) && (
                <div className="space-y-4">
                  <GeologicalContext draft={draft} updateDraft={updateDraft} />
                  <DatingMethodSourceDisclosure
                    draft={draft}
                    updateDraft={updateDraft}
                  />
                </div>
              )}

              {/* Catch-all error — surfaces the first non-year/era schema
                  issue so users can recover (e.g. "day: ... invalid for month"). */}
              {hasInteracted &&
                candidate == null &&
                !fieldErrors.year &&
                !fieldErrors.era && (
                  <p className="text-sm text-destructive">
                    {error ??
                      genericError ??
                      "Complete the required fields to save this temporal value."}
                  </p>
                )}

              <Separator />

              {/* Footer */}
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={cancel}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={apply}
                  disabled={candidate == null}
                >
                  Apply
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
