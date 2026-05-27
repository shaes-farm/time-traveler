import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

function CheckboxWithLabel(args: React.ComponentProps<typeof Checkbox>) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="story-checkbox" {...args} />
      <Label htmlFor="story-checkbox" className="font-normal">
        Published
      </Label>
    </div>
  );
}

export const Unchecked: Story = {
  args: {
    checked: false,
    onCheckedChange: () => {},
  },
  render: (args) => <CheckboxWithLabel {...args} />,
};

export const Checked: Story = {
  args: {
    checked: true,
    onCheckedChange: () => {},
  },
  render: (args) => <CheckboxWithLabel {...args} />,
};

export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
    onCheckedChange: () => {},
  },
  render: (args) => <CheckboxWithLabel {...args} />,
};
