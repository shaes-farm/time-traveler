import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

export type Significance = "low" | "medium" | "high" | "critical";

const LEVELS: Significance[] = ["low", "medium", "high", "critical"];

const RANK: Record<Significance, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

// Single-hue amber importance ramp reused for significance (03-aesthetic-notes
// § Significance scale). The active level tints all filled steps.
const BAR_COLOR: Record<Significance, string> = {
  low: "bg-importance-low",
  high: "bg-importance-high",
  medium: "bg-importance-medium",
  critical: "bg-importance-critical",
};

const LABEL: Record<Significance, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/**
 * A four-step sequential bar + label for a period's `significance`. Deliberately
 * the same visual language as event importance (sequential, single-hue amber).
 */
export function SignificanceRamp({
  value,
  showLabel = true,
  className,
}: {
  value: Significance;
  showLabel?: boolean;
  className?: string;
}) {
  const rank = RANK[value];
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      title={`${LABEL[value]} significance`}
    >
      <span className="inline-flex items-end gap-0.5" aria-hidden>
        {LEVELS.map((level) => {
          const filled = RANK[level] <= rank;
          return (
            <span
              key={level}
              className={cn(
                "w-1 rounded-sm",
                filled ? BAR_COLOR[value] : "bg-border",
              )}
              style={{ height: `${4 + RANK[level] * 2}px` }}
            />
          );
        })}
      </span>
      {showLabel && (
        <span className="text-xs text-foreground-muted">{LABEL[value]}</span>
      )}
      <span className="sr-only">{LABEL[value]} significance</span>
    </span>
  );
}
