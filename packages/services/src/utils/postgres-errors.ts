/**
 * Shared mapping from Postgres error codes to messages a person can act on.
 *
 * PostgREST surfaces constraint violations as a code plus raw Postgres text
 * naming a constraint the caller has never heard of ("violates foreign key
 * constraint character_relationships_relationship_type_fkey"). Every write path
 * that can trip a constraint needs to turn that into a sentence.
 *
 * Scope note: `character-relationship-service.ts` predates this module and
 * carries its own private `describeVocabularyViolation`. Migrating it here is
 * deliberately out of scope for #428 — that service's mapping is entangled with
 * its reciprocal-write logic and moving it would put an untested refactor in an
 * unrelated PR. New write paths should use this module.
 */

/** The subset of a PostgrestError this module reads. */
export interface PostgresErrorLike {
  code?: string | null;
  message: string;
  details?: string | null;
  hint?: string | null;
}

/** Postgres SQLSTATE codes this module recognizes. */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FOREIGN_KEY_VIOLATION = "23503";
export const PG_CHECK_VIOLATION = "23514";
export const PG_NOT_NULL_VIOLATION = "23502";

/**
 * A rule matching one constraint by name. The first rule whose `constraint`
 * appears in the error's message/details/hint wins, so list more specific
 * constraint names before prefixes of them.
 */
export interface ConstraintMessage {
  /** Constraint name as it appears in the Postgres error text. */
  constraint: string;
  /** Message to surface instead. */
  message: string;
}

export interface DescribePostgresErrorOptions {
  /**
   * Constraint-specific overrides, checked before the generic per-code
   * fallbacks. This is how a caller distinguishes two 23503s on the same row.
   */
  constraints?: readonly ConstraintMessage[];
  /**
   * Fallbacks keyed by SQLSTATE, used when no constraint rule matched. Lets a
   * caller say "any unique violation here means a duplicate key" without
   * naming the index.
   */
  byCode?: Partial<Record<string, string>>;
}

/**
 * Everything Postgres tells us about which constraint failed, flattened into
 * one string. `message` alone is not enough: PostgREST puts the constraint name
 * in `details` for some violations and in `message` for others.
 */
function haystackOf(error: PostgresErrorLike): string {
  return `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`;
}

/**
 * Translate a Postgres error into a user-facing message.
 *
 * Resolution order: a matching `constraints` rule, then a `byCode` fallback,
 * then the raw `message`. Passing the original message through unchanged is
 * deliberate — an unrecognized failure should stay legible to whoever debugs
 * it rather than collapse into "something went wrong".
 */
export function describePostgresError(
  error: PostgresErrorLike,
  options: DescribePostgresErrorOptions = {},
): string {
  const haystack = haystackOf(error);

  for (const rule of options.constraints ?? []) {
    if (haystack.includes(rule.constraint)) {
      return rule.message;
    }
  }

  // An absent code must not be coerced to "" — that would let a `byCode` entry
  // keyed on the empty string swallow every codeless error.
  if (error.code != null) {
    const byCode = options.byCode?.[error.code];
    if (byCode !== undefined) {
      return byCode;
    }
  }

  return error.message;
}

/** True when `error` is the given SQLSTATE. */
export function isPostgresCode(
  error: PostgresErrorLike | null | undefined,
  code: string,
): boolean {
  return error?.code === code;
}

/**
 * True when the error is a foreign-key violation raised by `ON DELETE RESTRICT`
 * — i.e. "something still references this row".
 *
 * Callers use it to distinguish "you cannot delete this because it is in use"
 * (recoverable, offer deactivation) from "the row you referenced does not
 * exist" (a bug), which share code 23503 and differ only by which side of the
 * FK failed. The constraint name identifies the referencing table.
 */
export function isRestrictViolation(
  error: PostgresErrorLike | null | undefined,
  referencingConstraint: string,
): boolean {
  if (!error || error.code !== PG_FOREIGN_KEY_VIOLATION) {
    return false;
  }
  return haystackOf(error).includes(referencingConstraint);
}
