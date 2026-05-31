"use client";

import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

/**
 * Switch — a controlled on/off toggle.
 *
 * Dependency-free (a native `<button role="switch">`) so adding it doesn't
 * pull a new Radix peer into the package. Space/Enter activation comes for
 * free from the underlying button. Used by the timeline editor's publish
 * toggle and the `PublishControl` primitive.
 */
export interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-surface-2",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-foreground shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  ),
);
Switch.displayName = "Switch";
