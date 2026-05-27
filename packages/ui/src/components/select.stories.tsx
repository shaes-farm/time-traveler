import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Label } from "./label";

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

function EraSelectHarness({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = React.useState<string>("CE");
  return (
    <Select value={value} onValueChange={setValue} disabled={disabled}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Pick an era" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="CE">CE — modern era</SelectItem>
        <SelectItem value="BCE">BCE — historical</SelectItem>
        <SelectItem value="KYA">KYA — ancient</SelectItem>
        <SelectItem value="MYA">MYA — deep historical</SelectItem>
        <SelectItem value="BYA">BYA — cosmic</SelectItem>
      </SelectContent>
    </Select>
  );
}

export const Default: Story = {
  render: () => <EraSelectHarness />,
};

export const Disabled: Story = {
  render: () => <EraSelectHarness disabled />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="story-select">Era</Label>
      <EraSelectHarness />
    </div>
  ),
};
