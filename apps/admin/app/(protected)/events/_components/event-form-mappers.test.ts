import { describe, it, expect } from "vitest";

import type { TemporalData } from "@repo/services/schemas/temporal";
import type { EventWithRelations } from "@repo/services/event-service";

import {
  eventFormSchema,
  BLANK_VALUES,
  toTemporalOrNull,
  parseNullableNumber,
  readCoordinate,
  toSpatialData,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
  diffAppearsIn,
  type EventFormValues,
} from "./event-form-mappers";

const START: TemporalData = { year: 1990, era: "CE", precision: "exact" };
const LATER: TemporalData = { year: 2000, era: "CE", precision: "exact" };
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

function makeValues(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    ...BLANK_VALUES,
    title: "Moon landing",
    slug: "moon-landing",
    ...overrides,
  };
}

describe("diffAppearsIn", () => {
  it("reports only additions", () => {
    expect(diffAppearsIn([], ["a", "b"])).toEqual({
      toAdd: ["a", "b"],
      toRemove: [],
    });
  });

  it("reports only removals", () => {
    expect(diffAppearsIn(["a", "b"], [])).toEqual({
      toAdd: [],
      toRemove: ["a", "b"],
    });
  });

  it("reports a mixed add/remove", () => {
    expect(diffAppearsIn(["a", "b"], ["b", "c"])).toEqual({
      toAdd: ["c"],
      toRemove: ["a"],
    });
  });

  it("is a no-op when membership is unchanged", () => {
    expect(diffAppearsIn(["a", "b"], ["a", "b"])).toEqual({
      toAdd: [],
      toRemove: [],
    });
  });
});

describe("parseNullableNumber", () => {
  it("treats an empty field as null", () => {
    expect(parseNullableNumber("", Number.NaN)).toBeNull();
  });

  it("treats unparseable (NaN) input as null", () => {
    expect(parseNullableNumber("-", Number.NaN)).toBeNull();
  });

  it("passes a valid number through", () => {
    expect(parseNullableNumber("42.5", 42.5)).toBe(42.5);
  });

  it("keeps zero", () => {
    expect(parseNullableNumber("0", 0)).toBe(0);
  });
});

describe("readCoordinate", () => {
  it("reads lat/lng from a spatial object", () => {
    const spatial = { lat: 12.5, lng: -77.1 };
    expect(readCoordinate(spatial, "lat")).toBe(12.5);
    expect(readCoordinate(spatial, "lng")).toBe(-77.1);
  });

  it("returns null for a non-finite value", () => {
    expect(readCoordinate({ lat: Number.POSITIVE_INFINITY }, "lat")).toBeNull();
  });

  it("returns null for a missing key", () => {
    expect(readCoordinate({ lng: 1 }, "lat")).toBeNull();
  });

  it("returns null for arrays, null, and primitives", () => {
    expect(readCoordinate([1, 2], "lat")).toBeNull();
    expect(readCoordinate(null, "lat")).toBeNull();
    expect(readCoordinate("nope", "lat")).toBeNull();
  });
});

describe("toSpatialData", () => {
  it("recombines a complete lat/lng pair", () => {
    expect(toSpatialData(1, 2)).toEqual({ lat: 1, lng: 2 });
  });

  it("returns undefined when either coordinate is null", () => {
    expect(toSpatialData(1, null)).toBeUndefined();
    expect(toSpatialData(null, 2)).toBeUndefined();
    expect(toSpatialData(null, null)).toBeUndefined();
  });

  it("round-trips through readCoordinate", () => {
    const blob = toSpatialData(10, 20);
    expect(readCoordinate(blob, "lat")).toBe(10);
    expect(readCoordinate(blob, "lng")).toBe(20);
  });
});

describe("toTemporalOrNull", () => {
  it("passes valid TemporalData through", () => {
    expect(toTemporalOrNull(START)).toEqual(START);
  });

  it("coerces empty/garbage JSON to null", () => {
    expect(toTemporalOrNull({})).toBeNull();
    expect(toTemporalOrNull(null)).toBeNull();
    expect(toTemporalOrNull({ era: "CE" })).toBeNull();
  });
});

