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
  /**
   * Ids of mounted editors that currently have unsaved changes. Ref-counted so
   * overlapping mounts / route transitions can't clobber each other's flag; any
   * shell navigation is guarded while this is non-empty. Transient — never persisted.
   */
  dirtyEditors: Set<string>;
  /** Href of a shell navigation deferred by the unsaved-changes guard, or null. */
  pendingNavigation: string | null;
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
  /** Register (or clear) an editor's dirty state by its stable id. */
  setEditorDirty: (id: string, dirty: boolean) => void;
  /** Defer a shell navigation, opening the app-level discard dialog. */
  requestShellNavigate: (href: string) => void;
  /** Dismiss the discard dialog and abandon the deferred navigation. */
  cancelShellNavigate: () => void;
  /**
   * Accept the deferred navigation: clears all dirty flags and the pending href.
   * Does NOT `router.push` — the caller performs the push in its event handler so
   * navigation never happens inside a state updater (would run mid-render).
   */
  confirmShellNavigate: () => void;
}

export type UiStore = UiState & UiActions;

const INITIAL_STATE: UiState = {
  sidebarOpen: true,
  sidebarWidth: 280,
  activeModal: null,
  modalData: {},
  toasts: [],
  dirtyEditors: new Set<string>(),
  pendingNavigation: null,
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

        setEditorDirty: (id, dirty) => {
          // No-op when the flag already matches: skips the Set rebuild and
          // avoids notifying subscribers for an idempotent call.
          if (get().dirtyEditors.has(id) === dirty) return;
          set(
            (state) => {
              // Rebuild from the updater's `state` (not the outer `get()`) so the
              // Set is derived from the snapshot `set` is actually applying.
              const next = new Set(state.dirtyEditors);
              if (dirty) next.add(id);
              else next.delete(id);
              return { dirtyEditors: next };
            },
            false,
            "setEditorDirty",
          );
        },

        requestShellNavigate: (href) =>
          set({ pendingNavigation: href }, false, "requestShellNavigate"),

        cancelShellNavigate: () =>
          set({ pendingNavigation: null }, false, "cancelShellNavigate"),

        confirmShellNavigate: () =>
          set(
            { pendingNavigation: null, dirtyEditors: new Set<string>() },
            false,
            "confirmShellNavigate",
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
