import * as React from "react";
import { render, screen, within } from "@testing-library/react";
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

  it("removes an already-selected checkbox option when toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const groups: FilterGroup[] = [
      {
        type: "checkbox",
        id: "type",
        label: "Character type",
        options: [{ value: "human", label: "Human" }],
        value: ["human"],
        onChange,
      },
    ];

    render(<FilterRail groups={groups} />);

    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("uses default range label formatting when formatLabel is omitted", () => {
    const groups: FilterGroup[] = [
      {
        type: "range",
        id: "importance",
        label: "Importance",
        min: 1,
        max: 10,
        value: [3, 9],
        onChange: vi.fn(),
      },
    ];

    render(<FilterRail groups={groups} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("uses default radio labels when yesLabel/noLabel are omitted", () => {
    const groups: FilterGroup[] = [
      {
        type: "radio",
        id: "published",
        label: "Published",
        value: "any",
        onChange: vi.fn(),
      },
    ];

    render(<FilterRail groups={groups} />);

    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Any" })).toBeInTheDocument();
  });

  it("does not render clear-all when active filters exist but callback is missing", () => {
    const groups: FilterGroup[] = [
      {
        type: "radio",
        id: "published",
        label: "Published",
        value: "yes",
        onChange: vi.fn(),
      },
    ];

    render(<FilterRail groups={groups} />);

    expect(
      screen.queryByRole("button", { name: /clear all/i }),
    ).not.toBeInTheDocument();
  });

  it("selects a combobox option and reveals clear-all", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const groups: FilterGroup[] = [
      {
        type: "combobox",
        id: "perspective",
        label: "Perspective",
        value: null,
        placeholder: "Any character",
        options: [
          { value: "char-1", label: "Frodo" },
          { value: "char-2", label: "Sam" },
        ],
        onChange,
      },
    ];

    render(<FilterRail groups={groups} onClearAll={vi.fn()} />);

    // Null value → "any" option shown, no active filter yet.
    expect(
      screen.queryByRole("button", { name: /clear all/i }),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Perspective" }),
      "char-2",
    );
    expect(onChange).toHaveBeenCalledWith("char-2");
  });

  it("clears the combobox selection back to null when 'any' is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const groups: FilterGroup[] = [
      {
        type: "combobox",
        id: "perspective",
        label: "Perspective",
        value: "char-1",
        placeholder: "Any character",
        options: [{ value: "char-1", label: "Frodo" }],
        onChange,
      },
    ];

    render(<FilterRail groups={groups} onClearAll={vi.fn()} />);

    // A non-null value counts as active.
    expect(
      screen.getByRole("button", { name: /clear all/i }),
    ).toBeInTheDocument();

    // Select the "any" option by its node (its value is "", not the label), so
    // the match doesn't depend on selectOptions' label/value fallback.
    const select = screen.getByRole("combobox", { name: "Perspective" });
    await user.selectOptions(
      select,
      within(select).getByRole("option", { name: "Any character" }),
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("adds a tag via the tags group and marks the rail active", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const groups: FilterGroup[] = [
      {
        type: "tags",
        id: "tags",
        label: "Tags",
        value: [],
        onChange,
      },
    ];

    render(<FilterRail groups={groups} onClearAll={vi.fn()} />);

    const input = screen.getByLabelText("Tags");
    await user.type(input, "war{Enter}");
    expect(onChange).toHaveBeenCalledWith(["war"]);
  });

  it("counts a tags group with values as an active filter", () => {
    const groups: FilterGroup[] = [
      {
        type: "tags",
        id: "tags",
        label: "Tags",
        value: ["myth"],
        onChange: vi.fn(),
      },
    ];

    render(<FilterRail groups={groups} onClearAll={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /clear all/i }),
    ).toBeInTheDocument();
  });

  it("handles unknown group types without crashing", () => {
    const groups = [
      {
        type: "unknown",
        id: "mystery",
        label: "Mystery",
      },
    ] as unknown as FilterGroup[];

    render(<FilterRail groups={groups} />);

    expect(screen.getByText("Mystery")).toBeInTheDocument();
  });
});
