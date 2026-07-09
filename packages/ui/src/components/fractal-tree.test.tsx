import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Calendar, GitBranch } from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";

import {
  buildSubTimelineTree,
  buildTimelineEventTree,
  type FractalEventNode,
} from "./fractal-tree";

const at = (year: number): TemporalData => ({
  year,
  era: "CE",
  precision: "exact",
});

const leafEvent: FractalEventNode = {
  id: "e1",
  title: "Sklodowska arrives in Paris",
  slug: "sklodowska-arrives",
  temporal_data: at(1891),
  detail_timeline_id: null,
  membership: "home",
};

const expandableEvent: FractalEventNode = {
  id: "e2",
  title: "Discovery of polonium",
  slug: "discovery-of-polonium",
  temporal_data: at(1898),
  detail_timeline_id: "sub-timeline-id",
  membership: "linked",
};

describe("buildTimelineEventTree", () => {
  it("maps each event to a leaf node with an id, title, and calendar icon", () => {
    const nodes = buildTimelineEventTree({
      events: [leafEvent, expandableEvent],
      onNavigateEvent: vi.fn(),
    });

    expect(nodes).toHaveLength(2);
    expect(nodes[0]!.id).toBe("event:e1");
    expect(nodes[0]!.label).toBe("Sklodowska arrives in Paris");
    expect(nodes[0]!.icon).toBe(Calendar);
    // Navigate-to-drill: event nodes are leaves, never carrying children.
    expect(nodes[0]!.children).toBeUndefined();
    expect(nodes[1]!.children).toBeUndefined();
  });

  it("navigates to the event slug on activate", () => {
    const onNavigateEvent = vi.fn();
    const [node] = buildTimelineEventTree({
      events: [leafEvent],
      onNavigateEvent,
    });

    node!.onActivate!();
    expect(onNavigateEvent).toHaveBeenCalledWith("sklodowska-arrives");
  });

  it("renders the membership badge and a drill marker only for expandable events", () => {
    const [leaf, expandable] = buildTimelineEventTree({
      events: [leafEvent, expandableEvent],
      onNavigateEvent: vi.fn(),
    });

    const { rerender } = render(<>{leaf!.meta}</>);
    expect(screen.getByText("home")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Expands into a sub-timeline"),
    ).not.toBeInTheDocument();

    rerender(<>{expandable!.meta}</>);
    expect(screen.getByText("linked")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Expands into a sub-timeline"),
    ).toBeInTheDocument();
  });
});

describe("buildSubTimelineTree", () => {
  const timeline = {
    id: "t1",
    title: "Polonium isolation",
    slug: "polonium-isolation",
  };

  it("builds a single expanded root node with the timeline's events as children", () => {
    const nodes = buildSubTimelineTree({
      timeline,
      events: [leafEvent, expandableEvent],
      onNavigateEvent: vi.fn(),
      onNavigateTimeline: vi.fn(),
    });

    expect(nodes).toHaveLength(1);
    const root = nodes[0]!;
    expect(root.id).toBe("timeline:t1");
    expect(root.label).toBe("Polonium isolation");
    expect(root.icon).toBe(GitBranch);
    expect(root.defaultExpanded).toBe(true);
    expect(root.children).toHaveLength(2);
    expect(root.children![0]!.id).toBe("event:e1");
  });

  it("navigates to the timeline slug on root activate and event slug on child activate", () => {
    const onNavigateEvent = vi.fn();
    const onNavigateTimeline = vi.fn();
    const [root] = buildSubTimelineTree({
      timeline,
      events: [leafEvent],
      onNavigateEvent,
      onNavigateTimeline,
    });

    root!.onActivate!();
    expect(onNavigateTimeline).toHaveBeenCalledWith("polonium-isolation");

    root!.children![0]!.onActivate!();
    expect(onNavigateEvent).toHaveBeenCalledWith("sklodowska-arrives");
  });

  it("omits the membership badge on sub-timeline children", () => {
    const [root] = buildSubTimelineTree({
      timeline,
      events: [leafEvent],
      onNavigateEvent: vi.fn(),
      onNavigateTimeline: vi.fn(),
    });

    render(<>{root!.children![0]!.meta}</>);
    expect(screen.queryByText("home")).not.toBeInTheDocument();
  });
});
