import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import {
  getTimelines,
  getTimelinesPage,
  getTimelineById,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  publishTimeline,
  unpublishTimeline,
  TimelinePublishError,
  getTimelineEventsUnion,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  addEventToTimeline,
  removeEventFromTimeline,
  setTimelineEventSortOrder,
  getEventTimelineLinks,
  addMediaToTimeline,
  removeMediaFromTimeline,
  reorderTimelineMedia,
} from "./timeline-service";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

/**
 * Creates a chainable query builder mock that resolves with the given result.
 * Methods return `this` to support chaining; the terminal call returns a
 * promise that resolves to `{ data, error, count }`.
 */
function makeBuilder(result: {
  data: unknown;
  error: unknown;
  count?: number | null;
}) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: terminal,
    maybeSingle: terminal,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  // Make the builder itself thenable so `await query` works when .single() is
  // not called (e.g. delete, range queries).
  return builder;
}

/** Wraps makeBuilder so `await query` and `await query.single()` both work */
function makeQuery(result: { data: unknown; error: unknown }) {
  return makeBuilder(result);
}

function makeClient(overrides: {
  fromResult?: { data: unknown; error: unknown; count?: number | null };
  authUser?: { data: { user: unknown }; error: unknown };
}) {
  const { fromResult = { data: null, error: null }, authUser } = overrides;

  const client = {
    from: vi.fn().mockReturnValue(makeQuery(fromResult)),
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

// ---------------------------------------------------------------------------
// Sample fixtures
// ---------------------------------------------------------------------------

const sampleTimeline = {
  id: "timeline-1",
  user_id: "user-123",
  slug: "my-timeline",
  title: "My Timeline",
  summary: null,
  detail: null,
  scale: null,
  temporal_data: {},
  end_temporal_data: null,
  timeline_type: "general",
  visibility: "private",
  fractal_depth: 5,
  subject_character_id: null,
  metadata: null,
  published: false,
  published_at: null,
  search_vector: null,
  sort_order_start: null,
  sort_order_end: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const sampleCollaborator = {
  timeline_id: "timeline-1",
  user_id: "user-456",
  role: "viewer",
  created_at: "2026-01-01T00:00:00Z",
};

const sampleEvent = {
  id: "event-1",
  user_id: "user-123",
  slug: "event-one",
  title: "Event One",
  summary: null,
  detail: null,
  event_type: "milestone",
  temporal_data: {},
  sort_order_years: 100,
  end_temporal_data: null,
  sort_order_end: null,
  computed_start_date: null,
  computed_end_date: null,
  location: null,
  spatial_data: null,
  importance: 5,
  timeline_id: "timeline-1",
  detail_timeline_id: null,
  metadata: null,
  search_vector: null,
  published: false,
  published_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// getTimelines
// ---------------------------------------------------------------------------

describe("getTimelines", () => {
  it("returns an array of timelines", async () => {
    const client = makeClient({
      fromResult: { data: [sampleTimeline], error: null },
    });
    const result = await getTimelines(client);
    expect(result).toEqual([sampleTimeline]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await getTimelines(client);
    expect(result).toEqual([]);
  });

  it("applies visibility filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { visibility: "public" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("visibility", "public");
  });

  it("applies userId filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { userId: "user-abc" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-abc");
  });

  it("applies search filter via full-text search with prefix matching", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { search: "ancient" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    // Single word → appended with :* so partial tokens match stored lexemes.
    expect(builder.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "ancient:*",
    );
  });

  it("applies multi-word search with prefix matching on the last token", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { search: "history phys" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    // Earlier words joined with &; last word appended with :*
    expect(builder.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "history & phys:*",
    );
  });

  it("strips tsquery metacharacters from search input", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { search: "anc&ient | hist!ory" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "anc & ient & hist & ory:*",
    );
  });

  it("clamps page=0 to page=1", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { page: 0, pageSize: 10 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    // page clamped to 1: from=0, to=9
    expect(builder.range).toHaveBeenCalledWith(0, 9);
  });

  it("clamps pageSize=0 to pageSize=1", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { page: 1, pageSize: 0 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    // pageSize clamped to 1: from=0, to=0
    expect(builder.range).toHaveBeenCalledWith(0, 0);
  });

  it("clamps pageSize>100 to 100", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { page: 1, pageSize: 999 });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    // pageSize clamped to 100: from=0, to=99
    expect(builder.range).toHaveBeenCalledWith(0, 99);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "DB error" } },
    });
    // getTimelines delegates to getTimelinesPage which owns the error context
    await expect(getTimelines(client)).rejects.toThrow(
      "TimelineService.getTimelinesPage: DB error",
    );
  });
});

