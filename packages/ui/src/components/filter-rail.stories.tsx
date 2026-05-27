import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  FilterRail,
  type FilterCheckboxOption,
  type FilterGroup,
  type RadioValue,
} from "./filter-rail";

const TYPE_OPTIONS: FilterCheckboxOption[] = [
  { value: "human", label: "Human", count: 12 },
  { value: "mythological", label: "Mythological", count: 4 },
  { value: "fictional", label: "Fictional", count: 7 },
  { value: "organization", label: "Organization", count: 3 },
];

const ERA_OPTIONS: FilterCheckboxOption[] = [
  { value: "ce", label: "CE", count: 14 },
  { value: "bce", label: "BCE", count: 6 },
  { value: "kya", label: "KYA", count: 2 },
];

const meta = {
  title: "Components/FilterRail",
  component: FilterRail,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FilterRail>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveFilterRail() {
  const [types, setTypes] = React.useState<string[]>(["human"]);
  const [eras, setEras] = React.useState<string[]>([]);
  const [importance, setImportance] = React.useState<[number, number]>([3, 9]);
  const [published, setPublished] = React.useState<RadioValue>("any");

  const groups: FilterGroup[] = [
    {
      type: "checkbox",
      id: "type",
      label: "Character type",
      options: TYPE_OPTIONS,
      value: types,
      onChange: setTypes,
    },
    {
      type: "checkbox",
      id: "era",
      label: "Era",
      options: ERA_OPTIONS,
      value: eras,
      onChange: setEras,
    },
    {
      type: "range",
      id: "importance",
      label: "Importance",
      min: 1,
      max: 10,
      value: importance,
      onChange: setImportance,
    },
    {
      type: "radio",
      id: "published",
      label: "Published",
      value: published,
      onChange: setPublished,
      yesLabel: "Published",
      noLabel: "Draft/Shared",
    },
  ];

  function clearAll() {
    setTypes([]);
    setEras([]);
    setImportance([1, 10]);
    setPublished("any");
  }

  return (
    <div className="max-w-xs border border-border bg-background">
      <FilterRail groups={groups} onClearAll={clearAll} />
    </div>
  );
}

export const Default: Story = {
  args: { groups: [] },
  render: () => <InteractiveFilterRail />,
};

export const NoActiveFilters: Story = {
  args: { groups: [] },
  render: () => {
    const groups: FilterGroup[] = [
      {
        type: "checkbox",
        id: "type",
        label: "Character type",
        options: TYPE_OPTIONS,
        value: [],
        onChange: () => {},
      },
      {
        type: "radio",
        id: "published",
        label: "Published",
        value: "any",
        onChange: () => {},
      },
    ];

    return (
      <div className="max-w-xs border border-border bg-background">
        <FilterRail groups={groups} onClearAll={() => {}} />
      </div>
    );
  },
};
