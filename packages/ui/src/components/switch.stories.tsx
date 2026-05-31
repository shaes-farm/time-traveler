import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Switch>;
export default meta;

type Story = StoryObj<typeof meta>;

function Controlled({ initial = false }: { initial?: boolean }) {
  const [checked, setChecked] = React.useState(initial);
  return (
    <label className="flex items-center gap-2.5 text-sm text-foreground">
      <Switch checked={checked} onCheckedChange={setChecked} />
      <span>{checked ? "Published" : "Draft"}</span>
    </label>
  );
}

export const Default: Story = {
  args: { checked: false, onCheckedChange: () => {} },
  render: () => <Controlled />,
};

export const On: Story = {
  args: { checked: true, onCheckedChange: () => {} },
  render: () => <Controlled initial />,
};

export const Disabled: Story = {
  args: { checked: false, onCheckedChange: () => {}, disabled: true },
};
