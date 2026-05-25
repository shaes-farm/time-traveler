import { beforeEach, describe, expect, it } from "vitest";
import {
  useNavigationStore,
  type NavigationState,
} from "./navigation-store.js";

// Reset store to initial state before each test to ensure isolation.
beforeEach(() => {
  useNavigationStore.getState().resetView();
});

describe("useNavigationStore — initial state", () => {
  it("starts with null currentTimelineId", () => {
    expect(useNavigationStore.getState().currentTimelineId).toBeNull();
  });

  it("starts with logarithmic viewMode", () => {
    expect(useNavigationStore.getState().viewMode).toBe("logarithmic");
  });

  it("starts with zoomLevel 1", () => {
    expect(useNavigationStore.getState().zoomLevel).toBe(1);
  });

  it("starts with visibleRange spanning Big Bang to near future", () => {
    const { visibleRange } = useNavigationStore.getState();
    expect(visibleRange.start).toBe(-14_000_000_000);
    expect(visibleRange.end).toBe(2_100_000_000);
  });

  it("starts with null selectedEventId", () => {
    expect(useNavigationStore.getState().selectedEventId).toBeNull();
  });

  it("starts with null selectedPeriodId", () => {
    expect(useNavigationStore.getState().selectedPeriodId).toBeNull();
  });
});

describe("setTimeline", () => {
  it("sets currentTimelineId to the provided id", () => {
    useNavigationStore.getState().setTimeline("tl-1");
    expect(useNavigationStore.getState().currentTimelineId).toBe("tl-1");
  });

  it("accepts null to clear the active timeline", () => {
    useNavigationStore.getState().setTimeline("tl-1");
    useNavigationStore.getState().setTimeline(null);
    expect(useNavigationStore.getState().currentTimelineId).toBeNull();
  });
});

describe("setViewMode", () => {
  it("switches to linear", () => {
    useNavigationStore.getState().setViewMode("linear");
    expect(useNavigationStore.getState().viewMode).toBe("linear");
  });

  it("switches back to logarithmic", () => {
    useNavigationStore.getState().setViewMode("linear");
    useNavigationStore.getState().setViewMode("logarithmic");
    expect(useNavigationStore.getState().viewMode).toBe("logarithmic");
  });
});

describe("zoomIn", () => {
  it("doubles the zoom level", () => {
    useNavigationStore.getState().zoomIn();
    expect(useNavigationStore.getState().zoomLevel).toBe(2);
  });

  it("caps zoom level at 32", () => {
    // Zoom in 6 times from level 1: 1→2→4→8→16→32
    for (let i = 0; i < 6; i++) useNavigationStore.getState().zoomIn();
    expect(useNavigationStore.getState().zoomLevel).toBe(32);
    // Further zooms should not exceed the cap
    useNavigationStore.getState().zoomIn();
    expect(useNavigationStore.getState().zoomLevel).toBe(32);
  });
});

describe("zoomOut", () => {
  it("halves the zoom level", () => {
    useNavigationStore.getState().zoomIn(); // 1→2
    useNavigationStore.getState().zoomOut(); // 2→1
    expect(useNavigationStore.getState().zoomLevel).toBe(1);
  });

  it("floors zoom level at 1", () => {
    useNavigationStore.getState().zoomOut();
    expect(useNavigationStore.getState().zoomLevel).toBe(1);
  });

  it("floors zoom level at 1 on repeated calls", () => {
    useNavigationStore.getState().zoomOut();
    useNavigationStore.getState().zoomOut();
    expect(useNavigationStore.getState().zoomLevel).toBe(1);
  });
});

describe("panTo", () => {
  it("recentres the visible range on the given sort_order value", () => {
    // Initial range: start=-14_000_000_000, end=2_100_000_000 → width=16_100_000_000: halfWidth=8_050_000_000
    const centre = 0;
    useNavigationStore.getState().panTo(centre);
    const { visibleRange } = useNavigationStore.getState();
    expect(visibleRange.start).toBe(centre - 8_050_000_000);
    expect(visibleRange.end).toBe(centre + 8_050_000_000);
  });

  it("preserves the width of the visible range", () => {
    const before = useNavigationStore.getState().visibleRange;
    const widthBefore = before.end - before.start;
    useNavigationStore.getState().panTo(1_000);
    const after = useNavigationStore.getState().visibleRange;
    expect(after.end - after.start).toBeCloseTo(widthBefore, 5);
  });
});

describe("selectEvent", () => {
  it("sets selectedEventId", () => {
    useNavigationStore.getState().selectEvent("ev-1");
    expect(useNavigationStore.getState().selectedEventId).toBe("ev-1");
  });

  it("clears selectedEventId when passed null", () => {
    useNavigationStore.getState().selectEvent("ev-1");
    useNavigationStore.getState().selectEvent(null);
    expect(useNavigationStore.getState().selectedEventId).toBeNull();
  });
});

describe("selectPeriod", () => {
  it("sets selectedPeriodId", () => {
    useNavigationStore.getState().selectPeriod("per-1");
    expect(useNavigationStore.getState().selectedPeriodId).toBe("per-1");
  });

  it("clears selectedPeriodId when passed null", () => {
    useNavigationStore.getState().selectPeriod("per-1");
    useNavigationStore.getState().selectPeriod(null);
    expect(useNavigationStore.getState().selectedPeriodId).toBeNull();
  });
});

describe("resetView", () => {
  it("restores all state to initial defaults", () => {
    const store = useNavigationStore.getState();
    store.setTimeline("tl-99");
    store.setViewMode("linear");
    store.zoomIn();
    store.panTo(999_999);
    store.selectEvent("ev-99");
    store.selectPeriod("per-99");
    store.resetView();

    const reset = useNavigationStore.getState();
    const expected: NavigationState = {
      currentTimelineId: null,
      viewMode: "logarithmic",
      zoomLevel: 1,
      visibleRange: { start: -14_000_000_000, end: 2_100_000_000 },
      selectedEventId: null,
      selectedPeriodId: null,
    };
    expect(reset.currentTimelineId).toBe(expected.currentTimelineId);
    expect(reset.viewMode).toBe(expected.viewMode);
    expect(reset.zoomLevel).toBe(expected.zoomLevel);
    expect(reset.visibleRange).toEqual(expected.visibleRange);
    expect(reset.selectedEventId).toBe(expected.selectedEventId);
    expect(reset.selectedPeriodId).toBe(expected.selectedPeriodId);
  });
});

describe("persist partialize", () => {
  it("only persists viewMode and zoomLevel (not session state)", () => {
    // Access the persist options via the store API
    const persistApi = useNavigationStore.persist;
    // Set some state then inspect what partialize produces
    useNavigationStore.getState().setTimeline("tl-1");
    useNavigationStore.getState().setViewMode("linear");
    useNavigationStore.getState().zoomIn();
    useNavigationStore.getState().selectEvent("ev-1");

    const stored = persistApi
      .getOptions()
      .partialize?.(useNavigationStore.getState()) as Record<string, unknown>;

    expect(stored).toHaveProperty("viewMode", "linear");
    expect(stored).toHaveProperty("zoomLevel", 2);
    expect(stored).not.toHaveProperty("currentTimelineId");
    expect(stored).not.toHaveProperty("selectedEventId");
    expect(stored).not.toHaveProperty("selectedPeriodId");
    expect(stored).not.toHaveProperty("visibleRange");
  });
});
