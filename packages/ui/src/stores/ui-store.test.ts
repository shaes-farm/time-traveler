import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore, type UiState, type Toast } from "./ui-store";

// Reset store to initial state before each test to ensure isolation.
beforeEach(() => {
  useUiStore.setState({
    sidebarOpen: true,
    sidebarWidth: 280,
    activeModal: null,
    modalData: {},
    toasts: [],
    dirtyEditors: new Set<string>(),
    pendingNavigation: null,
  });
});

describe("useUiStore — initial state", () => {
  it("sidebarOpen defaults to true", () => {
    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });

  it("sidebarWidth defaults to 280", () => {
    expect(useUiStore.getState().sidebarWidth).toBe(280);
  });

  it("activeModal defaults to null", () => {
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  it("modalData defaults to an empty object", () => {
    expect(useUiStore.getState().modalData).toEqual({});
  });

  it("toasts defaults to an empty array", () => {
    expect(useUiStore.getState().toasts).toEqual([]);
  });
});

describe("toggleSidebar", () => {
  it("closes an open sidebar", () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });

  it("opens a closed sidebar", () => {
    useUiStore.getState().toggleSidebar(); // close
    useUiStore.getState().toggleSidebar(); // open
    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });
});

describe("setSidebarWidth", () => {
  it("sets sidebar width to the given value", () => {
    useUiStore.getState().setSidebarWidth(320);
    expect(useUiStore.getState().sidebarWidth).toBe(320);
  });

  it("can be updated multiple times", () => {
    useUiStore.getState().setSidebarWidth(200);
    useUiStore.getState().setSidebarWidth(400);
    expect(useUiStore.getState().sidebarWidth).toBe(400);
  });
});

describe("openModal", () => {
  it("sets activeModal to the given key", () => {
    useUiStore.getState().openModal("confirm-delete");
    expect(useUiStore.getState().activeModal).toBe("confirm-delete");
  });

  it("stores modal data when provided", () => {
    useUiStore.getState().openModal("edit-character", { characterId: "ch-1" });
    expect(useUiStore.getState().modalData).toEqual({ characterId: "ch-1" });
  });

  it("defaults to empty modalData when no data argument given", () => {
    useUiStore.getState().openModal("simple-modal");
    expect(useUiStore.getState().modalData).toEqual({});
  });

  it("replaces an already-open modal", () => {
    useUiStore.getState().openModal("modal-a", { x: 1 });
    useUiStore.getState().openModal("modal-b", { y: 2 });
    expect(useUiStore.getState().activeModal).toBe("modal-b");
    expect(useUiStore.getState().modalData).toEqual({ y: 2 });
  });
});

describe("closeModal", () => {
  it("clears activeModal", () => {
    useUiStore.getState().openModal("confirm-delete");
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  it("clears modalData", () => {
    useUiStore.getState().openModal("edit-character", { characterId: "ch-1" });
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().modalData).toEqual({});
  });

  it("is a no-op when no modal is open", () => {
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().activeModal).toBeNull();
    expect(useUiStore.getState().modalData).toEqual({});
  });
});

describe("addToast", () => {
  const toast1: Toast = { id: "t-1", message: "Saved!", variant: "success" };
  const toast2: Toast = { id: "t-2", message: "Error!", variant: "error" };

  it("adds a toast to the queue", () => {
    useUiStore.getState().addToast(toast1);
    expect(useUiStore.getState().toasts).toHaveLength(1);
    expect(useUiStore.getState().toasts[0]).toEqual(toast1);
  });

  it("preserves order — new toasts appended to the end", () => {
    useUiStore.getState().addToast(toast1);
    useUiStore.getState().addToast(toast2);
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(2);
    expect(toasts[0]?.id).toBe("t-1");
    expect(toasts[1]?.id).toBe("t-2");
  });

  it("supports all variants", () => {
    const variants: Toast["variant"][] = [
      "default",
      "success",
      "error",
      "warning",
    ];
    variants.forEach((variant, i) => {
      useUiStore
        .getState()
        .addToast({ id: `t-${String(i)}`, message: variant, variant });
    });
    expect(useUiStore.getState().toasts).toHaveLength(variants.length);
  });
});

describe("removeToast", () => {
  const toast1: Toast = { id: "t-1", message: "First", variant: "default" };
  const toast2: Toast = { id: "t-2", message: "Second", variant: "warning" };
  const toast3: Toast = { id: "t-3", message: "Third", variant: "success" };

  it("removes the toast with the matching id", () => {
    useUiStore.getState().addToast(toast1);
    useUiStore.getState().addToast(toast2);
    useUiStore.getState().removeToast("t-1");
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.id).toBe("t-2");
  });

  it("preserves order of remaining toasts", () => {
    useUiStore.getState().addToast(toast1);
    useUiStore.getState().addToast(toast2);
    useUiStore.getState().addToast(toast3);
    useUiStore.getState().removeToast("t-2");
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(2);
    expect(toasts[0]?.id).toBe("t-1");
    expect(toasts[1]?.id).toBe("t-3");
  });

  it("is a no-op when id does not exist", () => {
    useUiStore.getState().addToast(toast1);
    useUiStore.getState().removeToast("nonexistent");
    expect(useUiStore.getState().toasts).toHaveLength(1);
  });

  it("results in an empty queue after removing all toasts", () => {
    useUiStore.getState().addToast(toast1);
    useUiStore.getState().removeToast("t-1");
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });
});

