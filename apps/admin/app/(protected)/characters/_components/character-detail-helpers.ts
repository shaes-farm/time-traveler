/**
 * Pure helpers for the Character detail page — grouping relationships by type
 * family, computing narrative direction labels, and small display utilities.
 * Kept free of React/Supabase so they can be unit-tested in isolation.
 */
import { TemporalService } from "@repo/services/modules/temporal-service";
import type { TemporalData } from "@repo/services/schemas/temporal";

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
 * Relationship-type → family grouping for the collapsible Relationships tab.
 * Mirrors `TYPE_FAMILIES` in `@repo/ui/components/relationship-type-selector`
 * so the read view and the add sheet agree on where each type lives.
 */
export const RELATIONSHIP_FAMILIES = [
  { key: "family", legend: "Family", types: ["family"] },
  {
    key: "professional",
    legend: "Professional",
    types: ["professional", "collaboration"],
  },
  {
    key: "social",
    legend: "Social / Personal",
    types: ["friendship", "rivalry"],
  },
  { key: "antagonistic", legend: "Antagonistic", types: ["enemy"] },
  {
    key: "asymmetric",
    legend: "Asymmetric",
    types: [
      "mentor_student",
      "owner_pet",
      "trainer_trainee",
      "creator_creation",
      "worship",
    ],
  },
] as const;

export type RelationshipFamilyKey =
  (typeof RELATIONSHIP_FAMILIES)[number]["key"];

const TYPE_TO_FAMILY: Record<string, RelationshipFamilyKey> =
  Object.fromEntries(
    RELATIONSHIP_FAMILIES.flatMap((f) => f.types.map((t) => [t, f.key])),
  ) as Record<string, RelationshipFamilyKey>;

/** Family key for a relationship type; falls back to "social" for unknowns. */
export function familyForType(type: string): RelationshipFamilyKey {
  return TYPE_TO_FAMILY[type] ?? "social";
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
 * Groups relationships into families, preserving the input order within each
 * family. Only families that have at least one relationship are returned, in
 * the canonical `RELATIONSHIP_FAMILIES` order.
 */
export function groupRelationshipsByFamily<T extends RelationshipLike>(
  relationships: T[],
): Array<{ key: RelationshipFamilyKey; legend: string; items: T[] }> {
  return RELATIONSHIP_FAMILIES.map((family) => ({
    key: family.key,
    legend: family.legend,
    items: relationships.filter(
      (rel) => familyForType(rel.relationship_type) === family.key,
    ),
  })).filter((group) => group.items.length > 0);
}

const humanize = (value: string): string => value.replace(/_/g, " ");

/** Verb phrases for the five asymmetric types (subject → object). */
const ASYMMETRIC_VERB: Record<string, string> = {
  mentor_student: "mentors",
  owner_pet: "owns",
  trainer_trainee: "trains",
  creator_creation: "created",
  worship: "worships",
};

/**
 * Plural noun phrase for type-only symmetric relationships that carry no
 * sub-role, e.g. friendship → "Marie and Pierre are friends".
 */
const SYMMETRIC_TYPE_NOUN: Record<string, string> = {
  friendship: "friends",
  rivalry: "rivals",
  enemy: "enemies",
  collaboration: "collaborators",
  professional: "colleagues",
  family: "relatives",
};

/**
 * Narrative direction line for a relationship, rendered for *every* type per
 * the #57 card contract ("direction as narrative text, never an arrow/glyph"):
 * - asymmetric types use a verb phrase ("Marie mentors Pierre"),
 * - any sub-role reads as "Marie is the parent of Irène" (paired or symmetric),
 * - type-only symmetric types get a plural noun ("Marie and Pierre are friends").
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
): string {
  const { subjectName, objectName } = names;
  const verb = ASYMMETRIC_VERB[rel.relationship_type];
  if (verb) {
    return `${subjectName} ${verb} ${objectName}`;
  }
  // Any concrete sub-role reads naturally as "X is the <role> of Y". "other" is
  // not a meaningful role name, so it falls through to the type-noun phrasing.
  if (rel.relationship_role && rel.relationship_role !== "other") {
    return `${subjectName} is the ${humanize(rel.relationship_role)} of ${objectName}`;
  }
  const noun = SYMMETRIC_TYPE_NOUN[rel.relationship_type];
  if (noun) {
    return `${subjectName} and ${objectName} are ${noun}`;
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
