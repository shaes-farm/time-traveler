"use client";

import * as React from "react";
import { typeAcceptsRole } from "@repo/services/schemas/character-relationship";
import type {
  RelationshipCategoryMeta,
  RelationshipTypeMeta,
  RelationshipVocabulary,
} from "@repo/services/schemas/relationship-vocabulary";

import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { cn } from "@repo/ui/lib/utils";

/**
 * A relationship type key. Open by design — the legal set lives in
 * `relationship_types` and grows at runtime, so a union here would assert
 * knowledge the code does not have (#419).
 */
export type RelationshipType = string;

export interface RelationshipTypeSelectorProps {
  type: RelationshipType;
  role?: string | null;
  onChange: (next: { type: RelationshipType; role: string | null }) => void;
  /**
   * The vocabulary tree, ordered by the DB's two levels of `sort_order`.
   * Supplied by the caller (via `useRelationshipCategories`) so this component
   * stays pure and Storybook-able.
   */
  categories: readonly RelationshipCategoryMeta[];
  /** Lookup form of the same data, for role validity. */
  vocabulary: RelationshipVocabulary;
  disabled?: boolean;
  className?: string;
}

const humanize = (value: string): string => value.replace(/_/g, " ");

/** Label for a vocabulary entry, falling back to a humanized key. */
const labelFor = (entry: { key: string; label?: string | null }): string =>
  entry.label && entry.label.length > 0 ? entry.label : humanize(entry.key);

// ─── Component ────────────────────────────────────────────────────────────────

export function RelationshipTypeSelector({
  type,
  role,
  onChange,
  categories,
  vocabulary,
  disabled,
  className,
}: RelationshipTypeSelectorProps) {
  // Unique per-instance prefix so multiple selectors on the same page don't
  // collide on id/htmlFor pairs.
  const selectorId = React.useId();

  const handleTypeChange = (next: string) => {
    // Carry the role forward only when the next type declares it. Roles are
    // per-type data now, so this is a lookup rather than a hard-coded map.
    const nextRoles = vocabulary.get(next)?.roles ?? [];
    const nextRole =
      role != null && nextRoles.some((r) => r.key === role) ? role : null;
    onChange({ type: next, role: nextRole });
  };

  // A fresh database has no vocabulary until the baseline seed migration runs.
  // Say so rather than rendering an empty fieldset that looks broken.
  if (categories.length === 0) {
    return (
      <p
        className={cn("text-sm text-foreground-muted", className)}
        data-testid="relationship-type-empty"
      >
        No relationship types are configured yet. An administrator needs to add
        them before relationships can be created.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {categories.map((category) => (
        <fieldset
          key={category.key}
          className="space-y-2 border-0 p-0"
          data-testid={`relationship-type-family-${category.key}`}
        >
          <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-foreground-muted">
            {labelFor(category)}
          </legend>
          {/*
            One Radix RadioGroup per type, all sharing value + handler.
            This lets the SubRoleRadios sit as a DOM sibling of just the
            selected type's RadioGroup — so the role group renders
            directly beneath the type the user picked, even when a
            category contains multiple sub-roled types. Avoids both
            (a) nested role="radiogroup" elements and (b) the role group
            being pushed to the bottom of the fieldset.
          */}
          {category.types.map((typeMeta) => (
            <React.Fragment key={typeMeta.key}>
              <RadioGroup
                value={type}
                onValueChange={handleTypeChange}
                disabled={disabled}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`${selectorId}-type-${typeMeta.key}`}
                    value={typeMeta.key}
                  />
                  <Label
                    htmlFor={`${selectorId}-type-${typeMeta.key}`}
                    className="font-normal capitalize text-foreground"
                  >
                    {labelFor(typeMeta)}
                  </Label>
                </div>
              </RadioGroup>
              {type === typeMeta.key &&
                typeAcceptsRole(typeMeta.key, vocabulary) && (
                  <SubRoleRadios
                    role={role}
                    roles={typeMeta.roles}
                    idPrefix={selectorId}
                    disabled={disabled}
                    onChange={(nextRole) => onChange({ type, role: nextRole })}
                  />
                )}
            </React.Fragment>
          ))}
        </fieldset>
      ))}

      {/* Symmetric/directed semantics helper text, driven by the vocabulary. */}
      <p className="text-xs text-foreground-muted">
        {describeReciprocity(vocabulary.get(type), vocabulary)}
      </p>
    </div>
  );
}

/**
 * Explain what saving this type will do. Mirrors `computeReciprocalRow`:
 * symmetric types get a mirrored row, types with an `inverse_key` get a row
 * carrying that other type, everything else is a single directed assertion.
 */
function describeReciprocity(
  meta: RelationshipTypeMeta | undefined,
  vocabulary: RelationshipVocabulary,
): string {
  if (meta === undefined) {
    return "A reverse entry will be created only if this type is symmetric.";
  }
  if (meta.is_symmetric) {
    return "A reverse entry will be created automatically.";
  }
  if (meta.inverse_key !== null) {
    const inverse = vocabulary.get(meta.inverse_key);
    const inverseLabel =
      inverse !== undefined ? labelFor(inverse) : humanize(meta.inverse_key);
    return `A reverse entry will be created as "${inverseLabel}".`;
  }
  return "No reverse entry is created — this relationship is stored as a single row.";
}

// ─── Sub-role radios (inline; rendered beneath the selected sub-roled type) ──

function SubRoleRadios({
  role,
  roles,
  idPrefix,
  disabled,
  onChange,
}: {
  role: string | null | undefined;
  roles: RelationshipTypeMeta["roles"];
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
        {roles.map((roleMeta) => {
          const itemId = `${idPrefix}-role-${roleMeta.key}`;
          return (
            <div key={roleMeta.key} className="flex items-center gap-2">
              <RadioGroupItem id={itemId} value={roleMeta.key} />
              <Label
                htmlFor={itemId}
                className="font-normal capitalize text-foreground"
              >
                {labelFor(roleMeta)}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
