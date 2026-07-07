import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { CreatePeriodInput } from "./period-service";
import {
  getPeriods,
  getPeriodById,
  getPeriodBySlug,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getChildPeriods,
  addPeriodToTimeline,
  removePeriodFromTimeline,
  assertNoPeriodCycle,
  getEventsInPeriod,
} from "./period-service";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: terminal,
    maybeSingle: terminal,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return builder;
}

// Successive `from()` calls return successive builders — used to script the
// multi-step ancestor walk in `assertNoPeriodCycle` and the multi-query
// `getEventsInPeriod` scoped path.
function makeSequenceClient(results: { data: unknown; error: unknown }[]) {
  const builders = results.map(makeBuilder);
  let callCount = 0;
  const client = {
    from: vi.fn().mockImplementation(() => {
      const builder =
        builders[callCount] ??
        makeBuilder({
          data: null,
          error: null,
        });
      callCount++;
      return builder;
    }),
  } as unknown as SupabaseClient<Database>;
  return { client, builders };
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

// For createPeriod: first call fetches slugs (returns array), second call is
// the insert (returns single row via .single() terminal).
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

type TemporalData = CreatePeriodInput["temporal_data"];
const sampleTemporalData: TemporalData = {
  era: "CE",
  year: 500,
  precision: "approximate",
};

const samplePeriod = {
  id: "period-1",
  user_id: "user-123",
  slug: "middle-ages",
  title: "Middle Ages",
  summary: "Medieval period",
  detail: null,
  temporal_data: sampleTemporalData,
  sort_order_start: -46125142800,
  end_temporal_data: null,
  sort_order_end: null,
  parent_period_id: null,
  significance: "high",
  characteristics: ["feudalism", "plague"],
  published: false,
  published_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const samplePeriodTimeline = {
  period_id: "period-1",
  timeline_id: "timeline-1",
};

// ---------------------------------------------------------------------------
// getPeriods
// ---------------------------------------------------------------------------

describe("getPeriods", () => {
  it("returns an array of periods", async () => {
    const client = makeClient({
      fromResult: { data: [samplePeriod], error: null },
    });
    const result = await getPeriods(client);
    expect(result).toEqual([samplePeriod]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getPeriods(client)).toEqual([]);
  });

  it("applies userId filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getPeriods(client, { userId: "user-abc" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-abc");
  });

  it("applies parentPeriodId filter with a UUID", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getPeriods(client, { parentPeriodId: "parent-1" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("parent_period_id", "parent-1");
  });

  it("applies parentPeriodId IS NULL filter when null is passed", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getPeriods(client, { parentPeriodId: null });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.is).toHaveBeenCalledWith("parent_period_id", null);
  });

  it("applies search filter via ilike on title", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getPeriods(client, { search: "middle" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.ilike).toHaveBeenCalledWith("title", "%middle%");
  });

  it("does not apply ilike when search string is empty", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getPeriods(client, { search: "  " });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.ilike).not.toHaveBeenCalled();
  });

  it("throws on query error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(getPeriods(client)).rejects.toThrow(
      "PeriodService.getPeriods: db error",
    );
  });
});

// ---------------------------------------------------------------------------
// getPeriodById
// ---------------------------------------------------------------------------

