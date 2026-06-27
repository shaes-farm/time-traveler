import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MediaFacetCounts } from "@repo/services/schemas/media";

import { MediaFilterRail, type MediaFacetSelection } from "./media-filter-rail";

const COUNTS: MediaFacetCounts = {
  type: { image: 181, video: 22, audio: 9, document: 36 },
  source: { upload: 212, external: 36 },
  attachedTo: { events: 40, characters: 30, timelines: 12, orphaned: 4 },
};

function Harness({
  onChange = vi.fn(),
  onClearAll = vi.fn(),
}: {
  onChange?: (next: MediaFacetSelection) => void;
  onClearAll?: () => void;
}) {
  const [selected, setSelected] = React.useState<MediaFacetSelection>({
    mediaTypes: [],
    sources: [],
    attachedTo: [],
  });
  return (
    <MediaFilterRail
      counts={COUNTS}
      selected={selected}
      onChange={(next) => {
        setSelected(next);
        onChange(next);
      }}
      onClearAll={onClearAll}
    />
  );
}

describe("MediaFilterRail", () => {
  it("renders the three facet groups with counts", () => {
    render(<Harness />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("Attached to")).toBeInTheDocument();
    expect(screen.getByText("181")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Orphaned ⚠")).toBeInTheDocument();
  });

  it("emits the OR-array for the toggled group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByLabelText(/^Image/));
    expect(onChange).toHaveBeenLastCalledWith({
      mediaTypes: ["image"],
      sources: [],
      attachedTo: [],
    });

    await user.click(screen.getByLabelText(/^Video/));
    expect(onChange).toHaveBeenLastCalledWith({
      mediaTypes: ["image", "video"],
      sources: [],
      attachedTo: [],
    });
  });

  it("keeps facet groups independent (AND across groups)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByLabelText(/^Uploaded/));
    expect(onChange).toHaveBeenLastCalledWith({
      mediaTypes: [],
      sources: ["upload"],
      attachedTo: [],
    });
  });

  it("surfaces clear-all once a facet is active", async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    render(<Harness onClearAll={onClearAll} />);

    await user.click(screen.getByLabelText(/^Image/));
    const clear = screen.getByRole("button", { name: /clear all/i });
    await user.click(clear);
    expect(onClearAll).toHaveBeenCalled();
  });
});
