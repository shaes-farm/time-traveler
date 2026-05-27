import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChipInput } from "./chip-input";

const meta = {
  title: "Components/Chip Input",
  component: ChipInput,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ChipInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function ChipInputStory() {
  const [chips, setChips] = useState(["aliases", "cultural context"]);

  return <ChipInput label="Tags" value={chips} onChange={setChips} />;
}

export const Default: Story = {
  args: {
    value: [],
    onChange: () => {},
  },
  render: () => <ChipInputStory />,
};
