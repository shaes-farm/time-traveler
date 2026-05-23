import { z } from "zod";

/**
 * Shared slug validator — URL-safe identifier used as the per-user unique
 * key on every content entity (events, timelines, characters, etc.).
 *
 * Constraints align with the migrations' VARCHAR(100) + per-user unique
 * index on `(user_id, slug)`. The regex is the application-layer addition
 * (DB only enforces length).
 */
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens");
