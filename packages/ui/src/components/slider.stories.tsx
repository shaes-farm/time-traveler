import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

function SingleValueSlider() {
  const [value, setValue] = React.useState<number[]>([35]);

  return (
    <div className="w-80 space-y-3">
      <Slider
        min={0}
        max={100}
        step={1}
        value={value}
        onValueChange={setValue}
      />
      <p className="text-sm text-foreground-muted">Importance: {value[0]}</p>
    </div>
  );
}

function RangeSlider() {
  const [value, setValue] = React.useState<number[]>([1200, 1800]);

  return (
    <div className="w-80 space-y-3">
      <Slider
        min={0}
        max={2000}
        step={10}
        value={value}
        onValueChange={setValue}
      />
      <p className="text-sm text-foreground-muted">
        Range: {value[0]} - {value[1]}
      </p>
    </div>
  );
}

export const Single: Story = {
  render: () => <SingleValueSlider />,
};

export const Range: Story = {
  render: () => <RangeSlider />,
};

export const Disabled: Story = {
  args: {
    defaultValue: [60],
    disabled: true,
  },
  render: (args) => <Slider className="w-80" {...args} />,
};
