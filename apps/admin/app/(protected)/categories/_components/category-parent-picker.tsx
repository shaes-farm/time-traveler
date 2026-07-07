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
import type { CategoryNode } from "@repo/services/category-service";

import {
  flattenTree,
  findNode,
  collectSelfAndDescendantIds,
} from "./category-tree-utils";

/**
 * Searchable parent selector for the category inspector. Options are the whole
 * forest flattened (indented by depth), plus a "— none (root) —" choice.
 *
 * Cycle prevention (wireframe 24 #7): when editing an existing node, that node
 * and all its descendants are excluded — a category can't be parented under
 * itself or its own child. The service `assertNoCategoryCycle` remains the
 * backstop for any raced write. In create mode (`currentId` undefined) the full
 * forest is selectable.
 */
export function CategoryParentPicker({
  id,
  tree,
  currentId,
  value,
  onChange,
  onBlur,
}: {
  id?: string;
  tree: CategoryNode[];
  currentId?: string;
  value: string | null;
  onChange: (parentId: string | null) => void;
  onBlur?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const excluded = React.useMemo(() => {
    if (currentId === undefined) return new Set<string>();
    const current = findNode(tree, currentId);
    return current ? collectSelfAndDescendantIds(current) : new Set<string>();
  }, [tree, currentId]);

  const options = React.useMemo(
    () => flattenTree(tree).filter(({ node }) => !excluded.has(node.id)),
    [tree, excluded],
  );

  const selectedLabel =
    value === null
      ? "— none (root) —"
      : (options.find(({ node }) => node.id === value)?.node.title ??
        "— none (root) —");

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
          <CommandInput placeholder="Search categories…" />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
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
                — none (root) —
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