describe("getPeriodById", () => {
  it("returns the matching period with its child periods attached", async () => {
    const child = {
      ...samplePeriod,
      id: "period-2",
      parent_period_id: "period-1",
    };
    // Query 1: the period (via .single()); query 2: getChildPeriods (thenable).
    const { client } = makeSequenceClient([
      { data: samplePeriod, error: null },
      { data: [child], error: null },
    ]);
    const result = await getPeriodById(client, "period-1");
    expect(result).toEqual({ ...samplePeriod, child_periods: [child] });
  });

  it("throws on error", async () => {
    const { client } = makeSequenceClient([
      { data: null, error: { message: "not found" } },
    ]);
    await expect(getPeriodById(client, "period-1")).rejects.toThrow(
      "PeriodService.getPeriodById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// getPeriodBySlug
// ---------------------------------------------------------------------------

describe("getPeriodBySlug", () => {
  it("returns the matching period with its child periods attached", async () => {
    const { client, builders } = makeSequenceClient([
      { data: samplePeriod, error: null },
      { data: [], error: null },
    ]);
    const result = await getPeriodBySlug(client, "user-123", "middle-ages");
    expect(result).toEqual({ ...samplePeriod, child_periods: [] });
    expect(builders[0]?.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(builders[0]?.eq).toHaveBeenCalledWith("slug", "middle-ages");
  });

  it("throws on error", async () => {
    const { client } = makeSequenceClient([
      { data: null, error: { message: "not found" } },
    ]);
    await expect(
      getPeriodBySlug(client, "user-123", "missing"),
    ).rejects.toThrow("PeriodService.getPeriodBySlug: not found");
  });
});

// ---------------------------------------------------------------------------
// createPeriod
// ---------------------------------------------------------------------------

describe("createPeriod", () => {
  it("creates and returns a new period", async () => {
    const client = makeCreateClient({ data: samplePeriod, error: null });
    const result = await createPeriod(client, {
      title: "Middle Ages",
      significance: "high",
      temporal_data: sampleTemporalData,
    });
    expect(result).toEqual(samplePeriod);
  });

  it("auto-generates a slug from the title", async () => {
    const client = makeCreateClient({ data: samplePeriod, error: null });
    await createPeriod(client, {
      title: "Middle Ages",
      significance: "high",
      temporal_data: sampleTemporalData,
    });
    expect(client.auth.getUser).toHaveBeenCalled();
  });

  it("uses an explicit slug when provided", async () => {
    const client = makeCreateClient({ data: samplePeriod, error: null });
    const result = await createPeriod(client, {
      title: "Middle Ages",
      slug: "custom-slug",
      significance: "high",
      temporal_data: sampleTemporalData,
    });
    expect(result).toEqual(samplePeriod);
  });

  it("throws when auth fails", async () => {
    const client = makeCreateClient({ data: null, error: null });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "auth error" },
    });
    await expect(
      createPeriod(client, {
        title: "Test",
        significance: "high",
        temporal_data: sampleTemporalData,
      }),
    ).rejects.toThrow("PeriodService.createPeriod.getUser: auth error");
  });

  it("throws when temporal_data is missing", async () => {
    const client = makeCreateClient({ data: null, error: null });
    await expect(
      // @ts-expect-error intentionally omitting required field
      createPeriod(client, { title: "Test" }),
    ).rejects.toThrow();
  });

  it("throws when user is null despite no auth error", async () => {
    const client = makeCreateClient({ data: null, error: null });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    await expect(
      createPeriod(client, {
        title: "Test",
        temporal_data: sampleTemporalData,
      }),
    ).rejects.toThrow("PeriodService.createPeriod: no authenticated user");
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
        return makeBuilder({ data: samplePeriod, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await createPeriod(client, {
      title: "Middle Ages",
      significance: "high",
      temporal_data: sampleTemporalData,
    });
    expect(result).toEqual(samplePeriod);
    expect(callCount).toBe(3);
  });

  it("propagates a non-collision insert error", async () => {
    const client = makeCreateClient({
      data: null,
      error: { message: "insert failed" },
    });
    await expect(
      createPeriod(client, {
        title: "Middle Ages",
        significance: "high",
        temporal_data: sampleTemporalData,
      }),
    ).rejects.toThrow("PeriodService.createPeriod: insert failed");
  });
});

// ---------------------------------------------------------------------------
// updatePeriod
// ---------------------------------------------------------------------------

describe("updatePeriod", () => {
  it("returns the updated period", async () => {
    const client = makeClient({
      fromResult: { data: samplePeriod, error: null },
    });
    const result = await updatePeriod(client, "period-1", { title: "Updated" });
    expect(result).toEqual(samplePeriod);
  });

  it("throws on validation error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      // @ts-expect-error intentionally wrong type
      updatePeriod(client, "period-1", { significance: "legendary" }),
    ).rejects.toThrow();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(
      updatePeriod(client, "period-1", { title: "X" }),
    ).rejects.toThrow("PeriodService.updatePeriod: update failed");
  });
});

// ---------------------------------------------------------------------------
// deletePeriod
// ---------------------------------------------------------------------------

describe("deletePeriod", () => {
  it("resolves without error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(deletePeriod(client, "period-1")).resolves.toBeUndefined();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(deletePeriod(client, "period-1")).rejects.toThrow(
      "PeriodService.deletePeriod: delete failed",
    );
  });
});

// ---------------------------------------------------------------------------
// getChildPeriods
// ---------------------------------------------------------------------------

describe("getChildPeriods", () => {
  it("returns children ordered by sort_order_start", async () => {
    const child = {
      ...samplePeriod,
      id: "period-2",
      parent_period_id: "period-1",
    };
    const client = makeClient({ fromResult: { data: [child], error: null } });
    const result = await getChildPeriods(client, "period-1");
    expect(result).toEqual([child]);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("parent_period_id", "period-1");
    expect(builder.order).toHaveBeenCalledWith("sort_order_start", {
      ascending: true,
    });
  });

  it("returns empty array when no children exist", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getChildPeriods(client, "period-1")).toEqual([]);
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "fetch failed" } },
    });
    await expect(getChildPeriods(client, "period-1")).rejects.toThrow(
      "PeriodService.getChildPeriods: fetch failed",
    );
  });
});

