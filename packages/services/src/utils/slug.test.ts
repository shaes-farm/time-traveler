import { describe, expect, it } from "vitest";
import { generateSlug, resolveCollision, validateSlug } from "./slug";

// ─── generateSlug ─────────────────────────────────────────────────────────────

describe("generateSlug", () => {
  it("lowercases and hyphenates ASCII title", () => {
    expect(generateSlug("My Timeline")).toBe("my-timeline");
  });

  it("strips Latin diacritics: café → cafe", () => {
    expect(generateSlug("café")).toBe("cafe");
  });

  it("strips Latin diacritics: Ère Mésozoïque → ere-mesozoique", () => {
    expect(generateSlug("Ère Mésozoïque")).toBe("ere-mesozoique");
  });

  it("strips Latin diacritics: résumé → resume", () => {
    expect(generateSlug("résumé")).toBe("resume");
  });

  it("collapses consecutive special characters into one hyphen", () => {
    expect(generateSlug("Hello   !! World")).toBe("hello-world");
  });

  it("strips leading and trailing hyphens", () => {
    expect(generateSlug("  Hello World  ")).toBe("hello-world");
  });

  it("handles digits in the title", () => {
    expect(generateSlug("Apollo 11 Mission")).toBe("apollo-11-mission");
  });

  it("truncates at word boundary when input exceeds 100 chars", () => {
    const longTitle = "word ".repeat(25).trim(); // 124 chars
    const slug = generateSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(100);
    // Should not end with a hyphen
    expect(slug.endsWith("-")).toBe(false);
  });

  it("truncates long single-word at hard boundary when no hyphen in range", () => {
    const longWord = "a".repeat(120);
    const slug = generateSlug(longWord);
    expect(slug.length).toBe(100);
  });

  it("throws on empty string", () => {
    expect(() => generateSlug("")).toThrow();
  });

  it("throws on whitespace-only string", () => {
    expect(() => generateSlug("   ")).toThrow();
  });

  it("throws when no ASCII alphanumeric chars survive normalization", () => {
    // Pure emoji has no Latin equivalent
    expect(() => generateSlug("🌍🌎🌏")).toThrow();
  });
});

// ─── validateSlug ─────────────────────────────────────────────────────────────

describe("validateSlug", () => {
  it("returns true for a valid slug", () => {
    expect(validateSlug("my-timeline")).toBe(true);
  });

  it("returns true for an all-lowercase alphanumeric slug", () => {
    expect(validateSlug("apollo11")).toBe(true);
  });

  it("returns false for a slug with uppercase letters", () => {
    expect(validateSlug("My-Timeline")).toBe(false);
  });

  it("returns false for a slug with spaces", () => {
    expect(validateSlug("my timeline")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(validateSlug("")).toBe(false);
  });

  it("returns false for consecutive hyphens", () => {
    expect(validateSlug("my--timeline")).toBe(false);
  });

  it("returns false for a leading hyphen", () => {
    expect(validateSlug("-my-timeline")).toBe(false);
  });

  it("returns false for a trailing hyphen", () => {
    expect(validateSlug("my-timeline-")).toBe(false);
  });
});

// ─── resolveCollision ─────────────────────────────────────────────────────────

describe("resolveCollision", () => {
  it("returns base slug when not in the existing set", () => {
    expect(resolveCollision("my-timeline", new Set())).toBe("my-timeline");
  });

  it("appends '-2' when base slug is taken", () => {
    expect(resolveCollision("my-timeline", new Set(["my-timeline"]))).toBe(
      "my-timeline-2",
    );
  });

  it("increments suffix until a free slot is found", () => {
    const taken = new Set(["my-timeline", "my-timeline-2", "my-timeline-3"]);
    expect(resolveCollision("my-timeline", taken)).toBe("my-timeline-4");
  });

  it("accepts an Iterable (array) as existing slugs", () => {
    expect(resolveCollision("slug", ["slug", "slug-2"])).toBe("slug-3");
  });

  it("truncates the base so the suffixed result stays within MAX_SLUG_LENGTH", () => {
    // base slug of 98 chars — "-2" suffix makes it 100 exactly
    const base = "a".repeat(98);
    const result = resolveCollision(base, new Set([base]));
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith("-2")).toBe(true);
  });

  it("throws when baseSlug does not satisfy slugSchema (uppercase)", () => {
    expect(() => resolveCollision("My-Slug", new Set())).toThrow();
  });

  it("throws when baseSlug is empty", () => {
    expect(() => resolveCollision("", new Set())).toThrow();
  });
});
