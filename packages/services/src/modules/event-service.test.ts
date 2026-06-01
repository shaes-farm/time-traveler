import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types.js";
import {
  getEvents,
  getEventById,
  getEventBySlug,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  getChildEvents,
  setParentEvent,
  setEventDetailTimeline,
  getEventsDetailedBy,
  getEventsInTemporalRange,
  addCategoryToEvent,
  removeCategoryFromEvent,
  addMediaToEvent,
  removeMediaFromEvent,
  addCharacterToEvent,
  removeCharacterFromEvent,
  getEventParticipants,
} from "./event-service.js";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
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

  const client = {
    from: vi.fn().mockReturnValue(makeBuilder(fromResult)),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue(
          authUser ?? { data: { user: { id: "user-123" } }, error: null },
        ),
    },
  };
  return client as unknown as SupabaseClient<Database>;
}

/**
 * Builds a client whose `from()` returns a fresh builder per call, drawn in
 * order from `results`. Once the sequence is exhausted the last result repeats.
 * Used for the cycle-guard tests, which issue several queries per call.
 */
function makeSequencedClient(
  results: { data: unknown; error: unknown }[],
): SupabaseClient<Database> {
  const builders = results.map((r) => makeBuilder(r));
  let i = 0;
  const from = vi.fn(() => {
    const builder = builders[Math.min(i, builders.length - 1)];
    i += 1;
    if (builder === undefined) {
      throw new Error("makeSequencedClient: no builders configured");
    }
    return builder;
  });
  const client = {
    from,
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    },
  };
  return client as unknown as SupabaseClient<Database>;
}

// ---------------------------------------------------------------------------
// Sample fixtures
// ---------------------------------------------------------------------------

const sampleTemporalData = {
  era: "CE",
  year: 1969,
  precision: "exact",
} as const;

const sampleEvent = {
  id: "event-1",
  user_id: "user-123",
  slug: "moon-landing",
  title: "Moon Landing",
  summary: "Apollo 11 lands on the Moon",
  detail: null,
  event_type: "milestone",
  temporal_data: sampleTemporalData,
  sort_order_years: 1969,
  end_temporal_data: null,
  sort_order_end: null,
  computed_start_date: null,
  computed_end_date: null,
  location: "Sea of Tranquility, Moon",
  spatial_data: null,
  importance: 10,
  parent_event_id: null,
  timeline_id: null,
  detail_timeline_id: null,
  metadata: null,
  search_vector: null,
  published: false,
  published_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const sampleCategory = { event_id: "event-1", category_id: "cat-1" };

const sampleMedia = { event_id: "event-1", media_id: "media-1", sort_order: 0 };

const sampleCharacter = {
  event_id: "event-1",
  character_id: "char-1",
  role: "protagonist",
  significance: "primary",
  description: null,
};

// ---------------------------------------------------------------------------
// getEvents
// ---------------------------------------------------------------------------

describe("getEvents", () => {
  it("returns an array of events", async () => {
    const client = makeClient({
      fromResult: { data: [sampleEvent], error: null },
    });
    const result = await getEvents(client);
    expect(result).toEqual([sampleEvent]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await getEvents(client);
    expect(result).toEqual([]);
  });

  it("applies eventType filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { eventType: "milestone" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("event_type", "milestone");
  });

  it("applies importance filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { importance: 8 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("importance", 8);
  });

  it("applies timelineId filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { timelineId: "tl-abc" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("timeline_id", "tl-abc");
  });

  it("applies userId filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { userId: "user-abc" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-abc");
  });

  it("applies search filter via full-text search", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { search: "apollo" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.textSearch).toHaveBeenCalledWith("search_vector", "apollo", {
      type: "websearch",
    });
  });

  it("does not apply search filter when search is empty string", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { search: "" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.textSearch).not.toHaveBeenCalled();
  });

  it("clamps page=0 to page=1", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { page: 0, pageSize: 10 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.range).toHaveBeenCalledWith(0, 9);
  });

  it("clamps pageSize=0 to pageSize=1", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { page: 1, pageSize: 0 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.range).toHaveBeenCalledWith(0, 0);
  });

  it("clamps pageSize>100 to 100", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client, { page: 1, pageSize: 999 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.range).toHaveBeenCalledWith(0, 99);
  });

  it("orders by sort_order_years ascending", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEvents(client);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.order).toHaveBeenCalledWith("sort_order_years", {
      ascending: true,
    });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "DB error" } },
    });
    await expect(getEvents(client)).rejects.toThrow(
      "EventService.getEvents: DB error",
    );
  });
});

