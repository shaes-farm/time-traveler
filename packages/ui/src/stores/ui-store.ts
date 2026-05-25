"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/** Variant controls the visual style of a toast notification. */
export type ToastVariant = "default" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface UiState {
  /** Whether the sidebar is expanded. */
  sidebarOpen: boolean;
  /** Resizable sidebar width in pixels. */
  sidebarWidth: number;
  /** Key of the currently open modal, or null if none. */
  activeModal: string | null;
  /** Arbitrary data passed to the active modal. */
  modalData: Record<string, unknown>;
  /** Ordered queue of toast notifications. */
  toasts: Toast[];
}

export interface UiActions {
  /** Toggle sidebar open/closed. */
  toggleSidebar: () => void;
  /** Set sidebar to an explicit width (pixels). */
  setSidebarWidth: (width: number) => void;
  /** Open a modal by key, optionally passing data to it. */
  openModal: (key: string, data?: Record<string, unknown>) => void;
  /** Close the currently open modal and clear modal data. */
  closeModal: () => void;
  /** Add a toast to the queue. */
  addToast: (toast: Toast) => void;
  /** Remove a toast from the queue by id. */
  removeToast: (id: string) => void;
}

export type UiStore = UiState & UiActions;

const INITIAL_STATE: UiState = {
  sidebarOpen: true,
  sidebarWidth: 280,
  activeModal: null,
  modalData: {},
  toasts: [],
};

export const useUiStore = create<UiStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        toggleSidebar: () =>
          set({ sidebarOpen: !get().sidebarOpen }, false, "toggleSidebar"),

        setSidebarWidth: (width) =>
          set({ sidebarWidth: width }, false, "setSidebarWidth"),

        openModal: (key, data = {}) =>
          set({ activeModal: key, modalData: data }, false, "openModal"),

        closeModal: () =>
          set({ activeModal: null, modalData: {} }, false, "closeModal"),

        addToast: (toast) =>
          set({ toasts: [...get().toasts, toast] }, false, "addToast"),

        removeToast: (id) =>
          set(
            { toasts: get().toasts.filter((t) => t.id !== id) },
            false,
            "removeToast",
          ),
      }),
      {
        name: "time-traveler-ui",
        // Only persist user preferences; transient UI state resets on refresh.
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          sidebarWidth: state.sidebarWidth,
        }),
      },
    ),
    { name: "UiStore", enabled: process.env["NODE_ENV"] === "development" },
  ),
);
