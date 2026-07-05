import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import {
  getStories,
  getStoryById,
  getStoryBySlug,
  getStoryEvents,
  createStory,
  updateStory,
  deleteStory,
  addCharacterToStory,
  removeCharacterFromStory,
  updateStoryCharacterRole,
  addEventToStory,
  removeEventFromStory,
  reorderStoryEvent,
  addPeriodToStory,
  removePeriodFromStory,
} from "./story-service";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: terminal,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return builder;
}

function makeClient(overrides: {
  fromResult?: { data: unknown; error: unknown };
  authUser?: { data: { user: unknown }; error: unknown };
}) {
  const { fromResult = { data: null, error: null }, authUser } = overrides;
  return {
    from: vi.fn().mockReturnValue(makeBuilder(fromResult)),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue(
          authUser ?? { data: { user: { id: "user-123" } }, error: null },
        ),
    },
  } as unknown as SupabaseClient<Database>;
}

// createStory: call 1 = slug fetch, call 2 = insert
function makeCreateClient(insertResult: { data: unknown; error: unknown }) {
  const slugBuilder = makeBuilder({ data: [], error: null });
  const insertBuilder = makeBuilder(insertResult);
  let callCount = 0;
  return {
    from: vi.fn().mockImplementation(() => {
      callCount++;
      return callCount === 1 ? slugBuilder : insertBuilder;
    }),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    },
  } as unknown as SupabaseClient<Database>;
}

// ---------------------------------------------------------------------------
// Sample fixtures
// ---------------------------------------------------------------------------

const sampleStory = {
  id: "story-1",
  user_id: "user-123",
  slug: "my-story",
  title: "My Story",
  sub_title: null,
  summary: "A tale",
  detail: null,
  perspective_character_id: null,
  narrator_type: "third_person",
  tags: ["history"],
  search_vector: null,
  published: false,
  published_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const sampleStoryWithRelations = {
  ...sampleStory,
  story_periods: [],
  story_characters: [],
  story_events: [],
};

// ---------------------------------------------------------------------------
// getStories
// ---------------------------------------------------------------------------

describe("getStories", () => {
  it("returns an array of stories", async () => {
    const client = makeClient({
      fromResult: { data: [sampleStory], error: null },
    });
    const result = await getStories(client);
    expect(result).toEqual([sampleStory]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getStories(client)).toEqual([]);
  });

  it("applies userId filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getStories(client, { userId: "user-abc" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-abc");
  });

  it("applies narratorType filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getStories(client, { narratorType: "omniscient" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("narrator_type", "omniscient");
  });

  it("applies search filter via full-text search on search_vector", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getStories(client, { search: "medieval" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "medieval",
      { type: "websearch" },
    );
  });

  it("does not apply textSearch when search string is empty", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getStories(client, { search: "  " });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.textSearch).not.toHaveBeenCalled();
  });

  it("throws on query error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(getStories(client)).rejects.toThrow(
      "StoryService.getStories: db error",
    );
  });
});

// ---------------------------------------------------------------------------
// getStoryById
// ---------------------------------------------------------------------------