describe("setEditorDirty", () => {
  it("registers a dirty editor by id", () => {
    useUiStore.getState().setEditorDirty("editor-a", true);
    expect(useUiStore.getState().dirtyEditors.has("editor-a")).toBe(true);
  });

  it("ref-counts across editors — clearing one keeps others dirty", () => {
    useUiStore.getState().setEditorDirty("editor-a", true);
    useUiStore.getState().setEditorDirty("editor-b", true);
    expect(useUiStore.getState().dirtyEditors.size).toBe(2);

    useUiStore.getState().setEditorDirty("editor-a", false);
    const { dirtyEditors } = useUiStore.getState();
    expect(dirtyEditors.has("editor-a")).toBe(false);
    expect(dirtyEditors.has("editor-b")).toBe(true);
    expect(dirtyEditors.size).toBe(1);
  });

  it("clearing the last dirty editor empties the set", () => {
    useUiStore.getState().setEditorDirty("editor-a", true);
    useUiStore.getState().setEditorDirty("editor-a", false);
    expect(useUiStore.getState().dirtyEditors.size).toBe(0);
  });

  it("produces a new Set reference so subscribers re-render", () => {
    const before = useUiStore.getState().dirtyEditors;
    useUiStore.getState().setEditorDirty("editor-a", true);
    expect(useUiStore.getState().dirtyEditors).not.toBe(before);
  });

  it("registering the same id twice is idempotent", () => {
    useUiStore.getState().setEditorDirty("editor-a", true);
    useUiStore.getState().setEditorDirty("editor-a", true);
    expect(useUiStore.getState().dirtyEditors.size).toBe(1);
  });
});

describe("shell navigation guard", () => {
  it("requestShellNavigate stashes the pending href", () => {
    useUiStore.getState().requestShellNavigate("/characters");
    expect(useUiStore.getState().pendingNavigation).toBe("/characters");
  });

  it("cancelShellNavigate clears the pending href without touching dirty flags", () => {
    useUiStore.getState().setEditorDirty("editor-a", true);
    useUiStore.getState().requestShellNavigate("/characters");
    useUiStore.getState().cancelShellNavigate();
    expect(useUiStore.getState().pendingNavigation).toBeNull();
    expect(useUiStore.getState().dirtyEditors.has("editor-a")).toBe(true);
  });

  it("confirmShellNavigate clears both the pending href and all dirty flags", () => {
    useUiStore.getState().setEditorDirty("editor-a", true);
    useUiStore.getState().setEditorDirty("editor-b", true);
    useUiStore.getState().requestShellNavigate("/timelines");
    useUiStore.getState().confirmShellNavigate();
    expect(useUiStore.getState().pendingNavigation).toBeNull();
    expect(useUiStore.getState().dirtyEditors.size).toBe(0);
  });
});

describe("persist partialize", () => {
  it("only persists sidebarOpen and sidebarWidth", () => {
    useUiStore.getState().setSidebarWidth(360);
    useUiStore.getState().toggleSidebar(); // false
    useUiStore.getState().openModal("some-modal", { x: 1 });
    useUiStore
      .getState()
      .addToast({ id: "t-1", message: "hi", variant: "default" });
    useUiStore.getState().setEditorDirty("editor-a", true);
    useUiStore.getState().requestShellNavigate("/dashboard");

    const stored = useUiStore.persist
      .getOptions()
      .partialize?.(useUiStore.getState()) as Record<string, unknown>;

    expect(stored).toHaveProperty("sidebarOpen", false);
    expect(stored).toHaveProperty("sidebarWidth", 360);
    expect(stored).not.toHaveProperty("activeModal");
    expect(stored).not.toHaveProperty("modalData");
    expect(stored).not.toHaveProperty("toasts");
    expect(stored).not.toHaveProperty("dirtyEditors");
    expect(stored).not.toHaveProperty("pendingNavigation");
  });
});

describe("UiState type completeness", () => {
  it("all required state keys are present on the store", () => {
    const state = useUiStore.getState();
    const requiredKeys: (keyof UiState)[] = [
      "sidebarOpen",
      "sidebarWidth",
      "activeModal",
      "modalData",
      "toasts",
      "dirtyEditors",
      "pendingNavigation",
    ];
    requiredKeys.forEach((key) => {
      expect(state).toHaveProperty(key);
    });
  });
});
