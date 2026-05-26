import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator.js";

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-72">
      <div className="text-sm text-foreground">Section A</div>
      <Separator className="my-3" />
      <div className="text-sm text-foreground-muted">Section B</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-3 text-sm">
      <span className="text-foreground">Marie Curie</span>
      <Separator orientation="vertical" />
      <span className="text-foreground-muted">1867 CE</span>
      <Separator orientation="vertical" />
      <span className="text-foreground-muted">Human</span>
    </div>
  ),
};