describe("getStoryById", () => {
  it("returns the story with relations", async () => {
    const client = makeClient({
      fromResult: { data: sampleStoryWithRelations, error: null },
    });
    const result = await getStoryById(client, "story-1");
    expect(result).toEqual(sampleStoryWithRelations);
  });

  it("throws on error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getStoryById(client, "story-1")).rejects.toThrow(
      "StoryService.getStoryById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// getStoryBySlug
// ---------------------------------------------------------------------------

describe("getStoryBySlug", () => {
  it("returns the story with relations", async () => {
    const client = makeClient({
      fromResult: { data: sampleStoryWithRelations, error: null },
    });
    const result = await getStoryBySlug(client, "user-123", "my-story");
    expect(result).toEqual(sampleStoryWithRelations);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(builder.eq).toHaveBeenCalledWith("slug", "my-story");
  });

  it("throws on error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getStoryBySlug(client, "user-123", "missing")).rejects.toThrow(
      "StoryService.getStoryBySlug: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// createStory
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// getStoryEvents
// ---------------------------------------------------------------------------

/** Build a story_events select result: rows of { sort_order, events }. */
function eventJunction(id: string, sortOrder: number, sortOrderYears: number) {
  return {
    sort_order: sortOrder,
    events: { id, sort_order_years: sortOrderYears },
  };
}

describe("getStoryEvents", () => {
  it("returns editorial order when any junction sort_order is non-zero, pushing 0s last", async () => {
    // Chronology is deliberately the reverse of editorial order to prove
    // editorial wins. The sort_order=0 event lands last regardless of its date.
    const rows = [
      eventJunction("c", 3, 100),
      eventJunction("a", 1, 300),
      eventJunction("z", 0, 50),
      eventJunction("b", 2, 200),
    ];
    const client = makeClient({ fromResult: { data: rows, error: null } });
    const result = await getStoryEvents(client, "story-1");
    expect(result.map((e) => e.id)).toEqual(["a", "b", "c", "z"]);
    expect(result.map((e) => e.junction_sort_order)).toEqual([1, 2, 3, 0]);
  });

  it("falls back to chronological order (sort_order_years) when all sort_order are 0", async () => {
    const rows = [
      eventJunction("late", 0, 900),
      eventJunction("early", 0, 100),
      eventJunction("mid", 0, 500),
    ];
    const client = makeClient({ fromResult: { data: rows, error: null } });
    const result = await getStoryEvents(client, "story-1");
    expect(result.map((e) => e.id)).toEqual(["early", "mid", "late"]);
  });

  it("uses a deterministic id tie-break when chronology is equal", async () => {
    const rows = [
      eventJunction("bravo", 0, 100),
      eventJunction("alpha", 0, 100),
    ];
    const client = makeClient({ fromResult: { data: rows, error: null } });
    const result = await getStoryEvents(client, "story-1");
    expect(result.map((e) => e.id)).toEqual(["alpha", "bravo"]);
  });

  it("sorts undated events (null sort_order_years) last, with a stable order among them", async () => {
    const rows = [
      { sort_order: 0, events: { id: "undated-b", sort_order_years: null } },
      eventJunction("dated", 0, 100),
      { sort_order: 0, events: { id: "undated-a", sort_order_years: null } },
    ];
    const client = makeClient({ fromResult: { data: rows, error: null } });
    const result = await getStoryEvents(client, "story-1");
    // Dated event first; the two undated events follow in id order (no NaN from
    // comparing two +Infinity chronologies).
    expect(result.map((e) => e.id)).toEqual([
      "dated",
      "undated-a",
      "undated-b",
    ]);
  });

  it("returns an empty array when the story has no events", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await expect(getStoryEvents(client, "story-1")).resolves.toEqual([]);
  });

  it("skips junction rows with a null event embed", async () => {
    const rows = [{ sort_order: 0, events: null }, eventJunction("a", 0, 100)];
    const client = makeClient({ fromResult: { data: rows, error: null } });
    const result = await getStoryEvents(client, "story-1");
    expect(result.map((e) => e.id)).toEqual(["a"]);
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "boom" } },
    });
    await expect(getStoryEvents(client, "story-1")).rejects.toThrow(
      "StoryService.getStoryEvents: boom",
    );
  });
});

describe("createStory", () => {
  it("creates and returns a new story", async () => {
    const client = makeCreateClient({ data: sampleStory, error: null });
    const result = await createStory(client, { title: "My Story" });
    expect(result).toEqual(sampleStory);
  });

  it("uses an explicit slug when provided", async () => {
    const client = makeCreateClient({ data: sampleStory, error: null });
    const result = await createStory(client, {
      title: "My Story",
      slug: "custom-slug",
    });
    expect(result).toEqual(sampleStory);
  });

  it("throws when auth fails", async () => {
    const client = makeCreateClient({ data: null, error: null });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "auth error" },
    });
    await expect(createStory(client, { title: "Test" })).rejects.toThrow(
      "StoryService.createStory.getUser: auth error",
    );
  });

  it("throws when user is null despite no auth error", async () => {
    const client = makeCreateClient({ data: null, error: null });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    await expect(createStory(client, { title: "Test" })).rejects.toThrow(
      "StoryService.createStory: no authenticated user",
    );
  });

  it("throws when narrator_type is invalid", async () => {
    const client = makeCreateClient({ data: null, error: null });
    await expect(
      // @ts-expect-error intentionally invalid narrator_type
      createStory(client, { title: "Test", narrator_type: "second_person" }),
    ).rejects.toThrow();
  });

  it("retries on a 23505 unique violation and succeeds", async () => {
    let callCount = 0;
    const client = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeBuilder({ data: [], error: null });
        if (callCount === 2) {
          return makeBuilder({
            data: null,
            error: { code: "23505", message: "unique violation" },
          });
        }
        return makeBuilder({ data: sampleStory, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await createStory(client, { title: "My Story" });
    expect(result).toEqual(sampleStory);
    expect(callCount).toBe(3);
  });

  it("propagates a non-collision insert error", async () => {
    const client = makeCreateClient({
      data: null,
      error: { message: "insert failed" },
    });
    await expect(createStory(client, { title: "My Story" })).rejects.toThrow(
      "StoryService.createStory: insert failed",
    );
  });

  it("rejects first_person without a perspective character", async () => {
    const client = makeCreateClient({ data: sampleStory, error: null });
    await expect(
      createStory(client, { title: "Voiced", narrator_type: "first_person" }),
    ).rejects.toThrow();
  });

  it("accepts first_person when a perspective character is provided", async () => {
    const client = makeCreateClient({ data: sampleStory, error: null });
    const result = await createStory(client, {
      title: "Voiced",
      narrator_type: "first_person",
      perspective_character_id: "11111111-1111-4111-8111-111111111111",
    });
    expect(result).toEqual(sampleStory);
  });

  it.each(["third_person", "omniscient"] as const)(
    "does not require a perspective character for %s",
    async (narrator_type) => {
      const client = makeCreateClient({ data: sampleStory, error: null });
      const result = await createStory(client, {
        title: "Unvoiced",
        narrator_type,
      });
      expect(result).toEqual(sampleStory);
    },
  );
});

