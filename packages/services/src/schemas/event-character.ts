import { z } from "zod";

/**
 * Role of a character's participation in an event, per the DB CHECK
 * constraint on `event_characters.role`
 * (supabase/migrations/00002_relationships_junctions.sql).
 */
export const characterRoleEnum = z.enum([
  "protagonist",
  "antagonist",
  "witness",
  "participant",
  "victim",
  "beneficiary",
  "performer",
  "competitor",
  "owner",
  "creator",
  "observer",
]);

/**
 * Significance of a character's participation in an event, per the DB CHECK
 * constraint on `event_characters.significance`. Distinct from
 * `significanceEnum` in ./character.ts, which governs the unrelated
 * `characters.significance` field with a different value set.
 */
export const eventCharacterSignificanceEnum = z.enum([
  "primary",
  "secondary",
  "minor",
  "mentioned",
]);
