import { z } from "zod";

import { slugSchema } from "@repo/services/schemas/slug";
import type { CategoryInput } from "@repo/services/schemas/category";
import type {
  CategoryNode,
  CreateCategoryInput,
} from "@repo/services/category-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The category inspector's working value type. Field names mirror the persisted
 * `categories` row (snake_case) so `zodResolver` validates a shape close to what
 * is stored.
 *
 * Every field is concrete (never `undefined`) so the same object drives both the
 * create and edit forms. `color` / `icon` / `description` hold `""` when unset;
 * `parent_category_id` is `null` for a root category. There is no `published`
 * field — categories are taxonomy, always live for their owner (wireframe 24).
 */
export interface CategoryFormValues {
  title: string;
  slug: string;
  description: string;
  /** `""` when unset, otherwise a 6-digit hex like `#8b5cf6`. */
  color: string;
  /** `""` when unset, otherwise a lucide icon name or an emoji. */
  icon: string;
  /** `null` = root category. */
  parent_category_id: string | null;
}

// ---------------------------------------------------------------------------
// Validation — form-only schema (the canonical categorySchema runs server-side)
// ---------------------------------------------------------------------------

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Form-only schema. The canonical `categorySchema` still runs server-side in
 * `createCategory`/`updateCategory`; this validates the inspector's own value
 * shape and surfaces errors inline before the round-trip.
 *
 * `color` accepts either `""` (unset) or a 6-digit hex — the persisted schema's
 * regex rejects `""`, so the form models "cleared" as the empty string and the
 * mappers translate that to an omitted field on the way out.
 */
export const categoryFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(2000),
  slug: slugSchema,
  description: z.string(),
  color: z
    .string()
    .refine(
      (v) => v === "" || HEX_COLOR.test(v),
      "Color must be a 6-digit hex like #8b5cf6.",
    ),
  icon: z.string().max(100),
  parent_category_id: z.string().uuid().nullable(),
});

// ---------------------------------------------------------------------------
// Pure mappers (exported for unit testing)
// ---------------------------------------------------------------------------

export const BLANK_VALUES: CategoryFormValues = {
  title: "",
  slug: "",
  description: "",
  color: "",
  icon: "",
  parent_category_id: null,
};

/** Hydrate the inspector from a selected tree node (edit mode). */
export function mapNodeToFormValues(node: CategoryNode): CategoryFormValues {
  return {
    title: node.title,
    slug: node.slug,
    description: node.description ?? "",
    color: node.color ?? "",
    icon: node.icon ?? "",
    parent_category_id: node.parent_category_id,
  };
}

/**
 * A fresh create form, optionally pre-parented (e.g. "add child of X"). Passing
 * `null` yields a root category.
 */
export function blankForParent(
  parentId: string | null = null,
): CategoryFormValues {
  return { ...BLANK_VALUES, parent_category_id: parentId };
}

export function toCreateInput(values: CategoryFormValues): CreateCategoryInput {
  return {
    title: values.title,
    // The service generates + collision-resolves the slug; only pass a base
    // when the user has typed one, otherwise omit so it derives from the title.
    slug: values.slug || undefined,
    description: values.description || undefined,
    color: values.color || undefined,
    icon: values.icon || undefined,
    // null = root (the column default); passed through explicitly.
    parent_category_id: values.parent_category_id,
  };
}

export function toUpdateData(
  values: CategoryFormValues,
): Partial<CategoryInput> {
  return {
    title: values.title,
    slug: values.slug,
    // description is sent as-is (including "") so clearing it persists the clear.
    description: values.description,
    // color / icon: the persisted schema is optional-but-not-nullable and its
    // hex regex rejects "", so an empty value is sent as `undefined` (no-op).
    // A set value is persisted; clearing back to null is not expressible through
    // updateCategory today — a known limitation of the categories schema tracked
    // in #347.
    color: values.color || undefined,
    icon: values.icon || undefined,
    // null reparents to root; a uuid reparents under that node (cycle-guarded
    // server-side by assertNoCategoryCycle).
    parent_category_id: values.parent_category_id,
  };
}
