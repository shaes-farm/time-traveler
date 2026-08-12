import { describe, it, expect } from "vitest";
import {
  describePostgresError,
  isPostgresCode,
  isRestrictViolation,
  PG_CHECK_VIOLATION,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
} from "./postgres-errors";

describe("describePostgresError", () => {
  it("prefers a matching constraint rule over the code fallback", () => {
    const message = describePostgresError(
      {
        code: PG_FOREIGN_KEY_VIOLATION,
        message:
          'update or delete on table "relationship_types" violates foreign key constraint "character_relationships_relationship_type_fkey"',
      },
      {
        constraints: [
          {
            constraint: "character_relationships_relationship_type_fkey",
            message: "Relationships still use this type.",
          },
        ],
        byCode: { [PG_FOREIGN_KEY_VIOLATION]: "generic fk failure" },
      },
    );
    expect(message).toBe("Relationships still use this type.");
  });

  it("matches a constraint named only in `details`", () => {
    // PostgREST puts the constraint name in `details` for some violations and
    // in `message` for others, so both have to be searched.
    const message = describePostgresError(
      {
        code: PG_FOREIGN_KEY_VIOLATION,
        message: "insert or update violates foreign key constraint",
        details: 'Key (category_key)=(nope) is not present in table "…fkey".',
      },
      {
        constraints: [
          { constraint: "…fkey", message: "That group doesn't exist." },
        ],
      },
    );
    expect(message).toBe("That group doesn't exist.");
  });

  it("takes the first matching rule when several could match", () => {
    const message = describePostgresError(
      { code: PG_FOREIGN_KEY_VIOLATION, message: "a_fkey and b_fkey" },
      {
        constraints: [
          { constraint: "a_fkey", message: "first" },
          { constraint: "b_fkey", message: "second" },
        ],
      },
    );
    expect(message).toBe("first");
  });

  it("falls back to the code message when no constraint matches", () => {
    const message = describePostgresError(
      {
        code: PG_UNIQUE_VIOLATION,
        message: 'duplicate key value violates unique constraint "some_pkey"',
      },
      {
        constraints: [{ constraint: "other_fkey", message: "unused" }],
        byCode: { [PG_UNIQUE_VIOLATION]: "That key already exists." },
      },
    );
    expect(message).toBe("That key already exists.");
  });

  it("passes the raw message through when nothing matches", () => {
    // An unrecognized failure should stay legible to whoever debugs it rather
    // than collapse into a generic apology.
    const message = describePostgresError(
      { code: "42501", message: "permission denied for table x" },
      { byCode: { [PG_CHECK_VIOLATION]: "unused" } },
    );
    expect(message).toBe("permission denied for table x");
  });

  it("passes the raw message through with no options at all", () => {
    expect(describePostgresError({ message: "boom" })).toBe("boom");
  });

  it("handles a null code without matching a fallback", () => {
    expect(
      describePostgresError(
        { code: null, message: "boom" },
        { byCode: { "": "should not match" } },
      ),
    ).toBe("boom");
  });
});

describe("isPostgresCode", () => {
  it("matches the code", () => {
    expect(isPostgresCode({ code: "23503", message: "" }, "23503")).toBe(true);
  });

  it("rejects a different code, null, and undefined", () => {
    expect(isPostgresCode({ code: "23505", message: "" }, "23503")).toBe(false);
    expect(isPostgresCode(null, "23503")).toBe(false);
    expect(isPostgresCode(undefined, "23503")).toBe(false);
  });
});

describe("isRestrictViolation", () => {
  it("is true for a 23503 naming the referencing constraint", () => {
    expect(
      isRestrictViolation(
        {
          code: PG_FOREIGN_KEY_VIOLATION,
          message:
            'violates foreign key constraint "character_relationships_relationship_type_fkey"',
        },
        "character_relationships_relationship_type_fkey",
      ),
    ).toBe(true);
  });

  it("is false for a 23503 naming a different constraint", () => {
    // Both sides of an FK failure share code 23503; only the constraint name
    // says whether this is "still in use" or "you referenced a missing row".
    expect(
      isRestrictViolation(
        {
          code: PG_FOREIGN_KEY_VIOLATION,
          message:
            'violates foreign key constraint "relationship_types_category_key_fkey"',
        },
        "character_relationships_relationship_type_fkey",
      ),
    ).toBe(false);
  });

  it("is false for a non-FK code and for no error", () => {
    expect(
      isRestrictViolation(
        { code: PG_CHECK_VIOLATION, message: "some_fkey" },
        "some_fkey",
      ),
    ).toBe(false);
    expect(isRestrictViolation(null, "some_fkey")).toBe(false);
  });
});
