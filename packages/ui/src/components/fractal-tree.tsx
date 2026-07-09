"use client";

import * as React from "react";
import { Calendar, CornerRightDown, GitBranch } from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";

import { Badge } from "./badge";
import { TemporalDisplay } from "./temporal-display";
import type { TreeNode } from "./tree";

/**
 * Maps event / timeline data into `TreeNode[]` for the fractal drill-down
 * surfaces (issue #296). Pure builders — they take navigation callbacks rather
 * than a router, so the mapping stays testable and the `Tree` primitive stays
 * unchanged.
 *
 * Model: "one fractal level per page" (navigate-to-drill). Event nodes are
 * leaves that navigate on activate; an expandable event (one with a
 * `detail_timeline_id`) carries a drill-down marker in its `meta` but is still
 * a leaf here — activating it opens that event's page, which renders the next
 * level. Only a sub-timeline *root* node carries eager one-level `children`.
 * This is inherently cycle-proof and depth-capped at one level.
 */

/** The minimal event shape the fractal builders need. */
export interface FractalEventNode {
  id: string;
  title: string;
  slug: string;
  temporal_data: TemporalData;
  /** Non-null → the event drills forward into a detail sub-timeline (#177). */
  detail_timeline_id: string | null;
  /** Containment relationship to the surrounding timeline (timeline surface only). */
  membership?: "home" | "linked";
}

/** The minimal timeline shape for a sub-timeline root node. */
export interface FractalTimelineNode {
  id: string;
  title: string;
  slug: string;
}

function EventNodeMeta({
  event,
  showMembership,
  expandable,
}: {
  event: FractalEventNode;
  showMembership: boolean;
  expandable: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <TemporalDisplay value={event.temporal_data} format="compact" />
      {showMembership && event.membership && (
        <Badge
          variant={event.membership === "home" ? "secondary" : "outline"}
          className="text-[10px]"
        >
          {event.membership}
        </Badge>
      )}
      {expandable && (
        <span
          role="img"
          aria-label="Expands into a sub-timeline"
          title="Expands into a sub-timeline"
          className="text-foreground-subtle"
        >
          <CornerRightDown className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
    </span>
  );
}

function eventToTreeNode(
  event: FractalEventNode,
  {
    onNavigateEvent,
    showMembership,
  }: { onNavigateEvent: (slug: string) => void; showMembership: boolean },
): TreeNode {
  const expandable = event.detail_timeline_id !== null;
  return {
    id: `event:${event.id}`,
    label: event.title,
    icon: Calendar,
    meta: (
      <EventNodeMeta
        event={event}
        showMembership={showMembership}
        expandable={expandable}
      />
    ),
    onActivate: () => onNavigateEvent(event.slug),
  };
}

/**
 * Builds the fractal tree for a timeline-detail surface: the timeline's events
 * as root-level nodes, each carrying its membership badge and (when expandable)
 * a drill-down marker.
 */
export function buildTimelineEventTree({
  events,
  onNavigateEvent,
}: {
  events: FractalEventNode[];
  onNavigateEvent: (slug: string) => void;
}): TreeNode[] {
  return events.map((event) =>
    eventToTreeNode(event, { onNavigateEvent, showMembership: true }),
  );
}

/**
 * Builds the fractal tree for an event-detail "Expands into" surface: a single
 * sub-timeline root node (expanded by default) with that sub-timeline's events
 * as eager one-level children.
 */
export function buildSubTimelineTree({
  timeline,
  events,
  onNavigateEvent,
  onNavigateTimeline,
}: {
  timeline: FractalTimelineNode;
  events: FractalEventNode[];
  onNavigateEvent: (slug: string) => void;
  onNavigateTimeline: (slug: string) => void;
}): TreeNode[] {
  return [
    {
      id: `timeline:${timeline.id}`,
      label: timeline.title,
      icon: GitBranch,
      defaultExpanded: true,
      onActivate: () => onNavigateTimeline(timeline.slug),
      children: events.map((event) =>
        eventToTreeNode(event, { onNavigateEvent, showMembership: false }),
      ),
    },
  ];
}