// ---------------------------------------------------------------------------
// updateStory
// ---------------------------------------------------------------------------

describe("updateStory", () => {
  it("returns the updated story", async () => {
    const client = makeClient({
      fromResult: { data: sampleStory, error: null },
    });
    const result = await updateStory(client, "story-1", {
      title: "Updated Title",
    });
    expect(result).toEqual(sampleStory);
  });

  it("throws on validation error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      // @ts-expect-error intentionally invalid narrator_type
      updateStory(client, "story-1", { narrator_type: "bad-value" }),
    ).rejects.toThrow();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(
      updateStory(client, "story-1", { title: "X" }),
    ).rejects.toThrow("StoryService.updateStory: update failed");
  });

  it("rejects a patch that switches to first_person while clearing the perspective", async () => {
    const client = makeClient({
      fromResult: { data: sampleStory, error: null },
    });
    await expect(
      updateStory(client, "story-1", {
        narrator_type: "first_person",
        perspective_character_id: null,
      }),
    ).rejects.toThrow(
      "StoryService.updateStory: perspective_character_id is required",
    );
    // Guard runs before any DB call.
    expect(client.from).not.toHaveBeenCalled();
  });

  it("permits a patch that does not touch narrator_type", async () => {
    const client = makeClient({
      fromResult: { data: sampleStory, error: null },
    });
    await expect(
      updateStory(client, "story-1", { title: "Renamed" }),
    ).resolves.toEqual(sampleStory);
  });

  it("permits switching to first_person alongside a perspective character", async () => {
    const client = makeClient({
      fromResult: { data: sampleStory, error: null },
    });
    await expect(
      updateStory(client, "story-1", {
        narrator_type: "first_person",
        perspective_character_id: "11111111-1111-4111-8111-111111111111",
      }),
    ).resolves.toEqual(sampleStory);
  });

  it("rejects clearing the perspective when narrator_type is not in the patch", async () => {
    // An existing first_person story could be stranded invalid; the service
    // cannot see the stored narrator_type, so it rejects the bare clear.
    const client = makeClient({
      fromResult: { data: sampleStory, error: null },
    });
    await expect(
      updateStory(client, "story-1", { perspective_character_id: null }),
    ).rejects.toThrow(
      "StoryService.updateStory: perspective_character_id is required",
    );
    expect(client.from).not.toHaveBeenCalled();
  });

  it("permits clearing the perspective when the patch declares a non-first-person narrator", async () => {
    const client = makeClient({
      fromResult: { data: sampleStory, error: null },
    });
    await expect(
      updateStory(client, "story-1", {
        narrator_type: "third_person",
        perspective_character_id: null,
      }),
    ).resolves.toEqual(sampleStory);
  });
});

