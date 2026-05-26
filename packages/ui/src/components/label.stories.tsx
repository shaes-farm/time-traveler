import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Input } from "./input";

const meta = {
  title: "Components/Label",
  component: Label,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInput: Story = {
  render: () => (
    <div className="grid w-72 gap-2">
      <Label htmlFor="character-name">Display name</Label>
      <Input id="character-name" placeholder="Marie Curie" />
    </div>
  ),
};