// ---------------------------------------------------------------------------
// getTimelinesPage
// ---------------------------------------------------------------------------

describe("getTimelinesPage", () => {
  it("returns rows and total count", async () => {
    const client = makeClient({
      fromResult: { data: [sampleTimeline], error: null, count: 42 },
    });
    const result = await getTimelinesPage(client);
    expect(result.rows).toEqual([sampleTimeline]);
    expect(result.total).toBe(42);
  });

  it("returns total 0 when count is null", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: null },
    });
    const result = await getTimelinesPage(client);
    expect(result.total).toBe(0);
  });

  it("applies timeline_type scalar filter", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: 0 },
    });
    await getTimelinesPage(client, { timelineType: "biographical" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("timeline_type", "biographical");
  });

  it("applies timeline_type array filter via .in()", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: 0 },
    });
    await getTimelinesPage(client, {
      timelineType: ["general", "comparative"],
    });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.in).toHaveBeenCalledWith("timeline_type", [
      "general",
      "comparative",
    ]);
  });

  it("applies visibility array filter via .in()", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: 0 },
    });
    await getTimelinesPage(client, { visibility: ["public", "shared"] });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.in).toHaveBeenCalledWith("visibility", ["public", "shared"]);
  });

  it("applies published=true filter", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: 0 },
    });
    await getTimelinesPage(client, { published: true });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("published", true);
  });

  it("applies published=false filter", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: 0 },
    });
    await getTimelinesPage(client, { published: false });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("published", false);
  });

  it("sorts by title ascending", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: 0 },
    });
    await getTimelinesPage(client, {
      sortBy: "title",
      sortDirection: "asc",
    });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.order).toHaveBeenCalledWith("title", {
      ascending: true,
      nullsFirst: false,
    });
  });

  it("sorts by updated_at descending by default", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: 0 },
    });
    await getTimelinesPage(client);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.order).toHaveBeenCalledWith("updated_at", {
      ascending: false,
      nullsFirst: false,
    });
  });

  it("sorts by created_at", async () => {
    const client = makeClient({
      fromResult: { data: [], error: null, count: 0 },
    });
    await getTimelinesPage(client, {
      sortBy: "created_at",
      sortDirection: "asc",
    });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.order).toHaveBeenCalledWith("created_at", {
      ascending: true,
      nullsFirst: false,
    });
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "page error" } },
    });
    await expect(getTimelinesPage(client)).rejects.toThrow(
      "TimelineService.getTimelinesPage: page error",
    );
  });
});

// ---------------------------------------------------------------------------
// getTimelineById
// ---------------------------------------------------------------------------

