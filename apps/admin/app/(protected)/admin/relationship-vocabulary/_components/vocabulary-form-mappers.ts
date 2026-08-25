import { z } from "zod";

import { vocabularyKeySchema } from "@repo/services/schemas/relationship-vocabulary";
import type {
  RelationshipCategoryCreateInput,
  RelationshipCategoryMeta,
  RelationshipCategoryUpdateInput,
  RelationshipRoleCreateInput,
  RelationshipRoleMeta,
  RelationshipRoleUpdateInput,
  RelationshipTypeCreateInput,
  RelationshipTypeMeta,
  RelationshipTypeUpdateInput,
} from "@repo/services/schemas/relationship-vocabulary";

/**
 * Form value types, form-only schemas, and pure mappers for the three
 * vocabulary inspectors.
 *
 * The canonical schemas in `@repo/services/schemas/relationship-vocabulary`
 * still run inside the service on every write; these validate the inspector's
 * own value shape so errors surface inline before the round trip, and add the
 * *editorial* rules the database does not enforce (a directed type wants a
 * verb, a symmetric one wants a noun). Same split as `category-form-mappers.ts`.
 *
 * Every field is concrete — never `undefined` — so one object drives both the
 * create and edit forms. Nullable columns are modelled as `""` and translated
 * back to `null` on the way out.
 */

/* ================================================================ *
 * Dirty-only patches
 * ================================================================ */

/**
 * Filters a full update patch down to the fields the user actually changed,
 * per react-hook-form's `dirtyFields` (computed against the form's
 * `defaultValues`, captured once when it mounts).
 *
 * Needed because an inspector's `key` prop encodes only the selected row's
 * *identity* — switching category/type/role remounts it, but an out-of-band
 * change to a field this form never touched does not. The ▲▼ reorder buttons
 * are the concrete case: they rewrite a row's `sort_order` while that row's
 * inspector can be sitting open, untouched. Since `defaultValues` never
 * resyncs, the form still holds the pre-reorder `sort_order`, and a plain
 * full-patch Save — even one only editing the label — would silently write
 * that stale value back and undo the reorder. Sending only what the user
 * actually edited means a save can never revert a field it never touched.
 *
 * `groups` lets one output field depend on several form fields moving
 * together: the type form's derived `symmetry` mode decides four persisted
 * columns at once ({@link symmetryColumns}), so touching any of its
 * contributing fields must carry all four into the patch — they are written
 * as a unit, never independently.
 */
function pickDirtyPatch<
  Patch extends Record<string, unknown>,
  FormValues extends Record<string, unknown>,
>(
  patch: Patch,
  dirtyFields: Partial<Record<keyof FormValues, unknown>>,
  groups: { [K in keyof Patch]: readonly (keyof FormValues)[] },
): Partial<Patch> {
  const result: Partial<Patch> = {};
  for (const key of Object.keys(patch) as (keyof Patch)[]) {
    if (groups[key].some((field) => dirtyFields[field])) {
      result[key] = patch[key];
    }
  }
  return result;
}

/* ================================================================ *
 * Symmetry mode — how the illegal state is made unreachable
 * ================================================================ */

/**
 * `relationship_types` encodes reciprocal semantics across two columns whose
 * four combinations include one the database rejects
 * (`relationship_types_symmetric_has_no_inverse`). Rather than expose both
 * columns and catch the `23514`, the form exposes the three legal states as a
 * single choice and derives the columns from it — so the illegal combination
 * is not reachable through the UI at all.
 *
 *   symmetric  → is_symmetric = true,  inverse_key = null   ("A and B are friends")
 *   inverse    → is_symmetric = false, inverse_key = <type> ("A mentors B" / "B is mentored by A")
 *   directed   → is_symmetric = false, inverse_key = null   (a one-way assertion, no reciprocal row)
 */
export type SymmetryMode = "symmetric" | "inverse" | "directed";

export function symmetryModeOf(type: {
  is_symmetric: boolean;
  inverse_key: string | null;
}): SymmetryMode {
  if (type.is_symmetric) return "symmetric";
  return type.inverse_key !== null ? "inverse" : "directed";
}

/* ================================================================ *
 * Categories
 * ================================================================ */

export interface CategoryFormValues {
  key: string;
  label: string;
  /** `""` when unset. */
  description: string;
  sort_order: number;
  is_active: boolean;
}

export const categoryFormSchema = z.object({
  // Category keys are VARCHAR(50) where types and roles are VARCHAR(100).
  key: vocabularyKeySchema.max(50, "Keys are limited to 50 characters."),
  label: z.string().min(1, "Label is required."),
  description: z.string(),
  sort_order: z.number().int("Order must be a whole number."),
  is_active: z.boolean(),
});

