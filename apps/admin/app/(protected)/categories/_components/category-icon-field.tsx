"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import { Input } from "@repo/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";

import { CATEGORY_ICONS, CategoryIcon } from "./category-icon";

/**
 * Category icon picker: a searchable grid of the curated lucide subset plus an
 * emoji / free-text fallback. `value` is the persisted icon identifier (`""`
 * when unset, otherwise a curated lucide name or an emoji). Anything not in the
 * curated map is treated as free text so emoji "just work".
 */
export function CategoryIconField({
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
  const [open, setOpen] = React.useState(false);
  const entries = React.useMemo(() => Object.entries(CATEGORY_ICONS), []);

  return (
    <div className="flex items-center gap-2">
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
              value === "" && "text-foreground-muted",
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <CategoryIcon name={value} className="h-4 w-4" />
              <span className="truncate">
                {value === "" ? "Choose an icon" : value}
              </span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search icons…" />
            <CommandList>
              <CommandEmpty>No icons found.</CommandEmpty>
              <CommandGroup>
                <div className="grid grid-cols-8 gap-1 p-1">
                  {entries.map(([name]) => (
                    <CommandItem
                      key={name}
                      value={name}
                      title={name}
                      onSelect={() => {
                        onChange(name === value ? "" : name);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-center rounded-md p-0 aspect-square",
                        value === name && "bg-surface-2 ring-1 ring-ring",
                      )}
                    >
                      <CategoryIcon name={name} className="h-4 w-4" />
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="border-t border-border p-2">
            <Input
              value={value}
              placeholder="…or paste an emoji"
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => onChange(e.target.value)}
              aria-label="Custom icon or emoji"
            />
          </div>
        </PopoverContent>
      </Popover>
      {value !== "" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