describe("getTimelineById", () => {
  it("returns a timeline with relations", async () => {
    const full = {
      ...sampleTimeline,
      timeline_collaborators: [],
      timeline_events: [],
      timeline_media: [],
    };
    const client = makeClient({ fromResult: { data: full, error: null } });
    const result = await getTimelineById(client, "timeline-1");
    expect(result).toEqual(full);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getTimelineById(client, "x")).rejects.toThrow(
      "TimelineService.getTimelineById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// createTimeline
// ---------------------------------------------------------------------------

const minimalCreateInput = {
  title: "Ancient Rome",
  temporal_data: {
    era: "BCE" as const,
    year: 753,
    precision: "approximate" as const,
  },
};

describe("createTimeline", () => {
  it("creates a timeline and returns the row", async () => {
    // First call: auth.getUser — handled by makeClient default
    // Second call: from('timelines').select('slug') → existing slugs
    // Third call: from('timelines').insert → new row
    let callIndex = 0;
    const fromResults = [
      { data: [], error: null }, // fetchSlugs
      { data: sampleTimeline, error: null }, // insert
    ];

    const client = {
      from: vi.fn().mockImplementation(() => {
        const result = fromResults[callIndex++] ?? { data: null, error: null };
        return makeQuery(result);
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await createTimeline(client, minimalCreateInput);
    expect(result).toEqual(sampleTimeline);
  });

  it("auto-generates slug from title", async () => {
    let callIndex = 0;
    const fromResults = [
      { data: [], error: null },
      { data: { ...sampleTimeline, slug: "ancient-rome" }, error: null },
    ];

    let capturedInsertArg: unknown = undefined;
    const client = {
      from: vi.fn().mockImplementation(() => {
        const result = fromResults[callIndex++] ?? { data: null, error: null };
        const builder = makeQuery(result);
        // On the second call (insert), spy on insert() to capture the argument
        if (callIndex === 2) {
          const originalInsert = builder.insert.bind(builder);
          builder.insert = vi.fn().mockImplementation((arg: unknown) => {
            capturedInsertArg = arg;
            return originalInsert(arg);
          });
        }
        return builder;
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    await createTimeline(client, minimalCreateInput);
    // Assert the slug inserted into the DB was derived from the title
    expect(capturedInsertArg).toMatchObject({ slug: "ancient-rome" });
  });

  it("resolves slug collision by appending suffix", async () => {
    let callIndex = 0;
    // Existing slugs include the base slug
    const fromResults = [
      { data: [{ slug: "ancient-rome" }], error: null },
      { data: { ...sampleTimeline, slug: "ancient-rome-2" }, error: null },
    ];

    const client = {
      from: vi.fn().mockImplementation(() => {
        const result = fromResults[callIndex++] ?? { data: null, error: null };
        return makeQuery(result);
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await createTimeline(client, minimalCreateInput);
    expect(result.slug).toBe("ancient-rome-2");
  });

  it("throws when not authenticated", async () => {
    const client = {
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    await expect(createTimeline(client, minimalCreateInput)).rejects.toThrow(
      "TimelineService.createTimeline: no authenticated user",
    );
  });

  it("retries on a 23505 unique violation and succeeds", async () => {
    let callIndex = 0;
    // fetchSlugs → insert collides (23505) → retried insert succeeds
    const fromResults = [
      { data: [], error: null },
      { data: null, error: { code: "23505", message: "unique violation" } },
      { data: sampleTimeline, error: null },
    ];

    const client = {
      from: vi.fn().mockImplementation(() => {
        const result = fromResults[callIndex++] ?? { data: null, error: null };
        return makeQuery(result);
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await createTimeline(client, minimalCreateInput);
    expect(result).toEqual(sampleTimeline);
    expect(callIndex).toBe(3);
  });

  it("propagates a non-collision insert error", async () => {
    let callIndex = 0;
    const fromResults = [
      { data: [], error: null },
      { data: null, error: { message: "insert failed" } },
    ];

    const client = {
      from: vi.fn().mockImplementation(() => {
        const result = fromResults[callIndex++] ?? { data: null, error: null };
        return makeQuery(result);
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    await expect(createTimeline(client, minimalCreateInput)).rejects.toThrow(
      "TimelineService.createTimeline: insert failed",
    );
  });

  it("throws on slug fetch error", async () => {
    const client = {
      from: vi
        .fn()
        .mockReturnValue(
          makeQuery({ data: null, error: { message: "slug fetch failed" } }),
        ),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    await expect(createTimeline(client, minimalCreateInput)).rejects.toThrow(
      "TimelineService.createTimeline(fetchSlugs): slug fetch failed",
    );
  });

  it("throws ZodError on invalid input", async () => {
    const client = makeClient({});
    // title is required — pass empty string to trigger validation failure
    await expect(
      createTimeline(client, {
        title: "",
        temporal_data: {
          era: "CE" as const,
          year: 2000,
          precision: "exact" as const,
        },
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// updateTimeline
// ---------------------------------------------------------------------------

describe("updateTimeline", () => {
  it("returns the updated row", async () => {
    const updated = { ...sampleTimeline, title: "Renamed" };
    const client = makeClient({ fromResult: { data: updated, error: null } });
    const result = await updateTimeline(client, "timeline-1", {
      title: "Renamed",
    });
    expect(result.title).toBe("Renamed");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(
      updateTimeline(client, "timeline-1", { title: "X" }),
    ).rejects.toThrow("TimelineService.updateTimeline: update failed");
  });

  it("throws ZodError on invalid partial input", async () => {
    const client = makeClient({});
    // fractal_depth must be >= 1
    await expect(
      updateTimeline(client, "timeline-1", { fractal_depth: 0 }),
    ).rejects.toThrow();
  });

  it("allows clearing subject_character_id with null", async () => {
    const updated = { ...sampleTimeline, subject_character_id: null };
    const client = makeClient({ fromResult: { data: updated, error: null } });

    const result = await updateTimeline(client, "timeline-1", {
      subject_character_id: null,
    });

    expect(result.subject_character_id).toBeNull();
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ subject_character_id: null }),
    );
  });
});

// ---------------------------------------------------------------------------
// deleteTimeline
// ---------------------------------------------------------------------------

describe("deleteTimeline", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(deleteTimeline(client, "timeline-1")).resolves.toBeUndefined();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(deleteTimeline(client, "timeline-1")).rejects.toThrow(
      "TimelineService.deleteTimeline: delete failed",
    );
  });
});

// ---------------------------------------------------------------------------
// publishTimeline / unpublishTimeline
// ---------------------------------------------------------------------------

describe("publishTimeline", () => {
  it("returns updated row with published:true when home events exist", async () => {
    const published = {
      ...sampleTimeline,
      published: true,
      published_at: "2026-01-01T00:00:00.000Z",
    };
    // Promise.all: home count + linked count in parallel, then the update.
    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce(makeBuilder({ data: null, error: null, count: 1 })) // home events
        .mockReturnValueOnce(makeBuilder({ data: null, error: null, count: 0 })) // junction events
        .mockReturnValueOnce(makeBuilder({ data: published, error: null })), // timelines update
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;
    const result = await publishTimeline(client, "timeline-1");
    expect(result.published).toBe(true);
    expect(result.published_at).toBeTruthy();
  });

  it("returns updated row with published:true when only junction events exist", async () => {
    const published = {
      ...sampleTimeline,
      published: true,
      published_at: "2026-01-01T00:00:00.000Z",
    };
    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce(makeBuilder({ data: null, error: null, count: 0 })) // home events — none
        .mockReturnValueOnce(makeBuilder({ data: null, error: null, count: 2 })) // junction events
        .mockReturnValueOnce(makeBuilder({ data: published, error: null })),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;
    const result = await publishTimeline(client, "timeline-1");
    expect(result.published).toBe(true);
  });

  it("throws TimelinePublishError when no events are linked", async () => {
    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce(makeBuilder({ data: null, error: null, count: 0 })) // home events — none
        .mockReturnValueOnce(
          makeBuilder({ data: null, error: null, count: 0 }),
        ), // junction events — none
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;
    await expect(publishTimeline(client, "timeline-1")).rejects.toThrow(
      TimelinePublishError,
    );
  });

  it("throws on Supabase error during home event count check", async () => {
    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce(
          makeBuilder({
            data: null,
            error: { message: "count failed" },
            count: null,
          }),
        )
        .mockReturnValueOnce(
          makeBuilder({ data: null, error: null, count: 0 }),
        ),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;
    await expect(publishTimeline(client, "timeline-1")).rejects.toThrow(
      "TimelineService.publishTimeline.homeEventCount: count failed",
    );
  });

  it("throws on Supabase error during linked event count check", async () => {
    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce(makeBuilder({ data: null, error: null, count: 0 }))
        .mockReturnValueOnce(
          makeBuilder({
            data: null,
            error: { message: "count failed" },
            count: null,
          }),
        ),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;
    await expect(publishTimeline(client, "timeline-1")).rejects.toThrow(
      "TimelineService.publishTimeline.linkedEventCount: count failed",
    );
  });
});

describe("unpublishTimeline", () => {
  it("returns updated row with published:false", async () => {
    const unpublished = {
      ...sampleTimeline,
      published: false,
      published_at: null,
    };
    const client = makeClient({
      fromResult: { data: unpublished, error: null },
    });
    const result = await unpublishTimeline(client, "timeline-1");
    expect(result.published).toBe(false);
    expect(result.published_at).toBeNull();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "unpublish failed" } },
    });
    await expect(unpublishTimeline(client, "timeline-1")).rejects.toThrow(
      "TimelineService.unpublishTimeline: unpublish failed",
    );
  });
});

// ---------------------------------------------------------------------------
// getCollaborators
// ---------------------------------------------------------------------------

describe("getCollaborators", () => {
  it("returns a list of collaborators", async () => {
    const client = makeClient({
      fromResult: { data: [sampleCollaborator], error: null },
    });
    const result = await getCollaborators(client, "timeline-1");
    expect(result).toEqual([sampleCollaborator]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await getCollaborators(client, "timeline-1");
    expect(result).toEqual([]);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "collab error" } },
    });
    await expect(getCollaborators(client, "timeline-1")).rejects.toThrow(
      "TimelineService.getCollaborators: collab error",
    );
  });
});

// ---------------------------------------------------------------------------
// addCollaborator
// ---------------------------------------------------------------------------

describe("addCollaborator", () => {
  it("returns the new collaborator row", async () => {
    const client = makeClient({
      fromResult: { data: sampleCollaborator, error: null },
    });
    const result = await addCollaborator(
      client,
      "timeline-1",
      "user-456",
      "viewer",
    );
    expect(result).toEqual(sampleCollaborator);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "duplicate key" } },
    });
    await expect(
      addCollaborator(client, "timeline-1", "user-456", "viewer"),
    ).rejects.toThrow("TimelineService.addCollaborator: duplicate key");
  });
});

// ---------------------------------------------------------------------------
// removeCollaborator
// ---------------------------------------------------------------------------

describe("removeCollaborator", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeCollaborator(client, "timeline-1", "user-456"),
    ).resolves.toBeUndefined();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "remove failed" } },
    });
    await expect(
      removeCollaborator(client, "timeline-1", "user-456"),
    ).rejects.toThrow("TimelineService.removeCollaborator: remove failed");
  });
});

// ---------------------------------------------------------------------------
// updateCollaboratorRole
// ---------------------------------------------------------------------------

describe("updateCollaboratorRole", () => {
  it("returns updated collaborator with new role", async () => {
    const updated = { ...sampleCollaborator, role: "editor" };
    const client = makeClient({ fromResult: { data: updated, error: null } });
    const result = await updateCollaboratorRole(
      client,
      "timeline-1",
      "user-456",
      "editor",
    );
    expect(result.role).toBe("editor");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update role failed" } },
    });
    await expect(
      updateCollaboratorRole(client, "timeline-1", "user-456", "admin"),
    ).rejects.toThrow(
      "TimelineService.updateCollaboratorRole: update role failed",
    );
  });
});

// ---------------------------------------------------------------------------
// addEventToTimeline
// ---------------------------------------------------------------------------

describe("addEventToTimeline", () => {
  it("returns the new junction row with default sort_order=0", async () => {
    const row = {
      timeline_id: "timeline-1",
      event_id: "event-1",
      sort_order: 0,
    };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addEventToTimeline(client, "timeline-1", "event-1");
    expect(result).toEqual(row);
  });

  it("accepts an explicit sort_order", async () => {
    const row = {
      timeline_id: "timeline-1",
      event_id: "event-1",
      sort_order: 5,
    };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addEventToTimeline(client, "timeline-1", "event-1", 5);
    expect(result.sort_order).toBe(5);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "event link failed" } },
    });
    await expect(
      addEventToTimeline(client, "timeline-1", "event-1"),
    ).rejects.toThrow("TimelineService.addEventToTimeline: event link failed");
  });
});

