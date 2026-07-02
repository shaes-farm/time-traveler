import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { MediaPickerProps } from "@repo/ui/components/media-picker";
import { ExistingMediaPicker } from "./existing-media-picker";

const h = vi.hoisted(() => ({
  pickerProps: null as MediaPickerProps | null,
  rows: [{ id: "m1" }, { id: "m2" }] as unknown[],
}));

vi.mock("@repo/ui/hooks/use-media", () => ({
  useMediaLibrary: () => ({
    data: { rows: h.rows, nextCursor: null, hasMore: false },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useMediaFacetCounts: () => ({ data: undefined }),
}));

vi.mock("@repo/ui/components/media-picker", () => ({
  MediaPicker: (props: MediaPickerProps) => {
    h.pickerProps = props;
    return <div data-testid="picker" />;
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = {} as any;

beforeEach(() => {
  h.pickerProps = null;
});

describe("ExistingMediaPicker", () => {
  it("mounts the picker in pick mode with the library rows and facet defaults", () => {
    render(
      <ExistingMediaPicker
        client={client}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(h.pickerProps?.mode).toBe("pick");
    expect(h.pickerProps?.items).toEqual(h.rows);
    // Falls back to empty counts when the facet query has no data yet.
    expect(h.pickerProps?.facetCounts.type.image).toBe(0);
  });

  it("propagates onConfirm and onCancel to the picker", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ExistingMediaPicker
        client={client}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    h.pickerProps?.onConfirm?.(["m1", "m2"]);
    h.pickerProps?.onCancel?.();
    expect(onConfirm).toHaveBeenCalledWith(["m1", "m2"]);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables confirm while busy by withholding onConfirm", () => {
    render(
      <ExistingMediaPicker
        client={client}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        busy
      />,
    );
    expect(h.pickerProps?.onConfirm).toBeUndefined();
  });
});