describe("mapRowToFormValues", () => {
  function makeRow(
    overrides: Partial<EventWithRelations> = {},
  ): EventWithRelations {
    return {
      title: "Row title",
      slug: "row-title",
      summary: null,
      detail: null,
      event_type: null,
      importance: null,
      location: null,
      spatial_data: null,
      temporal_data: null,
      end_temporal_data: null,
      timeline_id: null,
      detail_timeline_id: null,
      metadata: null,
      ...overrides,
    } as unknown as EventWithRelations;
  }

  it("falls back to sensible defaults for nullable columns", () => {
    const values = mapRowToFormValues(makeRow(), []);
    expect(values).toMatchObject({
      summary: "",
      detail: "",
      event_type: "milestone",
      importance: 5,
      location: "",
      latitude: null,
      longitude: null,
      temporal_data: null,
      end_temporal_data: null,
      timeline_id: undefined,
      detail_timeline_id: undefined,
      metadata: undefined,
      appears_in: [],
    });
  });

  it("extracts coordinates and carries the appears_in list", () => {
    const values = mapRowToFormValues(
      makeRow({ spatial_data: { lat: 5, lng: 6 }, temporal_data: START }),
      [UUID_A],
    );
    expect(values.latitude).toBe(5);
    expect(values.longitude).toBe(6);
    expect(values.temporal_data).toEqual(START);
    expect(values.appears_in).toEqual([UUID_A]);
  });

  it("treats a legacy empty-object temporal as null", () => {
    const values = mapRowToFormValues(makeRow({ temporal_data: {} }), []);
    expect(values.temporal_data).toBeNull();
  });
});

describe("toCreateInput", () => {
  it("drops empty-string optionals and omits an unset slug", () => {
    const input = toCreateInput(
      makeValues({ slug: "", summary: "", location: "", temporal_data: START }),
    );
    expect(input.summary).toBeUndefined();
    expect(input.location).toBeUndefined();
    expect(input.slug).toBeUndefined();
  });

  it("omits spatial_data when coordinates are absent", () => {
    const input = toCreateInput(makeValues({ temporal_data: START }));
    expect(input.spatial_data).toBeUndefined();
  });

  it("includes spatial_data when both coordinates are present", () => {
    const input = toCreateInput(
      makeValues({ latitude: 1, longitude: 2, temporal_data: START }),
    );
    expect(input.spatial_data).toEqual({ lat: 1, lng: 2 });
  });
});

describe("toUpdateData", () => {
  it("clears spatial_data with an empty object when coordinates are absent", () => {
    const data = toUpdateData(makeValues({ temporal_data: START }));
    expect(data.spatial_data).toEqual({});
  });

  it("keeps the slug (even empty) on update", () => {
    const data = toUpdateData(makeValues({ slug: "", temporal_data: START }));
    expect(data.slug).toBe("");
  });

  it("writes spatial_data when coordinates are present", () => {
    const data = toUpdateData(
      makeValues({ latitude: 3, longitude: 4, temporal_data: START }),
    );
    expect(data.spatial_data).toEqual({ lat: 3, lng: 4 });
  });
});

describe("eventFormSchema refinements", () => {
  function base(overrides: Record<string, unknown> = {}) {
    return {
      title: "Valid event",
      slug: "valid-event",
      event_type: "milestone",
      importance: 5,
      temporal_data: START,
      appears_in: [],
      ...overrides,
    };
  }

  it("accepts a valid event", () => {
    expect(eventFormSchema.safeParse(base()).success).toBe(true);
  });

  it("requires a start date", () => {
    const result = eventFormSchema.safeParse(base({ temporal_data: null }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "temporal_data"),
      ).toBe(true);
    }
  });

  it("rejects an end before the start", () => {
    const result = eventFormSchema.safeParse(
      base({ temporal_data: LATER, end_temporal_data: START }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "end_temporal_data"),
      ).toBe(true);
    }
  });

  it("rejects expanding into the event's own primary timeline", () => {
    const result = eventFormSchema.safeParse(
      base({ timeline_id: UUID_A, detail_timeline_id: UUID_A }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "detail_timeline_id"),
      ).toBe(true);
    }
  });

  it("allows a different expands-into timeline", () => {
    expect(
      eventFormSchema.safeParse(
        base({ timeline_id: UUID_A, detail_timeline_id: UUID_B }),
      ).success,
    ).toBe(true);
  });

  it("rejects a latitude without a longitude", () => {
    const result = eventFormSchema.safeParse(base({ latitude: 10 }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "longitude")).toBe(
        true,
      );
    }
  });

  it("rejects a longitude without a latitude", () => {
    const result = eventFormSchema.safeParse(base({ longitude: 10 }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "latitude")).toBe(
        true,
      );
    }
  });

  it("accepts a complete coordinate pair", () => {
    expect(
      eventFormSchema.safeParse(base({ latitude: 10, longitude: 20 })).success,
    ).toBe(true);
  });
});