// ---------------------------------------------------------------------------
// removeEventFromTimeline
// ---------------------------------------------------------------------------

describe("removeEventFromTimeline", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeEventFromTimeline(client, "timeline-1", "event-1"),
    ).resolves.toBeUndefined();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "unlink failed" } },
    });
    await expect(
      removeEventFromTimeline(client, "timeline-1", "event-1"),
    ).rejects.toThrow("TimelineService.removeEventFromTimeline: unlink failed");
  });
});

// ---------------------------------------------------------------------------
// getEventTimelineLinks
// ---------------------------------------------------------------------------

describe("getEventTimelineLinks", () => {
  it("returns the timeline ids an event appears in", async () => {
    const client = makeClient({
      fromResult: {
        data: [{ timeline_id: "timeline-1" }, { timeline_id: "timeline-2" }],
        error: null,
      },
    });
    const result = await getEventTimelineLinks(client, "event-1");
    expect(result).toEqual(["timeline-1", "timeline-2"]);
  });

  it("returns an empty array when the event has no junction links", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    const result = await getEventTimelineLinks(client, "event-1");
    expect(result).toEqual([]);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "links failed" } },
    });
    await expect(getEventTimelineLinks(client, "event-1")).rejects.toThrow(
      "TimelineService.getEventTimelineLinks: links failed",
    );
  });
});

