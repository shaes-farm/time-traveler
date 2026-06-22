import { describe, it, expect } from "vitest";

import type { TemporalData } from "@repo/services/schemas/temporal";
import type { TimelineWithRelations } from "@repo/services/timeline-service";

import {
  timelineFormSchema,
  BLANK_VALUES,
  toTemporalOrNull,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
  type TimelineFormValues,
} from "./timeline-form-mappers";

const START: TemporalData = { year: 1990, era: "CE", precision: "exact" };
const LATER: TemporalData = { year: 2000, era: "CE", precision: "exact" };
const UUID_A = "11111111-1111-4111-8111-111111111111";

function makeValues(
  overrides: Partial<TimelineFormValues> = {},
): TimelineFormValues {
  return {
    ...BLANK_VALUES,
    title: "Roman Empire",
    slug: "roman-empire",
    ...overrides,
  };
}

describe("toTemporalOrNull", () => {
  it("passes valid TemporalData through", () => {
    expect(toTemporalOrNull(START)).toEqual(START);
  });

  it("coerces empty/garbage JSON to null", () => {
    expect(toTemporalOrNull({})).toBeNull();
    expect(toTemporalOrNull(null)).toBeNull();
  });
});

describe("mapRowToFormValues", () => {
  function makeRow(
    overrides: Partial<TimelineWithRelations> = {},
  ): TimelineWithRelations {
    return {
      title: "Row title",
      slug: "row-title",
      summary: null,
      detail: null,
      scale: null,
      temporal_data: null,
      end_temporal_data: null,
      timeline_type: null,
      subject_character_id: null,
      visibility: null,
      fractal_depth: null,
      metadata: null,
      ...overrides,
    } as unknown as TimelineWithRelations;
  }

  it("falls back to sensible defaults for nullable columns", () => {
    expect(mapRowToFormValues(makeRow())).toMatchObject({
      summary: "",
      detail: "",
      scale: "",
      temporal_data: null,
      end_temporal_data: null,
      timeline_type: "general",
      subject_character_id: undefined,
      visibility: "private",
      fractal_depth: 5,
      metadata: undefined,
    });
  });

  it("carries persisted values through", () => {
    const values = mapRowToFormValues(
      makeRow({
        temporal_data: START,
        timeline_type: "biographical",
        subject_character_id: UUID_A,
        visibility: "public",
        fractal_depth: 3,
      }),
    );
    expect(values).toMatchObject({
      temporal_data: START,
      timeline_type: "biographical",
      subject_character_id: UUID_A,
      visibility: "public",
      fractal_depth: 3,
    });
  });

  it("treats a legacy empty-object temporal as null", () => {
    expect(
      mapRowToFormValues(makeRow({ temporal_data: {} })).temporal_data,
    ).toBeNull();
  });
});

describe("toCreateInput", () => {
  it("drops empty-string optionals and omits an unset slug", () => {
    const input = toCreateInput(
      makeValues({ slug: "", summary: "", scale: "", temporal_data: START }),
    );
    expect(input.summary).toBeUndefined();
    expect(input.scale).toBeUndefined();
    expect(input.slug).toBeUndefined();
  });

  it("includes a provided slug", () => {
    const input = toCreateInput(makeValues({ temporal_data: START }));
    expect(input.slug).toBe("roman-empire");
  });
});

describe("toUpdateData", () => {
  it("normalizes an unset subject character to null and keeps the slug", () => {
    const data = toUpdateData(
      makeValues({
        slug: "",
        subject_character_id: undefined,
        temporal_data: START,
      }),
    );
    expect(data.subject_character_id).toBeNull();
    expect(data.slug).toBe("");
  });

  it("preserves a subject character on update", () => {
    const data = toUpdateData(
      makeValues({ subject_character_id: UUID_A, temporal_data: START }),
    );
    expect(data.subject_character_id).toBe(UUID_A);
  });
});

describe("timelineFormSchema refinements", () => {
  function base(overrides: Record<string, unknown> = {}) {
    return {
      title: "Valid timeline",
      slug: "valid-timeline",
      timeline_type: "general",
      visibility: "private",
      fractal_depth: 5,
      temporal_data: START,
      ...overrides,
    };
  }

  it("accepts a valid timeline", () => {
    expect(timelineFormSchema.safeParse(base()).success).toBe(true);
  });

  it("requires a start date", () => {
    const result = timelineFormSchema.safeParse(base({ temporal_data: null }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "temporal_data"),
      ).toBe(true);
    }
  });

  it("requires a subject character for biographical timelines", () => {
    const result = timelineFormSchema.safeParse(
      base({ timeline_type: "biographical" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "subject_character_id"),
      ).toBe(true);
    }
  });

  it("accepts a biographical timeline with a subject", () => {
    expect(
      timelineFormSchema.safeParse(
        base({ timeline_type: "biographical", subject_character_id: UUID_A }),
      ).success,
    ).toBe(true);
  });

  it("rejects an end before the start", () => {
    const result = timelineFormSchema.safeParse(
      base({ temporal_data: LATER, end_temporal_data: START }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "end_temporal_data"),
      ).toBe(true);
    }
  });
});
