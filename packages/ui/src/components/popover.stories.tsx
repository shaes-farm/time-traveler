import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Pick era</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm text-foreground-muted">
        Era picker UI lands in Batch G — placeholder content for the primitive
        smoke test.
      </PopoverContent>
    </Popover>
  ),
};