// ---------------------------------------------------------------------------
// addPeriodToTimeline
// ---------------------------------------------------------------------------

describe("addPeriodToTimeline", () => {
  it("upserts the junction and returns the composite key", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    const result = await addPeriodToTimeline(client, "period-1", "timeline-1");
    expect(result).toEqual(samplePeriodTimeline);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.upsert).toHaveBeenCalledWith(
      { period_id: "period-1", timeline_id: "timeline-1" },
      { onConflict: "period_id,timeline_id", ignoreDuplicates: true },
    );
  });

  it("is idempotent: a duplicate association does not throw", async () => {
    // ignoreDuplicates upsert returns no error on conflict.
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      addPeriodToTimeline(client, "period-1", "timeline-1"),
    ).resolves.toEqual(samplePeriodTimeline);
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "conflict" } },
    });
    await expect(
      addPeriodToTimeline(client, "period-1", "timeline-1"),
    ).rejects.toThrow("PeriodService.addPeriodToTimeline: conflict");
  });
});

// ---------------------------------------------------------------------------
// removePeriodFromTimeline
// ---------------------------------------------------------------------------

describe("removePeriodFromTimeline", () => {
  it("resolves without error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      removePeriodFromTimeline(client, "period-1", "timeline-1"),
    ).resolves.toBeUndefined();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(
      removePeriodFromTimeline(client, "period-1", "timeline-1"),
    ).rejects.toThrow("PeriodService.removePeriodFromTimeline: delete failed");
  });
});

// ---------------------------------------------------------------------------
// assertNoPeriodCycle
// ---------------------------------------------------------------------------