export const BLANK_CATEGORY: CategoryFormValues = {
  key: "",
  label: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export function mapCategoryToFormValues(
  category: RelationshipCategoryMeta,
): CategoryFormValues {
  return {
    key: category.key,
    label: category.label,
    description: category.description ?? "",
    sort_order: category.sort_order,
    is_active: category.is_active,
  };
}

export function blankCategory(sortOrder: number): CategoryFormValues {
  return { ...BLANK_CATEGORY, sort_order: sortOrder };
}

export function toCategoryCreateInput(
  values: CategoryFormValues,
): RelationshipCategoryCreateInput {
  return {
    key: values.key,
    label: values.label,
    description: values.description || null,
    sort_order: values.sort_order,
    is_active: values.is_active,
  };
}

/**
 * `key` is absent by design — it is immutable after creation (ADR-0041), and
 * the service's update input has no such field to assign to.
 */
export function toCategoryUpdateData(
  values: CategoryFormValues,
): RelationshipCategoryUpdateInput {
  return {
    label: values.label,
    description: values.description || null,
    sort_order: values.sort_order,
    is_active: values.is_active,
  };
}

/** As {@link toCategoryUpdateData}, keeping only the fields the user edited. */
export function toCategoryUpdateDataDirty(
  values: CategoryFormValues,
  dirtyFields: Partial<Record<keyof CategoryFormValues, unknown>>,
): Partial<RelationshipCategoryUpdateInput> {
  return pickDirtyPatch(toCategoryUpdateData(values), dirtyFields, {
    label: ["label"],
    description: ["description"],
    sort_order: ["sort_order"],
    is_active: ["is_active"],
  });
}

/* ================================================================ *
 * Types
 * ================================================================ */

export interface TypeFormValues {
  key: string;
  label: string;
  category_key: string;
  symmetry: SymmetryMode;
  /** `""` when the mode is not `inverse`. */
  inverse_key: string;
  /** `""` when unset. Shown for `inverse` and `directed`. */
  direction_verb: string;
  /** `""` when unset. Shown for `symmetric`. */
  symmetric_noun: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

/**
 * Editorial rules the database does not enforce, applied per symmetry mode:
 * a directed type without a verb and a symmetric type without a noun both
 * render as blanks in the relationship card, so the form insists on them.
 */
export const typeFormSchema = z
  .object({
    key: vocabularyKeySchema,
    label: z.string().min(1, "Label is required."),
    category_key: z.string().min(1, "Pick a group."),
    symmetry: z.enum(["symmetric", "inverse", "directed"]),
    inverse_key: z.string(),
    direction_verb: z.string(),
    symmetric_noun: z.string(),
    description: z.string(),
    sort_order: z.number().int("Order must be a whole number."),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.symmetry === "inverse" && values.inverse_key === "") {
      ctx.addIssue({
        code: "custom",
        path: ["inverse_key"],
        message: "Pick the type the reciprocal relationship carries.",
      });
    }
    if (
      values.symmetry === "symmetric" &&
      values.symmetric_noun.trim() === ""
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["symmetric_noun"],
        message: 'A symmetric type needs a noun, e.g. "friends".',
      });
    }
    if (
      values.symmetry !== "symmetric" &&
      values.direction_verb.trim() === ""
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["direction_verb"],
        message: 'A directed type needs a verb, e.g. "mentors".',
      });
    }
  });

