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

// ─── Asymmetric type set (UI helper-text branching only) ─────────────────────
//
// Mirrors the service's ASYMMETRIC_TYPES set. Kept here rather than imported
// because the selector's only use for it is rendering helper-text copy — the
// service is the authority on reciprocal-edge logic, the UI just needs to
// know which message to show.

const ASYMMETRIC_TYPES: ReadonlySet<RelationshipType> =
  new Set<RelationshipType>([
    "mentor_student",
    "owner_pet",
    "trainer_trainee",
    "creator_creation",
    "worship",
  ]);

const humanize = (value: string): string => value.replace(/_/g, " ");

// ─── Component ────────────────────────────────────────────────────────────────

export function RelationshipTypeSelector({
  type,
  role,
  onChange,
  disabled,
  className,
}: RelationshipTypeSelectorProps) {
  // Unique per-instance prefix so multiple selectors on the same page don't
  // collide on id/htmlFor pairs.
  const idPrefix = React.useId();

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup
        value={type}
        onValueChange={(next) => {
          const nextType = next as RelationshipType;
          // Carry role forward only when (a) the next type accepts a role
          // *and* (b) the current role is valid for that type's enum.
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
            {family.types.map((typeValue) => (
              <React.Fragment key={typeValue}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`${idPrefix}-type-${typeValue}`}
                    value={typeValue}
                  />
                  <Label
                    htmlFor={`${idPrefix}-type-${typeValue}`}
                    className="font-normal capitalize text-foreground"
                  >
                    {humanize(typeValue)}
                  </Label>
                </div>
                {/* Sub-role radios inline beneath the currently-selected
                    sub-roled type. Renders inside the same fieldset as the
                    parent type radio so the visual hierarchy matches the
                    wireframe. */}
                {type === typeValue &&
                  typeAcceptsRole(typeValue) &&
                  ROLE_OPTIONS[typeValue] && (
                    <SubRoleRadios
                      role={role}
                      options={ROLE_OPTIONS[typeValue]!}
                      idPrefix={idPrefix}
                      disabled={disabled}
                      onChange={(nextRole) =>
                        onChange({ type, role: nextRole })
                      }
                    />
                  )}
              </React.Fragment>
            ))}
          </fieldset>
        ))}
      </RadioGroup>

      {/* Symmetric/asymmetric semantics helper text */}
      <p className="text-xs text-foreground-muted">
        {ASYMMETRIC_TYPES.has(type)
          ? "No reverse entry is created — this relationship is stored as a single row."
          : "A reverse entry will be created automatically."}
      </p>
    </div>
  );
}

// ─── Sub-role radios (inline; rendered beneath the selected sub-roled type) ──

function SubRoleRadios({
  role,
  options,
  idPrefix,
  disabled,
  onChange,
}: {
  role: string | null | undefined;
  options: readonly string[];
  idPrefix: string;
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const labelId = `${idPrefix}-role-label`;
  return (
    <div
      className="mt-1 space-y-2 pl-6"
      data-testid="relationship-type-role-select"
    >
      <span id={labelId} className="block text-sm font-medium text-foreground">
        Role
      </span>
      <RadioGroup
        value={role ?? ""}
        onValueChange={onChange}
        disabled={disabled}
        aria-labelledby={labelId}
        className="grid grid-cols-2 gap-x-4 gap-y-2"
      >
        {options.map((roleValue) => {
          const itemId = `${idPrefix}-role-${roleValue}`;
          return (
            <div key={roleValue} className="flex items-center gap-2">
              <RadioGroupItem id={itemId} value={roleValue} />
              <Label
                htmlFor={itemId}
                className="font-normal capitalize text-foreground"
              >
                {humanize(roleValue)}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