describe("assertNoPeriodCycle", () => {
  it("rejects making a period its own parent (no DB call needed)", async () => {
    const { client } = makeSequenceClient([]);
    await expect(assertNoPeriodCycle(client, "p-1", "p-1")).rejects.toThrow(
      "a period cannot be its own ancestor",
    );
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rejects assigning a descendant as the new parent", async () => {
    // Ancestor chain of the candidate parent p-3: p-3 -> p-2 -> p-1.
    const { client } = makeSequenceClient([
      { data: { parent_period_id: "p-2" }, error: null },
      { data: { parent_period_id: "p-1" }, error: null },
    ]);
    await expect(assertNoPeriodCycle(client, "p-1", "p-3")).rejects.toThrow(
      "circular hierarchy",
    );
  });

  it("allows a valid non-descendant parent (chain reaches root)", async () => {
    const { client } = makeSequenceClient([
      { data: { parent_period_id: "p-99" }, error: null },
      { data: { parent_period_id: null }, error: null },
    ]);
    await expect(
      assertNoPeriodCycle(client, "p-1", "p-3"),
    ).resolves.toBeUndefined();
  });

  it("terminates on a pre-existing cycle not involving the moved node", async () => {
    // p-3 -> p-2 -> p-3 (corrupt loop); the visited guard stops the walk.
    const { client } = makeSequenceClient([
      { data: { parent_period_id: "p-2" }, error: null },
      { data: { parent_period_id: "p-3" }, error: null },
    ]);
    await expect(
      assertNoPeriodCycle(client, "p-1", "p-3"),
    ).resolves.toBeUndefined();
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("throws when a walk query errors", async () => {
    const { client } = makeSequenceClient([
      { data: null, error: { message: "boom" } },
    ]);
    await expect(assertNoPeriodCycle(client, "p-1", "p-3")).rejects.toThrow(
      "PeriodService.assertNoPeriodCycle: boom",
    );
  });
});

// ---------------------------------------------------------------------------
// updatePeriod — reparenting
// ---------------------------------------------------------------------------

// periodSchema validates parent_period_id as a UUID, so reparent tests must use
// a real UUID rather than the "p-1"-style ids used for the guard unit tests.
const NEW_PARENT_UUID = "11111111-1111-4111-8111-111111111111";

describe("updatePeriod (reparenting)", () => {
  it("rejects a reparent that would form a cycle and skips the UPDATE", async () => {
    // Walk from NEW_PARENT_UUID immediately reaches period-1 (the moved node).
    const { client } = makeSequenceClient([
      { data: { parent_period_id: "period-1" }, error: null },
    ]);
    await expect(
      updatePeriod(client, "period-1", { parent_period_id: NEW_PARENT_UUID }),
    ).rejects.toThrow("circular hierarchy");
    // Only the ancestor-walk query ran; the UPDATE never did.
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("performs a safe reparent (walk clears, then UPDATE runs)", async () => {
    const { client } = makeSequenceClient([
      { data: { parent_period_id: null }, error: null }, // walk: NEW_PARENT -> root
      { data: samplePeriod, error: null }, // the UPDATE
    ]);
    const result = await updatePeriod(client, "period-1", {
      parent_period_id: NEW_PARENT_UUID,
    });
    expect(result).toEqual(samplePeriod);
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("reparenting to root (null) skips the cycle walk", async () => {
    const client = makeClient({
      fromResult: { data: samplePeriod, error: null },
    });
    const result = await updatePeriod(client, "period-1", {
      parent_period_id: null,
    });
    expect(result).toEqual(samplePeriod);
    // Only the UPDATE ran — no ancestor walk.
    expect(client.from).toHaveBeenCalledTimes(1);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ parent_period_id: null }),
    );
  });
});

// ---------------------------------------------------------------------------
// updatePeriod — partial-patch span validity (against the stored row)
// ---------------------------------------------------------------------------

const geo = (year: number) =>
  ({ year, era: "MYA", precision: "geological" }) as const;

describe("updatePeriod (partial-patch span validity)", () => {
  it("rejects a patch whose new end precedes the stored start, skipping UPDATE", async () => {
    // Stored start = 66 MYA; patch end = 145 MYA is chronologically earlier.
    const { client } = makeSequenceClient([
      {
        data: { temporal_data: geo(66), end_temporal_data: null },
        error: null,
      },
    ]);
    await expect(
      updatePeriod(client, "period-1", { end_temporal_data: geo(145) }),
    ).rejects.toThrow("end must be the same as or later than start");
    // Only the span fetch ran; the UPDATE never did.
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("rejects a patch whose new start follows the stored end", async () => {
    // Stored end = 66 MYA; patch start = 40 MYA is chronologically later.
    const { client } = makeSequenceClient([
      {
        data: { temporal_data: geo(145), end_temporal_data: geo(66) },
        error: null,
      },
    ]);
    await expect(
      updatePeriod(client, "period-1", { temporal_data: geo(40) }),
    ).rejects.toThrow("end must be the same as or later than start");
  });

  it("allows a partial patch that keeps the span valid (then UPDATE runs)", async () => {
    // Stored start = 145 MYA; patch end = 66 MYA is chronologically later.
    const { client } = makeSequenceClient([
      {
        data: { temporal_data: geo(145), end_temporal_data: null },
        error: null,
      },
      { data: samplePeriod, error: null },
    ]);
    const result = await updatePeriod(client, "period-1", {
      end_temporal_data: geo(66),
    });
    expect(result).toEqual(samplePeriod);
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("skips the merged-span fetch when the patch touches no temporal bound", async () => {
    const client = makeClient({
      fromResult: { data: samplePeriod, error: null },
    });
    await updatePeriod(client, "period-1", { title: "Renamed" });
    // Only the UPDATE — no extra read for span validation.
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("allows clearing the end (open-ended) without a span error", async () => {
    const { client } = makeSequenceClient([
      {
        data: { temporal_data: geo(66), end_temporal_data: geo(30) },
        error: null,
      },
      { data: samplePeriod, error: null },
    ]);
    const result = await updatePeriod(client, "period-1", {
      end_temporal_data: null,
    });
    expect(result).toEqual(samplePeriod);
    expect(client.from).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// getEventsInPeriod
// ---------------------------------------------------------------------------

const sampleEvent = {
  ...samplePeriod,
  id: "event-1",
  slug: "an-event",
  title: "An Event",
  sort_order_years: 150,
};

describe("getEventsInPeriod", () => {
  it("queries events within the period's sort-order span (unscoped)", async () => {
    const { client, builders } = makeSequenceClient([
      {
        data: {
          sort_order_start: 100,
          sort_order_end: 200,
          end_temporal_data: { era: "CE", year: 200 },
        },
        error: null,
      },
      { data: [sampleEvent], error: null },
    ]);
    const result = await getEventsInPeriod(client, "period-1");
    expect(result).toEqual([sampleEvent]);
    const eventsBuilder = builders[1];
    expect(eventsBuilder?.gte).toHaveBeenCalledWith("sort_order_years", 100);
    expect(eventsBuilder?.lte).toHaveBeenCalledWith("sort_order_years", 200);
  });

  it("collapses an open-ended period to its start instant", async () => {
    // No end era: the generated sort_order_end is 0, but open-endedness is
    // keyed off end_temporal_data, so the span collapses to sort_order_start.
    const { client, builders } = makeSequenceClient([
      {
        data: {
          sort_order_start: 100,
          sort_order_end: 0,
          end_temporal_data: null,
        },
        error: null,
      },
      { data: [], error: null },
    ]);
    await getEventsInPeriod(client, "period-1");
    expect(builders[1]?.lte).toHaveBeenCalledWith("sort_order_years", 100);
  });

  it("scopes to overlaid timelines, merging home + guest events", async () => {
    const homeEvent = {
      ...sampleEvent,
      id: "event-home",
      sort_order_years: 120,
    };
    const guestEvent = {
      ...sampleEvent,
      id: "event-guest",
      sort_order_years: 110,
    };
    const { client, builders } = makeSequenceClient([
      {
        data: {
          sort_order_start: 100,
          sort_order_end: 200,
          end_temporal_data: { era: "CE", year: 200 },
        },
        error: null,
      }, // period
      { data: [{ timeline_id: "tl-1" }], error: null }, // period_timelines
      { data: [homeEvent], error: null }, // home events
      { data: [{ event_id: "event-guest" }], error: null }, // timeline_events
      { data: [guestEvent], error: null }, // guest events
    ]);
    const result = await getEventsInPeriod(client, "period-1", {
      timelineScoped: true,
    });
    // De-duplicated and sorted by sort_order_years ascending.
    expect(result.map((e) => e.id)).toEqual(["event-guest", "event-home"]);
    expect(builders[1]?.eq).toHaveBeenCalledWith("period_id", "period-1");
    expect(builders[2]?.in).toHaveBeenCalledWith("timeline_id", ["tl-1"]);
  });

  it("returns [] when a scoped period overlays no timeline", async () => {
    const { client } = makeSequenceClient([
      {
        data: {
          sort_order_start: 100,
          sort_order_end: 200,
          end_temporal_data: { era: "CE", year: 200 },
        },
        error: null,
      },
      { data: [], error: null }, // no overlaid timelines
    ]);
    const result = await getEventsInPeriod(client, "period-1", {
      timelineScoped: true,
    });
    expect(result).toEqual([]);
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("throws when the period fetch errors", async () => {
    const { client } = makeSequenceClient([
      { data: null, error: { message: "not found" } },
    ]);
    await expect(getEventsInPeriod(client, "period-1")).rejects.toThrow(
      "PeriodService.getEventsInPeriod(period): not found",
    );
  });
});
