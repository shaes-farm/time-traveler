"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@repo/ui/lib/utils";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Slider } from "@repo/ui/components/slider";
import { Label } from "@repo/ui/components/label";
import { ChipInput } from "@repo/ui/components/chip-input";

// ---- Filter group type definitions ----------------------------------------

export interface FilterCheckboxOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterCheckboxGroup {
  type: "checkbox";
  id: string;
  label: string;
  options: FilterCheckboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export interface FilterRangeGroup {
  type: "range";
  id: string;
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
}

export type RadioValue = "yes" | "no" | "any";

export interface FilterRadioGroup {
  type: "radio";
  id: string;
  label: string;
  value: RadioValue;
  onChange: (value: RadioValue) => void;
  yesLabel?: string;
  noLabel?: string;
}

export interface FilterComboboxOption {
  value: string;
  label: string;
}

/**
 * Single-select dropdown group (e.g. the stories list's perspective-character
 * filter). `value` of null means "no selection" — the group renders an "any"
 * option (labelled by `placeholder`) at the top.
 */
export interface FilterComboboxGroup {
  type: "combobox";
  id: string;
  label: string;
  value: string | null;
  options: FilterComboboxOption[];
  onChange: (value: string | null) => void;
  /** Label for the null/"any" option. Defaults to "Any". */
  placeholder?: string;
}

/**
 * Free-form tag entry group (e.g. the stories list's tag filter). Matching is
 * ANY-of the entered tags; the group is active whenever at least one tag is set.
 */
export interface FilterTagsGroup {
  type: "tags";
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export type FilterGroup =
  | FilterCheckboxGroup
  | FilterRangeGroup
  | FilterRadioGroup
  | FilterComboboxGroup
  | FilterTagsGroup;

// ---- FilterRail component --------------------------------------------------

export interface FilterRailProps {
  groups: FilterGroup[];
  onClearAll?: () => void;
  className?: string;
}

function CheckboxGroupSection({ group }: { group: FilterCheckboxGroup }) {
  function toggle(optionValue: string) {
    if (group.value.includes(optionValue)) {
      group.onChange(group.value.filter((v) => v !== optionValue));
    } else {
      group.onChange([...group.value, optionValue]);
    }
  }

  return (
    <div className="space-y-2">
      {group.options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <Checkbox
            id={`${group.id}-${option.value}`}
            checked={group.value.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
          />
          <Label
            htmlFor={`${group.id}-${option.value}`}
            className="flex flex-1 cursor-pointer items-center justify-between text-sm font-normal text-foreground"
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className="text-xs text-foreground-muted">
                {option.count}
              </span>
            )}
          </Label>
        </div>
      ))}
    </div>
  );
}

function RangeGroupSection({ group }: { group: FilterRangeGroup }) {
  const fmt = group.formatLabel ?? String;

  return (
    <div className="space-y-3">
      <Slider
        min={group.min}
        max={group.max}
        step={1}
        value={group.value}
        onValueChange={(v) => group.onChange(v as [number, number])}
      />
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>{fmt(group.value[0])}</span>
        <span>{fmt(group.value[1])}</span>
      </div>
    </div>
  );
}

function RadioGroupSection({ group }: { group: FilterRadioGroup }) {
  const options: { value: RadioValue; label: string }[] = [
    { value: "yes", label: group.yesLabel ?? "Yes" },
    { value: "no", label: group.noLabel ?? "No" },
    { value: "any", label: "Any" },
  ];

  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => group.onChange(option.value)}
          className={cn(
            "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            group.value === option.value
              ? "bg-surface-2 text-foreground"
              : "text-foreground-muted hover:bg-surface hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ComboboxGroupSection({ group }: { group: FilterComboboxGroup }) {
  return (
    <select
      id={`${group.id}-select`}
      value={group.value ?? ""}
      onChange={(e) =>
        group.onChange(e.target.value === "" ? null : e.target.value)
      }
      aria-label={group.label}
      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="">{group.placeholder ?? "Any"}</option>
      {group.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TagsGroupSection({ group }: { group: FilterTagsGroup }) {
  return (
    <ChipInput
      value={group.value}
      onChange={group.onChange}
      placeholder={group.placeholder ?? "Add tag"}
      aria-label={group.label}
    />
  );
}

// ---- Main export -----------------------------------------------------------

export function FilterRail({ groups, onClearAll, className }: FilterRailProps) {
  const hasActiveFilters = groups.some((g) => {
    if (g.type === "checkbox") return g.value.length > 0;
    if (g.type === "range") return g.value[0] !== g.min || g.value[1] !== g.max;
    if (g.type === "radio") return g.value !== "any";
    if (g.type === "combobox") return g.value !== null && g.value !== "";
    if (g.type === "tags") return g.value.length > 0;
    return false;
  });

  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col gap-0 border-l border-border",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Filters
        </span>
        {hasActiveFilters && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-foreground-muted transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-col divide-y divide-border">
        {groups.map((group) => (
          <div key={group.id} className="px-4 py-4">
            <p className="mb-3 text-xs font-medium text-foreground-muted">
              {group.label}
            </p>
            {group.type === "checkbox" && (
              <CheckboxGroupSection group={group} />
            )}
            {group.type === "range" && <RangeGroupSection group={group} />}
            {group.type === "radio" && <RadioGroupSection group={group} />}
            {group.type === "combobox" && (
              <ComboboxGroupSection group={group} />
            )}
            {group.type === "tags" && <TagsGroupSection group={group} />}
          </div>
        ))}
      </div>
    </aside>
  );
}
