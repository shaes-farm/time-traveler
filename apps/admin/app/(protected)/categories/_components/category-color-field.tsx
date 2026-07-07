"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/utils";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Category color input: a native color-picker swatch paired with a hex text
 * field, kept in sync. `value` is `""` when unset (rendered as a neutral,
 * checkered swatch) or a 6-digit hex like `#8b5cf6`. Final validity is enforced
 * by the form schema; this component allows partial typing so a hex can be
 * edited character by character.
 */
export function CategoryColorField({
  id,
  value,
  onChange,
  onBlur,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const isValid = HEX_COLOR.test(value);
  // The native <input type="color"> can't hold "", so give it a concrete value
  // while the swatch overlay shows the true (possibly unset) state.
  const nativeValue = isValid ? value : "#000000";

  return (
    <div className="flex items-center gap-2">
      <span className="relative inline-flex h-9 w-9 shrink-0">
        {/* Neutral checkered backdrop shows through when unset. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-md border border-border",
            !isValid &&
              "bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:10px_10px]",
          )}
          style={isValid ? { backgroundColor: value } : undefined}
        />
        <input
          type="color"
          aria-label="Pick a color"
          value={nativeValue}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          onBlur={onBlur}
          className="h-full w-full cursor-pointer opacity-0"
        />
      </span>
      <Input
        id={id}
        value={value}
        placeholder="#8b5cf6"
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="font-mono"
        aria-invalid={value !== "" && !isValid}
      />
      {value !== "" && (
        <button
          type="button"
          aria-label="Clear color"
          onClick={() => onChange("")}
          className="grid h-9 w-9 shrink-0 place-content-center rounded-md text-foreground-subtle hover:bg-surface-2 hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
