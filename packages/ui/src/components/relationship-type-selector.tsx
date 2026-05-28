"use client";

import * as React from "react";
import {
  collaborationRoleEnum,
  familyRoleEnum,
  professionalRoleEnum,
  relationshipTypeEnum,
  typeAcceptsRole,
} from "@repo/services/schemas/character-relationship.js";
import { z } from "zod";

import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@repo/ui/lib/utils";

export type RelationshipType = z.infer<typeof relationshipTypeEnum>;

export interface RelationshipTypeSelectorProps {
  type: RelationshipType;
  role?: string | null;
  onChange: (next: { type: RelationshipType; role: string | null }) => void;
  disabled?: boolean;
  className?: string;
}

// ─── Type → family grouping ──────────────────────────────────────────────────

interface FamilyGroup {
  legend: string;
  types: RelationshipType[];
}

const TYPE_FAMILIES: FamilyGroup[] = [
  { legend: "Family", types: ["family"] },
  { legend: "Professional", types: ["professional", "collaboration"] },
  { legend: "Social / Personal", types: ["friendship"] },
  { legend: "Antagonistic", types: ["rivalry", "enemy"] },
  {
    legend: "Asymmetric",
    types: [
      "mentor_student",
      "owner_pet",
      "trainer_trainee",
      "creator_creation",
      "worship",
    ],
  },
];

// ─── Per-type sub-role enums ─────────────────────────────────────────────────

const ROLE_OPTIONS: Partial<Record<RelationshipType, readonly string[]>> = {
  family: familyRoleEnum.options,
  professional: professionalRoleEnum.options,
  collaboration: collaborationRoleEnum.options,
};

const humanize = (value: string): string => value.replace(/_/g, " ");

// ─── Component ────────────────────────────────────────────────────────────────

export function RelationshipTypeSelector({
  type,
  role,
  onChange,
  disabled,
  className,
}: RelationshipTypeSelectorProps) {
  const roleOptions = ROLE_OPTIONS[type];
  const acceptsRole = typeAcceptsRole(type);
  // Unique per-instance prefix so multiple selectors on the same page don't
  // collide on id/htmlFor pairs (each fieldset/radio + the role select trigger).
  const idPrefix = React.useId();
  const roleSelectId = `${idPrefix}-role`;

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup
        value={type}
        onValueChange={(next) => {
          const nextType = next as RelationshipType;
          const nextRoleOptions = ROLE_OPTIONS[nextType];
          const nextRole =
            typeAcceptsRole(nextType) &&
            role != null &&
            nextRoleOptions?.includes(role)
              ? role
              : null;

          onChange({ type: nextType, role: nextRole });
        }}
        disabled={disabled}
        className="gap-4"
      >
        {TYPE_FAMILIES.map((family) => (
          <fieldset
            key={family.legend}
            className="space-y-2 border-0 p-0"
            data-testid={`relationship-type-family-${family.legend.toLowerCase().replace(/[^a-z]/g, "-")}`}
          >
            <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-foreground-muted">
              {family.legend}
            </legend>
            {family.types.map((typeValue) => {
              const itemId = `${idPrefix}-type-${typeValue}`;
              return (
                <div key={typeValue} className="flex items-center gap-2">
                  <RadioGroupItem id={itemId} value={typeValue} />
                  <Label
                    htmlFor={itemId}
                    className="font-normal capitalize text-foreground"
                  >
                    {humanize(typeValue)}
                  </Label>
                </div>
              );
            })}
          </fieldset>
        ))}
      </RadioGroup>

      {acceptsRole && roleOptions && (
        <div
          className="space-y-1.5"
          data-testid="relationship-type-role-select"
        >
          <Label htmlFor={roleSelectId} className="text-sm">
            Role
          </Label>
          <Select
            value={role ?? undefined}
            onValueChange={(next) => onChange({ type, role: next })}
            disabled={disabled}
          >
            <SelectTrigger id={roleSelectId} aria-label="Role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((roleValue) => (
                <SelectItem key={roleValue} value={roleValue}>
                  <span className="capitalize">{humanize(roleValue)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
