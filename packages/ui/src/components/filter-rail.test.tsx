import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FilterGroup, RadioValue } from "./filter-rail";
import { FilterRail } from "./filter-rail";

vi.mock("./slider", () => ({
  Slider: ({
    value,
    onValueChange,
  }: {
    value: [number, number];
    onValueChange: (next: [number, number]) => void;
  }) => (
    <button
      type="button"
      role="slider"
      onClick={() => onValueChange([value[0] + 1, value[1] + 1])}
    >
      Mock Slider
    </button>
  ),
}));

function FilterRailHarness() {
  const [types, setTypes] = React.useState<string[]>([]);
  const [importance, setImportance] = React.useState<[number, number]>([2, 8]);
  const [published, setPublished] = React.useState<RadioValue>("any");

  const groups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "type",
      label: "Character type",
      options: [
        { value: "human", label: "Human", count: 3 },
        { value: "organization", label: "Organization", count: 1 },
      ],
      value: types,
      onChange: setTypes,
    },
    {
      type: "range",
      id: "importance",
      label: "Importance",
      min: 1,
      max: 10,
      value: importance,
      onChange: setImportance,
      formatLabel: (value) => `${value}/10`,
    },
    {
      type: "radio",
      id: "published",
      label: "Published",
      value: published,
      onChange: setPublished,
      yesLabel: "Published",
      noLabel: "Draft",
    },
  ];

  return (
    <FilterRail
      groups={groups}
      onClearAll={() => {
        setTypes([]);
        setImportance([1, 10]);
        setPublished("any");
      }}
    />
  );
}

describe("FilterRail", () => {
  it("toggles checkbox filters and reveals clear-all when active", async () => {
    const user = userEvent.setup();
    render(<FilterRailHarness />);

    const humanCheckbox = screen.getAllByRole("checkbox")[0]!;
    await user.click(humanCheckbox);

    expect(
      screen.getByRole("button", { name: /clear all/i }),
    ).toBeInTheDocument();
    expect(humanCheckbox).toBeChecked();
  });

  it("updates the range group via keyboard interaction", async () => {
    const user = userEvent.setup();
    render(<FilterRailHarness />);

    const slider = screen.getAllByRole("slider")[0]!;
    await user.click(slider);

    expect(screen.getByText(/Importance/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/10/i)).toBeInTheDocument();
    expect(screen.getByText(/9\/10/i)).toBeInTheDocument();
  });

  it("switches radio options and clears all active filters", async () => {
    const user = userEvent.setup();
    render(<FilterRailHarness />);

    await user.click(screen.getByRole("button", { name: /published/i }));
    expect(
      screen.getByRole("button", { name: /clear all/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear all/i }));

    const humanCheckbox = screen.getAllByRole("checkbox")[0]!;
    expect(humanCheckbox).not.toBeChecked();
    expect(screen.getByText(/1\/10/i)).toBeInTheDocument();
    expect(screen.getByText(/10\/10/i)).toBeInTheDocument();
  });
});