// ---------------------------------------------------------------------------
// getEventById
// ---------------------------------------------------------------------------

describe("getEventById", () => {
  it("returns an event with relations", async () => {
    const eventWithRelations = {
      ...sampleEvent,
      event_categories: [sampleCategory],
      event_media: [sampleMedia],
      event_characters: [sampleCharacter],
    };
    const client = makeClient({
      fromResult: { data: eventWithRelations, error: null },
    });
    const result = await getEventById(client, "event-1");
    expect(result).toEqual(eventWithRelations);
  });

  it("selects with junction tables", async () => {
    const client = makeClient({
      fromResult: {
        data: {
          ...sampleEvent,
          event_categories: [],
          event_media: [],
          event_characters: [],
        },
        error: null,
      },
    });
    await getEventById(client, "event-1");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.select).toHaveBeenCalledWith(
      "*, event_categories(*), event_media(*), event_characters(*)",
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "event-1");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getEventById(client, "event-1")).rejects.toThrow(
      "EventService.getEventById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// getEventBySlug
// ---------------------------------------------------------------------------

describe("getEventBySlug", () => {
  it("filters by user_id and slug", async () => {
    const client = makeClient({
      fromResult: {
        data: {
          ...sampleEvent,
          event_categories: [],
          event_media: [],
          event_characters: [],
        },
        error: null,
      },
    });
    await getEventBySlug(client, "user-123", "moon-landing");
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(builder.eq).toHaveBeenCalledWith("slug", "moon-landing");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(
      getEventBySlug(client, "user-123", "moon-landing"),
    ).rejects.toThrow("EventService.getEventBySlug: not found");
  });
});

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------

describe("createEvent", () => {
  const validInput = {
    title: "Moon Landing",
    temporal_data: sampleTemporalData,
  };

  function makeCreateClient(insertResult: { data: unknown; error: unknown }) {
    let callCount = 0;
    return {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        // First call: fetch existing slugs — returns empty array via .then
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (resolve: (v: unknown) => unknown) =>
              Promise.resolve({ data: [], error: null }).then(resolve),
          };
        }
        // Second call: insert — returns the provided result
        return makeBuilder(insertResult);
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;
  }

  it("creates an event and returns the row", async () => {
    const client = makeCreateClient({ data: sampleEvent, error: null });
    const result = await createEvent(client, validInput);
    expect(result).toEqual(sampleEvent);
  });

  it("throws when no authenticated user", async () => {
    const client = makeClient({
      authUser: { data: { user: null }, error: null },
    });
    await expect(createEvent(client, validInput)).rejects.toThrow(
      "EventService.createEvent: no authenticated user",
    );
  });

  it("throws when auth.getUser returns an error", async () => {
    const client = makeClient({
      authUser: { data: { user: null }, error: { message: "auth fail" } },
    });
    await expect(createEvent(client, validInput)).rejects.toThrow(
      "EventService.createEvent(auth.getUser): auth fail",
    );
  });

  it("uses explicit slug when provided", async () => {
    const client = makeCreateClient({ data: sampleEvent, error: null });
    const result = await createEvent(client, {
      ...validInput,
      slug: "custom-slug",
    });
    expect(result).toEqual(sampleEvent);
  });

  it("retries on 23505 unique violation and succeeds", async () => {
    let callCount = 0;
    const client = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "events") {
          callCount++;
          // First call: fetch existing slugs (returns array via .then)
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: (resolve: (v: unknown) => unknown) =>
                Promise.resolve({ data: [], error: null }).then(resolve),
            };
          }
          // Second call: insert — returns 23505 collision
          if (callCount === 2) {
            const builder = makeBuilder({
              data: null,
              error: { code: "23505", message: "unique violation" },
            });
            return builder;
          }
          // Third call: insert — succeeds
          return makeBuilder({ data: sampleEvent, error: null });
        }
        return makeBuilder({ data: null, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await createEvent(client, validInput);
    expect(result).toEqual(sampleEvent);
  });

  it("throws after exhausting slug retries", async () => {
    let callCount = 0;
    const client = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "events") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: (resolve: (v: unknown) => unknown) =>
                Promise.resolve({ data: [], error: null }).then(resolve),
            };
          }
          // All insert attempts fail with 23505
          return makeBuilder({
            data: null,
            error: { code: "23505", message: "unique violation" },
          });
        }
        return makeBuilder({ data: null, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    await expect(createEvent(client, validInput)).rejects.toThrow(
      "unique violation",
    );
  });
});

