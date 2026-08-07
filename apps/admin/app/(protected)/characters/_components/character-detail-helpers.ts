/**
 * Pure helpers for the Character detail page — grouping relationships by type
 * family, computing narrative direction labels, and small display utilities.
 * Kept free of React/Supabase so they can be unit-tested in isolation.
 */
import { TemporalService } from "@repo/services/modules/temporal-service";
import type { TemporalData } from "@repo/services/schemas/temporal";
import type {
  RelationshipCategoryMeta,
  RelationshipVocabulary,
} from "@repo/services/schemas/relationship-vocabulary";

/**
 * A minimally-typed relationship row — the fields the detail page reads off a
 * `character_relationships` row. Kept structural so both the generated row type
 * and test fixtures satisfy it.
 */
export interface RelationshipLike {
  id: string;
  character_id: string;
  related_character_id: string;
  relationship_type: string;
  relationship_role: string | null;
  start_temporal: unknown;
  end_temporal: unknown;
  description: string | null;
}

/**
 * Grouping for the collapsible Relationships tab comes from the vocabulary's
 * `relationship_categories` (#419), so the read view and the add sheet agree by
 * construction rather than by two hand-maintained lists staying in sync.
 */
export type RelationshipFamilyKey = string;

/** Bucket for relationships whose type is absent from the vocabulary. */
export const UNGROUPED_FAMILY_KEY = "other";

/**
 * Category key for a relationship type. Types the vocabulary doesn't know about
 * — retired, or added since this client fetched — land in their own bucket
 * rather than being silently mis-filed under an unrelated heading.
 */
export function familyForType(
  type: string,
  vocabulary: RelationshipVocabulary,
): RelationshipFamilyKey {
  return vocabulary.get(type)?.category_key ?? UNGROUPED_FAMILY_KEY;
}

/** The id of the character on the other end of a relationship from `focalId`. */
export function otherCharacterId(
  rel: Pick<RelationshipLike, "character_id" | "related_character_id">,
  focalId: string,
): string {
  return rel.character_id === focalId
    ? rel.related_character_id
    : rel.character_id;
}

/**
 * Groups relationships by vocabulary category, preserving input order within
 * each group. Only non-empty groups are returned, in the order the categories
 * declare via `sort_order`. Relationships whose type is unknown to the
 * vocabulary are collected into a trailing "Other" group so nothing silently
 * disappears from the tab.
 */
export function groupRelationshipsByFamily<T extends RelationshipLike>(
  relationships: T[],
  categories: readonly RelationshipCategoryMeta[],
  vocabulary: RelationshipVocabulary,
): Array<{ key: RelationshipFamilyKey; legend: string; items: T[] }> {
  const groups = categories.map((category) => ({
    key: category.key,
    legend: category.label,
    items: relationships.filter(
      (rel) =>
        familyForType(rel.relationship_type, vocabulary) === category.key,
    ),
  }));

  const ungrouped = relationships.filter(
    (rel) => !vocabulary.has(rel.relationship_type),
  );
  if (ungrouped.length > 0) {
    groups.push({
      key: UNGROUPED_FAMILY_KEY,
      legend: "Other",
      items: ungrouped,
    });
  }

  return groups.filter((group) => group.items.length > 0);
}

const humanize = (value: string): string => value.replace(/_/g, " ");

/**
 * Narrative direction line for a relationship, rendered for *every* type per
 * the #57 card contract ("direction as narrative text, never an arrow/glyph"):
 * - directed types use their `direction_verb` ("Marie mentors Pierre"),
 * - any sub-role reads as "Marie is the parent of Irène" (paired or symmetric),
 * - symmetric types use their `symmetric_noun` ("Marie and Pierre are friends").
 *
 * Both phrases come from `relationship_types` (#419) rather than hard-coded
 * maps, so a type added through the admin UI reads correctly with no code
 * change — provided its `direction_verb`/`symmetric_noun` are filled in. A type
 * with neither falls back to a bare "X — Y".
 *
 * Rendered from the stored row's own subject/object (character_id →
 * related_character_id), so it reads correctly regardless of which end is the
 * focal character.
 */
export function directionLabel(
  rel: Pick<
    RelationshipLike,
    "relationship_type" | "relationship_role" | "character_id"
  >,
  names: { subjectName: string; objectName: string },
  vocabulary: RelationshipVocabulary,
): string {
  const { subjectName, objectName } = names;
  const meta = vocabulary.get(rel.relationship_type);

  if (meta?.direction_verb) {
    return `${subjectName} ${meta.direction_verb} ${objectName}`;
  }
  // Any concrete sub-role reads naturally as "X is the <role> of Y". "other" is
  // not a meaningful role name, so it falls through to the type-noun phrasing.
  if (rel.relationship_role && rel.relationship_role !== "other") {
    return `${subjectName} is the ${humanize(rel.relationship_role)} of ${objectName}`;
  }
  if (meta?.symmetric_noun) {
    return `${subjectName} and ${objectName} are ${meta.symmetric_noun}`;
  }
  return `${subjectName} — ${objectName}`;
}

/** First-letter initials (max two) for an avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Whole years lived between two temporal points, or `null` when it can't be
 * meaningfully computed. Restricted to CE/BCE eras — a "lived N years" figure
 * is meaningless at geological/cosmological (KYA/MYA/BYA) scale.
 */
export function livedYears(
  birth: TemporalData | null | undefined,
  death: TemporalData | null | undefined,
): number | null {
  if (!birth || !death) return null;
  const yearScaleEras = new Set(["CE", "BCE"]);
  if (!yearScaleEras.has(birth.era) || !yearScaleEras.has(death.era)) {
    return null;
  }
  const span =
    TemporalService.toSortableYears(death) -
    TemporalService.toSortableYears(birth);
  if (!Number.isFinite(span) || span < 0) return null;
  return Math.floor(span);
}
