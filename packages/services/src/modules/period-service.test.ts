import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types.js";
import type { CreatePeriodInput } from "./period-service.js";
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
} from "./period-service.js";

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
    is: vi.fn().mockReturnThis(),
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
  it("returns the matching period", async () => {
    const client = makeClient({
      fromResult: { data: samplePeriod, error: null },
    });
    const result = await getPeriodById(client, "period-1");
    expect(result).toEqual(samplePeriod);
  });

  it("throws on error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getPeriodById(client, "period-1")).rejects.toThrow(
      "PeriodService.getPeriodById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// getPeriodBySlug
// ---------------------------------------------------------------------------

describe("getPeriodBySlug", () => {
  it("returns the matching period", async () => {
    const client = makeClient({
      fromResult: { data: samplePeriod, error: null },
    });
    const result = await getPeriodBySlug(client, "user-123", "middle-ages");
    expect(result).toEqual(samplePeriod);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(builder.eq).toHaveBeenCalledWith("slug", "middle-ages");
  });

  it("throws on error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
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
  it("returns the created junction row", async () => {
    const client = makeClient({
      fromResult: { data: samplePeriodTimeline, error: null },
    });
    const result = await addPeriodToTimeline(client, "period-1", "timeline-1");
    expect(result).toEqual(samplePeriodTimeline);
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.insert).toHaveBeenCalledWith({
      period_id: "period-1",
      timeline_id: "timeline-1",
    });
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