// ---------------------------------------------------------------------------
// setTimelineEventSortOrder
// ---------------------------------------------------------------------------

describe("setTimelineEventSortOrder", () => {
  it("upserts the junction row keyed on (timeline_id, event_id) and returns it", async () => {
    const row = {
      timeline_id: "timeline-1",
      event_id: "event-1",
      sort_order: 3,
    };
    const client = makeClient({ fromResult: { data: row, error: null } });

    const result = await setTimelineEventSortOrder(
      client,
      "timeline-1",
      "event-1",
      3,
    );

    expect(result).toEqual(row);
    expect(client.from).toHaveBeenCalledWith("timeline_events");
    const builder = vi.mocked(client.from).mock.results[0]!.value;
    expect(builder.upsert).toHaveBeenCalledWith(
      { timeline_id: "timeline-1", event_id: "event-1", sort_order: 3 },
      { onConflict: "timeline_id,event_id" },
    );
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "reorder failed" } },
    });
    await expect(
      setTimelineEventSortOrder(client, "timeline-1", "event-1", 3),
    ).rejects.toThrow(
      "TimelineService.setTimelineEventSortOrder: reorder failed",
    );
  });
});

// ---------------------------------------------------------------------------
// addMediaToTimeline
// ---------------------------------------------------------------------------