// ---------------------------------------------------------------------------
// deleteStory
// ---------------------------------------------------------------------------

describe("deleteStory", () => {
  it("resolves without error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(deleteStory(client, "story-1")).resolves.toBeUndefined();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(deleteStory(client, "story-1")).rejects.toThrow(
      "StoryService.deleteStory: delete failed",
    );
  });
});

// ---------------------------------------------------------------------------
// addCharacterToStory / removeCharacterFromStory
// ---------------------------------------------------------------------------

describe("addCharacterToStory", () => {
  it("returns the created junction row", async () => {
    const row = {
      story_id: "story-1",
      character_id: "char-1",
      role_in_story: "protagonist",
    };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addCharacterToStory(
      client,
      "story-1",
      "char-1",
      "protagonist",
    );
    expect(result).toEqual(row);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      story_id: "story-1",
      character_id: "char-1",
      role_in_story: "protagonist",
    });
  });

  it("defaults role_in_story to 'mentioned'", async () => {
    const client = makeClient({ fromResult: { data: {}, error: null } });
    await addCharacterToStory(client, "story-1", "char-1");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ role_in_story: "mentioned" }),
    );
  });

  it.each(["supporting", "narrator"] as const)(
    "accepts the %s role",
    async (role) => {
      const client = makeClient({ fromResult: { data: {}, error: null } });
      await addCharacterToStory(client, "story-1", "char-1", role);
      const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
        ?.value as ReturnType<typeof makeBuilder>;
      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ role_in_story: role }),
      );
    },
  );

  it("rejects an invalid role before hitting the DB", async () => {
    const client = makeClient({ fromResult: { data: {}, error: null } });
    await expect(
      // @ts-expect-error intentionally invalid role
      addCharacterToStory(client, "story-1", "char-1", "villain"),
    ).rejects.toThrow();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "conflict" } },
    });
    await expect(
      addCharacterToStory(client, "story-1", "char-1"),
    ).rejects.toThrow("StoryService.addCharacterToStory: conflict");
  });
});

describe("updateStoryCharacterRole", () => {
  it.each(["protagonist", "supporting", "mentioned", "narrator"] as const)(
    "updates the role to %s",
    async (role) => {
      const row = {
        story_id: "story-1",
        character_id: "char-1",
        role_in_story: role,
      };
      const client = makeClient({ fromResult: { data: row, error: null } });
      const result = await updateStoryCharacterRole(
        client,
        "story-1",
        "char-1",
        role,
      );
      expect(result).toEqual(row);
      const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
        ?.value as ReturnType<typeof makeBuilder>;
      expect(builder.update).toHaveBeenCalledWith({ role_in_story: role });
      expect(builder.eq).toHaveBeenCalledWith("story_id", "story-1");
      expect(builder.eq).toHaveBeenCalledWith("character_id", "char-1");
    },
  );

  it("rejects an invalid role before hitting the DB", async () => {
    const client = makeClient({ fromResult: { data: {}, error: null } });
    await expect(
      // @ts-expect-error intentionally invalid role
      updateStoryCharacterRole(client, "story-1", "char-1", "sidekick"),
    ).rejects.toThrow();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "failed" } },
    });
    await expect(
      updateStoryCharacterRole(client, "story-1", "char-1", "protagonist"),
    ).rejects.toThrow("StoryService.updateStoryCharacterRole: failed");
  });
});

