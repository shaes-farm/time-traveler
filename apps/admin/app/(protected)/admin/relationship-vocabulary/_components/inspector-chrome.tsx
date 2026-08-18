"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";

/**
 * Chrome shared by the three vocabulary inspectors: the header with its
 * overflow menu, the save/cancel footer, the error alert, and the key field.
 *
 * Extracted because the three forms differ only in their middle — repeating the
 * header/footer three times would make a later change to (say) where Delete
 * lives a three-file edit with two chances to drift.
 */

export function InspectorHeader({
  title,
  isEdit,
  isActive,
  onDeactivate,
  onDelete,
}: {
  title: string;
  isEdit: boolean;
  isActive: boolean;
  onDeactivate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
      <h2 className="font-display text-sm font-medium text-foreground">
        {title}
      </h2>
      {isEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onDeactivate}>
              {isActive ? "Deactivate" : "Reactivate"}
            </DropdownMenuItem>
            {/*
              Delete sits below deactivate, and is the secondary action by
              design: both FKs are ON DELETE RESTRICT, so for anything actually
              in use this path only ever ends in a blocked dialog.
            */}
            <DropdownMenuItem
              onSelect={onDelete}
              className="text-destructive focus:text-destructive"
            >
              Delete permanently…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function InspectorError({
  message,
  title = "Couldn’t save",
}: {
  message: string | null;
  /** The three inspectors reuse one alert for save, deactivate and delete
   * failures alike — default to the save-path wording, override for the other two. */
  title?: string;
}) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function InspectorFooter({
  pending,
  isEdit,
  onCancel,
}: {
  pending: boolean;
  isEdit: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={pending}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : isEdit ? "Save" : "Create"}
      </Button>
    </div>
  );
}

/**
 * The `key` field.
 *
 * Editable on create, permanently disabled afterwards. The FKs are
 * `ON UPDATE CASCADE`, so changing a key rewrites `relationship_type` on every
 * relationship row that references it — a silent bulk data edit behind a text
 * input. ADR-0041 keeps that capability at the SQL level and withholds it from
 * the UI, which is why the input is disabled rather than merely warned about.
 */
export function KeyField({
  value,
  onChange,
  onBlur,
  isEdit,
  error,
  placeholder,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  isEdit: boolean;
  error?: string;
  placeholder: string;
  name: string;
}) {
  const describedBy = `${name}-hint`;
  return (
    // Plain Label/Input rather than the Form* primitives: those read
    // FormFieldContext, which only `<FormField>` provides, and these fields are
    // driven by a bare `<Controller>`.
    <div className="space-y-2">
      <Label htmlFor={name}>Key</Label>
      <Input
        id={name}
        name={name}
        value={value}
        disabled={isEdit}
        placeholder={placeholder}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <p id={describedBy} className="text-xs text-foreground-muted">
        {isEdit
          ? "Keys are permanent. To retire this entry, deactivate it and add a replacement."
          : "Lowercase letters, digits and underscores — e.g. derived_from. This is what gets stored on every relationship, so it can’t be changed later."}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** Shared numeric `sort_order` field. */
export function SortOrderField({
  value,
  onChange,
  onBlur,
  error,
  name,
}: {
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  error?: string;
  name: string;
}) {
  const describedBy = `${name}-hint`;
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>Order</Label>
      <Input
        id={name}
        name={name}
        type="number"
        step={1}
        value={Number.isNaN(value) ? "" : value}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        onBlur={onBlur}
      />
      <p id={describedBy} className="text-xs text-foreground-muted">
        Lower sorts first. Values are spaced by 10 so a new entry can be slotted
        between two existing ones — the arrows in the tree do this for you.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Shared active/inactive toggle, rendered as a labelled switch row.
 *
 * `disabled` is set by every inspector in edit mode: saving this field
 * directly would flip `is_active` without going through `DeactivateDialog`'s
 * blast-radius warning, silently bypassing the one guard rail that exists for
 * this state change. Deactivation only happens through the overflow menu.
 * Stays interactive on create, where nothing references the row yet.
 */
export function ActiveField({
  checked,
  onChange,
  name,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
      <div className="space-y-0.5">
        <Label htmlFor={name}>Active</Label>
        <p className="text-xs text-foreground-muted">{description}</p>
      </div>
      <Switch
        id={name}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