describe("addMediaToTimeline", () => {
  it("upserts the new junction row with default sort_order=0, ignoring duplicates on the composite PK", async () => {
    const row = {
      timeline_id: "timeline-1",
      media_id: "media-1",
      sort_order: 0,
    };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addMediaToTimeline(client, "timeline-1", "media-1");
    expect(result).toEqual(row);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.upsert).toHaveBeenCalledWith(
      { timeline_id: "timeline-1", media_id: "media-1", sort_order: 0 },
      { onConflict: "timeline_id,media_id", ignoreDuplicates: true },
    );
  });

  it("accepts an explicit sort_order", async () => {
    const row = {
      timeline_id: "timeline-1",
      media_id: "media-1",
      sort_order: 5,
    };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addMediaToTimeline(client, "timeline-1", "media-1", 5);
    expect(result?.sort_order).toBe(5);
  });

  it("returns null when the pair already exists (dedup no-op)", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await addMediaToTimeline(client, "timeline-1", "media-1");
    expect(result).toBeNull();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "media link failed" } },
    });
    await expect(
      addMediaToTimeline(client, "timeline-1", "media-1"),
    ).rejects.toThrow("TimelineService.addMediaToTimeline: media link failed");
  });
});

// ---------------------------------------------------------------------------
// removeMediaFromTimeline
// ---------------------------------------------------------------------------