describe("removeCharacterFromStory", () => {
  it("resolves without error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeCharacterFromStory(client, "story-1", "char-1"),
    ).resolves.toBeUndefined();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "failed" } },
    });
    await expect(
      removeCharacterFromStory(client, "story-1", "char-1"),
    ).rejects.toThrow("StoryService.removeCharacterFromStory: failed");
  });
});

// ---------------------------------------------------------------------------
// addEventToStory / removeEventFromStory
// ---------------------------------------------------------------------------

describe("addEventToStory", () => {
  it("returns the new junction row with default sort_order=0", async () => {
    const row = { story_id: "story-1", event_id: "event-1", sort_order: 0 };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addEventToStory(client, "story-1", "event-1");
    expect(result).toEqual(row);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      story_id: "story-1",
      event_id: "event-1",
      sort_order: 0,
    });
  });

  it("accepts an explicit sort_order", async () => {
    const row = { story_id: "story-1", event_id: "event-1", sort_order: 5 };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addEventToStory(client, "story-1", "event-1", 5);
    expect(result.sort_order).toBe(5);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      story_id: "story-1",
      event_id: "event-1",
      sort_order: 5,
    });
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "conflict" } },
    });
    await expect(addEventToStory(client, "story-1", "event-1")).rejects.toThrow(
      "StoryService.addEventToStory: conflict",
    );
  });
});

describe("removeEventFromStory", () => {
  it("resolves without error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeEventFromStory(client, "story-1", "event-1"),
    ).resolves.toBeUndefined();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "failed" } },
    });
    await expect(
      removeEventFromStory(client, "story-1", "event-1"),
    ).rejects.toThrow("StoryService.removeEventFromStory: failed");
  });
});

// ---------------------------------------------------------------------------
// reorderStoryEvent
// ---------------------------------------------------------------------------

describe("reorderStoryEvent", () => {
  it("upserts the junction row with the new sort_order and onConflict keys", async () => {
    const row = { story_id: "story-1", event_id: "event-1", sort_order: 3 };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await reorderStoryEvent(client, "story-1", "event-1", 3);
    expect(result.sort_order).toBe(3);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.upsert).toHaveBeenCalledWith(
      { story_id: "story-1", event_id: "event-1", sort_order: 3 },
      { onConflict: "story_id,event_id" },
    );
  });

  it("creates the junction row when the link does not yet exist (upsert)", async () => {
    // A not-yet-linked (story, event) pair: upsert returns the freshly created row
    // rather than silently affecting zero rows.
    const created = {
      story_id: "story-1",
      event_id: "new-event",
      sort_order: 1,
    };
    const client = makeClient({ fromResult: { data: created, error: null } });
    const result = await reorderStoryEvent(client, "story-1", "new-event", 1);
    expect(result).toEqual(created);
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(
      reorderStoryEvent(client, "story-1", "event-1", 3),
    ).rejects.toThrow("StoryService.reorderStoryEvent: not found");
  });
});

// ---------------------------------------------------------------------------
// addPeriodToStory / removePeriodFromStory
// ---------------------------------------------------------------------------

describe("addPeriodToStory", () => {
  it("returns the created junction row", async () => {
    const row = { story_id: "story-1", period_id: "period-1" };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addPeriodToStory(client, "story-1", "period-1");
    expect(result).toEqual(row);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      story_id: "story-1",
      period_id: "period-1",
    });
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "conflict" } },
    });
    await expect(
      addPeriodToStory(client, "story-1", "period-1"),
    ).rejects.toThrow("StoryService.addPeriodToStory: conflict");
  });
});

describe("removePeriodFromStory", () => {
  it("resolves without error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removePeriodFromStory(client, "story-1", "period-1"),
    ).resolves.toBeUndefined();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "failed" } },
    });
    await expect(
      removePeriodFromStory(client, "story-1", "period-1"),
    ).rejects.toThrow("StoryService.removePeriodFromStory: failed");
  });
});
