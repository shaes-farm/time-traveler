import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Tree, type TreeNode } from "./tree";

const NODES: TreeNode[] = [
  {
    id: "root",
    label: "Root timeline",
    defaultExpanded: true,
    children: [
      { id: "child-a", label: "Event A", onActivate: vi.fn() },
      {
        id: "child-b",
        label: "Event B",
        children: [{ id: "grandchild", label: "Sub event" }],
      },
    ],
  },
];

const rowFor = (text: string): HTMLElement =>
  screen.getByText(text).closest("[role=treeitem]") as HTMLElement;

describe("Tree", () => {
  it("renders a tree with treeitems and respects defaultExpanded", () => {
    render(<Tree aria-label="Hierarchy" nodes={NODES} />);
    expect(screen.getByRole("tree")).toBeInTheDocument();
    // Root is expanded by default → its children are visible.
    expect(screen.getByText("Event A")).toBeInTheDocument();
    expect(screen.getByText("Event B")).toBeInTheDocument();
    // Grandchild stays hidden until Event B is expanded.
    expect(screen.queryByText("Sub event")).not.toBeInTheDocument();
  });

  it("expands a collapsed node when its toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<Tree aria-label="Hierarchy" nodes={NODES} />);

    expect(rowFor("Event B")).toHaveAttribute("aria-expanded", "false");

    // Root is expanded ("Collapse"); only Event B offers an "Expand" toggle.
    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getByText("Sub event")).toBeInTheDocument();
  });

  it("collapses an expanded node with ArrowLeft", async () => {
    const user = userEvent.setup();
    render(<Tree aria-label="Hierarchy" nodes={NODES} />);

    const rootRow = rowFor("Root timeline");
    await user.click(rootRow);
    await user.keyboard("{ArrowLeft}");

    expect(rootRow).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Event A")).not.toBeInTheDocument();
  });

  it("activates a leaf node on Enter", async () => {
    const onActivate = vi.fn();
    const nodes: TreeNode[] = [{ id: "a", label: "Leaf", onActivate }];
    const user = userEvent.setup();
    render(<Tree aria-label="Hierarchy" nodes={nodes} />);

    await user.tab();
    await user.keyboard("{Enter}");
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("moves focus down with ArrowDown", async () => {
    const user = userEvent.setup();
    render(<Tree aria-label="Hierarchy" nodes={NODES} />);

    const rootRow = rowFor("Root timeline");
    await user.click(rootRow);
    await user.keyboard("{ArrowDown}");

    // Focus moved: Event A now has tabIndex 0 (roving focus), root has -1.
    expect(rowFor("Event A")).toHaveAttribute("tabindex", "0");
    expect(rootRow).toHaveAttribute("tabindex", "-1");
  });

  it("ascends to parent with ArrowLeft on a leaf node", async () => {
    const user = userEvent.setup();
    render(<Tree aria-label="Hierarchy" nodes={NODES} />);

    // Focus Event A (a leaf child of Root).
    const eventARow = rowFor("Event A");
    await user.click(eventARow);
    await user.keyboard("{ArrowLeft}");

    // Focus should move up to Root timeline.
    expect(rowFor("Root timeline")).toHaveAttribute("tabindex", "0");
  });

  it("marks the selectedId row with aria-selected", () => {
    render(<Tree aria-label="Hierarchy" nodes={NODES} selectedId="child-a" />);

    expect(rowFor("Event A")).toHaveAttribute("aria-selected", "true");
    expect(rowFor("Event B")).toHaveAttribute("aria-selected", "false");
  });

  it("omits aria-selected entirely when selectedId is not provided", () => {
    render(<Tree aria-label="Hierarchy" nodes={NODES} />);

    expect(rowFor("Event A")).not.toHaveAttribute("aria-selected");
  });

  it("reveals a selected node by expanding its collapsed ancestors", () => {
    // Event B is not a root, so it stays collapsed by default and its child is
    // hidden — until that child becomes the selection.
    const { rerender } = render(<Tree aria-label="Hierarchy" nodes={NODES} />);
    expect(screen.queryByText("Sub event")).not.toBeInTheDocument();

    rerender(
      <Tree aria-label="Hierarchy" nodes={NODES} selectedId="grandchild" />,
    );

    expect(screen.getByText("Sub event")).toBeInTheDocument();
    expect(rowFor("Event B")).toHaveAttribute("aria-expanded", "true");
    expect(rowFor("Sub event")).toHaveAttribute("aria-selected", "true");
  });
});
