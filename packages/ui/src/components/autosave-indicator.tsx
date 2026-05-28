import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

export interface AutosaveIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  savedAt?: Date | string | null;
  isSaving?: boolean;
  label?: string;
}

const formatSavedAt = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export function AutosaveIndicator({
  savedAt,
  isSaving = false,
  label = "Draft saved",
  className,
  ...props
}: AutosaveIndicatorProps) {
  const text = isSaving
    ? "Saving draft..."
    : savedAt != null
      ? `${label} at ${formatSavedAt(savedAt)}`
      : label;

  return (
    <div
      aria-live="polite"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground-muted",
        className,
      )}
      {...props}
    >
      {text}
    </div>
  );
}
