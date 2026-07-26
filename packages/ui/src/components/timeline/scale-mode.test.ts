import { describe, expect, it } from "vitest";
import {
  coerceScaleParam,
  DEFAULT_VIEW_MODE,
  isSpanCompressed,
  LINEAR_COMPRESSION_THRESHOLD_YEARS,
  SCALE_QUERY_KEY,
  toScaleMode,
  toViewMode,
} from "./scale-mode";

describe("coerceScaleParam", () => {
  it("selects linear only for the exact 'linear' value", () => {
    expect(coerceScaleParam("linear")).toBe("linear");
  });

  it("keeps 'logarithmic' as logarithmic", () => {
    expect(coerceScaleParam("logarithmic")).toBe("logarithmic");
  });

  it.each([null, undefined, "", "log", "Linear", "LINEAR", "foo", "0"])(
    "coerces invalid input %p to the logarithmic default (spec §5.1)",
    (value) => {
      expect(coerceScaleParam(value as string | null | undefined)).toBe(
        DEFAULT_VIEW_MODE,
      );
    },
  );

  it("has logarithmic as the default mode", () => {
    expect(DEFAULT_VIEW_MODE).toBe("logarithmic");
  });

  it("exposes the canonical query key", () => {
    expect(SCALE_QUERY_KEY).toBe("scale");
  });
});

describe("view/scale mode adapters", () => {
  it("maps ViewMode to the renderer's TimelineScaleMode", () => {
    expect(toScaleMode("logarithmic")).toBe("log");
    expect(toScaleMode("linear")).toBe("linear");
  });

  it("maps TimelineScaleMode back to ViewMode", () => {
    expect(toViewMode("log")).toBe("logarithmic");
    expect(toViewMode("linear")).toBe("linear");
  });

  it("round-trips both modes", () => {
    expect(toViewMode(toScaleMode("logarithmic"))).toBe("logarithmic");
    expect(toViewMode(toScaleMode("linear"))).toBe("linear");
  });
});

describe("isSpanCompressed (V-07 threshold)", () => {
  it("never trips in logarithmic mode, even on a cosmological span", () => {
    expect(isSpanCompressed([-13.8e9, 2026], "logarithmic")).toBe(false);
  });

  it("trips in linear mode at or above the threshold", () => {
    const min = 0;
    expect(
      isSpanCompressed([min, LINEAR_COMPRESSION_THRESHOLD_YEARS], "linear"),
    ).toBe(true);
    expect(isSpanCompressed([-13.8e9, 2026], "linear")).toBe(true);
  });

  it("does not trip in linear mode just below the threshold", () => {
    expect(
      isSpanCompressed([0, LINEAR_COMPRESSION_THRESHOLD_YEARS - 1], "linear"),
    ).toBe(false);
  });

  it("uses absolute span, independent of endpoint order/sign", () => {
    expect(isSpanCompressed([2026, -13.8e9], "linear")).toBe(true);
  });

  it("documents an explicit one-megayear threshold", () => {
    expect(LINEAR_COMPRESSION_THRESHOLD_YEARS).toBe(1_000_000);
  });
});