describe("removeMediaFromTimeline", () => {
  it("resolves without error on success", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removeMediaFromTimeline(client, "timeline-1", "media-1"),
    ).resolves.toBeUndefined();
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("timeline_id", "timeline-1");
    expect(builder.eq).toHaveBeenCalledWith("media_id", "media-1");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(
      removeMediaFromTimeline(client, "timeline-1", "media-1"),
    ).rejects.toThrow("TimelineService.removeMediaFromTimeline: delete failed");
  });
});

// ---------------------------------------------------------------------------
// reorderTimelineMedia
// ---------------------------------------------------------------------------

describe("reorderTimelineMedia", () => {
  it("updates the junction sort_order and returns the row", async () => {
    const row = {
      timeline_id: "timeline-1",
      media_id: "media-1",
      sort_order: 3,
    };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await reorderTimelineMedia(
      client,
      "timeline-1",
      "media-1",
      3,
    );
    expect(result.sort_order).toBe(3);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.update).toHaveBeenCalledWith({ sort_order: 3 });
    expect(builder.eq).toHaveBeenCalledWith("timeline_id", "timeline-1");
    expect(builder.eq).toHaveBeenCalledWith("media_id", "media-1");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(
      reorderTimelineMedia(client, "timeline-1", "media-1", 3),
    ).rejects.toThrow("TimelineService.reorderTimelineMedia: update failed");
  });
});

// ---------------------------------------------------------------------------
// getTimelineEventsUnion
// ---------------------------------------------------------------------------

/**
 * Builds a client whose from() calls are served in sequence, each returning
 * its own builder. Used for getTimelineEventsUnion which issues 2-3 queries.
 */
function makeSequencedClient(
  results: { data: unknown; error: unknown; count?: number | null }[],
): SupabaseClient<Database> {
  let i = 0;
  const from = vi.fn(() => {
    const result = results[Math.min(i, results.length - 1)]!;
    i += 1;
    return makeBuilder(result);
  });
  return {
    from,
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    },
  } as unknown as SupabaseClient<Database>;
}

