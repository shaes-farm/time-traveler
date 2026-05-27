"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "@repo/ui/lib/utils";

export interface SaveDropdownProps {
  onSave: () => void;
  onSaveAndAddAnother?: () => void;
  onSaveAsDraft?: () => void;
  onSaveAndPublish?: () => void;
  saveLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SaveDropdown({
  onSave,
  onSaveAndAddAnother,
  onSaveAsDraft,
  onSaveAndPublish,
  saveLabel = "Save",
  disabled = false,
  className,
}: SaveDropdownProps) {
  const hasMenuItems =
    onSaveAndAddAnother != null ||
    onSaveAsDraft != null ||
    onSaveAndPublish != null;

  return (
    <div className={cn("inline-flex items-stretch", className)}>
      <Button type="button" onClick={onSave} disabled={disabled}>
        {saveLabel}
      </Button>
      {hasMenuItems && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={disabled}
              className="rounded-l-none border-l-0 px-2"
              aria-label="More save actions"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onSaveAndAddAnother && (
              <DropdownMenuItem onSelect={() => onSaveAndAddAnother()}>
                Save and add another
              </DropdownMenuItem>
            )}
            {onSaveAsDraft && (
              <DropdownMenuItem onSelect={() => onSaveAsDraft()}>
                Save as draft
              </DropdownMenuItem>
            )}
            {onSaveAndPublish && (
              <DropdownMenuItem onSelect={() => onSaveAndPublish()}>
                Save and publish
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
