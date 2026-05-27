"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@repo/ui/lib/utils";

export interface ChipInputProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "value" | "onChange"
> {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  description?: string;
  allowDuplicates?: boolean;
}

const normalizeChip = (chip: string): string => chip.trim();

const sameChip = (left: string, right: string): boolean =>
  left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;

export const ChipInput = React.forwardRef<HTMLInputElement, ChipInputProps>(
  (
    {
      value,
      onChange,
      label,
      description,
      allowDuplicates = false,
      className,
      id,
      onKeyDown,
      onPaste,
      placeholder = "Add item",
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = React.useState("");
    const [announcement, setAnnouncement] = React.useState("");
    const inputId = React.useId();
    const helperId = React.useId();
    const resolvedId = id ?? inputId;
    const filteredDescription = description
      ? `${resolvedId}-description`
      : undefined;

    const announce = React.useCallback((message: string) => {
      setAnnouncement(message);
    }, []);

    const commitChips = React.useCallback(
      (next: string[], message?: string) => {
        onChange(next);
        if (message) {
          announce(message);
        }
      },
      [announce, onChange],
    );

    const addFromText = React.useCallback(
      (text: string) => {
        const chips = text.split(",").map(normalizeChip).filter(Boolean);

        if (chips.length === 0) return;

        const next = [...value];
        let added = 0;

        for (const chip of chips) {
          const exists = next.some((entry) => sameChip(entry, chip));
          if (!allowDuplicates && exists) continue;
          next.push(chip);
          added += 1;
        }

        if (added > 0) {
          commitChips(next, `${added} chip${added === 1 ? "" : "s"} added`);
        }
      },
      [allowDuplicates, commitChips, value],
    );

    const removeChip = React.useCallback(
      (chip: string) => {
        commitChips(
          value.filter((entry) => entry !== chip),
          `${chip} removed`,
        );
      },
      [commitChips, value],
    );

    const handleKeyDown = React.useCallback<
      React.KeyboardEventHandler<HTMLInputElement>
    >(
      (event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;

        if (event.key === "Enter" || event.key === ",") {
          event.preventDefault();
          const nextValue = normalizeChip(inputValue);
          if (nextValue.length > 0) {
            addFromText(nextValue);
            setInputValue("");
          }
          return;
        }

        if (
          event.key === "Backspace" &&
          inputValue.length === 0 &&
          value.length > 0
        ) {
          event.preventDefault();
          const next = value.slice(0, -1);
          const removed = value[value.length - 1];
          if (removed != null) {
            commitChips(next, `${removed} removed`);
          }
        }
      },
      [addFromText, commitChips, inputValue, onKeyDown, value],
    );

    const handlePaste = React.useCallback<
      React.ClipboardEventHandler<HTMLInputElement>
    >(
      (event) => {
        onPaste?.(event);
        if (event.defaultPrevented) return;

        const pasted = event.clipboardData.getData("text");
        if (!pasted.includes(",")) return;
        event.preventDefault();
        addFromText(pasted);
      },
      [addFromText, onPaste],
    );

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={resolvedId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2",
            className,
          )}
        >
          {value.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1 text-sm text-foreground"
            >
              <span>{chip}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 rounded-full p-0"
                onClick={() => removeChip(chip)}
                aria-label={`Remove ${chip}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </span>
          ))}
          <Input
            {...props}
            ref={ref}
            id={resolvedId}
            value={inputValue}
            placeholder={placeholder}
            className={cn(
              "h-auto min-h-7 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0",
              props.disabled && "cursor-not-allowed",
            )}
            aria-describedby={
              description ? filteredDescription : props["aria-describedby"]
            }
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
        </div>
        {description && (
          <p id={filteredDescription} className="text-xs text-foreground-muted">
            {description}
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <span id={helperId} className="sr-only">
          Chip input
        </span>
      </div>
    );
  },
);
ChipInput.displayName = "ChipInput";
