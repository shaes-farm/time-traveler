import { describe, expect, it } from "vitest";
import {
  characterRoleEnum,
  eventCharacterSignificanceEnum,
} from "./event-character";

describe("characterRoleEnum", () => {
  it.each(characterRoleEnum.options)("accepts role '%s'", (role) => {
    expect(characterRoleEnum.safeParse(role).success).toBe(true);
  });

  it("rejects an invalid role", () => {
    expect(characterRoleEnum.safeParse("hero").success).toBe(false);
  });
});

describe("eventCharacterSignificanceEnum", () => {
  it.each(eventCharacterSignificanceEnum.options)(
    "accepts significance '%s'",
    (sig) => {
      expect(eventCharacterSignificanceEnum.safeParse(sig).success).toBe(true);
    },
  );

  it("rejects an invalid significance", () => {
    expect(eventCharacterSignificanceEnum.safeParse("legendary").success).toBe(
      false,
    );
  });
});
