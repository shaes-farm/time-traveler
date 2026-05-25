"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/** Scale mode for the timeline visualization. */
export type ViewMode = "logarithmic" | "linear";

/** Temporal range expressed in sort_order units (years from epoch). */
export interface VisibleRange {
  start: number;
  end: number;
}

export interface NavigationState {
  /** Active timeline being viewed. */
  currentTimelineId: string | null;
  /** Scale toggle for the timeline axis. */
  viewMode: ViewMode;
  /** Current zoom depth (fractal zoom; higher = more detail). */
  zoomLevel: number;
  /** Temporal range currently in view, in sort_order units. */
  visibleRange: VisibleRange;
  /** Currently selected / highlighted event. */
  selectedEventId: string | null;
  /** Currently selected period band. */
  selectedPeriodId: string | null;
}

export interface NavigationActions {
  /** Set the active timeline. */
  setTimeline: (id: string | null) => void;
  /** Switch between logarithmic and linear scale. */
  setViewMode: (mode: ViewMode) => void;
  /** Zoom in by one step (doubles zoom level, max 32). */
  zoomIn: () => void;
  /** Zoom out by one step (halves zoom level, min 1). */
  zoomOut: () => void;
  /** Pan the visible range to centre on the given sort_order value. */
  panTo: (centre: number) => void;
  /** Select or deselect an event. */
  selectEvent: (id: string | null) => void;
  /** Select or deselect a period. */
  selectPeriod: (id: string | null) => void;
  /** Reset all state back to initial defaults. */
  resetView: () => void;
}

export type NavigationStore = NavigationState & NavigationActions;

const INITIAL_STATE: NavigationState = {
  currentTimelineId: null,
  viewMode: "logarithmic",
  zoomLevel: 1,
  visibleRange: { start: -14_000_000_000, end: 2_100_000_000 },
  selectedEventId: null,
  selectedPeriodId: null,
};

export const useNavigationStore = create<NavigationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        setTimeline: (id) =>
          set({ currentTimelineId: id }, false, "setTimeline"),

        setViewMode: (mode) => set({ viewMode: mode }, false, "setViewMode"),

        zoomIn: () =>
          set(
            { zoomLevel: Math.min(get().zoomLevel * 2, 32) },
            false,
            "zoomIn",
          ),

        zoomOut: () =>
          set(
            // Floor to keep zoomLevel a discrete integer step. Without this
            // a non-power-of-two value rehydrated from persistence (e.g.
            // zoomLevel=3 from a future schema) would produce 1.5 here and
            // break invertibility with zoomIn.
            { zoomLevel: Math.max(Math.floor(get().zoomLevel / 2), 1) },
            false,
            "zoomOut",
          ),

        panTo: (centre) => {
          const { visibleRange } = get();
          const halfWidth = (visibleRange.end - visibleRange.start) / 2;
          set(
            {
              visibleRange: {
                start: centre - halfWidth,
                end: centre + halfWidth,
              },
            },
            false,
            "panTo",
          );
        },

        selectEvent: (id) => set({ selectedEventId: id }, false, "selectEvent"),

        selectPeriod: (id) =>
          set({ selectedPeriodId: id }, false, "selectPeriod"),

        resetView: () => set({ ...INITIAL_STATE }, false, "resetView"),
      }),
      {
        name: "time-traveler-navigation",
        // Only persist user preferences; session-scoped selection state resets on refresh.
        partialize: (state) => ({
          viewMode: state.viewMode,
          zoomLevel: state.zoomLevel,
        }),
      },
    ),
    {
      name: "NavigationStore",
      enabled: process.env["NODE_ENV"] === "development",
    },
  ),
);
