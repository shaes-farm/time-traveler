"use client";

import * as React from "react";
import type { MediaFacetCounts } from "@repo/services/schemas/media";

import {
  FilterRail,
  type FilterCheckboxOption,
  type FilterGroup,
} from "@repo/ui/components/filter-rail";

/** The three facet groups' current selections (OR within each, AND across). */
export interface MediaFacetSelection {
  mediaTypes: string[];
  sources: string[];
  attachedTo: string[];
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Document" },
];

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "upload", label: "Uploaded" },
  { value: "external", label: "External" },
];

const ATTACHED_TO_OPTIONS: { value: string; label: string }[] = [
  { value: "events", label: "Events" },
  { value: "characters", label: "Characters" },
  { value: "timelines", label: "Timelines" },
  { value: "orphaned", label: "Orphaned ⚠" },
];

export interface MediaFilterRailProps {
  counts: MediaFacetCounts;
  selected: MediaFacetSelection;
  onChange: (next: MediaFacetSelection) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * The library filter rail — a thin adapter over the Batch F {@link FilterRail}.
 * Builds Type / Source / Attached-to checkbox groups with live counts; facets
 * combine AND across groups, OR within a group (screen-17 annotation #3).
 */
export function MediaFilterRail({
  counts,
  selected,
  onChange,
  onClearAll,
  className,
}: MediaFilterRailProps) {
  function withCounts(
    options: { value: string; label: string }[],
    bucket: Record<string, number>,
  ): FilterCheckboxOption[] {
    return options.map((o) => ({
      value: o.value,
      label: o.label,
      count: bucket[o.value] ?? 0,
    }));
  }

  const groups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "type",
      label: "Type",
      options: withCounts(TYPE_OPTIONS, counts.type),
      value: selected.mediaTypes,
      onChange: (value) => onChange({ ...selected, mediaTypes: value }),
    },
    {
      type: "checkbox",
      id: "source",
      label: "Source",
      options: withCounts(SOURCE_OPTIONS, counts.source),
      value: selected.sources,
      onChange: (value) => onChange({ ...selected, sources: value }),
    },
    {
      type: "checkbox",
      id: "attached-to",
      label: "Attached to",
      options: withCounts(ATTACHED_TO_OPTIONS, counts.attachedTo),
      value: selected.attachedTo,
      onChange: (value) => onChange({ ...selected, attachedTo: value }),
    },
  ];

  return (
    <FilterRail groups={groups} onClearAll={onClearAll} className={className} />
  );
}
