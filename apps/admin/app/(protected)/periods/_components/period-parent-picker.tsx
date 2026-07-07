"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";

import {
  collectSelfAndDescendantIds,
  orderedForPicker,
  type PeriodLite,
} from "./period-tree-utils";

/**
 * Searchable parent selector for the period editor. Options are the user's
 * periods in hierarchical reading order (indented by depth), plus a
 * "— none (top-level) —" choice.
 *
 * Cycle prevention (wireframe 22 #4): when editing an existing period, that
 * period and all its descendants are excluded — a period can't be parented
 * under itself or its own child. The service `assertNoPeriodCycle` is the
 * backstop for any raced write. In create mode (`currentId` undefined) the full
 * list is selectable.
 */
export function PeriodParentPicker({
  id,
  periods,
  currentId,
  value,
  onChange,
  onBlur,
}: {
  id?: string;
  periods: PeriodLite[];
  currentId?: string;
  value: string | null;
  onChange: (parentId: string | null) => void;
  onBlur?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const excluded = React.useMemo(
    () =>
      currentId === undefined
        ? new Set<string>()
        : collectSelfAndDescendantIds(periods, currentId),
    [periods, currentId],
  );

  const options = React.useMemo(
    () =>
      orderedForPicker(periods).filter(({ node }) => !excluded.has(node.id)),
    [periods, excluded],
  );

  const selectedLabel =
    value === null
      ? "— none (top-level) —"
      : (options.find(({ node }) => node.id === value)?.node.title ??
        "— none (top-level) —");

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            value === null && "text-foreground-muted",
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search periods…" />
          <CommandList>
            <CommandEmpty>No periods found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__root__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0",
                  )}
                />
                — none (top-level) —
              </CommandItem>
              {options.map(({ node, depth }) => (
                <CommandItem
                  key={node.id}
                  value={`${node.title} ${node.id}`}
                  onSelect={() => {
                    onChange(node.id === value ? null : node.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === node.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span
                    className="truncate"
                    style={{ paddingLeft: `${depth * 12}px` }}
                  >
                    {node.title}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