// ---------------------------------------------------------------------------
// publishEvent / unpublishEvent
// ---------------------------------------------------------------------------

describe("publishEvent", () => {
  it("sets published=true and published_at timestamp", async () => {
    const publishedRow = {
      ...sampleEvent,
      published: true,
      published_at: "2026-01-02T12:34:56Z",
    };
    const client = makeClient({
      fromResult: { data: publishedRow, error: null },
    });

    const result = await publishEvent(client, "event-1");

    expect(result).toEqual(publishedRow);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        published: true,
        published_at: expect.any(String),
      }),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "event-1");
  });

  it("throws on publish error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "publish failed" } },
    });

    await expect(publishEvent(client, "event-1")).rejects.toThrow(
      "EventService.publishEvent: publish failed",
    );
  });
});

describe("unpublishEvent", () => {
  it("sets published=false and clears published_at", async () => {
    const unpublishedRow = {
      ...sampleEvent,
      published: false,
      published_at: null,
    };
    const client = makeClient({
      fromResult: { data: unpublishedRow, error: null },
    });

    const result = await unpublishEvent(client, "event-1");

    expect(result).toEqual(unpublishedRow);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.update).toHaveBeenCalledWith({
      published: false,
      published_at: null,
    });
    expect(builder.eq).toHaveBeenCalledWith("id", "event-1");
  });

  it("throws on unpublish error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "unpublish failed" } },
    });

    await expect(unpublishEvent(client, "event-1")).rejects.toThrow(
      "EventService.unpublishEvent: unpublish failed",
    );
  });
});

// ---------------------------------------------------------------------------
// updateEvent
// ---------------------------------------------------------------------------

describe("updateEvent", () => {
  it("returns updated event row", async () => {
    const updated = { ...sampleEvent, title: "Moon Landing Updated" };
    const client = makeClient({ fromResult: { data: updated, error: null } });
    const result = await updateEvent(client, "event-1", {
      title: "Moon Landing Updated",
    });
    expect(result).toEqual(updated);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(
      updateEvent(client, "event-1", { title: "x" }),
    ).rejects.toThrow("EventService.updateEvent: update failed");
  });

  it("runs the fractal-cycle guard when detail_timeline_id is set", async () => {
    // The target timeline already contains event-1 → updating its drill-down to
    // it cycles. (Zod requires a real UUID, unlike the setEventDetailTimeline path.)
    const targetTimeline = "11111111-1111-4111-8111-111111111111";
    const client = makeSequencedClient([
      { data: [{ id: "event-1", detail_timeline_id: null }], error: null },
      { data: [], error: null },
    ]);
    await expect(
      updateEvent(client, "event-1", { detail_timeline_id: targetTimeline }),
    ).rejects.toThrow("fractal cycle");
  });
});

// ---------------------------------------------------------------------------
// deleteEvent
// ---------------------------------------------------------------------------

describe("deleteEvent", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(deleteEvent(client, "event-1")).resolves.toBeUndefined();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(deleteEvent(client, "event-1")).rejects.toThrow(
      "EventService.deleteEvent: delete failed",
    );
  });
});

