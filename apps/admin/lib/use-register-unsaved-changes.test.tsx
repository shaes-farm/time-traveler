import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUiStore } from "@repo/ui/stores";
import { useRegisterUnsavedChanges } from "./use-register-unsaved-changes";

beforeEach(() => {
  useUiStore.setState({
    dirtyEditors: new Set<string>(),
    pendingNavigation: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRegisterUnsavedChanges", () => {
  it("registers a dirty editor on mount", () => {
    renderHook(() => useRegisterUnsavedChanges(true));
    expect(useUiStore.getState().dirtyEditors.size).toBe(1);
  });

  it("does not register a clean editor", () => {
    renderHook(() => useRegisterUnsavedChanges(false));
    expect(useUiStore.getState().dirtyEditors.size).toBe(0);
  });

  it("clears its registration on unmount", () => {
    const { unmount } = renderHook(() => useRegisterUnsavedChanges(true));
    expect(useUiStore.getState().dirtyEditors.size).toBe(1);
    unmount();
    expect(useUiStore.getState().dirtyEditors.size).toBe(0);
  });

  it("tracks changes to the dirty flag", () => {
    const { rerender } = renderHook(
      ({ dirty }) => useRegisterUnsavedChanges(dirty),
      { initialProps: { dirty: false } },
    );
    expect(useUiStore.getState().dirtyEditors.size).toBe(0);
    rerender({ dirty: true });
    expect(useUiStore.getState().dirtyEditors.size).toBe(1);
    rerender({ dirty: false });
    expect(useUiStore.getState().dirtyEditors.size).toBe(0);
  });

  it("ref-counts overlapping editors under distinct ids", () => {
    const first = renderHook(() => useRegisterUnsavedChanges(true));
    renderHook(() => useRegisterUnsavedChanges(true));
    expect(useUiStore.getState().dirtyEditors.size).toBe(2);
    // Unmounting one editor leaves the other still registered.
    first.unmount();
    expect(useUiStore.getState().dirtyEditors.size).toBe(1);
  });

  it("adds a beforeunload listener only while dirty", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const { rerender, unmount } = renderHook(
      ({ dirty }) => useRegisterUnsavedChanges(dirty),
      { initialProps: { dirty: true } },
    );
    expect(add).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    // Going clean removes the listener.
    rerender({ dirty: false });
    expect(remove).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    unmount();
  });

  it("beforeunload handler cancels the event (native prompt)", () => {
    renderHook(() => useRegisterUnsavedChanges(true));
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
