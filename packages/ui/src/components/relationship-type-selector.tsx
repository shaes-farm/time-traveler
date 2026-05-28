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
  /**
   * True when the relationship is stored from the OTHER character's
   * perspective — i.e., the focal character is the object, not the subject.
   * Only meaningful for the five asymmetric types
   * (mentor_student / owner_pet / trainer_trainee / creator_creation / worship).
   */
  isReversed?: boolean;
  /**
   * Focal character's display name. Interpolated into the paired
   * asymmetric radio labels (e.g., "Marie mentors Pierre"). Falls back to
   * "This character" when omitted.
   */
  focalCharacterName?: string;
  /**
   * Other character's display name. Interpolated into the paired
   * asymmetric radio labels (e.g., "Marie mentors Pierre"). Falls back to
   * "Other" when omitted.
   */
  otherCharacterName?: string;
  onChange: (next: {
    type: RelationshipType;
    role: string | null;
    isReversed: boolean;
  }) => void;
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

// ─── Asymmetric verb mapping ─────────────────────────────────────────────────

/**
 * UI-presentational verb forms for the five asymmetric types. Used to
 * interpolate paired-radio labels ("Marie mentors Pierre" vs
 * "Pierre mentors Marie"). Kept here rather than imported from the service
 * because this is screen copy, not domain logic — the service's
 * ASYMMETRIC_TYPES set is the authority on *which* types are asymmetric;
 * the verb form is a presentation concern.
 */
const ASYMMETRIC_VERB: Partial<Record<RelationshipType, string>> = {
  mentor_student: "mentors",
  owner_pet: "owns",
  trainer_trainee: "trains",
  creator_creation: "created",
  worship: "worships",
};

const isAsymmetric = (t: RelationshipType): boolean =>
  ASYMMETRIC_VERB[t] != null;

const humanize = (value: string): string => value.replace(/_/g, " ");

// ─── Composite-value parser/encoder ──────────────────────────────────────────

/**
 * Asymmetric paired-radio values encode direction by suffix:
 *   "mentor_student"          → forward (focal mentors other)
 *   "mentor_student:reverse"  → reversed (other mentors focal)
 *
 * Non-asymmetric types use the plain enum string.
 */
const REVERSE_SUFFIX = ":reverse";

function parseTypeValue(raw: string): {
  type: RelationshipType;
  isReversed: boolean;
} {
  if (raw.endsWith(REVERSE_SUFFIX)) {
    return {
      type: raw.slice(0, -REVERSE_SUFFIX.length) as RelationshipType,
      isReversed: true,
    };
  }
  return { type: raw as RelationshipType, isReversed: false };
}

function encodeTypeValue(t: RelationshipType, isReversed: boolean): string {
  return isAsymmetric(t) && isReversed ? `${t}${REVERSE_SUFFIX}` : t;
}

// ─── Radio row generation ────────────────────────────────────────────────────

interface RadioRow {
  key: string;
  value: string;
  label: string;
}

function rowsForType(
  t: RelationshipType,
  focal: string,
  other: string,
): RadioRow[] {
  if (isAsymmetric(t)) {
    const verb = ASYMMETRIC_VERB[t]!;
    return [
      { key: `${t}-fwd`, value: t, label: `${focal} ${verb} ${other}` },
      {
        key: `${t}-rev`,
        value: `${t}${REVERSE_SUFFIX}`,
        label: `${other} ${verb} ${focal}`,
      },
    ];
  }
  return [{ key: t, value: t, label: humanize(t) }];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RelationshipTypeSelector({
  type,
  role,
  isReversed = false,
  focalCharacterName,
  otherCharacterName,
  onChange,
  disabled,
  className,
}: RelationshipTypeSelectorProps) {
  const roleOptions = ROLE_OPTIONS[type];
  const acceptsRole = typeAcceptsRole(type);
  // Unique per-instance prefix so multiple selectors on the same page don't
  // collide on id/htmlFor pairs.
  const idPrefix = React.useId();
  const roleGroupLabelId = `${idPrefix}-role-label`;

  const focal = focalCharacterName ?? "This character";
  const other = otherCharacterName ?? "Other";

  const typeRadioValue = encodeTypeValue(type, isReversed);

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup
        value={typeRadioValue}
        onValueChange={(next) => {
          const parsed = parseTypeValue(next);
          // Carry role forward only when (a) the next type accepts a role
          // *and* (b) the current role is valid for that type's enum.
          const nextRoleOptions = ROLE_OPTIONS[parsed.type];
          const nextRole =
            typeAcceptsRole(parsed.type) &&
            role != null &&
            nextRoleOptions?.includes(role)
              ? role
              : null;

          onChange({
            type: parsed.type,
            role: nextRole,
            isReversed: parsed.isReversed,
          });
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
            {family.types
              .flatMap((typeValue) => rowsForType(typeValue, focal, other))
              .map((row) => {
                const itemId = `${idPrefix}-type-${row.key}`;
                return (
                  <div key={row.key} className="flex items-center gap-2">
                    <RadioGroupItem id={itemId} value={row.value} />
                    <Label
                      htmlFor={itemId}
                      className="font-normal capitalize text-foreground"
                    >
                      {row.label}
                    </Label>
                  </div>
                );
              })}
          </fieldset>
        ))}
      </RadioGroup>

      {/* Symmetric/asymmetric semantics helper text */}
      <p className="text-xs text-foreground-muted">
        {isAsymmetric(type)
          ? "Direction matters — this relationship is stored from one perspective only."
          : "A reverse entry will be created automatically."}
      </p>

      {acceptsRole && roleOptions && (
        <div className="space-y-2" data-testid="relationship-type-role-select">
          <span
            id={roleGroupLabelId}
            className="block text-sm font-medium text-foreground"
          >
            Role
          </span>
          <RadioGroup
            value={role ?? ""}
            onValueChange={(next) => onChange({ type, role: next, isReversed })}
            disabled={disabled}
            aria-labelledby={roleGroupLabelId}
            className="grid grid-cols-2 gap-x-4 gap-y-2"
          >
            {roleOptions.map((roleValue) => {
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
      )}
    </div>
  );
}