// ---------------------------------------------------------------------------
// getChildEvents
// ---------------------------------------------------------------------------

describe("getChildEvents", () => {
  it("returns child events ordered by sort_order_years", async () => {
    const child = { ...sampleEvent, id: "event-2", parent_event_id: "event-1" };
    const client = makeClient({ fromResult: { data: [child], error: null } });
    const result = await getChildEvents(client, "event-1");
    expect(result).toEqual([child]);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("parent_event_id", "event-1");
    expect(builder.order).toHaveBeenCalledWith("sort_order_years", {
      ascending: true,
    });
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getChildEvents(client, "event-1")).toEqual([]);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "DB error" } },
    });
    await expect(getChildEvents(client, "event-1")).rejects.toThrow(
      "EventService.getChildEvents: DB error",
    );
  });
});

// ---------------------------------------------------------------------------
// setParentEvent
// ---------------------------------------------------------------------------

describe("setParentEvent", () => {
  it("returns updated event with parent set", async () => {
    const updated = { ...sampleEvent, parent_event_id: "event-parent" };
    const client = makeClient({ fromResult: { data: updated, error: null } });
    const result = await setParentEvent(client, "event-1", "event-parent");
    expect(result).toEqual(updated);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.update).toHaveBeenCalledWith({
      parent_event_id: "event-parent",
    });
  });

  it("accepts null to remove parent association", async () => {
    const updated = { ...sampleEvent, parent_event_id: null };
    const client = makeClient({ fromResult: { data: updated, error: null } });
    const result = await setParentEvent(client, "event-1", null);
    expect(result).toEqual(updated);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.update).toHaveBeenCalledWith({ parent_event_id: null });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(setParentEvent(client, "event-1", "parent-1")).rejects.toThrow(
      "EventService.setParentEvent: update failed",
    );
  });
});

// ---------------------------------------------------------------------------
// setEventDetailTimeline
// ---------------------------------------------------------------------------

describe("setEventDetailTimeline", () => {
  it("sets the drill-down timeline when there is no cycle", async () => {
    const updated = { ...sampleEvent, detail_timeline_id: "tl-sub" };
    // 1: home events of tl-sub (none) · 2: guest junction (none) · 3: update
    const client = makeSequencedClient([
      { data: [], error: null },
      { data: [], error: null },
      { data: updated, error: null },
    ]);
    const result = await setEventDetailTimeline(client, "event-1", "tl-sub");
    expect(result).toEqual(updated);
    const updateBuilder = (client.from as ReturnType<typeof vi.fn>).mock
      .results[2]?.value as ReturnType<typeof makeBuilder>;
    expect(updateBuilder.update).toHaveBeenCalledWith({
      detail_timeline_id: "tl-sub",
    });
  });

  it("clears the drill-down with null and skips the cycle check", async () => {
    const updated = { ...sampleEvent, detail_timeline_id: null };
    const client = makeClient({ fromResult: { data: updated, error: null } });
    const result = await setEventDetailTimeline(client, "event-1", null);
    expect(result).toEqual(updated);
    // Only the update query runs — no BFS.
    expect((client.from as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(
      1,
    );
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.update).toHaveBeenCalledWith({ detail_timeline_id: null });
  });

  it("rejects an assignment that would close a fractal cycle", async () => {
    // tl-sub already contains event-1 (its home timeline) → cycle.
    const client = makeSequencedClient([
      { data: [{ id: "event-1", detail_timeline_id: null }], error: null },
      { data: [], error: null },
    ]);
    await expect(
      setEventDetailTimeline(client, "event-1", "tl-sub"),
    ).rejects.toThrow("fractal cycle");
  });

  it("detects a cycle reached transitively through a guest appearance", async () => {
    // tl-sub contains event-2 (guest); event-2 expands into tl-deep; tl-deep
    // contains event-1 → cycle two hops out.
    const client = makeSequencedClient([
      { data: [], error: null }, // tl-sub home events
      { data: [{ event_id: "event-2" }], error: null }, // tl-sub guest junction
      { data: [{ id: "event-2", detail_timeline_id: "tl-deep" }], error: null }, // guest events
      { data: [{ id: "event-1", detail_timeline_id: null }], error: null }, // tl-deep home events
      { data: [], error: null }, // tl-deep guest junction
    ]);
    await expect(
      setEventDetailTimeline(client, "event-1", "tl-sub"),
    ).rejects.toThrow("fractal cycle");
  });

  it("throws on Supabase error during update", async () => {
    const client = makeSequencedClient([
      { data: [], error: null },
      { data: [], error: null },
      { data: null, error: { message: "update failed" } },
    ]);
    await expect(
      setEventDetailTimeline(client, "event-1", "tl-sub"),
    ).rejects.toThrow("EventService.setEventDetailTimeline: update failed");
  });
});

// ---------------------------------------------------------------------------
// getEventsDetailedBy
// ---------------------------------------------------------------------------

describe("getEventsDetailedBy", () => {
  it("returns events that expand into the given timeline", async () => {
    const detailing = { ...sampleEvent, detail_timeline_id: "tl-sub" };
    const client = makeClient({
      fromResult: { data: [detailing], error: null },
    });
    const result = await getEventsDetailedBy(client, "tl-sub");
    expect(result).toEqual([detailing]);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("detail_timeline_id", "tl-sub");
    expect(builder.order).toHaveBeenCalledWith("sort_order_years", {
      ascending: true,
    });
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getEventsDetailedBy(client, "tl-sub")).toEqual([]);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "DB error" } },
    });
    await expect(getEventsDetailedBy(client, "tl-sub")).rejects.toThrow(
      "EventService.getEventsDetailedBy: DB error",
    );
  });
});

