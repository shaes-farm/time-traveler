import { MAX_SLUG_LENGTH, slugSchema } from "../schemas/slug.js";

/**
 * Converts an arbitrary title to a URL-safe slug:
 * - Unicode NFKD normalization + combining-mark strip folds most Latin
 *   diacritics to ASCII (café → cafe, résumé → resume, naïve → naive).
 *   Non-Latin scripts (中文, العربية, emoji) drop out and will throw if
 *   nothing usable remains.
 * - Anything not in [a-z0-9] becomes a single hyphen, runs collapse, and
 *   leading/trailing hyphens are trimmed.
 * - Result is truncated to MAX_SLUG_LENGTH at a word (hyphen) boundary when
 *   possible — falls back to a hard cut if no boundary exists in range.
 *
 * Throws when the input is empty/whitespace-only or yields nothing usable
 * after normalization (e.g., a pure-emoji title).
 */
export function generateSlug(title: string): string {
  if (title.trim().length === 0) {
    throw new Error("slug cannot be generated from empty or whitespace-only input");
  }

  const normalized = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length === 0) {
    throw new Error(
      `slug cannot be generated from "${title}" — no ASCII alphanumeric characters survived normalization`,
    );
  }

  return truncateAtBoundary(normalized, MAX_SLUG_LENGTH);
}

/**
 * Returns true when `slug` matches the canonical form enforced by
 * `slugSchema`: lowercase alphanumeric segments separated by single hyphens,
 * 1–MAX_SLUG_LENGTH chars, no leading/trailing/consecutive hyphens.
 */
export function validateSlug(slug: string): boolean {
  return slugSchema.safeParse(slug).success;
}

/**
 * Returns `baseSlug` if it doesn't collide with `existingSlugs`; otherwise
 * appends the smallest numeric suffix ≥ 2 (`my-title-2`, `my-title-3`, ...)
 * that's free. Truncates the base when necessary so the suffixed result
 * stays within MAX_SLUG_LENGTH.
 *
 * `baseSlug` must already satisfy `slugSchema` (typically produced by
 * `generateSlug`) — throws otherwise so callers fail fast rather than
 * producing a colliding-but-still-invalid slug downstream.
 */
export function resolveCollision(
  baseSlug: string,
  existingSlugs: Iterable<string>,
): string {
  if (!validateSlug(baseSlug)) {
    throw new Error(
      `resolveCollision requires baseSlug to satisfy slugSchema — got "${baseSlug}"`,
    );
  }

  const taken = existingSlugs instanceof Set ? existingSlugs : new Set(existingSlugs);
  if (!taken.has(baseSlug)) return baseSlug;

  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const room = MAX_SLUG_LENGTH - suffix.length;
    const truncated = baseSlug.length > room ? truncateAtBoundary(baseSlug, room) : baseSlug;
    const candidate = `${truncated}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

function truncateAtBoundary(slug: string, maxLength: number): string {
  if (slug.length <= maxLength) return slug;
  const window = slug.slice(0, maxLength);
  const lastHyphen = window.lastIndexOf("-");
  return lastHyphen > 0 ? window.slice(0, lastHyphen) : window;
}