describe("getTimelineEventsUnion", () => {
  it("returns home events tagged with membership 'home'", async () => {
    const client = makeSequencedClient([
      { data: [sampleEvent], error: null }, // events (home)
      { data: [], error: null }, // timeline_events (junction)
    ]);
    const result = await getTimelineEventsUnion(client, "timeline-1");
    expect(result).toHaveLength(1);
    expect(result[0]?.membership).toBe("home");
    expect(result[0]?.id).toBe("event-1");
  });

  it("returns linked events tagged with membership 'linked'", async () => {
    const linkedEvent = { ...sampleEvent, id: "event-2", timeline_id: null };
    const client = makeSequencedClient([
      { data: [], error: null }, // events (home) — none
      { data: [{ event_id: "event-2", sort_order: 0 }], error: null }, // timeline_events
      { data: [linkedEvent], error: null }, // events .in() for linked IDs
    ]);
    const result = await getTimelineEventsUnion(client, "timeline-1");
    expect(result).toHaveLength(1);
    expect(result[0]?.membership).toBe("linked");
    expect(result[0]?.id).toBe("event-2");
  });

  it("home wins deduplication when the same event appears in both home and junction", async () => {
    const client = makeSequencedClient([
      { data: [sampleEvent], error: null }, // events (home) — event-1
      // junction also references event-1; filter removes it from linkedEventIds
      { data: [{ event_id: "event-1", sort_order: 0 }], error: null },
    ]);
    const result = await getTimelineEventsUnion(client, "timeline-1");
    expect(result).toHaveLength(1);
    expect(result[0]?.membership).toBe("home");
  });

  it("sorts by junction_sort_order when any event has a non-zero editorial order", async () => {
    const eventA = { ...sampleEvent, id: "event-a" };
    const eventB = { ...sampleEvent, id: "event-b" };
    const client = makeSequencedClient([
      { data: [eventA, eventB], error: null }, // events (home)
      {
        data: [
          { event_id: "event-a", sort_order: 2 },
          { event_id: "event-b", sort_order: 1 },
        ],
        error: null,
      },
    ]);
    const result = await getTimelineEventsUnion(client, "timeline-1");
    expect(result[0]?.id).toBe("event-b");
    expect(result[1]?.id).toBe("event-a");
  });

  it("falls back to sort_order_years when no editorial order is set", async () => {
    const eventA = { ...sampleEvent, id: "event-a", sort_order_years: 200 };
    const eventB = { ...sampleEvent, id: "event-b", sort_order_years: 100 };
    const client = makeSequencedClient([
      { data: [eventA, eventB], error: null }, // events (home)
      {
        data: [
          { event_id: "event-a", sort_order: 0 },
          { event_id: "event-b", sort_order: 0 },
        ],
        error: null,
      },
    ]);
    const result = await getTimelineEventsUnion(client, "timeline-1");
    expect(result[0]?.id).toBe("event-b"); // lower sort_order_years first
    expect(result[1]?.id).toBe("event-a");
  });

  it("breaks editorial ties by sort_order_years then id, with sort_order=0 pushed last", async () => {
    // event-a and event-b share editorial order 1 → tie broken by sort_order_years.
    // event-c/event-d have sort_order 0 → pushed last, tie broken by id.
    const eventA = { ...sampleEvent, id: "event-a", sort_order_years: 200 };
    const eventB = { ...sampleEvent, id: "event-b", sort_order_years: 100 };
    const eventC = { ...sampleEvent, id: "event-c", sort_order_years: 50 };
    const eventD = { ...sampleEvent, id: "event-d", sort_order_years: 50 };
    const client = makeSequencedClient([
      { data: [eventA, eventB, eventC, eventD], error: null }, // events (home)
      {
        data: [
          { event_id: "event-a", sort_order: 1 },
          { event_id: "event-b", sort_order: 1 },
          { event_id: "event-c", sort_order: 0 },
          { event_id: "event-d", sort_order: 0 },
        ],
        error: null,
      },
    ]);
    const result = await getTimelineEventsUnion(client, "timeline-1");
    expect(result.map((e) => e.id)).toEqual([
      "event-b", // order 1, years 100
      "event-a", // order 1, years 200
      "event-c", // order 0 (last), years 50, id < event-d
      "event-d", // order 0 (last), years 50
    ]);
  });

  it("is deterministic when sort_order and sort_order_years are equal (id tie-break)", async () => {
    const eventY = { ...sampleEvent, id: "event-y", sort_order_years: 100 };
    const eventX = { ...sampleEvent, id: "event-x", sort_order_years: 100 };
    const client = makeSequencedClient([
      { data: [eventY, eventX], error: null }, // events (home), returned y-before-x
      {
        data: [
          { event_id: "event-y", sort_order: 3 },
          { event_id: "event-x", sort_order: 3 },
        ],
        error: null,
      },
    ]);
    const result = await getTimelineEventsUnion(client, "timeline-1");
    expect(result.map((e) => e.id)).toEqual(["event-x", "event-y"]);
  });

  it("throws on home events query error", async () => {
    const client = makeSequencedClient([
      { data: null, error: { message: "home failed" } }, // events (home)
      { data: [], error: null }, // timeline_events
    ]);
    await expect(getTimelineEventsUnion(client, "timeline-1")).rejects.toThrow(
      "TimelineService.getTimelineEventsUnion(home): home failed",
    );
  });

  it("throws on junction query error", async () => {
    const client = makeSequencedClient([
      { data: [], error: null }, // events (home)
      { data: null, error: { message: "junction failed" } }, // timeline_events
    ]);
    await expect(getTimelineEventsUnion(client, "timeline-1")).rejects.toThrow(
      "TimelineService.getTimelineEventsUnion(junction): junction failed",
    );
  });
});
