"use client";

import * as React from "react";

import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@repo/ui/lib/utils";
import { generateSlug, resolveCollision } from "@repo/services/utils/slug.js";

export interface SlugFieldProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "value" | "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  sourceValue: string;
  mode?: "create" | "edit";
  existingSlugs?: string[];
  debounceMs?: number;
  label?: string;
  description?: string;
  warning?: string;
}

export function SlugField({
  value,
  onChange,
  sourceValue,
  mode = "create",
  existingSlugs = [],
  debounceMs = 300,
  label = "Slug",
  description,
  warning,
  className,
  disabled,
  id,
  ...props
}: SlugFieldProps) {
  const generatedId = React.useId();
  const resolvedId = id ?? generatedId;
  const [isUnlocked, setIsUnlocked] = React.useState(() => mode === "create");
  const [isLinked, setIsLinked] = React.useState(() => mode === "create");
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "create" || !isLinked || isDirty) return;
    if (sourceValue.trim().length === 0) return;

    const timeout = window.setTimeout(() => {
      try {
        const generated = resolveCollision(
          generateSlug(sourceValue),
          existingSlugs,
        );
        if (generated !== value) {
          onChange(generated);
        }
      } catch {
        // Empty/emoji-only titles are expected during intermediate editing.
      }
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [
    debounceMs,
    existingSlugs,
    isDirty,
    isLinked,
    mode,
    onChange,
    sourceValue,
    value,
  ]);

  const regenerate = React.useCallback(() => {
    try {
      const generated = resolveCollision(
        generateSlug(sourceValue),
        existingSlugs,
      );
      onChange(generated);
      setIsLinked(true);
      setIsDirty(false);
    } catch {
      setIsLinked(true);
    }
  }, [existingSlugs, onChange, sourceValue]);

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
    setIsDirty(mode === "create");
    setIsLinked(false);
  };

  const readOnly = mode === "edit" && !isUnlocked;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={resolvedId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        {mode === "edit" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsUnlocked((current) => !current)}
          >
            {isUnlocked ? "Lock slug" : "Edit slug"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={regenerate}
            disabled={sourceValue.trim().length === 0}
          >
            Regenerate
          </Button>
        )}
      </div>
      <Input
        {...props}
        id={resolvedId}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        readOnly={readOnly}
        disabled={disabled}
        className={cn(readOnly && "bg-surface/60", className)}
      />
      <p className="text-xs text-foreground-muted">
        {mode === "edit"
          ? (warning ??
            "Changing the slug will break existing links to this record.")
          : isLinked
            ? (description ??
              "Linked to the source field until you edit it manually.")
            : (description ??
              "Manual edits break the live link until you regenerate.")}
      </p>
    </div>
  );
}