// ---------------------------------------------------------------------------
// getEventsInTemporalRange
// ---------------------------------------------------------------------------

describe("getEventsInTemporalRange", () => {
  it("returns events within the given sort order range", async () => {
    const client = makeClient({
      fromResult: { data: [sampleEvent], error: null },
    });
    const result = await getEventsInTemporalRange(client, 1900, 2000);
    expect(result).toEqual([sampleEvent]);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.gte).toHaveBeenCalledWith("sort_order_years", 1900);
    expect(builder.lte).toHaveBeenCalledWith("sort_order_years", 2000);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getEventsInTemporalRange(client, 0, 100)).toEqual([]);
  });

  it("handles negative sort orders (BCE events)", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getEventsInTemporalRange(client, -500, -44);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.gte).toHaveBeenCalledWith("sort_order_years", -500);
    expect(builder.lte).toHaveBeenCalledWith("sort_order_years", -44);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "DB error" } },
    });
    await expect(getEventsInTemporalRange(client, 0, 100)).rejects.toThrow(
      "EventService.getEventsInTemporalRange: DB error",
    );
  });
});

// ---------------------------------------------------------------------------
// addCategoryToEvent
// ---------------------------------------------------------------------------

describe("addCategoryToEvent", () => {
  it("inserts and returns the junction row", async () => {
    const client = makeClient({
      fromResult: { data: sampleCategory, error: null },
    });
    const result = await addCategoryToEvent(client, "event-1", "cat-1");
    expect(result).toEqual(sampleCategory);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      event_id: "event-1",
      category_id: "cat-1",
    });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "insert failed" } },
    });
    await expect(
      addCategoryToEvent(client, "event-1", "cat-1"),
    ).rejects.toThrow("EventService.addCategoryToEvent: insert failed");
  });
});

// ---------------------------------------------------------------------------
// removeCategoryFromEvent
// ---------------------------------------------------------------------------

describe("removeCategoryFromEvent", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeCategoryFromEvent(client, "event-1", "cat-1"),
    ).resolves.toBeUndefined();
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("event_id", "event-1");
    expect(builder.eq).toHaveBeenCalledWith("category_id", "cat-1");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(
      removeCategoryFromEvent(client, "event-1", "cat-1"),
    ).rejects.toThrow("EventService.removeCategoryFromEvent: delete failed");
  });
});

