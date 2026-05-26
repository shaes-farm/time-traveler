import * as React from "react";
import { ArrowLeftRight, Check, Minus } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        published:
          "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
        draft:
          "bg-surface-2 text-foreground-muted ring-1 ring-inset ring-border",
        shared: "bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  },
);

const STATUS_ICON: Record<
  NonNullable<VariantProps<typeof statusBadgeVariants>["status"]>,
  React.ComponentType<{ className?: string }>
> = {
  published: Check,
  draft: Minus,
  shared: ArrowLeftRight,
};

const STATUS_LABEL: Record<
  NonNullable<VariantProps<typeof statusBadgeVariants>["status"]>,
  string
> = {
  published: "Published",
  draft: "Draft",
  shared: "Shared",
};

export interface StatusBadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof statusBadgeVariants> {
  /** Optional label override; defaults to the canonical name for the status. */
  label?: string;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, label, ...props }, ref) => {
    const resolvedStatus = status ?? "draft";
    const Icon = STATUS_ICON[resolvedStatus];
    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ status, className }))}
        {...props}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {label ?? STATUS_LABEL[resolvedStatus]}
      </span>
    );
  },
);
StatusBadge.displayName = "StatusBadge";

export { statusBadgeVariants };