export const BLANK_TYPE: TypeFormValues = {
  key: "",
  label: "",
  category_key: "",
  symmetry: "symmetric",
  inverse_key: "",
  direction_verb: "",
  symmetric_noun: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export function mapTypeToFormValues(
  type: RelationshipTypeMeta,
): TypeFormValues {
  return {
    key: type.key,
    label: type.label,
    category_key: type.category_key,
    symmetry: symmetryModeOf(type),
    inverse_key: type.inverse_key ?? "",
    direction_verb: type.direction_verb ?? "",
    symmetric_noun: type.symmetric_noun ?? "",
    description: type.description ?? "",
    sort_order: type.sort_order,
    is_active: type.is_active,
  };
}

export function blankType(
  categoryKey: string,
  sortOrder: number,
): TypeFormValues {
  return { ...BLANK_TYPE, category_key: categoryKey, sort_order: sortOrder };
}

/**
 * Collapse the symmetry mode back onto the two persisted columns, dropping any
 * value the mode does not use.
 *
 * Dropping is what keeps the invariant true: a user who fills in an inverse,
 * then switches to "symmetric", must not leave the stale `inverse_key` behind —
 * that combination is exactly what the CHECK rejects.
 */
function symmetryColumns(values: TypeFormValues): {
  is_symmetric: boolean;
  inverse_key: string | null;
  direction_verb: string | null;
  symmetric_noun: string | null;
} {
  switch (values.symmetry) {
    case "symmetric":
      return {
        is_symmetric: true,
        inverse_key: null,
        direction_verb: null,
        symmetric_noun: values.symmetric_noun || null,
      };
    case "inverse":
      return {
        is_symmetric: false,
        inverse_key: values.inverse_key || null,
        direction_verb: values.direction_verb || null,
        symmetric_noun: null,
      };
    case "directed":
      return {
        is_symmetric: false,
        inverse_key: null,
        direction_verb: values.direction_verb || null,
        symmetric_noun: null,
      };
  }
}

export function toTypeCreateInput(
  values: TypeFormValues,
): RelationshipTypeCreateInput {
  return {
    key: values.key,
    label: values.label,
    category_key: values.category_key,
    description: values.description || null,
    sort_order: values.sort_order,
    is_active: values.is_active,
    ...symmetryColumns(values),
  };
}

export function toTypeUpdateData(
  values: TypeFormValues,
): RelationshipTypeUpdateInput {
  return {
    label: values.label,
    category_key: values.category_key,
    description: values.description || null,
    sort_order: values.sort_order,
    is_active: values.is_active,
    ...symmetryColumns(values),
  };
}

/**
 * As {@link toTypeUpdateData}, keeping only the fields the user edited.
 *
 * The four symmetry-derived columns share one group: they come from
 * {@link symmetryColumns}, which reads `symmetry`, `inverse_key`,
 * `direction_verb` and `symmetric_noun` together, so touching any one of
 * those form fields must carry all four columns into the patch.
 */
export function toTypeUpdateDataDirty(
  values: TypeFormValues,
  dirtyFields: Partial<Record<keyof TypeFormValues, unknown>>,
): Partial<RelationshipTypeUpdateInput> {
  const symmetryFields = [
    "symmetry",
    "inverse_key",
    "direction_verb",
    "symmetric_noun",
  ] as const;
  return pickDirtyPatch(toTypeUpdateData(values), dirtyFields, {
    label: ["label"],
    category_key: ["category_key"],
    description: ["description"],
    sort_order: ["sort_order"],
    is_active: ["is_active"],
    is_symmetric: symmetryFields,
    inverse_key: symmetryFields,
    direction_verb: symmetryFields,
    symmetric_noun: symmetryFields,
  });
}

/* ================================================================ *
 * Roles
 * ================================================================ */

/**
 * Form-only sentinel for "this sub-role is its own inverse".
 *
 * Self-inversion (`inverse_key = key`) is the sanctioned encoding for a
 * symmetric sub-role — spouse ↔ spouse, sibling ↔ sibling — and 16 of the 32
 * roles seeded by 00030 use it; 00031 declined a `inverse_key <> key` CHECK
 * precisely to keep it legal. The form cannot hold the literal key there,
 * because in create mode the key is still being typed and would go stale the
 * moment it changed. The sentinel is resolved to the row's own key on the way
 * out, in {@link resolveRoleInverseKey}.
 *
 * Cannot collide with a real key: those match `^[a-z][a-z0-9_]*$`.
 */
export const SELF_INVERSE = "__self__";

export interface RoleFormValues {
  type_key: string;
  key: string;
  label: string;
  /**
   * `""` when the role has no inverse, {@link SELF_INVERSE} when it is its own,
   * otherwise a sibling role's key.
   */
  inverse_key: string;
  sort_order: number;
  is_active: boolean;
}

export const roleFormSchema = z.object({
  type_key: z.string().min(1),
  key: vocabularyKeySchema,
  label: z.string().min(1, "Label is required."),
  inverse_key: z.string(),
  sort_order: z.number().int("Order must be a whole number."),
  is_active: z.boolean(),
});

export const BLANK_ROLE: RoleFormValues = {
  type_key: "",
  key: "",
  label: "",
  inverse_key: "",
  sort_order: 0,
  is_active: true,
};

export function mapRoleToFormValues(
  role: RelationshipRoleMeta,
): RoleFormValues {
  return {
    type_key: role.type_key,
    key: role.key,
    label: role.label,
    inverse_key:
      role.inverse_key === null
        ? ""
        : role.inverse_key === role.key
          ? SELF_INVERSE
          : role.inverse_key,
    sort_order: role.sort_order,
    is_active: role.is_active,
  };
}

/** The column value behind {@link RoleFormValues.inverse_key}. */
export function resolveRoleInverseKey(values: RoleFormValues): string | null {
  if (values.inverse_key === "") return null;
  if (values.inverse_key === SELF_INVERSE) return values.key;
  return values.inverse_key;
}

export function blankRole(typeKey: string, sortOrder: number): RoleFormValues {
  return { ...BLANK_ROLE, type_key: typeKey, sort_order: sortOrder };
}

export function toRoleCreateInput(
  values: RoleFormValues,
): RelationshipRoleCreateInput {
  return {
    type_key: values.type_key,
    key: values.key,
    label: values.label,
    inverse_key: resolveRoleInverseKey(values),
    sort_order: values.sort_order,
    is_active: values.is_active,
  };
}

export function toRoleUpdateData(
  values: RoleFormValues,
): RelationshipRoleUpdateInput {
  return {
    label: values.label,
    inverse_key: resolveRoleInverseKey(values),
    sort_order: values.sort_order,
    is_active: values.is_active,
  };
}

/** As {@link toRoleUpdateData}, keeping only the fields the user edited. */
export function toRoleUpdateDataDirty(
  values: RoleFormValues,
  dirtyFields: Partial<Record<keyof RoleFormValues, unknown>>,
): Partial<RelationshipRoleUpdateInput> {
  return pickDirtyPatch(toRoleUpdateData(values), dirtyFields, {
    label: ["label"],
    inverse_key: ["inverse_key"],
    sort_order: ["sort_order"],
    is_active: ["is_active"],
  });
}