// ---------------------------------------------------------------------------
// addMediaToEvent
// ---------------------------------------------------------------------------

describe("addMediaToEvent", () => {
  it("inserts with default sort_order=0", async () => {
    const client = makeClient({
      fromResult: { data: sampleMedia, error: null },
    });
    const result = await addMediaToEvent(client, "event-1", "media-1");
    expect(result).toEqual(sampleMedia);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      event_id: "event-1",
      media_id: "media-1",
      sort_order: 0,
    });
  });

  it("accepts a custom sort_order", async () => {
    const client = makeClient({
      fromResult: { data: { ...sampleMedia, sort_order: 5 }, error: null },
    });
    await addMediaToEvent(client, "event-1", "media-1", 5);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      event_id: "event-1",
      media_id: "media-1",
      sort_order: 5,
    });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "insert failed" } },
    });
    await expect(addMediaToEvent(client, "event-1", "media-1")).rejects.toThrow(
      "EventService.addMediaToEvent: insert failed",
    );
  });
});

// ---------------------------------------------------------------------------
// removeMediaFromEvent
// ---------------------------------------------------------------------------

describe("removeMediaFromEvent", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeMediaFromEvent(client, "event-1", "media-1"),
    ).resolves.toBeUndefined();
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("event_id", "event-1");
    expect(builder.eq).toHaveBeenCalledWith("media_id", "media-1");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(
      removeMediaFromEvent(client, "event-1", "media-1"),
    ).rejects.toThrow("EventService.removeMediaFromEvent: delete failed");
  });
});

// ---------------------------------------------------------------------------
// addCharacterToEvent
// ---------------------------------------------------------------------------

describe("addCharacterToEvent", () => {
  it("inserts with default role and significance", async () => {
    const defaultCharacter = {
      ...sampleCharacter,
      role: "participant",
      significance: "secondary",
    };
    const client = makeClient({
      fromResult: { data: defaultCharacter, error: null },
    });
    const result = await addCharacterToEvent(client, "event-1", "char-1");
    expect(result).toEqual(defaultCharacter);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      event_id: "event-1",
      character_id: "char-1",
      role: "participant",
      significance: "secondary",
    });
  });

  it("accepts explicit role and significance", async () => {
    const client = makeClient({
      fromResult: { data: sampleCharacter, error: null },
    });
    await addCharacterToEvent(
      client,
      "event-1",
      "char-1",
      "protagonist",
      "primary",
    );
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      event_id: "event-1",
      character_id: "char-1",
      role: "protagonist",
      significance: "primary",
    });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "insert failed" } },
    });
    await expect(
      addCharacterToEvent(client, "event-1", "char-1"),
    ).rejects.toThrow("EventService.addCharacterToEvent: insert failed");
  });
});

// ---------------------------------------------------------------------------
// removeCharacterFromEvent
// ---------------------------------------------------------------------------

describe("removeCharacterFromEvent", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeCharacterFromEvent(client, "event-1", "char-1"),
    ).resolves.toBeUndefined();
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("event_id", "event-1");
    expect(builder.eq).toHaveBeenCalledWith("character_id", "char-1");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(
      removeCharacterFromEvent(client, "event-1", "char-1"),
    ).rejects.toThrow("EventService.removeCharacterFromEvent: delete failed");
  });
});

// ---------------------------------------------------------------------------
// getEventParticipants
// ---------------------------------------------------------------------------

describe("getEventParticipants", () => {
  it("returns all character participation records", async () => {
    const client = makeClient({
      fromResult: { data: [sampleCharacter], error: null },
    });
    const result = await getEventParticipants(client, "event-1");
    expect(result).toEqual([sampleCharacter]);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("event_id", "event-1");
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getEventParticipants(client, "event-1")).toEqual([]);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "DB error" } },
    });
    await expect(getEventParticipants(client, "event-1")).rejects.toThrow(
      "EventService.getEventParticipants: DB error",
    );
  });
});
