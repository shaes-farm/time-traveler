import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types.js";
import {
  getTimelines,
  getTimelineById,
  getTimelineBySlug,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  publishTimeline,
  unpublishTimeline,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  addEventToTimeline,
  removeEventFromTimeline,
  addMediaToTimeline,
} from "./timeline-service.js";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

/**
 * Creates a chainable query builder mock that resolves with the given result.
 * Methods return `this` to support chaining; the terminal call returns a
 * promise that resolves to `{ data, error }`.
 */
function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: terminal,
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
  fromResult?: { data: unknown; error: unknown };
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

  it("applies search filter via ilike", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getTimelines(client, { search: "ancient" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.ilike).toHaveBeenCalledWith("title", "%ancient%");
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "DB error" } },
    });
    await expect(getTimelines(client)).rejects.toThrow(
      "TimelineService.getTimelines: DB error",
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
// getTimelineBySlug
// ---------------------------------------------------------------------------

describe("getTimelineBySlug", () => {
  it("returns a timeline with relations", async () => {
    const full = {
      ...sampleTimeline,
      timeline_collaborators: [],
      timeline_events: [],
      timeline_media: [],
    };
    const client = makeClient({ fromResult: { data: full, error: null } });
    const result = await getTimelineBySlug(client, "my-timeline");
    expect(result).toEqual(full);
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getTimelineBySlug(client, "missing")).rejects.toThrow(
      "TimelineService.getTimelineBySlug: not found",
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

    const insertMock = vi.fn();
    const client = {
      from: vi.fn().mockImplementation(() => {
        const result = fromResults[callIndex++] ?? { data: null, error: null };
        const builder = makeQuery(result);
        if (callIndex === 2) insertMock.mockImplementation(() => builder);
        return builder;
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await createTimeline(client, minimalCreateInput);
    // slug must be derived from the title
    expect(result.slug).toMatch(/^[a-z0-9-]+$/);
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
  it("returns updated row with published:true", async () => {
    const published = {
      ...sampleTimeline,
      published: true,
      published_at: "2026-01-01T00:00:00.000Z",
    };
    const client = makeClient({ fromResult: { data: published, error: null } });
    const result = await publishTimeline(client, "timeline-1");
    expect(result.published).toBe(true);
    expect(result.published_at).toBeTruthy();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "publish failed" } },
    });
    await expect(publishTimeline(client, "timeline-1")).rejects.toThrow(
      "TimelineService.publishTimeline: publish failed",
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
  it("returns the new junction row", async () => {
    const row = { timeline_id: "timeline-1", event_id: "event-1" };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addEventToTimeline(client, "timeline-1", "event-1");
    expect(result).toEqual(row);
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
// addMediaToTimeline
// ---------------------------------------------------------------------------

describe("addMediaToTimeline", () => {
  it("returns the new junction row with default sort_order=0", async () => {
    const row = {
      timeline_id: "timeline-1",
      media_id: "media-1",
      sort_order: 0,
    };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addMediaToTimeline(client, "timeline-1", "media-1");
    expect(result).toEqual(row);
  });

  it("accepts an explicit sort_order", async () => {
    const row = {
      timeline_id: "timeline-1",
      media_id: "media-1",
      sort_order: 5,
    };
    const client = makeClient({ fromResult: { data: row, error: null } });
    const result = await addMediaToTimeline(client, "timeline-1", "media-1", 5);
    expect(result.sort_order).toBe(5);
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
